# Twitch MCP Server

AI-powered tools for Twitch streamers. This package provides an easy way to connect AI assistants like Claude, Qwen Code, or LM Studio to your Twitch chat.

## 🚀 Quick Start

1) Create your config file with a bare token (no `oauth:`):
- Windows: `C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json`
- macOS: `~/Library/Application Support/twitch-mcp/config.json`
- Linux: `~/.config/twitch-mcp/config.json`

```json
{
  "channel": "your_twitch_username",
  "auth": "YOUR_TWITCH_ACCESS_TOKEN",
  "clientId": "your_twitch_client_id",
  "broadcasterId": "your_twitch_broadcaster_id",
  "showConnectionMessage": true
}
```

2) Run with npx (non-interactive):
```bash
npx -y twitch-mcp-server@latest --config "C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json"
```

That's it! No need to clone this repo or install Maven.

## 📋 Prerequisites

- Node.js 14 or later (comes with npx)
- Java 11 or later

## ⚙️ Configuration

### Command Line Options

Prefer the `--config` file, but you can also pass flags directly:

```bash
npx -y twitch-mcp-server@latest \
  --channel your_twitch_username \
  --auth YOUR_TWITCH_ACCESS_TOKEN \
  --client-id your_twitch_client_id \
  --broadcaster-id your_twitch_broadcaster_id \
  [--show-connection-message]
```

### Environment Variables

You can also configure using environment variables:

```bash
export TWITCH_CHANNEL=your_twitch_username
export TWITCH_AUTH=your_twitch_access_token
export TWITCH_CLIENT_ID=your_twitch_client_id
export TWITCH_BROADCASTER_ID=your_twitch_broadcaster_id
export TWITCH_SHOW_CONNECTION_MESSAGE=true

npx twitch-mcp-server
```

### Optional JSON Config File

You can store settings in a JSON file and point to it via `--config` (or let the tool discover it at a standard path):

```json
{
  "channel": "your_twitch_username",
  "auth": "your_twitch_access_token",
  "clientId": "your_twitch_client_id",
  "broadcasterId": "your_twitch_broadcaster_id",
  "showConnectionMessage": true
}
```

Default locations searched automatically when `--config` is not provided:

- Windows: `%APPDATA%/twitch-mcp/config.json`
- macOS: `~/Library/Application Support/twitch-mcp/config.json`
- Linux: `~/.config/twitch-mcp/config.json`

Run with an explicit config file:

```bash
npx twitch-mcp-server --config ./twitch-mcp.config.json
```

### Getting Your Twitch Credentials

1. **Channel Name**: Your Twitch username (e.g., `ninja`)
2. **Access Token**: Get from https://twitchtokengenerator.com/
   - Click "Generate Token"
   - Select required scopes:
     - `chat:read` - Read chat messages
     - `chat:edit` - Send chat messages
     - `channel:moderate` - Timeout/ban users
     - `channel:manage:broadcast` - Change title/category
     - `clips:edit` - Create clips
     - `channel:manage:polls` - Create polls
     - `channel:manage:predictions` - Create predictions
   - Copy the "Access Token" (do not include `oauth:` in the config)
3. **Client ID**: Also from twitchtokengenerator.com
4. **Broadcaster ID**: Get from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/

## 🤖 Connect with AI Tools

Once running, connect with your preferred AI tool:

### For Qwen Code (Recommended)
1. Open Qwen Code settings
2. Add this MCP configuration:
   ```json
   {
     "mcpServers": {
       "twitch-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "twitch-mcp-server@latest",
          "--config", "C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json"
        ]
       }
     }
   }
   ```

### For LM Studio
1. Open LM Studio
2. Go to Settings → Developer → MCP Settings
3. Add this configuration:
   ```json
   {
     "mcpServers": {
       "twitch-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "twitch-mcp-server@latest",
          "--config", "/home/<you>/.config/twitch-mcp/config.json"
        ]
       }
     }
   }
   ```

## 🛠️ Features

- **Chat Interaction**: Send and read Twitch chat messages
- **Moderation**: Timeout/ban users based on chat behavior
- **Stream Management**: Update title, category, create clips
- **Interactive Tools**: Create polls and predictions
- **Chat Analysis**: Analyze recent chat activity and topics

## 📖 Usage Examples

Once connected to an AI tool, you can ask:

- "Send a message to my Twitch chat saying 'Hello viewers!'"
- "What are people talking about in my chat?"
- "Create a poll asking viewers what game to play next"
- "Timeout the user who's being toxic"
- "Update my stream title to 'Epic Gaming Session!'"
- "Create a clip of that awesome moment"

## 🐛 Troubleshooting

### Common Issues

**"Java not found" error:** Install Java 11+ from https://adoptium.net/

- **Auth format:** Use a bare access token (no `oauth:`) in your config. The server applies the correct format for IRC/API.
- **"Connection refused" or "Authentication failed":**
  - Double-check your Twitch credentials
- Ensure your OAuth token has all required scopes
- Verify your broadcaster ID matches your channel

**AI assistant can't see Twitch tools:**
- Make sure the server is running
- Check that all 4 configuration values are correct
- Try restarting your AI application

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Based on [TomCools' Twitch MCP Server](https://github.com/tomcools/twitch-mcp), expanded with additional Twitch integration features.