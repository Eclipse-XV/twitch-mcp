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
let javaReady = false;
let nextSessionId = 1;
let activeSessionId = null;
let currentConfig = {};
let lastStderr = [];
const MAX_STDERR_LINES = 100;

// Map of pending HTTP responses by JSON-RPC id
const pending = new Map();

// Fallback tool list for fast discovery when Java is slow
const FALLBACK_TOOLS = {
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "sendMessageToChat",
        "description": "Send message to the Twitch Chat",
        "inputSchema": {
          "type": "object",
          "properties": {
            "message": {"type": "string", "description": "The message"}
          },
          "required": ["message"]
        }
      },
      {
        "name": "createTwitchPoll", 
        "description": "Create a Twitch Poll",
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": {"type": "string", "description": "Poll title"},
            "choices": {"type": "string", "description": "Comma-separated choices"},
            "duration": {"type": "integer", "description": "Duration in seconds"}
          },
          "required": ["title", "choices", "duration"]
        }
      },
      {
        "name": "createTwitchPrediction",
        "description": "Create a Twitch Prediction", 
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": {"type": "string", "description": "Prediction title"},
            "outcomes": {"type": "string", "description": "Comma-separated outcomes"},
            "duration": {"type": "integer", "description": "Duration in seconds"}
          },
          "required": ["title", "outcomes", "duration"]
        }
      },
      {
        "name": "createTwitchClip",
        "description": "Create a Twitch clip of the current stream",
        "inputSchema": {"type": "object", "properties": {}}
      },
      {
        "name": "analyzeChat",
        "description": "Analyze recent Twitch chat messages and provide a summary of topics and activity",
        "inputSchema": {"type": "object", "properties": {}}
      },
      {
        "name": "getRecentChatLog",
        "description": "Get the last 20 chat messages for moderation context",
        "inputSchema": {"type": "object", "properties": {}}
      },
      {
        "name": "timeoutUser",
        "description": "Timeout a user in the Twitch chat. If no username is provided, it will return the recent chat log for LLM review.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "usernameOrDescriptor": {"type": "string", "description": "Username or descriptor to timeout (e.g. 'toxic', 'spammer', or a username)"},
            "reason": {"type": "string", "description": "Reason for timeout (optional)"}
          },
          "required": ["usernameOrDescriptor", "reason"]
        }
      },
      {
        "name": "banUser",
        "description": "Ban a user from the Twitch chat. If no username is provided, it will return the recent chat log for LLM review.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "usernameOrDescriptor": {"type": "string", "description": "Username or descriptor to ban (e.g. 'toxic', 'spammer', or a username)"},
            "reason": {"type": "string", "description": "Reason for ban (optional)"}
          },
          "required": ["usernameOrDescriptor", "reason"]
        }
      },
      {
        "name": "updateStreamTitle",
        "description": "Update the stream title",
        "inputSchema": {
          "type": "object", 
          "properties": {
            "title": {"type": "string", "description": "The new title for the stream"}
          },
          "required": ["title"]
        }
      },
      {
        "name": "updateStreamCategory",
        "description": "Update the game category of the stream",
        "inputSchema": {
          "type": "object",
          "properties": {
            "category": {"type": "string", "description": "The new game category, e.g. 'Fortnite'"}
          },
          "required": ["category"]
        }
      }
    ]
  }
};

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
  javaReady = false;
  const args = ['-jar', '/app/server.jar'];
  
  console.log(`[${new Date().toISOString()}] Starting Java MCP server with session ${activeSessionId}`);

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
          // Mark Java as ready on first successful response
          if (!javaReady) {
            javaReady = true;
            console.log(`[${new Date().toISOString()}] Java MCP server is ready`);
          }
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
    console.log(`[${new Date().toISOString()}] Java MCP server exited with code ${code}`);
    javaReady = false;
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
  // Fast-path check for tools/list - bypass all Java startup logic
  let quickPayload;
  try {
    quickPayload = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
  } catch (e) {
    // If we can't parse, continue with normal flow
  }
  
  if (quickPayload && quickPayload.method === 'tools/list') {
    console.log(`[${new Date().toISOString()}] Fast-path tools/list response`);
    const response = { ...FALLBACK_TOOLS, id: quickPayload.id };
    return cb(null, response);
  }

  if (!javaProc) {
    try {
      startJava();
      // Brief delay for Java startup, but always proceed to processRequest regardless
      setTimeout(() => {
        processRequest();
      }, 100); // Reduced to 100ms for faster response
      return;
    } catch (error) {
      return cb(new Error(`Failed to start Java MCP server: ${error.message}`));
    }
  }
  processRequest();

  function processRequest() {
    let payload;
    try {
      payload = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
    } catch (e) {
      return cb(Object.assign(new Error('Invalid JSON'), { status: 400 }));
    }
    
    // Always use fallback for tools/list to ensure fast discovery
    if (payload && payload.method === 'tools/list') {
      console.log(`[${new Date().toISOString()}] Using fallback tools/list response for fast discovery`);
      const response = { ...FALLBACK_TOOLS, id: payload.id };
      return cb(null, response);
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
      
      console.log(`[${new Date().toISOString()}] Sending MCP request: ${item.method} (id: ${id})`);
      
      // Add timeout for MCP requests to prevent hanging
      const timeoutMs = 10000; // 10 second timeout
      const timeoutId = setTimeout(() => {
        if (pending.has(String(id))) {
          pending.delete(String(id));
          console.log(`[${new Date().toISOString()}] MCP request timed out: ${item.method} (id: ${id})`);
          done(new Error(`MCP request timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
      
      pending.set(String(id), (err, result) => {
        clearTimeout(timeoutId);
        if (err) {
          console.log(`[${new Date().toISOString()}] MCP request failed: ${item.method} (id: ${id}) - ${err.message}`);
        } else {
          console.log(`[${new Date().toISOString()}] MCP request succeeded: ${item.method} (id: ${id})`);
        }
        done(err, result);
      });
      
      try {
        writeFramedJsonRpc(javaProc, item);
      } catch (e) {
        pending.delete(String(id));
        return done(e);
      }
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
  console.log(`[${new Date().toISOString()}] HTTP Request: ${req.method} ${req.url}`);
  
  // Simple CORS for tooling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] OPTIONS request handled`);
    res.statusCode = 204; res.end(); return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const configChanged = applyConfigFromQuery(url);
  // Only (re)start Java on POST, not on GET, to keep discovery fast
  // But don't restart Java for tools/list requests even if config changed
  if (configChanged && req.method === 'POST') {
    // Defer the Java restart decision until we know if it's a tools/list request
    // The actual restart logic will be handled in the POST body processing
  }
  if (url.pathname !== '/mcp') {
    console.log(`[${new Date().toISOString()}] 404 - Not found: ${url.pathname}`);
    res.statusCode = 404; res.end('Not Found'); return;
  }
  
  console.log(`[${new Date().toISOString()}] MCP request received: ${req.method}`);
  

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
    console.log(`[${new Date().toISOString()}] POST request - reading body`);
    let body = '';
    req.on('data', (chunk) => { 
      body += chunk; 
      if (body.length > 10 * 1024 * 1024) req.destroy(); 
    });
    req.on('end', () => {
      console.log(`[${new Date().toISOString()}] POST body received, forwarding to JsonRpc`);
      // Check for tools/list before potentially restarting Java due to config changes
      let isToolsList = false;
      try {
        const payload = typeof body === 'string' ? JSON.parse(body) : body;
        isToolsList = payload && payload.method === 'tools/list';
      } catch (e) {
        // If we can't parse, continue with normal flow
      }
      
      // If config changed and this is NOT a tools/list request, restart Java
      if (configChanged && !isToolsList) {
        console.log(`[${new Date().toISOString()}] Restarting Java due to config change (not tools/list)`);
        if (javaProc) { try { javaProc.kill(); } catch (_) {} }
        startJava();
      } else if (configChanged && isToolsList) {
        console.log(`[${new Date().toISOString()}] Skipping Java restart for tools/list request with config change`);
      }
      
      forwardJsonRpc(body, (err, responsePayload) => {
        if (err) {
          console.log(`[${new Date().toISOString()}] JsonRpc error: ${err.message}`);
          res.statusCode = err.status || 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: err.message || 'bridge error', data: err.stderr || undefined } }));
          return;
        }
        console.log(`[${new Date().toISOString()}] JsonRpc success - sending response`);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(responsePayload));
      });
    });
    return;
  }

  res.statusCode = 405; res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  // Don't start Java at all during initial container startup - only start on demand
  // startJava(); // Commented out to prevent startup issues
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] MCP HTTP bridge listening on :${PORT} at /mcp`);
  console.log(`[${new Date().toISOString()}] Bridge ready for requests - NO JAVA STARTUP`);
  console.log(`[${new Date().toISOString()}] Container startup complete, waiting for requests`);
});


