# Phase 8 — Documentation finale

## Livrables réalisés
- README enrichi : structure, sécurité (JWT + clé API), endpoints, commandes de tests.
- Docs Phases 0 → 7 : cadrage, architecture, SmartFlow, gateway, client web, conteneurisation, qualité.
- Mise à jour UX (déc. 2025) : écran de connexion centré, données Grand Tunis, dashboard AQI en trois colonnes.
- Contrats conservés dans `contracts/` (OpenAPI, WSDL, GraphQL SDL, proto gRPC) + duplication du proto dans l'image SmartFlow.
- Guide Phase 5 (client web) : configuration `.env`, navigation, SSE.
- Guide Phase 6 (containerisation) : nouveaux services (`redis-cache`, `web-dashboard`) et TLS.

## Runbook (résumé)
1. **Pré-requis** : Docker Desktop actif, certificats déposés dans `gateway/certs`, variables `KONG_SSL_CERT*` déjà renseignées dans `docker-compose.yml`.
2. **Démarrage** : `docker compose build && docker compose up` (la première commande peut être relancée après avoir démarré Docker Desktop si absente).
3. **Accès** :
	- Gateway : `https://localhost:8443` (ou `http://localhost:8000`).
	- Dashboard : `http://localhost:4173`.
4. **Identifiants demo** :
	- API keys : `citizen-api-key`, `operator-api-key`.
	- JWT HS256 : secrets `supersecretcitizen` / `supersecretoperator` (génération dans `docs/phase4/gateway-security.md`).
	- Dashboard : utiliser l'écran de connexion centré (onglets Connexion/Création). Le bouton "Utiliser l'accès démo" pré-remplit `demo@soc.local / soc-demo`.
5. **Tests** : voir `docs/phase7/quality.md` pour l'ordre (`npm test`, `npm run build`, `RUN_E2E=1 npm run test:e2e`).
6. **Rotation clés/certificats** : remplacer fichiers dans `gateway/certs`, recharger Kong (`docker compose restart kong`).

## Restant
- Rédiger un runbook détaillé (incident, scaling) si requis.
- Fournir exports formels (PDF) des documents Phases 0-8.
- Compléter instructions de déploiement cloud (Phase future si besoin d'Aks/AKS).
