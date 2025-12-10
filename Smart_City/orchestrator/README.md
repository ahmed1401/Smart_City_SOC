# Orchestrator

Ce répertoire regroupe tous les services d'orchestration utilisés par la plateforme. Il contient actuellement **SmartFlow**, un service Node.js/TypeScript qui compose les APIs REST, SOAP, gRPC et GraphQL avant d'exposer une façade unique consommée par le dashboard.

## Structure
- `smartflow/` — service Express + Vitest
  - `contracts/grpc/emergency.proto` — fichier proto utilisé pour les clients gRPC internes
  - `src/` — contrôleurs (`routes`), clients distants (SOAP/REST/gRPC) et utilitaires (cache Redis, formatteurs SSE)
  - `Dockerfile` — image multi-stage Node 20
  - `README.md` — guide complet (installation, commandes)

## Fonctionnalités couvertes par SmartFlow
- **Agrégation temps réel** : combine les métriques AQI (SOAP) et transport (REST) pour alimenter `GET /metrics/overview`
- **Planificateur multimodal** : `POST /trip-plan` choisit dynamiquement le mode de transport selon l'AQI, le mode préféré et la zone
- **Alertes Emergency** : proxy gRPC vers SSE (`/alerts/stream`) et fallback REST (`/alerts/recent`)
- **Cache distribué** : support Redis (TTL configurable) + fallback mémoire
- **Résilience** : retries exponentiels, timeout par protocole, mise en quarantaine des services en erreur

## Lancer SmartFlow
```bash
cd orchestrator/smartflow
cp .env.example .env    # personnaliser les URL externes si nécessaire
npm install
npm run dev             # démarre sur http://localhost:7000
```

Envoyez les appels via Kong (`/api/smartflow/*`) pour bénéficier des en-têtes JWT + clé API, ou ciblez directement `http://localhost:7000` durant le développement.

### Variables importantes
| Variable | Description |
| --- | --- |
| `PORT` | Port HTTP local (défaut `7000`). |
| `MOBILITY_BASE_URL` | Endpoint du service REST mobilité (`http://mobility-rest:8080`). |
| `AIRQUALITY_SOAP_URL` | Endpoint SOAP (`http://airquality-soap:8081/airquality`). |
| `DIRECTORY_GRAPHQL_URL` | URL GraphQL (facultatif). |
| `EMERGENCY_GRPC_URL` | Adresse gRPC (ex: `emergency-grpc:50051`). |
| `REDIS_URL` | Chaîne de connexion Redis pour le cache partagé. |

## Tests & qualité
```bash
cd orchestrator/smartflow
npm test      # Vitest (clients mockés)
```

Le dossier `contracts/` est synchronisé avec `../../contracts/` pour garantir que le service utilise exactement la même définition gRPC que le reste de la plateforme.
