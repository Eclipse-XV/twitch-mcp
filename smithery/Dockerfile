# Minimal Dockerfile for Smithery, isolated context
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY server.jar /app/server.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-jar", "/app/server.jar"]
