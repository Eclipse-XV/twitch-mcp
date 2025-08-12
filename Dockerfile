# syntax=docker/dockerfile:1

# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy Maven files for dependency resolution
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /build/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar /app/server.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -f http://localhost:8080/q/health || exit 1

# Run the application
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-jar", "/app/server.jar"]
