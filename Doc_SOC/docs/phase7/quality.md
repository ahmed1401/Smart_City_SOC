# Phase 7 — Tests & Qualité

## 1. Couverture actuelle
- **SmartFlow** : Vitest + Supertest (`orchestrator/smartflow/src/routes/*.test.ts`). `npm test` couvre trip-plan, metrics et alerts.
- **Directory GraphQL** : tests Spring GraphQL (`DirectoryGraphQlTest`). `mvn -pl services/directory-graphql test` exécute les contrôleurs sur H2 en mémoire, ce qui évite toute dépendance à PostgreSQL.
- **Client web** : build Vite (`npm run build`) + vérification visuelle de l'écran de connexion centré.
- **E2E (Playwright)** : scénario fumée `tests/e2e/smoke.spec.ts` (connexion via panneau centré puis navigation Dashboard → Planner).

## 2. Commandes
```bash
# SmartFlow
(cd orchestrator/smartflow && npm install && npm test)

# Directory GraphQL
mvn -pl services/directory-graphql test

# Client web build
(cd client/web-dashboard && npm install && npm run build)

# Playwright (avec stack Docker + navigateurs installés)
RUN_E2E=1 PLAYWRIGHT_BASE_URL=http://localhost:4173 \
	(cd client/web-dashboard && npx playwright install && npm run test:e2e)
```
Par défaut le script `npm run test:e2e` se contente d'afficher un message tant que `RUN_E2E` ≠ `1`.

## 3. CI/CD
Workflow `.github/workflows/ci.yml` :
1. Tests SmartFlow.
2. Build client web.
3. Tests Directory GraphQL.
4. Script Playwright optionnel (skip par défaut).

## 4. Backlog qualité
- Ajouter lint (ESLint/TS) et SCA.
- Enrichir Playwright (auth, appels réels via Kong en TLS) dès que l'environnement CI dispose des secrets/API keys.
