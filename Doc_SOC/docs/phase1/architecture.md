# Conception détaillée — Phase 1

## 1. Vue d'ensemble de l'architecture
La plateforme adopte un style microservices. Chaque domaine fonctionnel est isolé dans son propre service, empaqueté via Docker et exposé via l'API Gateway Kong. L'orchestrateur SmartFlow agrège plusieurs services pour produire des réponses enrichies.

![Diagramme architecture](architecture.puml)

### Composants principaux
- **Mobility REST** (Spring Boot) — CRUD lignes/arrêts/horaires, PostgreSQL.
- **AirQuality SOAP** (JAX-WS) — AQI, polluants, comparaison, base legacy.
- **Emergency gRPC** (Go) — alertes temps réel, Redis Streams.
- **Directory GraphQL** (Spring Boot + Spring GraphQL) — annuaire, tickets, PostgreSQL (Flyway + seeds).
- **SmartFlow Orchestrator** — service REST qui combine SOAP + REST et fournit des recommandations.
- **API Gateway (Kong)** — authentification JWT, rate limiting, transformation protocolaire.
- **Web Client (React)** — tableau de bord, planificateur, annuaire, notifications ; comporte désormais un écran de connexion minimal centré ainsi que des vues AQI spécialisées pour les six zones du Grand Tunis.
- **Observabilité Stack** — Prometheus, Grafana, Loki, Jaeger pour métriques, logs, traces.

## 2. Diagrammes de séquence clés
Le diagramme suivant illustre le workflow "Planifier un trajet sain".

![Séquence Planificateur](sequence-trip-planner.puml)

Étapes principales :
1. L'utilisateur déclenche `/api/smartflow/trip-plan` via le client web.
2. SmartFlow appelle le service SOAP pour récupérer l'AQI de la zone.
3. En fonction du seuil AQI, SmartFlow interroge la disponibilité de lignes via REST.
4. SmartFlow retourne une recommandation enrichie (mode conseillé, justification AQI).

## 3. Contrats d'interface
- REST : `contracts/openapi/mobility-openapi.yaml`
- SOAP : `contracts/soap/airquality.wsdl`
- GraphQL : `contracts/graphql/directory-schema.graphql`
- gRPC : `contracts/grpc/emergency.proto`

Chaque fichier est versionné et servira de base pour la génération de code et la validation contractuelle (tests d'intégration via Postman/Newman, SoapUI, ghz, etc.).

## 4. Plan de sécurité
- **Authentification** : JWT signé (issuer interne). Le client web obtient un token via un Identity Provider simulé (Future Phase 2). Kong valide le token avant routage.
- **Autorisations** : ACL via Kong. Routes internes protégées par mTLS (Kong ↔ services).
- **Secrets** : stockés dans Vault ou Kubernetes Secrets (environnement dev : `.env` + Docker secrets).
- **Transport** : TLS obligatoire côté Gateway, certificats Let's Encrypt en prod, auto-signés en dev.
- **Protection** : Rate limiting, protection contre les injections (validation schema), audit logs.
- **Observabilité sécurité** : alertes sur changements de configuration Gateway, monitoring 4xx/5xx.

## 5. Stratégie d'orchestration et résilience
- **SmartFlow** applique un pattern Aggregator + Circuit Breaker (bibliothèque `opossum`).
- **Retries** exponentiels sur appels SOAP/REST (max 2).
- **Caching** AQI (Redis TTL 5 min) pour limiter la charge SOAP.
- **Timeouts** spécifiques : 3 s SOAP, 1 s REST, 500 ms gRPC.
- **Fallback** : si SOAP indisponible, utiliser dernier AQI cache et marquer la réponse "stale".

## 6. Modèle de données logique
- Entités Mobilité : `Line`, `Stop`, `Trip`, `Booking`.
- Entités AQI : `Zone`, `AQIReport`, `PollutantLevel`.
- Entités Urgences : `Alert`, `AlertAck`.
- Entités Annuaire/Tickets : `Service`, `Ticket`, `ContactInfo`.

## 7. Infrastructure et déploiement
- **docker-compose** orchestrera : services + Kong + DBs + observabilité + client.
- Réseaux Docker séparés : `frontend-net` (Client ↔ Gateway) et `backend-net` (Gateway ↔ services).
- Volumes persistants pour PostgreSQL (mobility, directory, emergency) et Redis snapshot.
- CI génèrera les images `ghcr.io/smartcity/{service}:tag`.

## 8. Livrables Phase 1
- Diagrammes PlantUML (`docs/phase1/architecture.puml`, `docs/phase1/sequence-trip-planner.puml`).
- Contrats d'interface (répertoire `contracts`).
- Documentation de conception (ce document) incluant sécurité, résilience et infra.
