# Cahier des charges — Plateforme de services urbains interopérables

## 1. Vision
Fournir une couche unifiée d'accès à quatre services urbains hétérogènes (REST, SOAP, GraphQL, gRPC) afin de répondre aux besoins des citoyens et opérateurs d'une ville intelligente (mobilité, qualité de l'air, urgences, annuaire/tickets). La solution doit faciliter l'orchestration métier, l'intégration de systèmes legacy et modernes, et exposer une interface cohérente via une API Gateway sécurisée ainsi qu'un client web. Le pilote actuel se concentre sur le Grand Tunis (Tunis Centre, Lac 2, La Marsa, Sidi Bou Saïd, Ariana, Ben Arous) pour démontrer l'ancrage géographique.

## 2. Cas d'usage prioritaires
1. **Planifier un trajet sain** : combiner disponibilité des lignes (REST) et qualité de l'air (SOAP) pour recommander un mode de transport adapté.
2. **Suivre la qualité de l'air par quartier** : tableau de bord affichant AQI, polluants, comparaisons historiques.
3. **Diffuser des alertes d'urgence** : envoyer/réceptionner des alertes temps réel (gRPC streaming) pour les services de secours et le public.
4. **Consulter l'annuaire municipal et ouvrir des tickets** : requêtes GraphQL pour rechercher services, horaires, contacts et créer des tickets de support.
5. **Superviser l'état global** : opérateur back-office visualise l'état des services, leurs journaux et la santé des intégrations via le client web.

## 3. Acteurs
- **Citoyen** (client web) : planifie des trajets, consulte AQI, crée des tickets.
- **Opérateur Mobilité** : met à jour lignes/horaires, surveille la demande.
- **Agence Environnementale** : publie la qualité de l'air et les polluants.
- **Centre d'Urgence** : émet/consomme des alertes critiques.
- **Administrateur Système** : configure Gateway, sécurité, observabilité.

## 4. Contraintes fonctionnelles
- Exposer au minimum quatre services utilisant des protocoles différents (REST, SOAP, GraphQL, gRPC) avec documentation contractuelle (OpenAPI, WSDL, SDL, .proto).
- Fournir un service d'orchestration combinant plusieurs services.
- API Gateway unique offrant authentification, contrôle de débit, routage, transformation protocolaires.
- Client web (SPA) consommant les services via la Gateway.
- Support de workflows synchrones (REST/SOAP/GraphQL) et asynchrones (gRPC streaming, WebSockets/SSE).

## 5. Exigences non fonctionnelles
| Domaine                  | Exigence |
|--------------------------|----------|
| Disponibilité            | 99,5 % sur les services critiques (mobilité, urgences). |
| Latence REST/GraphQL     | < 200 ms p95 intra-datacenter. |
| Latence gRPC             | < 50 ms p95 pour `SendAlert`. |
| Sécurité                 | Authentification JWT côté Gateway, TLS obligatoire, chiffrement au repos sur bases sensibles. |
| Observabilité            | Logs structurés (JSON), métriques Prometheus, traces OpenTelemetry. |
| Scalabilité              | Services conteneurisés, prêts pour Kubernetes. |
| Compatibilité            | Maintien des formats legacy (XML/WSDL) et modernes (JSON/ProtoBuf). |

## 6. Choix technologiques
| Domaine | Technologie | Justification |
|---------|-------------|---------------|
| REST Mobilité | Spring Boot 3 (Java 21), PostgreSQL, Flyway | Ecosystème mature, support OpenAPI natif, bonne intégration DB. |
| SOAP Qualité de l'air | Java + JAX-WS (Jakarta EE 10), Payara Micro | Compatible WSDL-first, outillage SOAP éprouvé. |
| gRPC Urgences | Go 1.21 + gRPC + Redis Pub/Sub | Faible latence, déploiement léger, streaming natif. |
| GraphQL Annuaire/Tickets | Spring Boot 3 + Spring GraphQL + PostgreSQL | Intégration unifiée avec le reste du socle Java, migrations Flyway, données relationnelles. |
| Orchestrateur SmartFlow | Node.js/TypeScript + Axios + circuit breaker (opossum) | Facile pour aggregator pattern. |
| API Gateway | Kong OSS + Postgres (config) | Routage multi-protocoles, plugins sécurité. |
| Client Web | React 18 + Vite + Apollo Client + gRPC-web (via Envoy) | Expérience utilisateur moderne, tooling riche. |
| Conteneurisation | Docker multi-stage, docker-compose, option K8s | Portabilité. |
| CI/CD | GitHub Actions (build, test, lint, scan, push images) | Automatisation standard. |
| Observabilité | Prometheus, Grafana, Loki, Jaeger | Stack open-source. |

## 7. Spécifications API minimales
### 7.1 Mobilité intelligente (REST)
- `GET /lines` — liste des lignes (filtre mode de transport, statut).
- `GET /lines/{id}` — détails d'une ligne.
- `GET /lines/{id}/schedule?date=ISO` — horaires par ligne.
- `GET /stops/{id}/arrivals` — prochains passages.
- `POST /bookings` — réserver un trajet (body JSON). 
- **Documentation** : `contracts/openapi/mobility-openapi.yaml`.

### 7.2 Qualité de l'air (SOAP)
- `GetAQI(zoneCode)` → `AQIReport` (valeur, tendance, recommandations).
- `GetPollutants(zoneCode)` → liste `PollutantLevel`.
- `CompareZones(zoneA, zoneB)` → `ComparisonResult` (delta AQI, polluants dominants).
- **Documentation** : `contracts/soap/airquality.wsdl`.

### 7.3 Urgences & Santé publique (gRPC)
- `rpc SendAlert(Alert) returns (Ack)` : push d'une alerte.
- `rpc SubscribeAlerts(AlertFilter) returns (stream Alert)` : flux temps réel filtrable.
- `rpc GetRecentAlerts(RecentRequest) returns (AlertList)` : fallback polling.
- **Documentation** : `contracts/grpc/emergency.proto`.

### 7.4 Annuaire & Tickets (GraphQL)
- `type Service { id name category contact hours location relatedAQI }`
- `type Ticket { id subject status priority createdAt serviceId }`
- Queries : `service(id)`, `services(filter)`, `tickets(status, serviceId)`.
- Mutations : `createTicket(input)`, `closeTicket(id)`.
- **Documentation** : `contracts/graphql/directory-schema.graphql`.

## 8. Données & stockages
| Service | Base | Données clés |
|---------|------|--------------|
| Mobilité | PostgreSQL | Lignes, arrêts, horaires, réservations. |
| Qualité de l'air | (option) PostgreSQL/CSV legacy | AQI par zone, polluants, historique. |
| Urgences | Redis Streams/Cluster | Alerts temps réel, backlog court. |
| Annuaire/Tickets | PostgreSQL | Services municipaux structurés, tickets et SLA. |
| Gateway | PostgreSQL (Kong) | Config routes, clés, consumers. |

## 9. Risques & mesures
- **Interopérabilité** : fournir adaptateurs (ex. SOAP client vers JSON) via orchestrateur. -> tests d'intégration contractuels.
- **Sécurité** : secrets via Vault/.env, scans SCA, TLS mTLS interne.
- **Disponibilité** : déploiement container orchestré, readiness probes, scaling horizontal.
- **Performance** : caching AQI (TTL 5 min), prefetch horaires, gRPC streaming pour alertes.
- **Maintenance** : documentation exhaustive, tests automatisés, linting.

## 10. Livrables Phase 0
- Cahier des charges (ce document).
- Table des APIs/contrats.
- Liste technologies et contraintes.
- Backlog initial (dans issue tracker ultérieur).
