# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

################################################################################

# Create a stage for resolving and downloading dependencies.
# Use an image with Maven preinstalled so we don't rely on the Maven Wrapper files.
FROM maven:3.9.9-eclipse-temurin-21 AS deps

WORKDIR /build

# Copy project descriptor for dependency resolution layer.
COPY pom.xml pom.xml

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.m2 so that subsequent builds don't have to
# re-download packages.
RUN --mount=type=cache,target=/root/.m2 mvn -B dependency:go-offline -DskipTests

################################################################################

# Create a stage for building the application based on the stage with downloaded dependencies.
# This Dockerfile is optimized for Java applications that output an uber jar, which includes
# all the dependencies needed to run your app inside a JVM. If your app doesn't output an uber
# jar and instead relies on an application server like Apache Tomcat, you'll need to update this
# stage with the correct filename of your package and update the base image of the "final" stage
# use the relevant app server, e.g., using tomcat (https://hub.docker.com/_/tomcat/) as a base image.
FROM deps AS package

WORKDIR /build

COPY ./src src/
COPY pom.xml pom.xml
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B package -DskipTests && \
    sh -lc 'set -e; JAR=$(ls -1 target/*-runner.jar 2>/dev/null || true); \
      if [ -z "${JAR}" ]; then JAR=$(ls -1 target/*-runner-*.jar 2>/dev/null || true); fi; \
      if [ -z "${JAR}" ]; then JAR=$(ls -1 target/*-all.jar 2>/dev/null || true); fi; \
      if [ -z "${JAR}" ]; then JAR=$(ls -1 target/*SNAPSHOT*.jar 2>/dev/null | head -n1 || true); fi; \
      if [ -z "${JAR}" ]; then echo "Could not find built jar in target/" >&2; exit 1; fi; \
      cp "${JAR}" target/app.jar'


################################################################################

# Create a new stage for running the application that contains the minimal
# runtime dependencies for the application. This often uses a different base
# image from the install or build stage where the necessary files are copied
# from the install stage.
#
# The example below uses eclipse-turmin's JRE image as the foundation for running the app.
# By specifying the "21-jre-jammy" tag, it will also use whatever happens to be the
# most recent version of that tag when you build your Dockerfile.
# If reproducibility is important, consider using a specific digest SHA, like
# eclipse-temurin@sha256:99cede493dfd88720b610eb8077c8688d3cca50003d76d1d539b0efc8cca72b4.
FROM eclipse-temurin:21-jre-jammy AS final

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser

# Copy the executable from the "package" stage.
# Copy the packaged jar produced in the previous stage.
COPY --from=package --chown=appuser:appuser /build/target/app.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/q/health || exit 1

EXPOSE 8080

ENTRYPOINT [ "java", "-Dquarkus.http.host=0.0.0.0", "-jar", "app.jar" ]
