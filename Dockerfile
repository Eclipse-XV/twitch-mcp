# syntax=docker/dockerfile:1

# =========================
# Stage 1: Quarkus Native Build
# =========================
FROM quay.io/quarkus/ubi-quarkus-mandrel-builder:22.3-java21 AS quarkus-build
COPY --chown=quarkus:quarkus mvnw /code/mvnw
COPY --chown=quarkus:quarkus .mvn /code/.mvn
COPY --chown=quarkus:quarkus pom.xml /code/
USER quarkus
WORKDIR /code
RUN ./mvnw -B org.apache.maven.plugins:maven-dependency-plugin:3.1.2:go-offline
COPY --chown=quarkus:quarkus src /code/src
# Build with debug symbols for inspection capabilities
RUN ./mvnw package -Pnative -Dquarkus.native.debug.enabled=true

# =========================
# Stage 2: NPM Build
# =========================
FROM node:20 AS npm-build
WORKDIR /app
COPY twitch-mcp-npm/package*.json ./
RUN npm install
COPY twitch-mcp-npm/ ./
RUN npm run build

# =========================
# Stage 3: Runtime (select mode)
# =========================
ARG MODE=quarkus
FROM ${MODE:-quarkus} AS final

# Quarkus mode (smallest)
FROM registry.access.redhat.com/ubi8/ubi-minimal:8.10 AS quarkus
COPY --from=quarkus-build /code/target/*-runner /app
EXPOSE 8080
ENTRYPOINT ["/app"]

# NPM mode (inspectable) - Recommended for Glama.ai
FROM node:20 AS npm
WORKDIR /app
COPY --from=npm-build /app ./
# Copy JAR file for the NPM mode
COPY twitch-mcp-npm/lib/twitch-mcp-runner.jar ./lib/
EXPOSE 8080
# Use the proper entrypoint for the NPM package
ENTRYPOINT ["node", "bin/twitch-mcp.js"]
CMD []