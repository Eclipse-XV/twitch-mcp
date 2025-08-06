# Stage 1: Build the native executable
FROM quay.io/quarkus/ubi-quarkus-mandrel-builder:22.3-java21 AS build
COPY --chown=quarkus:quarkus mvnw /code/mvnw
COPY --chown=quarkus:quarkus .mvn /code/.mvn
COPY --chown=quarkus:quarkus pom.xml /code/
USER quarkus
WORKDIR /code
RUN ./mvnw -B org.apache.maven.plugins:maven-dependency-plugin:3.1.2:go-offline
COPY --chown=quarkus:quarkus src /code/src
RUN ./mvnw package -Pnative

# Stage 2: Create the minimal runtime image
FROM scratch
COPY --from=build /code/target/*-runner /app
EXPOSE 8080
ENTRYPOINT ["/app"] 