# Relational Data Models

> Revision: December 2025 — Spring Boot migration track

## Directory Service (PostgreSQL `directory`)
- **`directory_service`**: canonical catalog of municipal services.
  - Contact + AQI insight columns condense the previous resolver metadata.
- **`directory_service_hours`**: 1..n opening hour rows per service.
- **`directory_ticket`**: citizen ticket workflow with status/priority guards and FK to `directory_service`.
- Initial dataset mirrors the existing Node.js seed (4 services, 3 tickets).

## Emergency Service (PostgreSQL `emergency`)
- **`emergency_alert`**: append-only log of gRPC alerts regardless of origin (user submission or backend injectors).
  - Retains proto attributes (`type`, `zone`, `severity`) plus metadata for acknowledgement and source tracking.
- Seeded with the Go server''s historical samples to keep dashboards populated on first boot.

## SmartFlow Orchestrator (PostgreSQL `smartflow`)
- **`journey_recommendation`**: captures each `/trip-plan` decision for auditing/analytics; stores transport payloads as JSONB to allow flexible schema.
- **`aqi_snapshot`**: short-lived cache of SOAP AQI responses so the service can answer queries while upstreams are degraded; will be updated by the WebFlux layer + Redis.
- Seeds provide a realistic baseline so Playwright metrics screens have content before live data arrives.

Every schema is managed via Flyway (`V1__init_schema.sql`) and designed to stay compatible with H2 in tests (Flyway disabled in `application-test.yml`).