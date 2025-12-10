# Emergency gRPC Service

Spring Boot 3 + gRPC implementation powering the alerting pillar. It persists alerts into PostgreSQL, exposes `SendAlert`, `GetRecentAlerts` and `SubscribeAlerts`, and now embeds a synthetic alert simulator that pushes a new record every 5 seconds (configurable).

## Run locally
```bash
export EMERGENCY_DB_URL=jdbc:postgresql://localhost:5432/emergency
export EMERGENCY_DB_USERNAME=emergency
export EMERGENCY_DB_PASSWORD=emergency
mvn spring-boot:run
```

- gRPC port: `50051` (plaintext).
- Management/actuator port: `9090` (metrics, health, Prometheus scrape).
- Flyway applies `db/migration/*.sql` on startup to seed demo alerts.

## Environment variables
| Variable | Description |
| --- | --- |
| `EMERGENCY_DB_URL`, `EMERGENCY_DB_USERNAME`, `EMERGENCY_DB_PASSWORD` | PostgreSQL connection. |
| `GRPC_PORT` | Overrides default gRPC port (`50051`). |
| `MANAGEMENT_HTTP_PORT` | HTTP actuator port (`9090`). |
| `EMERGENCY_SIMULATOR_ENABLED` | Enable/disable the synthetic alert scheduler (`true` by default). |
| `EMERGENCY_SIMULATOR_PERIOD_MS` | Frequency of synthetic alerts (`5000`). |
| `EMERGENCY_SIMULATOR_INITIAL_DELAY_MS` | Delay before the first synthetic alert (`2000`). |

## gRPC contract
Defined in `contracts/grpc/emergency.proto`:
- `rpc SendAlert(Alert) returns (AlertAck)`
- `rpc GetRecentAlerts(RecentRequest) returns (AlertList)`
- `rpc SubscribeAlerts(AlertFilter) returns (stream Alert)`

SmartFlow consumes `SubscribeAlerts` for SSE, while `GetRecentAlerts` backs the REST fallback and filtering (limit, types, zones, minimum severity).

## Docker
```bash
docker compose up -d --build emergency-service
```
This rebuilds the fat jar via Maven, publishes it in the `soc-emergency-service` image and restarts only this service.

## Troubleshooting
- **`Failed to persist alert`**: verify PostgreSQL connectivity and ensure timestamps are valid unix seconds/milliseconds.
- **Gateway 502 on `/api/smartflow/alerts`**: confirm this service is healthy (`docker compose logs emergency-service`) and accepting gRPC connections.
- **Disable simulator**: set `EMERGENCY_SIMULATOR_ENABLED=false` when running automated tests to avoid drifting datasets.
