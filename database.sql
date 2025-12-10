-- database.sql
-- Export contract for SOC platform services using PostgreSQL as persistence layer.
-- The file consolidates every PostgreSQL schema so operators can recreate
-- the persistence layer with a single transaction when standing up the stack.

BEGIN;

-- =============================================================
-- Service: mobility-rest (PostgreSQL 15)
-- Schema source: services/mobility-rest/src/main/resources/schema.sql
-- =============================================================
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  line_id VARCHAR(64) NOT NULL,
  stop_from VARCHAR(64) NOT NULL,
  stop_to VARCHAR(64) NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL
);

INSERT INTO bookings (id, line_id, stop_from, stop_to, datetime, user_id, status) VALUES
  ('bk-demo-001', 'LINE-42', 'STOP-A', 'STOP-C', '2025-12-09T08:15:00+01:00', 'citizen-app-user', 'confirmed'),
  ('bk-demo-002', 'LINE-METRO-14', 'STOP-E', 'STOP-B', '2025-12-09T09:05:00+01:00', 'citizen-green-team', 'confirmed'),
  ('bk-demo-003', 'LINE-11', 'STOP-D', 'STOP-F', '2025-12-09T10:40:00+01:00', 'citizen-care-team', 'pending'),
  ('bk-demo-004', 'TRAM-T2', 'STOP-K', 'STOP-M', '2025-12-09T07:20:00+01:00', 'citizen-app-user', 'cancelled'),
  ('bk-demo-005', 'BUS-88', 'STOP-Q', 'STOP-S', '2025-12-09T12:05:00+01:00', 'citizen-scouts', 'confirmed'),
  ('bk-demo-006', 'METRO-4', 'STOP-X', 'STOP-A', '2025-12-09T06:55:00+01:00', 'citizen-green-team', 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Service: airquality-soap (PostgreSQL 15)
--   services/airquality-soap/src/main/java/com/smartcity/airquality/AirQualityServiceImpl.java
--   services/airquality-soap/src/main/java/com/smartcity/airquality/model/*.java
-- =============================================================
DROP TABLE IF EXISTS airquality_pollutant_profile CASCADE;
DROP TABLE IF EXISTS airquality_zone_report CASCADE;

CREATE TABLE IF NOT EXISTS airquality_zone_report (
  zone_code     VARCHAR(48) PRIMARY KEY,
  display_name  VARCHAR(96) NOT NULL,
  aqi_value     INT NOT NULL CHECK (aqi_value BETWEEN 0 AND 500),
  category      VARCHAR(32) NOT NULL,
  trend         VARCHAR(16) NOT NULL CHECK (trend IN ('hausse','stable','baisse')),
  recommendation TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS airquality_pollutant_profile (
  zone_code VARCHAR(48) NOT NULL REFERENCES airquality_zone_report(zone_code) ON DELETE CASCADE,
  pollutant VARCHAR(16) NOT NULL,
  value     DOUBLE PRECISION NOT NULL CHECK (value >= 0),
  unit      VARCHAR(16) NOT NULL,
  PRIMARY KEY (zone_code, pollutant)
);

CREATE INDEX IF NOT EXISTS idx_airquality_pollutant ON airquality_pollutant_profile(pollutant);

INSERT INTO airquality_zone_report (zone_code, display_name, aqi_value, category, trend, recommendation, updated_at)
VALUES
  ('TUNIS-CENTRE', 'Tunis Centre', 112, 'Élevé', 'hausse', 'Réduire les activités industrielles autour de Ben Arous et porter un masque filtrant.', NOW() - INTERVAL '8 minutes'),
  ('LAC-2', 'Lac 2', 74, 'Modéré', 'stable', 'Surveiller les populations sensibles autour du Lac de Tunis et aérer aux heures fraîches.', NOW() - INTERVAL '12 minutes'),
  ('LA-MARSA', 'La Marsa', 58, 'Bon', 'stable', 'Conditions favorables sur le Grand Tunis, activités extérieures autorisées.', NOW() - INTERVAL '20 minutes'),
  ('SIDI-BOU-SAID', 'Sidi Bou Saïd', 52, 'Bon', 'baisse', 'Conditions favorables sur le Grand Tunis, activités extérieures autorisées.', NOW() - INTERVAL '22 minutes'),
  ('ARIANA', 'Ariana', 88, 'Modéré', 'stable', 'Surveiller les populations sensibles autour du Lac de Tunis et aérer aux heures fraîches.', NOW() - INTERVAL '15 minutes'),
  ('BEN-AROUS', 'Ben Arous', 95, 'Élevé', 'stable', 'Réduire les activités industrielles autour de Ben Arous et porter un masque filtrant.', NOW() - INTERVAL '10 minutes'),
  ('RIVE-GAUCHE', 'Rive Gauche', 69, 'Modéré', 'stable', 'Limitez l''effort prolongé en extérieur.', NOW() - INTERVAL '9 minutes'),
  ('SUD', 'Grand Sud', 60, 'Bon', 'baisse', 'Conditions favorables pour les chantiers municipaux.', NOW() - INTERVAL '14 minutes'),
  ('DEFAULT', 'Zone inconnue', 68, 'Modéré', 'stable', 'Conditions favorables sur le Grand Tunis, activités extérieures autorisées.', NOW() - INTERVAL '18 minutes')
ON CONFLICT (zone_code) DO UPDATE
SET aqi_value = EXCLUDED.aqi_value,
    category = EXCLUDED.category,
    trend = EXCLUDED.trend,
    recommendation = EXCLUDED.recommendation,
    updated_at = EXCLUDED.updated_at;

INSERT INTO airquality_pollutant_profile (zone_code, pollutant, value, unit)
VALUES
  ('TUNIS-CENTRE', 'PM2.5', 38.2, 'ug/m3'),
  ('TUNIS-CENTRE', 'PM10', 64.0, 'ug/m3'),
  ('TUNIS-CENTRE', 'NO2', 44.0, 'ppb'),
  ('TUNIS-CENTRE', 'O3', 56.0, 'ppb'),
  ('TUNIS-CENTRE', 'SO2', 9.0, 'ppb'),
  ('LAC-2', 'PM2.5', 24.5, 'ug/m3'),
  ('LAC-2', 'PM10', 38.0, 'ug/m3'),
  ('LAC-2', 'NO2', 21.0, 'ppb'),
  ('LAC-2', 'O3', 62.0, 'ppb'),
  ('LAC-2', 'SO2', 6.0, 'ppb'),
  ('LA-MARSA', 'PM2.5', 19.0, 'ug/m3'),
  ('LA-MARSA', 'PM10', 32.0, 'ug/m3'),
  ('LA-MARSA', 'NO2', 15.0, 'ppb'),
  ('LA-MARSA', 'O3', 70.0, 'ppb'),
  ('LA-MARSA', 'SO2', 5.0, 'ppb'),
  ('SIDI-BOU-SAID', 'PM2.5', 17.3, 'ug/m3'),
  ('SIDI-BOU-SAID', 'PM10', 29.0, 'ug/m3'),
  ('SIDI-BOU-SAID', 'NO2', 12.0, 'ppb'),
  ('SIDI-BOU-SAID', 'O3', 72.0, 'ppb'),
  ('SIDI-BOU-SAID', 'SO2', 4.0, 'ppb'),
  ('ARIANA', 'PM2.5', 30.4, 'ug/m3'),
  ('ARIANA', 'PM10', 52.0, 'ug/m3'),
  ('ARIANA', 'NO2', 33.0, 'ppb'),
  ('ARIANA', 'O3', 60.0, 'ppb'),
  ('ARIANA', 'SO2', 7.5, 'ppb'),
  ('BEN-AROUS', 'PM2.5', 34.1, 'ug/m3'),
  ('BEN-AROUS', 'PM10', 58.0, 'ug/m3'),
  ('BEN-AROUS', 'NO2', 39.0, 'ppb'),
  ('BEN-AROUS', 'O3', 55.0, 'ppb'),
  ('BEN-AROUS', 'SO2', 10.0, 'ppb'),
  ('RIVE-GAUCHE', 'PM2.5', 26.5, 'ug/m3'),
  ('RIVE-GAUCHE', 'PM10', 41.0, 'ug/m3'),
  ('RIVE-GAUCHE', 'NO2', 24.0, 'ppb'),
  ('RIVE-GAUCHE', 'O3', 59.0, 'ppb'),
  ('RIVE-GAUCHE', 'SO2', 6.5, 'ppb'),
  ('SUD', 'PM2.5', 21.0, 'ug/m3'),
  ('SUD', 'PM10', 34.0, 'ug/m3'),
  ('SUD', 'NO2', 14.0, 'ppb'),
  ('SUD', 'O3', 68.0, 'ppb'),
  ('SUD', 'SO2', 4.5, 'ppb'),
  ('DEFAULT', 'PM2.5', 22.0, 'ug/m3'),
  ('DEFAULT', 'PM10', 36.0, 'ug/m3'),
  ('DEFAULT', 'NO2', 18.0, 'ppb'),
  ('DEFAULT', 'O3', 65.0, 'ppb'),
  ('DEFAULT', 'SO2', 5.0, 'ppb')
ON CONFLICT (zone_code, pollutant) DO UPDATE
SET value = EXCLUDED.value,
    unit = EXCLUDED.unit;

-- =============================================================
-- Service: directory-graphql (PostgreSQL 15)
-- GraphQL contract: contracts/graphql/directory-schema.graphql
-- =============================================================
DROP TABLE IF EXISTS directory_service_hours CASCADE;
DROP TABLE IF EXISTS directory_ticket CASCADE;
DROP TABLE IF EXISTS directory_service CASCADE;

CREATE TABLE IF NOT EXISTS directory_service (
  id              VARCHAR(32) PRIMARY KEY,
  name            VARCHAR(160) NOT NULL,
  category        VARCHAR(64)  NOT NULL,
  description     TEXT,
  contact_phone   VARCHAR(32),
  contact_email   VARCHAR(160),
  contact_url     VARCHAR(200),
  address         VARCHAR(200),
  latitude        NUMERIC(9, 6),
  longitude       NUMERIC(9, 6),
  related_aqi_zone    VARCHAR(32),
  related_aqi_value   INT,
  related_aqi_category VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS directory_service_hours (
  id          BIGSERIAL PRIMARY KEY,
  service_id  VARCHAR(32) NOT NULL REFERENCES directory_service(id) ON DELETE CASCADE,
  day_label   VARCHAR(32) NOT NULL,
  open_time   VARCHAR(8)  NOT NULL,
  close_time  VARCHAR(8)  NOT NULL
);

CREATE TABLE IF NOT EXISTS directory_ticket (
  id          VARCHAR(40) PRIMARY KEY,
  subject     VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(16) NOT NULL CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')),
  priority    VARCHAR(16) NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,
  service_id  VARCHAR(32) NOT NULL REFERENCES directory_service(id) ON DELETE RESTRICT,
  citizen_id  VARCHAR(120) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_directory_ticket_service_status
  ON directory_ticket(service_id, status);
CREATE INDEX IF NOT EXISTS idx_directory_ticket_citizen
  ON directory_ticket(citizen_id);

INSERT INTO directory_service (id, name, category, description, contact_phone, contact_email, contact_url,
                 address, latitude, longitude, related_aqi_zone, related_aqi_value, related_aqi_category)
VALUES
  ('svc-transport', 'Agence Mobilité', 'transport', 'Coordonne bus, métro, vélib et supervise les réservations citoyennes.',
   '+33 1 42 00 00 00', 'contact@mobilite.local', NULL, '10 Rue Centrale', 48.8566, 2.3522, NULL, NULL, NULL),
  ('svc-air', 'Qualité de l''air', 'environment', 'Calibre les stations AQI et publie les recommandations sanitaires.',
   NULL, 'aqi@ville.local', NULL, '2 Avenue Verte', 48.8635, 2.3471, 'CENTRE', 82, 'Modérée'),
  ('svc-green', 'Cellule Espaces verts', 'environment', 'Entretiens des parcs urbains et gère les alertes canicule.',
   '+33 1 44 00 00 12', 'verts@ville.local', NULL, 'Parc Nord', NULL, NULL, NULL, NULL, NULL),
  ('svc-digital', 'Maison du numérique', 'citizen-services', 'Support pour les applications citoyennes et les bornes publiques.',
   NULL, 'support@smartcity.local', NULL, '5 Passage Lumière', NULL, NULL, NULL, NULL, NULL),
  ('svc-health', 'Maison Santé Solidaire', 'health', 'Coordination des centres médicaux municipaux et campagnes de vaccination.',
   '+33 1 43 00 00 88', 'sante@ville.local', NULL, '12 Rue du Docteur', 48.8591, 2.3411, NULL, NULL, NULL),
  ('svc-safety', 'Unité Sécurité Civile', 'safety', 'Centre de pilotage des plans de prévention et d''évacuation.',
   '+33 1 47 00 00 02', 'securite@ville.local', NULL, 'Place de l''Hôtel de Ville', 48.8570, 2.3530, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO directory_service_hours (service_id, day_label, open_time, close_time)
VALUES
  ('svc-transport', 'Mon-Fri', '08:00', '18:00'),
  ('svc-air', 'Mon-Fri', '09:00', '17:00'),
  ('svc-green', 'Mon-Sat', '07:00', '19:00'),
  ('svc-digital', 'Mon-Fri', '08:30', '18:30'),
  ('svc-health', 'Mon-Sat', '08:00', '20:00'),
  ('svc-safety', 'Daily', '00:00', '23:59')
ON CONFLICT DO NOTHING;

INSERT INTO directory_ticket (id, subject, description, status, priority, created_at, updated_at, service_id, citizen_id)
VALUES
  ('tkt-1', 'Station vélo hors service', 'La borne Vélo #17 ne libère plus de vélos depuis ce matin.', 'OPEN', 'HIGH',
   NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes', 'svc-transport', 'citizen-app-user'),
  ('tkt-2', 'Capteur AQI à recalibrer', 'Les mesures de la station CENTRE semblent bloquées à 60.', 'OPEN', 'MEDIUM',
   NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '20 minutes', 'svc-air', 'citizen-green-team'),
  ('tkt-3', 'Signalement éclairage parc nord', 'Plusieurs lampadaires ne fonctionnent plus côté terrain de sport.', 'CLOSED', 'LOW',
  NOW() - INTERVAL '240 minutes', NOW() - INTERVAL '60 minutes', 'svc-green', 'citizen-maintenance'),
  ('tkt-4', 'Campagne de vaccination grippe', 'Besoin d''un renfort infirmier pour la salle polyvalente.', 'IN_PROGRESS', 'CRITICAL',
  NOW() - INTERVAL '150 minutes', NOW() - INTERVAL '15 minutes', 'svc-health', 'citizen-healthboard'),
  ('tkt-5', 'Exercice d''évacuation scolaire', 'Validation du plan d''évacuation du collège République.', 'OPEN', 'MEDIUM',
  NOW() - INTERVAL '300 minutes', NOW() - INTERVAL '25 minutes', 'svc-safety', 'citizen-education'),
  ('tkt-6', 'Borne wifi du forum en panne', 'Portail captif boucle sur une erreur 502.', 'OPEN', 'HIGH',
  NOW() - INTERVAL '75 minutes', NOW() - INTERVAL '30 minutes', 'svc-digital', 'citizen-younglab')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Service: emergency-grpc (PostgreSQL 15)
-- =============================================================
DROP TABLE IF EXISTS emergency_alert CASCADE;

CREATE TABLE IF NOT EXISTS emergency_alert (
  id              VARCHAR(64) PRIMARY KEY,
  type            VARCHAR(64) NOT NULL,
  zone            VARCHAR(64) NOT NULL,
  description     TEXT        NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  severity        SMALLINT    NOT NULL CHECK (severity BETWEEN 1 AND 3),
  source          VARCHAR(64) NOT NULL DEFAULT 'external',
  acknowledged    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_alert_zone ON emergency_alert(zone);
CREATE INDEX IF NOT EXISTS idx_emergency_alert_type ON emergency_alert(type);
CREATE INDEX IF NOT EXISTS idx_emergency_alert_timestamp ON emergency_alert(event_timestamp DESC);

INSERT INTO emergency_alert (id, type, zone, description, event_timestamp, severity, source)
VALUES
  ('seed-air', 'QUALITE_AIR', 'CENTRE', 'Particules élevées détectées, privilégiez le télétravail.', NOW() - INTERVAL '10 minutes', 2, 'seed'),
  ('seed-traffic', 'INCIDENT_TRANSPORT', 'RIVE-GAUCHE', 'Manifestation déclarée sur le quai Anatole France.', NOW() - INTERVAL '20 minutes', 1, 'seed'),
  ('seed-meteo', 'VENT_FORT', 'NORD', 'Rafales supérieures à 70km/h attendues dans la soirée.', NOW() - INTERVAL '35 minutes', 2, 'seed'),
  ('seed-flood', 'INONDATION', 'SUD', 'Crue rapide de l''Oued signalée, surveillez les berges.', NOW() - INTERVAL '50 minutes', 3, 'seed'),
  ('seed-heat', 'CANICULE', 'CENTRE', 'Plan chaleur déclenché, distribuer de l''eau dans les parcs.', NOW() - INTERVAL '80 minutes', 2, 'seed'),
  ('seed-drill', 'EXERCICE', 'RIVE-DROITE', 'Exercice d''évacuation coordonné avec la sécurité civile.', NOW() - INTERVAL '15 minutes', 1, 'seed')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Service: smartflow-spring orchestrator (PostgreSQL 15)
-- =============================================================
DROP TABLE IF EXISTS journey_recommendation CASCADE;
DROP TABLE IF EXISTS aqi_snapshot CASCADE;

CREATE TABLE IF NOT EXISTS journey_recommendation (
  id              BIGSERIAL PRIMARY KEY,
  requested_at    TIMESTAMPTZ NOT NULL,
  zone_code       VARCHAR(32) NOT NULL,
  preferred_mode  VARCHAR(32),
  chosen_mode     VARCHAR(32) NOT NULL,
  reason          TEXT,
  caution         TEXT,
  stop_id         VARCHAR(32) NOT NULL,
  metrics         JSONB,
  transport_lines JSONB,
  arrivals        JSONB
);

CREATE TABLE IF NOT EXISTS aqi_snapshot (
  zone_code       VARCHAR(32) PRIMARY KEY,
  value           INT NOT NULL,
  category        VARCHAR(32) NOT NULL,
  recommendation  TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL
);

INSERT INTO journey_recommendation (requested_at, zone_code, preferred_mode, chosen_mode, reason, caution, stop_id, metrics, transport_lines, arrivals)
VALUES
  (
    NOW() - INTERVAL '5 minutes',
    'CENTRE',
    'bike',
    'tram',
    'AQI modéré, privilégier tram pour limiter l''exposition',
    'Modérée',
    'STOP-A',
    '{"aqi": {"value": 82, "category": "Modérée"}}',
    '[{"id": "TRM-A", "mode": "tram", "status": "ON_TIME"}]',
    '[{"lineId": "TRM-A", "etaMinutes": 4}]'
  ),
  (
    NOW() - INTERVAL '9 minutes',
    'RIVE-GAUCHE',
    'tram',
    'bus',
    'Manifestation locale: rediriger les flux vers les bus express.',
    'Élevée',
    'STOP-G',
    '{"alerts": {"type": "INCIDENT_TRANSPORT", "severity": 2}}',
    '[{"id": "BUS-X3", "mode": "bus", "status": "DETOUR"}]',
    '[{"lineId": "BUS-X3", "etaMinutes": 7}]'
  ),
  (
    NOW() - INTERVAL '3 minutes',
    'NORD',
    'carpool',
    'metro',
    'Rafales fortes, privilégier la ligne souterraine.',
    'Modérée',
    'STOP-N',
    '{"weather": {"wind": 72}}',
    '[{"id": "MET-N1", "mode": "metro", "status": "ON_TIME"}]',
    '[{"lineId": "MET-N1", "etaMinutes": 2}]'
  )
ON CONFLICT DO NOTHING;

INSERT INTO aqi_snapshot (zone_code, value, category, recommendation, recorded_at)
VALUES
  ('CENTRE', 82, 'Modérée', 'Limitez l''effort prolongé en extérieur.', NOW() - INTERVAL '7 minutes'),
  ('RIVE-GAUCHE', 65, 'Bonne', 'Conditions favorables pour la mobilité douce.', NOW() - INTERVAL '12 minutes'),
  ('NORD', 71, 'Modérée', 'Préférez le métro aux transports de surface.', NOW() - INTERVAL '6 minutes'),
  ('SUD', 58, 'Bonne', 'Ouvrez les fenêtres pour ventiler les équipements municipaux.', NOW() - INTERVAL '11 minutes')
ON CONFLICT (zone_code) DO NOTHING;

COMMIT;
