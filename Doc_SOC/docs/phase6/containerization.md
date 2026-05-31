# Phase 6 — Conteneurisation & Orchestration

## Nouveautés docker-compose
- **redis-cache** : cache partagé pour SmartFlow (`REDIS_URL`).
- **web-dashboard** : build multi-stage (Node build → Nginx runtime sur port 4173).
- Kong TLS monté via `gateway/certs` et variables `KONG_SSL_CERT*`.

## Commandes
```bash
docker compose build
KONG_SSL_CERT=... docker compose up
# rebuild rapide du front lorsque seuls les assets React changent
docker compose up -d --build web-dashboard
```

## Réseau
- `backend` : services techniques (Postgres, Redis, microservices, SmartFlow, Kong).
- `frontend` : Kong + web-dashboard pour séparer trafic utilisateur.

## Prochaines étapes
- Ajouter Fluent Bit / Loki pour logs (option).
- Déclarer healthchecks pour tous les services.
- Préparer fichiers `make` et profils prod/staging.
