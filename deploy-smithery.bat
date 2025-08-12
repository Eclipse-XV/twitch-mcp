@echo off
REM Deployment script for Smithery on Windows

REM Build the Java application
echo Building Java application...
call mvnw.cmd package -DskipTests

REM Copy the JAR file to the smithery directory
echo Copying JAR file to smithery directory...
copy target\server-runner.jar smithery\server.jar

REM Build the Docker image
echo Building Docker image for Smithery...
cd smithery
docker build -t twitch-mcp-smithery .

echo Deployment package ready!