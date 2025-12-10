# Gateway

Ce répertoire contient l'ensemble des artefacts nécessaires à l'API Gateway **Kong** utilisée pour sécuriser et router les services urbains.

## Structure
- `kong/kong.yml` — configuration déclarative (services, routes `/api/*`, plugins `jwt` + `key-auth`)
- `kong/README.md` — rappel des commandes `deck`/`kong` si vous devez appliquer la configuration manuellement
- `certs/` — emplacements des certificats TLS optionnels (`server.crt`, `server.key`)

## Fonctionnement
1. **Authentification** : chaque requête doit fournir `Authorization: Bearer <jwt>` et `x-api-key`. Les consumers configurés sont `citizen-app` et `operator-app`.
2. **Routage** : Kong relaie vers `smartflow`, `mobility-rest`, `airquality-soap`, `directory-graphql` et `emergency-grpc` au sein du réseau Docker `backend`.
3. **TLS** : si `certs/server.crt` et `certs/server.key` existent, Docker Compose publie également `https://localhost:8443`.

## Démarrage via Docker Compose
Kong est géré automatiquement par `docker compose up`. Pour reconstruire uniquement la gateway :
```bash
docker compose up -d --build kong
```

Les variables importantes sont définies dans `docker-compose.yml` :
- `KONG_DATABASE=off` (mode déclaratif)
- `KONG_LOG_LEVEL=notice`
- `KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml`
- `KONG_SSL_CERT` / `KONG_SSL_CERT_KEY` pointant vers `certs/` si présents

## Certificats de développement
```bash
mkdir -p gateway/certs
openssl req -newkey rsa:2048 -nodes -keyout gateway/certs/server.key \
  -x509 -days 365 -out gateway/certs/server.crt -subj "/CN=localhost"
```
Relancez ensuite la gateway : `docker compose restart kong`.

## Dépannage
- **401/403** : vérifier les en-têtes JWT/API Key ou l'heure système (token expiré).
- **TLS handshake failure** : s'assurer que la clé et le certificat correspondent et qu'ils sont lisibles par Docker.
- **Service unreachable** : confirmer que le conteneur ciblé est `healthy` (`docker compose ps`).
