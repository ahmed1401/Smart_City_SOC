# Plan de scaffolding — Phase 2

## Structure cible du dépôt
```
SOC/
  README.md
  docker-compose.yml
  contracts/
  docs/
  services/
    mobility-rest/
    airquality-soap/
    emergency-grpc/
    directory-graphql/
  orchestrator/
    smartflow/
  gateway/
    kong/
  client/
    web-dashboard/
  infra/
    databases/
```

Chaque service possède un README, un fichier de configuration d'environnement, un Dockerfile et un script pour démarrer localement.

## Technologies par dossier
| Dossier | Stack | Description |
|---------|-------|-------------|
| `services/mobility-rest` | Spring Boot + Maven + PostgreSQL | API REST alignée sur `mobility-openapi.yaml`. |
| `services/airquality-soap` | JAX-WS + Maven + Payara Micro | Implémentation SOAP exposant `airquality.wsdl`. |
| `services/emergency-grpc` | Go + gRPC + Redis | Serveur gRPC conforme à `emergency.proto`. |
| `services/directory-graphql` | Spring Boot + Spring GraphQL + PostgreSQL | API GraphQL (`directory-schema.graphql`). |
| `orchestrator/smartflow` | Node.js/TypeScript + Axios | Service d'agrégation orchestrant SOAP/REST. |
| `gateway/kong` | Kong declarative config + migrations Postgres | Gateway unique. |
| `client/web-dashboard` | React + Vite + TypeScript | Tableau de bord citoyen avec écran de connexion centré et vues AQI Grand Tunis. |
| `infra/databases` | Dockerfiles init PostgreSQL (mobility/directory/emergency) + Redis | Données de démonstration. |

## Artefacts créés dans cette phase
- Squelettes de projets avec fichiers essentiels : `pom.xml`, `go.mod`, `package.json`, `tsconfig`, `Dockerfile`, `.env.example`, README.
- Scripts communs : `docker-compose.yml`, `Makefile` (optionnel) pour orchestrer.
- Config Gateway : `gateway/kong/kong.yml` (routes, services). 
- Documentation d'onboarding dans `README.md`.
