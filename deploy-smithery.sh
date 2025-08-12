#!/bin/bash
# Deployment script for Smithery

# Build the Java application
echo "Building Java application..."
./mvnw package -DskipTests

# Copy the JAR file to the smithery directory
echo "Copying JAR file to smithery directory..."
cp target/server-runner.jar smithery/server.jar

# Build the Docker image
echo "Building Docker image for Smithery..."
cd smithery
docker build -t twitch-mcp-smithery .

echo "Deployment package ready!"