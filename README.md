# Twitch MCP Server

This project is a fork and expansion of [TomCools' Twitch MCP Server](https://github.com/tomcools/twitch-mcp), which implements a Model Context Protocol (MCP) server that integrates with Twitch chat, allowing AI assistants like Claude to interact with your Twitch channel. The original project was inspired by [Max Rydahl Andersen's blog post](https://quarkus.io/blog/mcp-server/) about MCP servers and combines that knowledge with Twitch chat integration.

## Project Overview

The server uses Quarkus and Apache Camel to create a bridge between Twitch chat and the MCP protocol, enabling AI assistants to interact with your Twitch channel through the following tools:

### Available Tools

**Chat & Moderation:**
- `sendMessageToChat` - Send messages to your Twitch chat
- `getRecentChatLog` - Get the last 20 chat messages for moderation context
- `analyzeChat` - Analyze recent chat messages and provide topic/activity summary
- `timeoutUser` - Timeout users in chat (supports username or descriptive targeting)
- `banUser` - Ban users from chat (supports username or descriptive targeting)

**Stream Management:**
- `updateStreamTitle` - Update your stream title
- `updateStreamCategory` - Update the game category of your stream
- `createTwitchClip` - Create a clip of the current stream

**Interactive Features:**
- `createTwitchPoll` - Create polls with custom choices and duration
- `createTwitchPrediction` - Create predictions with custom outcomes and duration

Our fork expands on TomCools' work by:
- Adding comprehensive stream management tools (title, category updates)
- Implementing advanced moderation features with AI-assisted targeting
- Adding interactive engagement tools (polls, predictions, clips)
- Providing chat analysis and monitoring capabilities
- Improving error handling and logging
- Enhancing the MCP protocol implementation

## Prerequisites

- Java 21 or later
- Maven
- A Twitch account and application credentials

## Setup

### 1. Build the Project

1. Clone the repository
2. Build the project using Maven:
```bash
mvn clean install
```

This creates the executable JAR file at `target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar`.

### 2. Configuration

Configure your Twitch credentials by replacing the placeholder values in the commands below:

- `YOUR_CHANNEL_NAME`: Your Twitch channel name (without the #)
- `YOUR_API_KEY`: Your Twitch OAuth token (should start with 'oauth:')
- `YOUR_CLIENT_ID`: Your Twitch application client ID  
- `YOUR_BROADCASTER_ID`: Your Twitch broadcaster ID

#### Optional Configuration

- `TWITCH_SHOW_CONNECTION_MESSAGE`: Set to `true` to show "Twitch MCP Server connected" message on startup (default: `false`)

## Integration

**Important**: Only one client can connect to the MCP server at a time. You cannot have multiple tools (e.g., Claude Code and LM Studio) connected simultaneously. Ensure the previous connection is closed before starting a new one.

### Claude Code

Configure the MCP server with user scope:

```bash
claude-code mcp install --user twitch-mcp java -Dtwitch.channel=YOUR_CHANNEL_NAME -Dtwitch.auth=YOUR_API_KEY -Dtwitch.client_id=YOUR_CLIENT_ID -Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID -jar /path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar
```

Replace `/path/to/your/twitch-mcp` with the actual path to your project directory.

### Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

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
        "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
      ]
    }
  }
}
```

Replace `/path/to/your/twitch-mcp` with the actual path to your project directory. After adding the configuration and restarting Claude Desktop, the Twitch MCP tool will be available in your Claude UI.

### LM Studio

Add the following to your `mcp.json` configuration file:

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
        "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
      ],
      "env": {}
    }
  }
}
```

Replace `/path/to/your/twitch-mcp` with the actual path to your project directory.

### MCP Inspector (Testing)

1. Install and run the MCP Inspector:
```bash
npx @modelcontextprotocol/inspector
```

2. Create an MCP configuration with the following settings:
- Command: `java`
- Arguments: 
```json
[
  "-Dtwitch.channel=YOUR_CHANNEL_NAME",
  "-Dtwitch.auth=YOUR_API_KEY",
  "-Dtwitch.client_id=YOUR_CLIENT_ID",
  "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
  "-jar",
  "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
]
```

## Development

The project uses:
- Quarkus 3.17.7
- Apache Camel Quarkus 3.17.0
- Java 21
- Maven for build management

## License

This project is open source and available under the MIT License.
