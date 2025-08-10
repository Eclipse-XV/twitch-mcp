#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { checkJava, downloadJava, ensureJar } = require('../lib/java-utils');
const { loadConfig, validateConfig } = require('../lib/config-utils');
const pkg = require('../package.json');

// Main function
async function main() {
  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .version(pkg.version)
    .option('channel', {
      alias: 'c',
      type: 'string',
      description: 'Twitch channel name'
    })
    .option('auth', {
      alias: 'a',
      type: 'string',
      description: 'Twitch OAuth token (with oauth: prefix)'
    })
    .option('client-id', {
      alias: 'i',
      type: 'string',
      description: 'Twitch Client ID'
    })
    .option('broadcaster-id', {
      alias: 'b',
      type: 'string',
      description: 'Twitch Broadcaster ID'
    })
    .option('show-connection-message', {
      type: 'boolean',
      default: false,
      description: 'Show connection message in chat'
    })
    .option('jar-path', {
      type: 'string',
      description: 'Path to the JAR file (if you have a local copy)'
    })
    .option('config', {
      alias: 'f',
      type: 'string',
      description: 'Path to a JSON config file (defaults to OS-specific location)'
    })
    .help()
    .alias('help', 'h')
    .argv;

  // Load and validate configuration
  const config = loadConfig(argv);
  const validationErrors = validateConfig(config);

  if (validationErrors.length > 0) {
    console.error('Configuration errors:');
    validationErrors.forEach(error => console.error(`  - ${error}`));
    console.error('\nYou can provide these via command line arguments or environment variables:');
    console.error('  Command line: twitch-mcp-server --channel your_channel --auth oauth:token ...');
    console.error('  Environment: TWITCH_CHANNEL=your_channel TWITCH_AUTH=oauth:token ... twitch-mcp-server');
    process.exit(1);
  }

  // Check Java installation
  const javaPath = await checkJava();
  if (!javaPath) {
    console.error('Java not found. Please install Java 11 or later.');
    console.error('Download from: https://adoptium.net/');
    process.exit(1);
  }

  // Get JAR path (use provided path or ensure we have the JAR)
  let jarPath = config.jarPath;
  if (!jarPath) {
    try {
      jarPath = await ensureJar();
    } catch (error) {
      console.error('Failed to get JAR file:', error.message);
      process.exit(1);
    }
  }

  // Normalize auth token: allow with or without "oauth:" prefix in user config
  const normalizedAuth = (config.auth || '').startsWith('oauth:')
    ? (config.auth || '').slice(6)
    : (config.auth || '');

  // Build Java arguments
  const javaArgs = [
    `-Dtwitch.channel=${config.channel}`,
    `-Dtwitch.auth=${normalizedAuth}`,
    `-Dtwitch.client_id=${config.clientId}`,
    `-Dtwitch.broadcaster_id=${config.broadcasterId}`
  ];

  if (config.showConnectionMessage) {
    javaArgs.push('-Dtwitch.show_connection_message=true');
  }

  javaArgs.push('-jar', jarPath);

  console.error('Starting Twitch MCP Server...');
  console.error('Connecting to channel:', config.channel);

  // Launch the Java application
  const javaProcess = spawn(javaPath || 'java', javaArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

  // Forward stdin from the MCP host to the Java MCP server
  if (process.stdin && javaProcess.stdin) {
    process.stdin.pipe(javaProcess.stdin);
  }

  javaProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  javaProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  javaProcess.on('error', (error) => {
    console.error('Failed to start Java process:', error.message);
    process.exit(1);
  });

  javaProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Java process exited with code ${code}`);
    }
    process.exit(code || 0);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.error('\nShutting down Twitch MCP Server...');
    javaProcess.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    console.error('\nShutting down Twitch MCP Server...');
    javaProcess.kill('SIGTERM');
  });
}

// Run main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});