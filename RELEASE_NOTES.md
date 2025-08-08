# Twitch MCP Server v1.0.1

## 📦 New npm Package Release

We're excited to announce that the Twitch MCP Server is now available as an npm package! This makes installation and setup much easier than ever before.

## 🚀 What's New

- **npm Package**: Install and run with a single command: `npx twitch-mcp-server@1.0.1`
- **No Java/Maven Required**: The npm package bundles the Java application, so users don't need to install Java or Maven
- **Cross-Platform**: Works on Windows, Mac, and Linux
- **Easy Configuration**: Configure via command line arguments or environment variables

## 📋 Installation

### Easiest Option (npx)
```bash
npx twitch-mcp-server@1.0.1 --channel your_channel --auth oauth:your_token --client-id your_client_id --broadcaster-id your_broadcaster_id
```

### Global Installation
```bash
npm install -g twitch-mcp-server@1.0.1
twitch-mcp-server --channel your_channel --auth oauth:your_token --client-id your_client_id --broadcaster-id your_broadcaster_id
```

## 🤖 AI Tool Integration

The npm package works seamlessly with:
- **Qwen Code** (Recommended)
- **LM Studio**
- **Claude Desktop**
- Any other MCP-compatible AI tool

## 📖 Documentation

For detailed instructions, see the [README](https://github.com/Eclipse-XV/twitch-mcp/blob/main/README.md).

## 🙏 Acknowledgments

Based on [TomCools' Twitch MCP Server](https://github.com/tomcools/twitch-mcp), expanded with additional Twitch integration features.