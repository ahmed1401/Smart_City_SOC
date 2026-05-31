# Phase 5 — Client Web React

## Objectifs
- Offrir un tableau de bord unifié (AQI, mobilité, tickets, alertes) centré sur les quartiers du Grand Tunis.
- Simplifier l'accès en affichant un écran de connexion/inscription minimaliste, centré et auto-configurant (`x-api-key` + JWT) avant toute navigation.
- Diffuser les alertes Emergency en temps réel via SmartFlow (SSE) tout en conservant un fallback polling.

## Architecture
```
React (Vite) ──> Kong (JWT+API key) ──> Services SmartFlow / Directory / Smart city
```

- Build Vite (`npm run build`) → artefact statique servi par Nginx (port 4173 dans Docker Compose).
- Les appels HTTP passent par `VITE_GATEWAY_URL` (défaut `http://localhost:8000`).
- Flux SSE `GET /api/smartflow/alerts/stream` maintenu côté navigateur.

## Écran de connexion
- La route racine affiche un panneau centré (max 540 px) avec description SOC et onglets Connexion/Création.
- Le panneau `AuthPanel` génère/stocke `citizenId`, `x-api-key` et JWT de démonstration dès validation. Les identifiants sont chiffrés côté navigateur avant d'être placés dans `localStorage`.
- Un bouton "Utiliser l'accès démo" reste disponible dans le panneau latéral (après connexion) pour pré-remplir `demo@soc.local / soc-demo`.

## Pages
1. **Dashboard AQI** : `GET /api/smartflow/metrics/overview`. Trois colonnes responsives regroupent focus AQI, polluants dominants (Tunis Centre, Lac 2, La Marsa, Sidi Bou Saïd, Ariana, Ben Arous), lignes recommandées, passages et flux d'alertes récents.
2. **Planificateur** : `POST /api/smartflow/trip-plan`. Formulaire en grille (zone/mode/stop) calqué sur les zones tunisiennes ; la carte récapitulative explique pourquoi le mode proposé change selon l'AQI.
3. **Annuaire & Tickets** : requêtes GraphQL (services/tickets + mutation `createTicket`). Les tickets sont filtrés sur le `citizenId` injecté par la session et restent présents après redémarrage de la base PostgreSQL dédiée.
4. **Alertes temps réel** : SSE `GET /api/smartflow/alerts/stream` (rotation en bandeau + timeline). Fallback `GET /alerts/recent` si SSE indisponible.

## Auth
- `SessionContext` applique automatiquement les en-têtes `x-api-key` + `Authorization: Bearer <jwt>` une fois le formulaire validé. L'utilisateur n'a plus besoin de saisir ces valeurs manuellement.
- Les secrets restent ceux de la Phase 4 (`citizen-api-key` + JWT HS256 issu de `supersecretcitizen`).

## Démarrage local
```bash
cd client/web-dashboard
npm install
npm run dev -- --host
```
Ou via Docker Compose : service `web-dashboard` (port 4173).

### Tests E2E (Playwright)
```bash
cd client/web-dashboard
npx playwright install   # une seule fois
RUN_E2E=1 PLAYWRIGHT_BASE_URL=http://localhost:4173 npm run test:e2e
```
Sans `RUN_E2E=1`, le script est ignoré (utile en CI).
