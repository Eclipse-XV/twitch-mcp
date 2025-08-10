### Twitch MCP Server

AI-powered tools for Twitch streamers, exposed via the Model Context Protocol (MCP). Connect your coding/chat assistants (Qwen Code, LM Studio, Claude, etc.) to your Twitch chat for moderation, stream management, and engagement.

### Quick start (no cloning required)
- Prerequisites: Node.js 14+ and Java 11+ available on your system PATH
- Create a config file with your Twitch credentials (bare access token, no "oauth:" prefix):
  - Windows: `C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json`
  - macOS: `~/Library/Application Support/twitch-mcp/config.json`
  - Linux: `~/.config/twitch-mcp/config.json`

  Example `config.json`:
  ```json
  {
    "channel": "YOUR_TWITCH_USERNAME",
    "auth": "YOUR_TWITCH_ACCESS_TOKEN",  
    "clientId": "YOUR_TWITCH_CLIENT_ID",
    "broadcasterId": "YOUR_BROADCASTER_ID",
    "showConnectionMessage": true
  }
  ```

Note: You do not need to start the server yourself when using Qwen Code. Qwen will launch it using the configuration below.

### Qwen Code configuration (recommended)
Add to your Qwen settings (Windows path shown):
```json
{
  "mcpServers": {
    "twitch-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "twitch-mcp-server@latest",
        "--config",
        "C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json"
      ]
    }
  }
}
```

Notes
- Use a bare access token in `auth`. The server formats it correctly for both IRC and API.
- Only one client (e.g., Qwen Code) should connect at a time.
- Make sure Node and Java are installed on the same OS where Qwen runs (on Windows, not WSL).

### Features
- Chat: send and read messages; recent chat log; chat analysis
- Moderation: timeout/ban users (by username or descriptor)
- Stream management: update title/category; create clips
- Interactive: polls and predictions

### Troubleshooting
- Authentication failed or no tools appear:
  - Confirm `auth` is a bare token (no `oauth:`)
  - Verify `clientId` and scopes match the token you generated
  - Ensure `broadcasterId` matches your channel
- npx prompts in headless environments: the Qwen config above uses `-y` to run non-interactively

### Developers
- Power users can build from source with Maven/Quarkus, but normal users do not need to clone or build. The npm package bundles the runner and is the recommended path.
- For containerized deployments, see [README_DEVELOPERS.md](README_DEVELOPERS.md) for Docker instructions.
