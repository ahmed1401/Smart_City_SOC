# syntax=docker/dockerfile:1.6
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./pom.xml
COPY services ./services
COPY orchestrator ./orchestrator
COPY contracts ./contracts
RUN mvn -q -pl services/directory-graphql -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/directory-graphql/target/*.jar /app/app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]
