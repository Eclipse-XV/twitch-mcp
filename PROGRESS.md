## Progress notes (2025-08-10)

- Fixed Docker build by updating `Dockerfile` to use `maven:3.9.8-eclipse-temurin-21` instead of relying on missing `.mvn/` and `mvnw`.
- Ensured the built JAR is copied to `app.jar` and Quarkus binds to `0.0.0.0`.
- Configured runtime env:
  - Updated `compose.yaml` to pass `TWITCH_CLIENT_ID`, `TWITCH_BROADCASTER_ID`, `TWITCH_CHANNEL`, `TWITCH_AUTH`.
  - Updated `src/main/resources/application.properties` to read `twitch.channel` and `twitch.auth` from env.
- Guidance provided to create a `.env` alongside `compose.yaml` for local values.
- Docker image builds successfully; container starts. If logs appear idle, run detached and verify with `docker compose ps`, `docker compose logs -f server`, and curl `http://localhost:8080`.

Next checks
- Verify the service is reachable on port 8080.
- Confirm valid Twitch env values are set (no startup config errors).
- Try running via Glama.ai build steps; plan to test tomorrow.

## Glama.ai deployment notes (2025-08-11)

Final working configuration: build Java-only and run via mcp-proxy wrapper using shell mode.

- Build steps (paste as JSON array in Glama):

  [
    "apt-get update",
    "apt-get install -y --no-install-recommends ca-certificates curl gnupg git maven wget",
    "wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor | tee /usr/share/keyrings/adoptium.gpg >/dev/null",
    "echo \"deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release; echo $VERSION_CODENAME) main\" > /etc/apt/sources.list.d/adoptium.list",
    "apt-get update && apt-get install -y --no-install-recommends temurin-21-jdk",
    "rm -f src/main/java/be/tomcools/twitchmcp/api/ChatResource.java || true",
    "mvn -B -DskipTests package",
    "bash -lc 'set -e; JAR=$(ls -1 target/*-runner.jar 2>/dev/null || ls -1 target/*-runner-*.jar 2>/dev/null || ls -1 target/*-all.jar 2>/dev/null || ls -1 target/*SNAPSHOT*.jar 2>/dev/null | head -n1); if [ -z \"$JAR\" ]; then echo Could not find built jar in target/ >&2; exit 1; fi; cp \"$JAR\" server.jar'",
    "apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*"
  ]

- CMD arguments (JSON array):

  ["--shell", "true", "java -jar server.jar"]

- Placeholder parameters (JSON object):

  {
    "TWITCH_CHANNEL": "test_channel",
    "TWITCH_AUTH": "oauth:test_token",
    "TWITCH_CLIENT_ID": "test_client_id",
    "TWITCH_BROADCASTER_ID": "test_broadcaster_id"
  }

Important learnings and pitfalls:
- Do not `git clone` in Glama; the workspace is already populated. Cloning or checking out older commits removed `twitch-mcp-npm/lib/*` and broke Node wrapper.
- If using the Node wrapper, ensure `twitch-mcp-npm/lib/java-utils.js` exists or extract from the npm tarball. We avoided this by running Java directly.
- Glama’s proxy can swallow flags. Use `--shell true "java -jar server.jar"` so the exact shell command runs.
- Java 21 is required (project compiles with `maven.compiler.release=21`).
- Removed legacy `ChatResource.java` to avoid Jakarta REST compilation errors (not needed for MCP stdio server).
