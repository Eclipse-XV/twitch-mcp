# Minimal runtime Dockerfile for Smithery
# Runs a prebuilt Quarkus runner jar without Maven/network downloads
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy prebuilt jar from repository root
COPY server.jar /app/server.jar

# Expose the Quarkus HTTP port
EXPOSE 8080

# Run the server and bind to 0.0.0.0
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-jar", "/app/server.jar"]
