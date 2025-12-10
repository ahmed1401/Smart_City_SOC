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
