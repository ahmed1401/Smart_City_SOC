# Smart City Interop Platform — Full Description

## Purpose & Scope
Plateforme démonstrateur pour une collectivité connectée : elle combine REST, SOAP, gRPC et GraphQL derrière une gateway Kong sécurisée et expose un tableau de bord React. L'objectif est double : prouver l'interopérabilité multi-protocoles (mobilité, qualité de l'air, urgences, annuaire citoyens) et servir de bac à sable pour tester des patterns d'orchestration (SmartFlow), de sécurité (JWT + clé API) et d'observabilité.

## High-Level Architecture
- **Gateway (Kong)** — Authentifie chaque requête (JWT HS256 + `x-api-key`), termine TLS et route vers les services internes.
- **SmartFlow Orchestrator (Node/Express)** — Point d'entrée métier : compose les services REST/SOAP/gRPC, intègre retries (`p-retry`), timeout (`AbortController`) et cache (Redis ou mémoire) pour limiter la charge.
- **Domain services**
  - `mobility-rest` (Spring Boot REST) — horaires, lignes, réservations.
  - `airquality-soap` (JAX-WS SOAP) — rapports AQI et polluants simulés.
  - `emergency-grpc` (Go gRPC) — flux d'alertes critiques avec streaming server-side.
  - `directory-graphql` (Apollo) — annuaire des services municipaux + tickets citoyens.
- **Client web** — SPA React/Vite consommant les endpoints Kong (`/api/*`).
- **Infra partagée** — Postgres (mobilité, annuaire, urgences), Redis (cache orchestrateur, fallback mémoire), certificats TLS facultatifs.

```
Browser → Kong (JWT + API Key, TLS) → SmartFlow → {Mobility REST, Air Quality SOAP, Emergency gRPC, Directory GraphQL}
                                           ↘ Redis cache & SSE alerts
```

## Run Instructions
1. **Prérequis** : Docker Desktop (WSL2) en marche, ports `8000/8443/4173` libres.
2. **Initialisation** : depuis la racine `SOC/` (où se trouve `docker-compose.yml`).
3. **Build** : `docker compose build` — construit chaque image (Spring Boot, Node, Go, React, Kong).
4. **Démarrage** : `docker compose up` (ou `docker compose up -d`). Attendre l'initialisation Postgres avant de consommer les services.
5. **Accès** :
   - Gateway HTTP: `http://localhost:8000`
   - Gateway HTTPS (si certs présents): `https://localhost:8443`
   - Dashboard: `http://localhost:4173`

### Auth & Test Tokens
- Chaque requête vers Kong doit porter `Authorization: Bearer <jwt>` **et** `x-api-key`.
- Secrets de test : `citizen-api-key` / `supersecretcitizen`, `operator-api-key` / `supersecretoperator` (voir `docs/phase4/gateway-security.md` pour générer un JWT daté < 1h).
- Exemple :
  ```bash
  curl http://localhost:8000/api/smartflow/metrics/overview \
    -H "x-api-key: citizen-api-key" \
    -H "Authorization: Bearer <jwt>"
  ```

### Développement local
- Chaque service peut être lancé seul (voir README spécifiques) ; ajuster les URLs dans `.env` du dashboard (`VITE_GATEWAY_URL`) ou dans `orchestrator/smartflow` (variables `*_BASE_URL`).

## Service Breakdown & Mechanics
### Mobility REST (`services/mobility-rest`)
- **But** : exposer lignes, horaires, arrivées et gérer des réservations multimodales.
- **API clés** :
  - `GET /api/lines?mode=&status=` — filtre sur mode (`bus`, `bike`, `tram`, `metro`) et statut.
  - `GET /api/lines/{id}/schedule` — génère un `Schedule` dynamique pour la ligne (départ `now+5min`).
  - `GET /api/stops/{stopId}/arrivals` — retourne l'ETA des lignes desservant l'arrêt.
  - `POST /api/bookings` — crée une réservation (UUID + `OffsetDateTime`).
- **Données & calculs** :
  - Le référentiel (`MobilityRepository`) pré-charge 4 lignes avec leurs arrêts (`GeoPoint`).
  - Les horaires d'un trajet sont générés en incrémentant de 6 minutes chaque arrêt (`buildStopTimes`).
  - Les arrivées injectent un jitter aléatoire ±1 min pour simuler des conditions réelles (`ThreadLocalRandom`).
  - Les réservations sont persistées dans Postgres via JPA (`BookingEntity`). Le schéma est appliqué à chaque démarrage grâce à `spring.sql.init` et `defer-datasource-initialization`, ce qui garantit l'existence de la table `bookings` même après un redéploiement. Un timestamp `OffsetDateTime.now()` est utilisé si le client n'en fournit pas.

### AirQuality SOAP (`services/airquality-soap`)
- **But** : service SOAP `AirQualityService` (namespace `http://smartcity.example.com/airquality`).
- **Opérations exposées** :
  - `GetAQI(zoneCode)` — construit un `AQIReport` à partir d'un `Map` de valeurs simulées (`CENTRE=85`, `NORD=42`, `SUD=65`). La catégorie est `Unhealthy` si >100 sinon `Moderate`; recommandation « Privilégier transports couverts » si >80.
  - `GetPollutants(zoneCode)` — retourne une liste fixe (`PM2.5`, `PM10`, `NO2`).
  - `CompareZones(zoneA, zoneB)` — calcule `deltaAQI` et identifie la zone la plus polluée (`higherZone`) ; `PM2.5` dominant par défaut.
- **Particularités** : service expose port `8081` et sert de source SOAP pour SmartFlow; pas de persistence.

### Emergency gRPC (`services/emergency-grpc`)
- **But** : produire et diffuser des alertes (trafic, météo, sécurité) en gRPC.
- **API (`emergency.proto`)** :
  - `SendAlert(Alert)` — valide/signe l'alerte (identifiant `YYYYMMDDTHHMMSSZ` si absent, timestamp UNIX si 0)
  - `GetRecentAlerts(RecentRequest)` — renvoie `limit` dernières alertes via `MemoryStore.Recent` (cap 50).
  - `SubscribeAlerts(AlertFilter)` — flux server-side (utilisé pour SSE). Le filtre compare `types`, `zones`, `minimum_severity`.
- **Mechanics** :
  - Stockage in-memory thread-safe (`MemoryStore`), diffusion via channels tamponnés (10).
  - Chaque `AddAlert` pousse en tête de liste et notifie les subscribers en non-bloquant.

### Directory GraphQL (`services/directory-graphql`)
- **But** : API GraphQL Spring Boot pour l'annuaire municipal et les tickets citoyens.
- **Schéma** : `contracts/graphql/directory-schema.graphql` (Query service/services/tickets, Mutations createTicket/closeTicket).
- **Données** :
  - Services statiques (`svc-transport`, `svc-air`, etc.) incluant coordonnées, horaires, indicateurs AQI liés.
  - Tickets persistés dans PostgreSQL via Spring Data JPA (`DirectoryTicketEntity`). Flyway applique les seeds au démarrage et le volume `pg_directory_data` conserve les données entre redémarrages.
- **Persistences** : variables `DIRECTORY_DB_URL/USERNAME/PASSWORD` injectées par Docker Compose. Les tests utilisent H2 en mémoire pour rester hermétiques.
- **Calculs** : filtres textuels/catégorie coté résolveurs (`services`), filtrage status/service (`tickets`).
- **Exposition** : port 8082 (GraphQL path `/graphql`), monté derrière Kong (`/api/directory`).

### SmartFlow Orchestrator (`orchestrator/smartflow`)
- **But** : endpoint unifié pour la SPA et les systèmes externes.
- **Endpoints** :
  - `POST /trip-plan` — lit `zoneCode/preferredMode/stopId`, appelle `fetchAQI` puis applique `pickMode` :
    - AQI ≥ 120 → `metro`
    - AQI ≥ 90 et préférence `bike` → fallback `bus`
    - Sinon `preferredMode` ou `tram` si AQI > 70, sinon `bike`.
    - Ensuite récupère `lines` & `arrivals` du mode retenu et renvoie une recommandation (motivation = `aqi.recommendation`, `caution = category`).
  - `GET /metrics/overview` — `Promise.all` de `fetchAQI`, `fetchLines(preferredMode)`, `fetchArrivals(stopId)` et `fetchRecentAlerts(5)`.
  - `GET /alerts/recent` & `/alerts/stream` — proxy vers gRPC : `/stream` convertit `SubscribeAlerts` en SSE avec heartbeat 15s et nettoyage (`stream.cancel`). Le endpoint `/alerts/recent` accepte désormais `limit`, `minimumSeverity`, `types` et `zones` pour appliquer les filtres server-side avant de pousser la réponse au dashboard.
- **Services clients** :
  - `airQualityClient` — construit enveloppe SOAP, parse via `fast-xml-parser`, gère namespace dynamiques, retries (2) + cache 5 minutes en Redis (`getCache/setCache`). En cas d'échec, renvoie cache marqué `stale: true`.
  - `mobilityClient` — Axios 2s timeout + `p-retry`.
  - `emergencyClient` — gRPC client `@grpc/grpc-js`, lazy init, streaming.
- **Observabilité** : `pino-http` logge chaque requête; middleware d'erreurs renvoie `502` par défaut avec code `orchestration_failed`.

### Gateway / Kong (`gateway/kong`)
- **But** : front door, politiques de sécurité et routage.
- **Config (`gateway/kong/kong.yml`)**
  - Routes : `/api/smartflow/*`, `/api/directory`, `/api/mobility`, etc.
  - Plugins : `jwt`, `key-auth`, rate-limiting (si activé).
- **TLS** : port 8443 activé si `gateway/certs/server.(crt|key)` présents (montés read-only).
- **Consumers** : `citizen-app`, `operator-app` (voir docs phase4 pour secrets et commandes d'émission JWT).

- **Web Dashboard (`client/web-dashboard`)**
  - **Stack** : Vite + React + TanStack Query pour la donnée, Playwright pour E2E.
  - **Sécurité UX** : l'application reste verrouillée tant que l'utilisateur n'est pas authentifié. L'écran d'accueil a été remplacé par un cartouche central minimal (description + formulaire Connexion/Inscription) qui pré-remplit les en-têtes `x-api-key`/JWT dès validation. Le panneau d'authentification (`SessionContext`) alimente toutes les pages.
  - **Pages & flux** :
    - `Dashboard AQI` → `GET /api/smartflow/metrics/overview` (3 colonnes responsives : focus AQI/polluants du Grand Tunis, lignes recommandées et alertes SSE en rotation).
    - `Planificateur` → `POST /api/smartflow/trip-plan` (grille zone/mode/stop calée sur les arrondissements Grand Tunis, justification AQI).
    - `Annuaire` → GraphQL `/api/directory` (liste services + tickets, mutations pour soumettre/closer) avec filtrage forcé sur le `citizenId` de session.
    - `Alertes temps réel` → SSE `/api/smartflow/alerts/stream` (ping keep-alive 15s, fallback `/alerts/recent`) avec timeline compacte.
  - **Config** : `.env` (`VITE_GATEWAY_URL`, `VITE_API_KEY`, `VITE_JWT`). Build statique servi sur port 4173 par un container Node (Vite preview mode).

### Supporting Infrastructure
- **Postgres (mobility)** — stockage persistant des réservations (`bookings`) avec volume `pg_mobility_data`. Toute recréation de conteneur rejoue `schema.sql` pour garantir la structure.
- **Postgres (directory)** — base dédiée `pg_directory_data` hébergeant services/tickets avec migrations Flyway (`directory_service`, `directory_ticket`, `service_hours`).
- **Redis** — cache partagés pour AQI. Si indisponible, SmartFlow fallback en mémoire (Map TTL).
- **Contracts** — dossier `contracts/` (OpenAPI, proto, GraphQL schema, WSDL) pour assurer traçabilité des interfaces.

## Operational Notes
- **Tests** :
  - SmartFlow : `npm test` (Jest) avec mocks d'axios/gRPC.
  - Directory GraphQL : `mvn -pl services/directory-graphql test` (Spring GraphQL + H2 en mémoire).
  - Web dashboard : `npm run test:e2e` (Playwright) — nécessite `RUN_E2E=1` et `PLAYWRIGHT_BASE_URL`.
- **Playwright smoke** : avec la stack Docker up, exécuter depuis `client/web-dashboard` :
  ```bash
  RUN_E2E=1 PLAYWRIGHT_BASE_URL=http://localhost:4173 npm run test:e2e
  ```
- **Logs & Observabilité** :
  - Kong logs JSON (stdout). Ajouter Fluent Bit/Loki (phase future).
  - SmartFlow logs Pino (correlation ID via `req.id`).
  - Emergency gRPC logge chaque alerte (`zerolog`).
- **Extensibilité** :
  - Ajouter d'autres modes de transport (data se seed dans `MobilityRepository`).
  - Remplacer `SAMPLE_AQI` par un connecteur externe (ex. Azure Maps).
  - Brancher un IdP OpenID Connect dans Kong (remplace JWT statique).

## Quick Reference
| Component | Protocol | Port (internal) | Highlights |
|-----------|----------|-----------------|------------|
| mobility-rest | REST/JSON | 8080 | Lignes, horaires, réservations, jitter ETA |
| airquality-soap | SOAP/XML | 8081 | AQI calculs statiques + recommandations | 
| emergency-grpc | gRPC | 50051 | Alertes push + streaming | 
| directory-graphql | GraphQL/HTTP | 4000 | Annuaire + tickets | 
| smartflow | REST/JSON + SSE | 7000 | Orchestration, cache Redis, SSE Alerts |
| kong | HTTP/TLS proxy | 8000/8443 | JWT + API Key, routing | 
| web-dashboard | SPA (Vite) | 4173 | UI unique pour tous les flux |

Cette description couvre l'architecture, l'exécution et la mécanique de chaque service afin d'accélérer la prise en main ou la rédaction de runbooks supplémentaires.
