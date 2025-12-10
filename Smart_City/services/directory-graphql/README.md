# Directory GraphQL Service

Spring Boot 3 + Spring GraphQL servlet stack exposing the municipal directory (services, service hours) and citizen tickets over PostgreSQL.

## Run locally
```bash
export DIRECTORY_DB_URL=jdbc:postgresql://localhost:5432/directory
export DIRECTORY_DB_USERNAME=directory
export DIRECTORY_DB_PASSWORD=directory
mvn spring-boot:run
```

- HTTP port: `8082`.
- Endpoint: `POST /graphql` (served as servlet, schema auto-loaded from `src/main/resources/graphql`).
- GraphQL Playground disabled by default; use `curl` or your favorite IDE plugin.

## Schema highlights
- Queries: `services`, `service(id)`, `tickets(citizenId:)`, `ticket(id:)`.
- Mutations: `createTicket`, `closeTicket`, `updateTicketStatus`.
- Enums mirror the SDL located in `contracts/graphql/directory-schema.graphql`.

## Environment variables
| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (defaults to `8082`). |
| `DIRECTORY_DB_URL`, `DIRECTORY_DB_USERNAME`, `DIRECTORY_DB_PASSWORD` | PostgreSQL credentials (Flyway migrations run automatically). |
| `DIRECTORY_DB_SCHEMA` | Optional schema override. |

## Docker
```bash
docker compose up -d --build directory-service
```
This rebuilds the fat jar and restarts only the GraphQL service.

## Troubleshooting
- **`404 /graphql`**: ensure the servlet stack is active (starter `spring-boot-starter-web`) and no WebFlux artifact remains.
- **`GraphQL error`** via Kong: double-check JWT + API key headers and confirm the request body is JSON (`{"query":"{"}`...).
- **Database mismatch**: rerun Flyway migrations or reset the `pg_directory_data` volume if schemas drift.
