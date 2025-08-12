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
let currentConfig = {};
let lastStderr = [];
const MAX_STDERR_LINES = 100;

// Map of pending HTTP responses by JSON-RPC id
const pending = new Map();

function writeFramedJsonRpc(child, obj) {
  const json = Buffer.from(JSON.stringify(obj), 'utf8');
  const header = Buffer.from(`Content-Length: ${json.length}\r\n\r\n`, 'utf8');
  child.stdin.write(header);
  child.stdin.write(json);
}

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

  let stdoutBuffer = Buffer.alloc(0);
  javaProc.stdout.on('data', (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, Buffer.from(chunk)]);
    // Parse framed messages: headers \r\n\r\n then body of Content-Length
    while (true) {
      const sepIndex = stdoutBuffer.indexOf('\r\n\r\n');
      if (sepIndex === -1) break;
      const headerBuf = stdoutBuffer.subarray(0, sepIndex).toString('utf8');
      const rest = stdoutBuffer.subarray(sepIndex + 4);
      const match = /Content-Length:\s*(\d+)/i.exec(headerBuf);
      if (!match) {
        // Drop invalid header
        stdoutBuffer = rest;
        continue;
      }
      const len = Number(match[1] || 0);
      if (rest.length < len) {
        // wait for more data
        break;
      }
      const payload = rest.subarray(0, len);
      stdoutBuffer = rest.subarray(len);
      try {
        const msg = JSON.parse(payload.toString('utf8'));
        if (msg && Object.prototype.hasOwnProperty.call(msg, 'id')) {
          const handler = pending.get(String(msg.id));
          if (handler) {
            pending.delete(String(msg.id));
            handler(null, msg);
          }
        }
      } catch (_) {
        // ignore malformed json
      }
    }
  });

  javaProc.stderr.on('data', (chunk) => {
    // For debugging; do not crash bridge on server logs
    process.stderr.write(chunk);
    const txt = chunk.toString('utf8');
    for (const line of txt.split(/\r?\n/)) {
      if (!line) continue;
      lastStderr.push(line);
      if (lastStderr.length > MAX_STDERR_LINES) lastStderr.shift();
    }
  });

  javaProc.on('exit', (code) => {
    // Fail pending requests
    for (const [, handler] of pending.entries()) {
      const err = new Error(`MCP server exited with code ${code}`);
      err.stderr = lastStderr.slice(-20).join('\n');
      handler(err);
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
    pending.set(String(id), done);
    try {
      writeFramedJsonRpc(javaProc, item);
    } catch (e) {
      pending.delete(String(id));
      return done(e);
    }
  }
}

function applyConfigFromQuery(urlObj) {
  // Map all query params directly into env and config map
  // Example: /mcp?TWITCH_CHANNEL=foo&TWITCH_AUTH=bar
  const params = Object.fromEntries(urlObj.searchParams.entries());
  if (Object.keys(params).length === 0) return false;
  let changed = false;
  for (const [key, value] of Object.entries(params)) {
    if (currentConfig[key] !== value) {
      changed = true;
    }
  }
  if (changed) {
    currentConfig = { ...currentConfig, ...params };
    // Apply to process.env for new Java processes
    for (const [k, v] of Object.entries(params)) {
      process.env[k] = v;
    }
  }
  return changed;
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
  const configChanged = applyConfigFromQuery(url);
  // Only (re)start Java on POST, not on GET, to keep discovery fast
  if (configChanged && req.method === 'POST') {
    if (javaProc) { try { javaProc.kill(); } catch (_) {} }
    startJava();
  }
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
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: err.message || 'bridge error', data: err.stderr || undefined } }));
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
  // Start Java immediately so the first POST doesn't incur startup delay
  startJava();
  // eslint-disable-next-line no-console
  console.log(`MCP HTTP bridge listening on :${PORT} at /mcp`);
});


