FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/datasteward-hub-api-1.0.0.jar app.jar
EXPOSE 8080
USER 1000
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
