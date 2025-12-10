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
