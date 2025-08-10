### Twitch MCP Server - Developer Guide

This guide is for developers who want to build the Twitch MCP Server from source. For general usage, please refer to the main [README.md](README.md).

### Prerequisites
- Java 11+ installed and available on your system PATH
- Maven 3.6.2+ installed and available on your system PATH
- Node.js 14+ installed and available on your system PATH

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twitch-mcp.git
   cd twitch-mcp
   ```

2. Build the project using Maven:
   ```bash
   ./mvnw clean package
   ```
   This will create a runnable JAR file in the `target` directory.

3. Run the server:
   ```bash
   java -jar target/twitch-mcp-server-*.jar
   ```

### Maven/Quarkus Development

The project is built with Quarkus. You can use standard Maven commands for development:

- Run in development mode with live reload:
  ```bash
  ./mvnw compile quarkus:dev
  ```

- Build a native executable (requires GraalVM):
  ```bash
  ./mvnw package -Pnative
  ```

### Docker

The project includes a multi-stage Dockerfile that supports both Quarkus native and NPM modes:

- Build the Docker image (Quarkus native mode by default):
  ```bash
  docker build -t twitch-mcp-server .
  ```

- Build the Docker image in NPM mode (inspectable):
  ```bash
  docker build --build-arg MODE=npm -t twitch-mcp-server-npm .
  ```

- Run the Docker container:
  ```bash
  docker run -p 8080:8080 twitch-mcp-server
  ```

The NPM mode is particularly useful for inspection and debugging, as it runs the server in a Node.js environment which is more familiar to many developers and allows for easier debugging.

### NPM Package

The project also includes an NPM package for easy distribution. The package bundles the runner and is the recommended path for normal users.

To build the NPM package:
```bash
cd twitch-mcp-npm
npm run build
```

### Configuration

Create a config file with your Twitch credentials (bare access token, no "oauth:" prefix):

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

### Troubleshooting

- Authentication failed or no tools appear:
  - Confirm `auth` is a bare token (no `oauth:`)
  - Verify `clientId` and scopes match the token you generated
  - Ensure `broadcasterId` matches your channel

- npx prompts in headless environments: the Qwen config above uses `-y` to run non-interactively