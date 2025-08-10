# Stage 1: Build the native executable
FROM quay.io/quarkus/ubi-quarkus-mandrel-builder:22.3-java21 AS build
COPY --chown=quarkus:quarkus mvnw /code/mvnw
COPY --chown=quarkus:quarkus .mvn /code/.mvn
COPY --chown=quarkus:quarkus pom.xml /code/
USER quarkus
WORKDIR /code
RUN ./mvnw -B org.apache.maven.plugins:maven-dependency-plugin:3.1.2:go-offline
COPY --chown=quarkus:quarkus src /code/src
# Build with debug symbols for inspection capabilities
RUN ./mvnw package -Pnative -Dquarkus.native.debug.enabled=true

# Stage 2: Create the minimal runtime image
# Using distroless instead of scratch to provide inspection capabilities
FROM gcr.io/distroless/base-debian11
COPY --from=build /code/target/*-runner /app
# Expose main port and debug port
EXPOSE 8080 5005
# Enable debugging and inspection
ENTRYPOINT ["/app", "-Dquarkus.http.host=0.0.0.0", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager"] 