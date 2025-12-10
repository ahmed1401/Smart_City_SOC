# SmartFlow Orchestrator

Service Express orchestrant les appels REST/SOAP/gRPC avec retries, timeout et cache Redis pour produire des recommandations de trajet et un flux d'alertes multi-protocoles.

## Démarrage
```bash
npm install
npm run dev
```

## Tests
```bash
npm test
```

Endpoints majeurs :
- `POST /trip-plan` — planification multimodale.
- `GET /metrics/overview` — indicateurs AQI + transport + alertes récentes.
- `GET /alerts/recent` + `GET /alerts/stream` (SSE) — diffusion des alertes Emergency gRPC (query params `limit`, `minimumSeverity`, `types`, `zones`).

Variables utiles :
- `MOBILITY_BASE_URL` (REST)
- `AIRQUALITY_SOAP_URL` (SOAP)
- `EMERGENCY_GRPC_URL` (gRPC)
- `REDIS_URL` (cache distribué)
- `CACHE_DEFAULT_TTL`
