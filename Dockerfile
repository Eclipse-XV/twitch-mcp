# syntax=docker/dockerfile:1

# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy Maven files for dependency resolution
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Make wrapper executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-jammy as jre
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /build/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar /app/server.jar

FROM node:20-bookworm-slim as runtime
WORKDIR /app

# Copy Java server jar into runtime image
COPY --from=jre /app/server.jar /app/server.jar

# Bring Java runtime into the Node image
COPY --from=jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

# Copy bridge
COPY package.json /app/package.json
COPY bridge /app/bridge

# Install minimal deps and curl for healthcheck
RUN npm install --omit=dev && \
    apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8080
ENV PORT=8080

# Healthcheck: bridge responds on /mcp
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD curl -fsS http://127.0.0.1:8080/mcp >/dev/null || exit 1

CMD ["npm", "start"]
