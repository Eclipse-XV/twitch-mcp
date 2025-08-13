# Twitch MCP Server - Claude Integration Guide

This document describes the Model Context Protocol (MCP) architecture of the Twitch MCP Server and provides example prompts for common developer tasks when using Claude as your AI assistant.

## Architecture Overview

The Twitch MCP Server is built using Quarkus and follows a layered architecture:

1. **MCP Layer** (`TwitchMcp.java`): Defines the tools available to AI assistants via MCP annotations
2. **Service Layer** (`TwitchClient.java`): Implements the business logic and integrates with Twitch APIs
3. **Integration Layer** (`CamelRoute.java`): Handles IRC communication with Twitch chat
4. **API Layer** (`ChatResource.java`): Provides REST endpoints for external integrations

The server exposes tools that allow AI assistants to interact with Twitch chat, manage streams, and moderate content.

## Available Tools

1. **Chat Management**
   - `sendMessageToChat`: Send messages to Twitch chat
   - `getRecentChatLog`: Retrieve recent chat messages
   - `analyzeChat`: Get analysis of recent chat activity

2. **Stream Management**
   - `updateStreamTitle`: Change the stream title
   - `updateStreamCategory`: Change the stream category/game
   - `createTwitchClip`: Create a clip of the current stream

3. **Audience Interaction**
   - `createTwitchPoll`: Create a poll for viewers
   - `createTwitchPrediction`: Create a prediction for viewers

4. **Moderation**
   - `timeoutUser`: Timeout a user in chat
   - `banUser`: Ban a user from chat

## Example Prompts for Common Developer Tasks

### 1. Chat Interaction
```
Send a welcome message to new viewers in my Twitch chat.
```

```
Analyze the recent chat activity and summarize the main topics discussed.
```

```
Get the last 20 messages from my Twitch chat to understand the current conversation.
```

### 2. Stream Management
```
Update my stream title to "Working on new features - Q&A session" and change the category to "Software Development".
```

```
Create a clip of the current stream moment.
```

### 3. Audience Engagement
```
Create a poll asking viewers what programming language we should use for the next project. Options: JavaScript, Python, Java, Rust.
```

```
Create a prediction asking viewers to guess how many lines of code I'll write in the next 30 minutes. Options: Less than 50, 50-100, 100-200, More than 200.
```

### 4. Moderation
```
Timeout the user "spam_bot123" for 10 minutes due to spamming.
```

```
Ban the user "toxic_viewer" for violating community guidelines.
```

### 5. Debugging and Troubleshooting
```
Check the recent chat log to identify any technical issues viewers are reporting.
```

```
Analyze the chat to see if viewers are having trouble with the current demo.
```

## Configuration

To use the Twitch MCP Server with Claude, you need to configure the MCP connection:

1. Create a config file with your Twitch credentials:
   - Windows: `C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json`
   - macOS: `~/Library/Application Support/twitch-mcp/config.json`
   - Linux: `~/.config/twitch-mcp/config.json`

2. Example `config.json`:
   ```json
   {
     "channel": "YOUR_TWITCH_USERNAME",
     "auth": "YOUR_TWITCH_ACCESS_TOKEN",  
     "clientId": "YOUR_TWITCH_CLIENT_ID",
     "broadcasterId": "YOUR_BROADCASTER_ID",
     "showConnectionMessage": true
   }
   ```

Note: Use a bare access token in `auth` (without the `oauth:` prefix).

## Development Workflow

When developing with the Twitch MCP Server:

1. Make sure Java 11+ and Maven 3.6.2+ are installed
2. Build the project: `./mvnw clean package` or `npm run build:jar`
3. Run in development mode: `./mvnw compile quarkus:dev` or `npm run start`
4. For NPM package development, use the npm scripts provided

## Common Development Tasks

### Adding a New Tool
1. Add a new method in `TwitchMcp.java` with `@Tool` annotation
2. Implement the functionality in `TwitchClient.java`
3. Test the tool through your AI assistant

### Modifying Chat Analysis
1. Update the `analyzeChat()` method in `TwitchClient.java`
2. Adjust the `DESCRIPTOR_KEYWORDS` map for better moderation targeting
3. Modify the common words filter in `isCommonWord()` method

### Extending Moderation Capabilities
1. Add new descriptor keywords to the `DESCRIPTOR_KEYWORDS` map
2. Update the `findUserByDescriptor()` method for improved matching
3. Adjust timeout durations in `guessTimeoutDuration()` method

This guide should help Claude users effectively interact with and extend the Twitch MCP Server.