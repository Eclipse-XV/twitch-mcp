# syntax=docker/dockerfile:1

# --- Build stage ---
FROM eclipse-temurin:17-jdk AS build
WORKDIR /build

# Copy Maven wrapper and config first for better caching
COPY --link ../../../../../../pom.xml ./
COPY --link ../../../../../../mvnw ./
COPY --link ../../../../../../mvnw.cmd ./
COPY --link ../../../../../../.mvn ./.mvn/

# Download dependencies (leverages Docker cache)
RUN chmod +x mvnw && ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY --link ../../../../../../src ./src/
COPY --link ../../../../../../src/main/resources ./src/main/resources/

# Build the application (skip tests for faster build)
RUN ./mvnw package -DskipTests

# --- Runtime stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app

# Create a non-root user and group
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy the built jar from the build stage
COPY --from=build /build/target/*.jar /app/app.jar

# Set permissions
RUN chown -R appuser:appgroup /app
USER appuser

# JVM options: container-aware memory settings
ENV JAVA_OPTS="-XX:MaxRAMPercentage=80.0 -XX:+UseContainerSupport"

# Expose the default Quarkus port (8080)
EXPOSE 8080

# Use exec form for proper signal handling
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
