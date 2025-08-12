const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

/**
 * Check if Java is installed and return the path
 */
function checkJava() {
  return new Promise((resolve) => {
    const java = spawn('java', ['-version']);
    java.on('error', () => resolve(null));
    java.on('exit', (code) => {
      if (code === 0) {
        resolve('java');
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Get architecture mapping for Java downloads
 */
function getArch() {
  const arch = os.arch();
  switch (arch) {
    case 'x64': return 'x64';
    case 'arm64': return 'aarch64';
    default: return 'x64';
  }
}

/**
 * Get OS mapping for Java downloads
 */
function getOS() {
  const platform = os.platform();
  switch (platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'mac';
    case 'linux': return 'linux';
    default: return 'linux';
  }
}

/**
 * Download Java using the Eclipse Adoptium API
 */
async function downloadJava() {
  console.log('Java not found. To use Twitch MCP Server, please install Java 11 or later.');
  console.log('You can download it from: https://adoptium.net/');
  throw new Error('Java installation required');
}

/**
 * Check if the packaged JAR exists
 */
function getPackagedJarPath() {
  const jarPath = path.join(__dirname, '..', 'lib', 'twitch-mcp-runner.jar');
  return fs.existsSync(jarPath) ? jarPath : null;
}

/**
 * In a production implementation, this would download from GitHub Releases
 */
async function downloadJar() {
  // For now, we just check if the packaged JAR exists
  const jarPath = getPackagedJarPath();
  if (!jarPath) {
    throw new Error('JAR file not found in package and download not implemented');
  }
  return jarPath;
}

/**
 * Ensure JAR file is available
 */
async function ensureJar() {
  // First check if packaged JAR exists
  const jarPath = getPackagedJarPath();
  if (jarPath) {
    return jarPath;
  }
  
  // If not, attempt to download
  return await downloadJar();
}

module.exports = {
  checkJava,
  downloadJava,
  ensureJar
};