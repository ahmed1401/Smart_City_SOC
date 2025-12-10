# Web Dashboard — Phase 5

SPA React (Vite + TypeScript) exposant les services agrégés via Kong.

## Scripts
```bash
cp .env.example .env   # renseigner API key + JWT
cd client/web-dashboard
npm install
npm run dev -- --host  # http://localhost:5173
npm run build          # dist/
```

## Pages & flux
- **Dashboard AQI** : `GET /api/smartflow/metrics/overview`.
- **Planificateur** : `POST /api/smartflow/trip-plan`.
- **Annuaire** : requêtes GraphQL sur `/api/directory` (tickets inclus).
- **Alertes temps réel** : SSE `GET /api/smartflow/alerts/stream` avec fallback `/alerts/recent`.
	- UI filtrable (gravité, zone opérateur, typologie) reliée aux query params `minimumSeverity`, `zones`, `types` de SmartFlow.

Configurer `VITE_GATEWAY_URL` pour pointer vers Kong (par défaut `http://localhost:8000`).
