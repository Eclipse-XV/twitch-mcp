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

The project includes a multi-stage Dockerfile that builds the application using Maven and creates a minimal runtime image:

- Build the Docker image:
  ```bash
  docker build -t twitch-mcp-server .
  ```

- Run the Docker container:
  ```bash
  docker run -p 8080:8080 twitch-mcp-server
  ```

The Dockerfile has been updated to use Maven 3.9.9 with Eclipse Temurin 21 for building the application, which provides the latest features and security updates. The runtime image uses Eclipse Temurin 21 JRE on Ubuntu Jammy for a lightweight and secure deployment.

The Docker image includes:
- A non-root user for security
- Proper file ownership with --chown
- Health checks for container orchestration
- Multi-stage build for smaller image size

### Glama.ai Deployment

For deployment on Glama.ai, you can use the standard Docker image:

1. Build the Docker image:
   ```bash
   docker build -t twitch-mcp-server .
   ```

2. Push to your container registry (Docker Hub, etc.)

3. Configure your Glama.ai deployment to use the image.

The Docker image includes health checks for better monitoring and uses a non-root user for security.

### Smithery.ai Deployment

For deployment on Smithery.ai, you need to create a specialized Docker image:

1. Build the Java application:
   ```bash
   ./mvnw package -DskipTests
   ```

2. Copy the JAR file to the smithery directory:
   ```bash
   cp target/server-runner.jar smithery/server.jar
   ```

3. Build the Smithery Docker image:
   ```bash
   cd smithery
   docker build -t twitch-mcp-smithery .
   ```

Alternatively, you can use the provided deployment scripts:
- On Unix/Linux/macOS: `./deploy-smithery.sh`
- On Windows: `deploy-smithery.bat`

The Smithery deployment uses a minimal Docker image that only includes the Java runtime and the application JAR file.

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