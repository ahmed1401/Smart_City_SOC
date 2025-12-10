# Certificats TLS pour Kong

Placez vos certificats ici avant de démarrer `docker-compose` en mode sécurisé.

## Génération rapide (auto-signée)
```bash
openssl req -newkey rsa:2048 -nodes -keyout server.key \
  -x509 -days 365 -out server.crt -subj "/CN=localhost"
```

Ensuite configurez les variables :
```bash
export KONG_SSL_CERT=/etc/kong/certs/server.crt
export KONG_SSL_CERT_KEY=/etc/kong/certs/server.key
```
(et montez `gateway/certs:/etc/kong/certs`).
