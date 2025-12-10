# AirQuality SOAP Service

Implémentation JAX-WS standalone conforme au contrat `contracts/soap/airquality.wsdl`.

## Démarrage local
```bash
mvn package
java -jar target/airquality-soap-0.1.0-SNAPSHOT.jar
```

Utiliser la variable `SOAP_BIND_ADDRESS` pour personnaliser l'URL (par défaut `http://0.0.0.0:8081/airquality`).

## Docker
```bash
docker build -t smartcity/airquality-soap:dev .
docker run -p 8081:8081 smartcity/airquality-soap:dev
```

## Notes
- WSDL accessible via `http://localhost:8081/airquality?wsdl`.
- Les données sont simulées en mémoire.
