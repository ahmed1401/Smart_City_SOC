# syntax=docker/dockerfile:1.6
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/airquality-soap-0.1.0-SNAPSHOT.jar app.jar
ENV SOAP_BIND_ADDRESS=http://0.0.0.0:8081/airquality
EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]
