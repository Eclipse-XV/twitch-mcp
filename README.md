### Running with Docker

This project provides Dockerfiles and a `compose.yaml` for easy containerized deployment of both the Node.js and Java Twitch MCP servers.

#### Requirements
- Docker and Docker Compose installed
- No need to manually install Node.js or Java; containers use:
  - Node.js `22.13.1-slim` (for the NPM server)
  - OpenJDK 11+ (for the NPM server)
  - Eclipse Temurin JDK 17 (for the Java server)

#### Configuration
- Place your Twitch credentials in a config file as described above. Mounting custom config files into containers is possible but not required for default usage.
- Environment variables:
  - The Node.js container sets `NODE_ENV=production` and `NODE_OPTIONS="--max-old-space-size=4096"` by default.
  - The Java container sets `JAVA_OPTS="-XX:MaxRAMPercentage=80.0 -XX:+UseContainerSupport"`.
- If you use `.env` files for secrets or configuration, uncomment the `env_file` lines in `compose.yaml` and place your `.env` in the respective service directory.

#### Build and Run
From the project root, run:
```sh
docker compose up --build
```
This will build and start both services:
- **js-twitch-mcp-npm**: Node.js-based Twitch MCP server
- **java-twitchmcp**: Java-based Twitch MCP server

#### Ports
- The Java service exposes port **8080** (`localhost:8080`)
- The Node.js service does **not** expose any ports by default (add to `compose.yaml` if needed)

#### Networking
- Both services share the `mcpnet` bridge network for inter-service communication
- The Java service depends on the Node.js service (can be adjusted in `compose.yaml`)

#### Notes
- For advanced usage, see [README_DEVELOPERS.md](README_DEVELOPERS.md) for details on building custom images or using Quarkus native mode.
- The provided Dockerfiles create non-root users for security.
- If you need to mount your Twitch config file into a container, use the `volumes` option in `compose.yaml`.

