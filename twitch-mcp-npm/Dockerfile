# syntax=docker/dockerfile:1

# Use Node.js slim image as the base
FROM node:22.13.1-slim

# Set working directory
WORKDIR /app

# Install Java (required for the Java component of your app)
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a non-privileged user
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --production && \
    npm cache clean --force

# Copy the application files
COPY . .

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port (if needed for any HTTP endpoints)
EXPOSE 8080

# Health check (if applicable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Set the entrypoint to the npm package executable
ENTRYPOINT ["node", "bin/twitch-mcp.js"]