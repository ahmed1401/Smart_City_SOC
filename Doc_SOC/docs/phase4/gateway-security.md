# Phase 4 — Sécurisation de la Gateway

## 1. Authentification multi-niveaux
- **JWT (HS256)** : plugin global sur Kong validant la revendication `iss` avec expiration max 3600 s.
- **Key-auth** : clé API transmise via en-tête `x-api-key` (masquée côté upstream) pour limiter l'usage des tokens volés.
- **Consumers** :
  - `citizen-app` (clé `citizen-api-key`, secret JWT `supersecretcitizen`).
  - `operator-app` (clé `operator-api-key`, secret JWT `supersecretoperator`).

### Génération d'un token JWT de test
```powershell
$payload = '{"iss":"citizen-app","exp":' + ([int][double]::Parse((Get-Date -UFormat %s)) + 900) + '}'
$secret = 'supersecretcitizen'
$header = '{"alg":"HS256","typ":"JWT"}'
function Encode([byte[]]$bytes) {
  return [Convert]::ToBase64String($bytes).TrimEnd('=') -replace '\+','-' -replace '/','_'
}
$jwt = (Encode([Text.Encoding]::UTF8.GetBytes($header))) + '.' + (Encode([Text.Encoding]::UTF8.GetBytes($payload)))
$signature = -join ((New-Object System.Security.Cryptography.HMACSHA256(([Text.Encoding]::UTF8.GetBytes($secret)))).ComputeHash([Text.Encoding]::UTF8.GetBytes($jwt)) | ForEach-Object { [Convert]::ToString($_,16).PadLeft(2,'0') })
```
_(ou utiliser `npx jose-toolkit sign ...`)_.

### Exemple de requête
```bash
curl https://localhost:8443/api/smartflow \
  -H "x-api-key: citizen-api-key" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"zoneCode":"CENTRE","preferredMode":"bike"}'
```

## 2. TLS
- Kong supporte TLS (port 8443). Pour utiliser un certificat personnalisé :
  1. Créer le dossier `gateway/certs`.
  2. Générer un certificat auto-signé :
     ```bash
     openssl req -newkey rsa:2048 -nodes -keyout gateway/certs/server.key \
       -x509 -days 365 -out gateway/certs/server.crt -subj "/CN=localhost"
     ```
  3. Mettre à jour `docker-compose.yml` (Phase 6) pour monter ces fichiers et définir `KONG_SSL_CERT`/`KONG_SSL_CERT_KEY`.

## 3. Journalisation & observabilité
- Kong fournit logs JSON (stdout). Configurer Fluent Bit/Loki en Phase 6.
- `x-consumer-username`, `x-anonymous-consumer` disponibles pour traçabilité.

## 4. Checklist sécurité
- [x] Auth multi-facteurs (JWT+API Key).
- [x] Secrets par consumer.
- [x] Documentation tokens & TLS.
- [ ] Rotation clé automatisée (phase ultérieure).
- [ ] Intégration IdP complet (OpenID Connect) — hors scope MVP.

## 5. Intégration côté client
- Le panneau Connexion/Inscription centré du dashboard applique automatiquement la clé `citizen-api-key` et un JWT de démonstration dès que l'utilisateur choisit le mode "Connexion" (ou crée un compte). Les valeurs sont stockées dans `SessionContext` puis propagées dans `localStorage`.
- Un bouton "Utiliser l'accès démo" reste disponible dans le panneau latéral (une fois connecté) pour rappeler les identifiants décrits ci-dessus.
