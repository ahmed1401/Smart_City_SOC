# syntax=docker/dockerfile:1.6
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./pom.xml
COPY services ./services
COPY orchestrator ./orchestrator
COPY contracts ./contracts
RUN mvn -q -pl services/emergency-grpc -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/emergency-grpc/target/*.jar /app/app.jar
EXPOSE 50051 9090
ENTRYPOINT ["java","-jar","/app/app.jar"]
