# Twitch MCP Server - Developer Guide

This guide is for developers who want to build the Twitch MCP Server from source, contribute to the project, or extend its functionality. For general usage, please refer to the main [README.md](README.md).

## Developer Gotchas

⚠️ **Important:** The JAR file is the authoritative runtime artifact and **MUST NOT** be committed to git. The `.gitignore` and `.dockerignore` files are configured to prevent this, but always check `git status` before committing.

## Prerequisites

- Java 11+ installed and available on your system PATH
- Maven 3.6.2+ installed and available on your system PATH  
- Node.js 14+ installed and available on your system PATH
- Git for version control

## Recommended AI CLI Tools for Development

When developing this project, we recommend using these AI assistants in order of preference:

### 🥇 Primary Recommendation: Gemini CLI
- Excellent for daily development tasks and code review
- Free tier with generous limits
- Great MCP support for testing your changes
- Best for: Code refactoring, documentation, general development

### 🥈 Secondary Recommendation: Qwen Coder CLI  
- Specialized for coding tasks and technical problem-solving
- Free and open-source
- Strong Java/Maven/Quarkus knowledge
- Best for: Bug fixes, feature implementation, build issues

### ⚡ For Heavy Lifting: Claude Code
- Most advanced reasoning and architectural decisions
- **Limited credits** - save for complex problems only
- Best for: Major refactoring, design decisions, complex debugging
- **Use sparingly** - reserve for when other tools aren't sufficient

## Building from Source

### Quick Start
```bash
git clone <this-repository>
cd twitch-mcp
npm ci
npm run build:jar  # Builds the JAR if missing
npm run start      # Runs the server
```

### Manual Maven Build
```bash
./mvnw clean package -DskipTests  # Builds JAR to target/
```

### NPM Scripts Overview
- `npm run build:jar` - Detect and build JAR only if missing or outdated
- `npm run start` - Launch the JAR with safety checks (prevents jar commits)  
- `npm run test:twitch` - Manual test helper for Twitch integration

## Maven/Quarkus Development

The project is built with Quarkus. Standard Maven commands for development:

### Development Mode (Live Reload)
```bash
./mvnw compile quarkus:dev
```

### Build JAR
```bash  
./mvnw clean package -DskipTests
```

### Build Native Executable (requires GraalVM)
```bash
./mvnw package -Pnative
```

## Configuration

Create a config file with your Twitch credentials (use bare access token, no "oauth:" prefix):

**Windows:** `C:/Users/<you>/AppData/Roaming/twitch-mcp/config.json`  
**macOS:** `~/Library/Application Support/twitch-mcp/config.json`  
**Linux:** `~/.config/twitch-mcp/config.json`

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

## NPM Wrapper Architecture

The project includes an NPM wrapper for easy distribution:

- `bin/twitch-mcp.js` - Main entry point, launches JAR with safety checks
- `scripts/build-jar.js` - Detects and builds JAR only when needed
- `scripts/test-twitch.js` - Manual testing helper for Twitch integration
- `package.json` - NPM package definition with build scripts

### Key Safety Features
- Automatic detection of existing JAR to avoid rebuilding
- Git status checks to prevent accidental jar commits
- Java/Maven availability verification
- Environment validation for Twitch credentials

## Development Workflow

1. **Make your changes** to Java source files in `src/main/java/`
2. **Test locally:**
   ```bash
   npm run build:jar  # Rebuilds JAR with changes
   npm run start      # Tests the updated server
   ```
3. **Manual testing:**
   ```bash
   npm run test:twitch  # Validates configuration
   ```
4. **Verify no JAR staged:** `git status` should show no `.jar` files
5. **Commit your changes** (source code only, never the JAR)

## Architecture Overview

The Twitch MCP Server follows a layered architecture:

1. **MCP Layer** (`TwitchMcp.java`): Defines tools available to AI assistants
2. **Service Layer** (`TwitchClient.java`): Business logic and Twitch API integration  
3. **Integration Layer** (`CamelRoute.java`): IRC communication with Twitch chat
4. **API Layer** (`ChatResource.java`): REST endpoints for external integrations

## Adding New Features

### Adding a New MCP Tool
1. Add a method in `TwitchMcp.java` with `@Tool` annotation
2. Implement the functionality in `TwitchClient.java`  
3. Test through your AI assistant
4. Update documentation in `CLAUDE.md` if needed

### Modifying Chat Analysis  
1. Update `analyzeChat()` method in `TwitchClient.java`
2. Adjust `DESCRIPTOR_KEYWORDS` map for better moderation
3. Modify common words filter in `isCommonWord()` method

### Extending Moderation
1. Add descriptor keywords to `DESCRIPTOR_KEYWORDS` map
2. Update `findUserByDescriptor()` method for improved matching
3. Adjust timeout durations in `guessTimeoutDuration()` method

## Testing

### Automated Tests: TODO
Currently, the project relies on manual testing. Automated testing is planned for a future release and should include:

1. **Unit tests** for individual MCP tools
2. **Integration tests** for Twitch API connectivity  
3. **Dry-run tests** for chat moderation (mocked)
4. **CI pipeline** to verify JAR builds successfully

### Manual Testing Process
1. Set up your Twitch credentials in config file
2. Run `npm run test:twitch` to validate configuration
3. Start server with `npm run start`  
4. Connect your AI assistant and test MCP tools
5. Verify chat integration by sending test messages

## Troubleshooting Development Issues

**Maven Build Failures:**
- Verify Java 11+ is installed: `java -version`
- Check Maven version: `mvn --version` or use `./mvnw`
- Clear Maven cache: `rm -rf ~/.m2/repository`

**NPM Script Issues:**
- Verify Node.js version: `node --version`
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm ci`

**JAR Not Found Errors:**
- Run `npm run build:jar` to build the JAR
- Check that `dist/twitch-mcp-server.jar` exists
- Verify `target/` directory has built artifacts

**Authentication Problems:**
- Confirm `auth` is a bare token (no `oauth:` prefix)
- Verify `clientId` and scopes match your token
- Test API credentials outside of MCP first

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the architecture above
4. Test thoroughly using the manual process
5. Ensure no JAR files are staged: `git status`
6. Commit with descriptive messages
7. Push your branch and create a Pull Request

## Release Process (Maintainers)

1. Update version in `package.json`
2. Build and test the JAR: `npm run build:jar && npm run test:twitch`
3. Create release notes in `CHANGELOG.md`
4. Tag the release: `git tag v1.x.x`
5. Push tags: `git push --tags`  
6. Publish to NPM: `npm publish` (JAR will be built during npm package creation)

## Support

- For development questions, create an issue in the repository
- For AI CLI integration, see the main [README.md](README.md)
- For Claude-specific development help, see [CLAUDE.md](CLAUDE.md)