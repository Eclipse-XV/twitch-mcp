/*
 Minimal HTTP → STDIO MCP bridge.
 - Exposes /mcp over HTTP (Smithery requirement)
 - Forwards JSON-RPC 2.0 requests to the Java MCP server running over stdio
 - Supports basic POST for request/response; GET returns 200 for health; DELETE restarts session
 - NOTE: This is a minimal non-streaming bridge intended to satisfy basic tool discovery/invocation
*/

const http = require('http');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT || 8080);

// Launch Java MCP server (stdio)
let javaProc = null;
let nextSessionId = 1;
let activeSessionId = null;

// Map of pending HTTP responses by JSON-RPC id
const pending = new Map();

function startJava() {
  if (javaProc) {
    try { javaProc.kill(); } catch (_) {}
  }
  activeSessionId = `s-${nextSessionId++}`;
  const args = ['-jar', '/app/server.jar'];

  javaProc = spawn('java', args, {
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdoutBuffer = '';
  javaProc.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString('utf8');
    // Process by lines
    let idx;
    while ((idx = stdoutBuffer.indexOf('\n')) !== -1) {
      const line = stdoutBuffer.slice(0, idx).trim();
      stdoutBuffer = stdoutBuffer.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg && Object.prototype.hasOwnProperty.call(msg, 'id')) {
          const handler = pending.get(String(msg.id));
          if (handler) {
            pending.delete(String(msg.id));
            handler(null, msg);
          }
        }
      } catch (_) {
        // Not JSON or partial line; ignore
      }
    }
  });

  javaProc.stderr.on('data', (chunk) => {
    // For debugging; do not crash bridge on server logs
    process.stderr.write(chunk);
  });

  javaProc.on('exit', (code) => {
    // Fail pending requests
    for (const [, handler] of pending.entries()) {
      handler(new Error(`MCP server exited with code ${code}`));
    }
    pending.clear();
    javaProc = null;
  });
}

function forwardJsonRpc(requestBody, cb) {
  if (!javaProc) startJava();
  let payload;
  try {
    payload = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
  } catch (e) {
    return cb(Object.assign(new Error('Invalid JSON'), { status: 400 }));
  }
  // Support batch and single; handle only single simply
  const isBatch = Array.isArray(payload);
  if (isBatch) {
    // Minimal batch: send each and collect
    const results = new Array(payload.length);
    let remaining = payload.length;
    if (remaining === 0) return cb(null, []);
    payload.forEach((item, i) => {
      sendSingle(item, (err, res) => {
        results[i] = err ? { jsonrpc: '2.0', id: item && item.id, error: { code: -32000, message: String(err.message || err) } } : res;
        remaining -= 1;
        if (remaining === 0) cb(null, results);
      });
    });
    return;
  }
  sendSingle(payload, cb);

  function sendSingle(item, done) {
    if (!item || typeof item !== 'object') return done(new Error('Invalid JSON-RPC payload'));
    const id = item.id;
    if (typeof id === 'undefined' || id === null) return done(new Error('JSON-RPC id is required'));
    const line = JSON.stringify(item) + '\n';
    pending.set(String(id), done);
    try {
      javaProc.stdin.write(line, 'utf8');
    } catch (e) {
      pending.delete(String(id));
      return done(e);
    }
  }
}

const server = http.createServer((req, res) => {
  // Simple CORS for tooling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204; res.end(); return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/mcp') {
    res.statusCode = 404; res.end('Not Found'); return;
  }

  if (req.method === 'GET') {
    // Basic health/session info
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, session: activeSessionId }));
    return;
  }

  if (req.method === 'DELETE') {
    // Close and restart the Java process to simulate session reset
    if (javaProc) { try { javaProc.kill(); } catch (_) {} }
    startJava();
    res.statusCode = 204; res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 10 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      forwardJsonRpc(body, (err, responsePayload) => {
        if (err) {
          res.statusCode = err.status || 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: err.message || 'bridge error' } }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(responsePayload));
      });
    });
    return;
  }

  res.statusCode = 405; res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  startJava();
  // eslint-disable-next-line no-console
  console.log(`MCP HTTP bridge listening on :${PORT} at /mcp`);
});


