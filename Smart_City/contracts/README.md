# Contracts

Spécifications officielles utilisées pour garantir l'interopérabilité entre les services de la plateforme. Chaque fichier est la source de vérité pour la génération de clients, la documentation et les tests contractuels.

## Répartition
| Dossier | Format | Service concerné | Description |
| --- | --- | --- | --- |
| `openapi/mobility-openapi.yaml` | OpenAPI 3.0 | Mobility REST | Lignes, arrêts, horaires, réservations (`/lines`, `/stops`, `/bookings`). Sert de base aux tests Postman/Newman et au client React. |
| `soap/airquality.wsdl` | WSDL 1.1 | AirQuality SOAP | Définit les opérations `GetAQI`, `GetPollutants`, `CompareZones`. Utilisé par SmartFlow pour générer les enveloppes SOAP. |
| `graphql/directory-schema.graphql` | GraphQL SDL | Directory Service | Schéma `Service`, `Ticket`, queries/mutations. Copié dans le module Spring GraphQL pour la validation et l'autocompletion. |
| `grpc/emergency.proto` | Protocol Buffers v3 | Emergency Service | Types `Alert`, `RecentRequest`, RPC `SendAlert`, `GetRecentAlerts`, `SubscribeAlerts`. Partagé avec SmartFlow pour générer les clients TypeScript/Go. |

