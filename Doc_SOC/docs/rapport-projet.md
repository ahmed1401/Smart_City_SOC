# Rapport complet du projet Smart City Orchestrator

_Auteur : Ahmed HAJJEJ_
_Date : 10 décembre 2025_

## 1. Contexte et objectifs
Le projet Smart City Orchestrator (SOC) fournit une plateforme urbaine intégrée permettant de superviser les flux de mobilité, la qualité de l'air, le répertoire des ressources et la gestion des alertes d'urgence. L'objectif est d'offrir un socle cohérent mêlant microservices Spring Boot, orchestrateur Node.js et tableau de bord React, avec une chaîne d'outillage moderne (tests automatisés, CI/CD potentiel, packaging Docker Compose).

## 2. Architecture globale
- **Backend Java** : trois services Spring Boot 3 (REST, GraphQL, gRPC) + un service SOAP (airquality) empaquetés via Maven.
- **Orchestrateur SmartFlow** : application Node.js/TypeScript exposant des APIs REST et un flux SSE, consommant les services backend (REST, SOAP, gRPC) et Redis pour le cache.
- **Gateway** : Kong 3.5 (mode declarative config) appliquant authentification JWT + clé API, centralisant toutes les routes vers SmartFlow.
- **Frontend** : tableau de bord React/Vite avec TanStack Query, SSE live feed et Playwright pour les tests E2E.
- **Infra de persistance** : PostgreSQL (mobility, directory, emergency) + Redis, orchestrés via Docker Compose.
- **Packaging** : `docker-compose.yml` crée deux réseaux (`backend`, `frontend`) et fournit les dépendances partagées.

## 3. Composants principaux
### 3.1 Services Spring Boot
| Service | Protocole | Ports | Base de données | Responsabilité |
|---------|-----------|-------|-----------------|----------------|
| `mobility-rest` | REST | 8080 | PostgreSQL `pg_mobility_data` | Trajets, véhicules, indicateurs de mobilité. |
| `directory-graphql` | GraphQL | 8082 | PostgreSQL `pg_directory_data` | Répertoire unifié d'acteurs et assets. |
| `emergency-service` | gRPC + HTTP actuator 9090/50051 | PostgreSQL `pg_emergency_data` | Diffusion/stockage des alertes et simulateur 5 s. |
| `airquality-soap` | SOAP | 8081 | Aucun (données synthétiques) | Indicateurs qualité de l'air avec client SOAP dans SmartFlow. |

### 3.2 Orchestrateur `smartflow`
- Express + TypeScript.
- Clients dédiés : REST (Mobility), SOAP (AirQuality via `soap`), gRPC (`@grpc/grpc-js`).
- Expose : `/alerts/recent`, `/alerts/stream` (SSE), `/alerts/send` (POST -> gRPC `SendAlert`).
- Utilise Redis (cache) et charge les contrats gRPC depuis `contracts/grpc`.

### 3.3 Gateway Kong
- Fichier `gateway/kong/kong.yml` définissant services, routes et la stratégie d'authentification (JWT + API Key).
- Monte les certificats TLS auto-signés pour exposition 8000/8443.

### 3.4 Tableau de bord `client/web-dashboard`
- React 18 + Vite + TypeScript.
- Composants : cartes synthèse, timeline des alertes, planificateur, formulaire `SendAlert`.
- Tests : Vitest unitaires et Playwright E2E (smoke, navigation).

## 4. Tests et validation
1. **Unitaires Maven** : `mvn -pl services/<module> test` pour mobility, directory, emergency.
2. **SmartFlow** : `npm run test` (Vitest) dans `orchestrator/smartflow`.
3. **Frontend** : `npm run build` + `RUN_E2E=1 npm run test:e2e` (Playwright).
4. **Intégration Docker** : `docker compose build` puis `docker compose up -d`. Tous les services démarrent avec leurs dépendances.
5. **Vérifications manuelles** :
   - `docker compose logs smartflow --tail=20` -> HTTP 200 sur `/api/smartflow/alerts/recent`.
   - `docker compose logs emergency-service` -> simulateur injecte une alerte toutes les 10 s.
   - Formulaire SendAlert opérationnel (statut 200 via Kong).

## 5. Correctifs clés avant soumission
- **Placeholder Spring mal fermé** : `EMERGENCY_SIMULATOR_PERIOD_MS` manquait la `}` dans `application.yml`. Correction :
  ```yaml
  emergency:
    simulator:
      period-ms: ${EMERGENCY_SIMULATOR_PERIOD_MS:10000}
  ```
  Rebuild ciblé : `docker compose up -d --build emergency-service`.
- **Conflit DNS gRPC** : suppression de l'ancien conteneur `soc-emergency-grpc-1` (ancien nom de service) pour éviter `Name resolution failed for target dns:emergency-service:50051`.
- **Relance globale** : `docker compose up -d` après rebuild pour assurer la cohérence entre services et gateway.

## 6. Procédure de mise en route
```powershell
cd C:\Users\user\Downloads\SOC
# Build & tests (optionnel si déjà effectués)
mvn -B test
cd orchestrator\smartflow && npm install && npm run test
cd ..\..\client\web-dashboard && npm install && npm run build && npm run test:e2e

# Démarrage stack
cd ..\..
docker compose build
docker compose up -d

# Accès
- Dashboard : http://localhost:4173
- Gateway : http://localhost:8000 (JWT + API key requis)
```

## 7. Résultats finaux
- Tests unitaires, intégration et E2E réussis.
- Stack Docker fonctionnelle, prouvée par les logs SmartFlow et emergency-service.
- Documentation (README, Description, rapport présent) alignée avec l'état du code.

## 8. Recommandations post-soumission
1. Exporter les journaux de tests/build si une preuve officielle est demandée.
2. Pour les démonstrations, laisser `docker compose up -d` actif ; sinon `docker compose down` pour libérer les ressources.
3. Toute modification des intervalles du simulateur doit respecter la syntaxe `${VAR:default}` et nécessitera un `docker compose up -d --build emergency-service`.

---
Projet Smart City Orchestrator prêt pour évaluation et déploiement pilote.
