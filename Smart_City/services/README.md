# Services

Ce dossier regroupe les quatre services métiers exposés derrière Kong. Chaque sous-dossier dispose de son README détaillé, mais ce document offre une vue synthétique pour comprendre leur rôle, leur stack et la manière de les exécuter.

## Vue d'ensemble
| Service | Protocole | Port interne | Stack | Description rapide |
| --- | --- | --- | --- | --- |
| `mobility-rest` | REST / JSON | 8080 | Spring Boot 3 + PostgreSQL | Lignes, arrêts, horaires et réservations multimodales persistées dans Postgres. |
| `airquality-soap` | SOAP / XML | 8081 | Java + JAX-WS | Rapports AQI et profils de polluants simulés pour les zones du Grand Tunis. |
| `emergency-grpc` | gRPC | 50051 | Spring Boot 3 + PostgreSQL | Diffusion, persistance et streaming des alertes d'urgence. |
| `directory-graphql` | GraphQL / HTTP | 8082 | Spring Boot 3 + GraphQL + PostgreSQL | Annuaire municipal + tickets citoyens entièrement migrés vers Postgres. |

## Commandes principales
```bash
# Mobility REST
(cd services/mobility-rest && mvn spring-boot:run)

# AirQuality SOAP
(cd services/airquality-soap && mvn package && java -jar target/airquality-soap-0.1.0-SNAPSHOT.jar)

# Emergency Service (gRPC)
(cd services/emergency-grpc && mvn spring-boot:run)

# Directory Service (GraphQL)
(cd services/directory-graphql && mvn spring-boot:run)
```

Tous les services disposent d'un `Dockerfile` compatible avec le `docker-compose.yml` racine. Pour reconstruire un service spécifique :
```bash
docker compose up -d --build mobility-rest
```
(remplacez par `airquality-soap`, `emergency-grpc` ou `directory-graphql`).

## Dépendances externes
- **mobility-rest** : PostgreSQL (`SPRING_DATASOURCE_*`), migrations dans `schema.sql`.
- **airquality-soap** : aucune base ; données en mémoire.
- **emergency-grpc** : PostgreSQL (`EMERGENCY_DB_*`) avec migrations Flyway (`db/migration`).
- **directory-graphql** : PostgreSQL (`DIRECTORY_DB_*`) et schéma GraphQL importé depuis `contracts/graphql`.

## Intégration via Kong
| Route Kong | Service interne |
| --- | --- |
| `/api/mobility/*` | mobility-rest |
| `/api/airquality` (proxy SOAP) | airquality-soap |
| `/api/emergency/*` (gRPC → HTTP) | emergency-grpc (exploité via SmartFlow) |
| `/api/directory` | directory-graphql |

Le service `smartflow` consomme ces quatre services pour fournir des vues consolidées au dashboard React.
