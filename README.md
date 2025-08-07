# Twitch MCP Server

This project is a fork and expansion of [TomCools' Twitch MCP Server](https://github.com/tomcools/twitch-mcp), which implements a Model Context Protocol (MCP) server that integrates with Twitch chat, allowing AI assistants like Claude to interact with your Twitch channel. The original project was inspired by [Max Rydahl Andersen's blog post](https://quarkus.io/blog/mcp-server/) about MCP servers and combines that knowledge with Twitch chat integration.

## Project Overview

The server uses Quarkus and Apache Camel to create a bridge between Twitch chat and the MCP protocol, enabling AI assistants to:
- Read messages from your Twitch chat
- Send messages to your Twitch chat
- Interact with your channel in real-time

Our fork expands on TomCools' work by:
- Adding support for more Twitch chat commands and interactions
- Improving error handling and logging
- Adding additional configuration options
- Enhancing the MCP protocol implementation

## Prerequisites

- Java 21 or later
- Maven
- JBang (for running the application)
- A Twitch account and application credentials

## Required Environment Variables

The following environment variables need to be set to run the application:

- `TWITCH_CHANNEL`: Your Twitch channel name (without the #)
- `TWITCH_AUTH`: Your Twitch OAuth token (should start with 'oauth:')
- `TWITCH_CLIENT_ID`: Your Twitch application client ID
- `TWITCH_BROADCASTER_ID`: Your Twitch broadcaster ID

### Optional Configuration

- `TWITCH_SHOW_CONNECTION_MESSAGE`: Set to `true` to show "Twitch MCP Server connected" message on startup (default: `false`)

You can set these either as environment variables or pass them as system properties when running the application.

## Building the Project

1. Clone the repository
2. Build the project using Maven:
```bash
mvn clean install
```

## Running the MCP Server

**Important Note**: Only one client can connect to the MCP server at a time. You cannot have multiple tools (e.g., Claude Code and LM Studio) connected to the same MCP server instance simultaneously. If you need to switch between different clients, ensure the previous connection is closed before starting a new one.

### Using MCP Inspector

1. Install and run the MCP Inspector:
```bash
npx @modelcontextprotocol/inspector
```

2. Create an MCP configuration with the following settings:
- Command: `jbang`
- Arguments: 
```json
[
  "--quiet",
  "-Dtwitch.channel=YOUR_CHANNEL_NAME",
  "-Dtwitch.auth=YOUR_API_KEY",
  "-Dtwitch.client_id=YOUR_CLIENT_ID",
  "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
  "be.tomcools:twitch-mcp:1.0.0-SNAPSHOT:runner"
]
```

### Using Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "twitch-mcp": {
      "command": "jbang",
      "args": [
        "--quiet",
        "-Dtwitch.channel=YOUR_CHANNEL_NAME",
        "-Dtwitch.auth=YOUR_API_KEY",
        "-Dtwitch.client_id=YOUR_CLIENT_ID",
        "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
        "be.tomcools:twitch-mcp:1.0.0-SNAPSHOT:runner"
      ]
    }
  }
}
```

After adding the configuration and restarting Claude Desktop, the Twitch MCP tool will be available in your Claude UI.

### Using Claude Code

The MCP server is also compatible with Claude Code. After building the project, you can configure it using user scope:

1. First, build the project to create the JAR file:
   ```bash
   mvn clean install
   ```

2. Configure the MCP server with user scope by running:
   ```bash
   claude-code mcp install --user twitch-mcp java -Dtwitch.channel=YOUR_CHANNEL_NAME -Dtwitch.auth=YOUR_API_KEY -Dtwitch.client_id=YOUR_CLIENT_ID -Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID -jar path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar
   ```

   Replace `path/to/your/twitch-mcp` with the actual path to your project directory.

3. The MCP server will then be available in your Claude Code sessions.

### Using LM Studio

For LM Studio integration, add the following to your `mcp.json` configuration file:

```json
{
  "mcpServers": {
    "twitch-mcp": {
      "command": "java",
      "args": [
        "-Dtwitch.channel=YOUR_CHANNEL_NAME",
        "-Dtwitch.auth=YOUR_API_KEY",
        "-Dtwitch.client_id=YOUR_CLIENT_ID",
        "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
        "-jar",
        "path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
      ],
      "env": {}
    }
  }
}
```

Replace `path/to/your/twitch-mcp` with the actual path to your project directory.

## Development

The project uses:
- Quarkus 3.17.7
- Apache Camel Quarkus 3.17.0
- Java 21
- Maven for build management
- JBang for running the application

## License

This project is open source and available under the MIT License.
