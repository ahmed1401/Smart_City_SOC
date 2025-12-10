import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { GatewayPaths, http } from '../api/http';

type Alert = {
  id: string;
  type: string;
  zone: string;
  description?: string;
  severity: string;
  timestamp?: number | string;
};

function parseAlertTimestamp(value?: number | string) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'number') {
    const millis = value > 1e12 ? value : value * 1000;
    return new Date(millis);
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const millis = numeric > 1e12 ? numeric : numeric * 1000;
    return new Date(millis);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const SEVERITY_META = {
  SEVERITY_CRITICAL: { label: 'Critique', tone: 'critical', level: 3 },
  SEVERITY_WARNING: { label: 'Alerte', tone: 'major', level: 2 },
  SEVERITY_INFO: { label: 'Info', tone: 'info', level: 1 },
} as const;

type SeverityKey = keyof typeof SEVERITY_META;

const INITIAL_STATS: Record<SeverityKey, number> = {
  SEVERITY_CRITICAL: 0,
  SEVERITY_WARNING: 0,
  SEVERITY_INFO: 0,
};

const DEFAULT_SEND_ALERT = {
  type: 'INCIDENT_TRANSPORT',
  zone: 'CENTRE',
  severity: 'SEVERITY_INFO' as SeverityValue,
  description: '',
};

const SEVERITY_FILTERS: Array<{ key: SeverityKey; label: string }> = [
  { key: 'SEVERITY_INFO', label: 'Info +' },
  { key: 'SEVERITY_WARNING', label: 'Alerte +' },
  { key: 'SEVERITY_CRITICAL', label: 'Critique' },
];

const STATUS_LABEL: Record<'idle' | 'connected' | 'error', { label: string; detail: string }> = {
  idle: { label: 'Initialisation', detail: 'Connexion au relais REST (5s)' },
  connected: { label: 'Flux synchronisé', detail: 'SmartFlow → Emergency gRPC toutes les 5s' },
  error: { label: 'Erreur de connexion', detail: 'Nouvelle tentative REST + SendAlert dispo' },
};

const ALERT_SEVERITIES = [
  { value: 'SEVERITY_INFO', label: 'Info' },
  { value: 'SEVERITY_WARNING', label: 'Alerte' },
  { value: 'SEVERITY_CRITICAL', label: 'Critique' },
] as const;

type SeverityValue = (typeof ALERT_SEVERITIES)[number]['value'];

const POLLING_INTERVAL_MS = 5000;
const MAX_ALERTS = 20;

function getSeverityTone(severity: string) {
  return SEVERITY_META[severity as SeverityKey]?.tone ?? 'info';
}

function getSeverityLabel(severity: string) {
  return SEVERITY_META[severity as SeverityKey]?.label ?? severity.replace('SEVERITY_', '');
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [minimumSeverity, setMinimumSeverity] = useState<SeverityKey>('SEVERITY_INFO');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [refreshToken, setRefreshToken] = useState(0);
  const [sendForm, setSendForm] = useState(() => ({ ...DEFAULT_SEND_ALERT }));
  const [sendFeedback, setSendFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const searchParams = useMemo(() => {
    const params: Record<string, string | number> = {
      limit: MAX_ALERTS,
    };
    const minLevel = SEVERITY_META[minimumSeverity].level;
    if (minLevel > 1) {
      params.minimumSeverity = minLevel;
    }
    if (zoneFilter !== 'ALL') {
      params.zones = zoneFilter;
    }
    if (typeFilter !== 'ALL') {
      params.types = typeFilter;
    }
    return params;
  }, [minimumSeverity, zoneFilter, typeFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const payload = await http<{ alerts: Alert[] }>(GatewayPaths.alertsRecent, { searchParams });
        if (cancelled) {
          return;
        }
        setAlerts(payload.alerts.slice(0, MAX_ALERTS));
        setStatus('connected');
        setLastRefresh(new Date());
        setActiveAlertIndex(0);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load alerts', error);
          setStatus('error');
        }
      }
    }

    loadAlerts();
    const intervalId = window.setInterval(loadAlerts, POLLING_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [searchParams, refreshToken]);

  const formattedAlerts = useMemo(() => {
    return alerts.map((alert) => {
      const parsed = parseAlertTimestamp(alert.timestamp);
      return {
        ...alert,
        timestampLabel: parsed ? parsed.toLocaleTimeString() : 'Horodatage indisponible',
      };
    });
  }, [alerts]);

  const severityStats = useMemo(() => {
    return formattedAlerts.reduce((acc, alert) => {
      const key = alert.severity as SeverityKey;
      if (acc[key] !== undefined) {
        acc[key] += 1;
      }
      return acc;
    }, { ...INITIAL_STATS });
  }, [formattedAlerts]);

  const impactedZones = useMemo(() => new Set(formattedAlerts.slice(0, 20).map((alert) => alert.zone)).size, [formattedAlerts]);

  const zoneOptions = useMemo(() => {
    const zones = Array.from(new Set(formattedAlerts.map((alert) => alert.zone))).filter(Boolean).sort();
    return zones.length ? zones : ['CENTRE', 'NORD', 'RIVE-GAUCHE'];
  }, [formattedAlerts]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(formattedAlerts.map((alert) => alert.type))).filter(Boolean).sort();
    return types.length ? types : ['INCIDENT_TRANSPORT', 'QUALITE_AIR', 'VENT_FORT'];
  }, [formattedAlerts]);

  const sendZoneOptions = useMemo(() => {
    const unique = new Set(zoneOptions);
    unique.add('CENTRE');
    return Array.from(unique);
  }, [zoneOptions]);

  const sendAlertMutation = useMutation({
    mutationFn: (payload: { type: string; zone: string; severity: SeverityValue; description?: string }) =>
      http<{ alertId: string; accepted: boolean; submittedAt: string }>(GatewayPaths.alertsSend, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (ack) => {
      setSendFeedback({ tone: 'success', text: `Alerte ${ack.alertId} injectée.` });
      setSendForm({ ...DEFAULT_SEND_ALERT });
      setRefreshToken((token) => token + 1);
    },
    onError: (error: Error) => {
      setSendFeedback({ tone: 'error', text: error.message });
    },
  });
  useEffect(() => {
    if (!formattedAlerts.length) {
      setActiveAlertIndex(0);
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % formattedAlerts.length);
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [formattedAlerts]);

  const highlightedAlert = formattedAlerts[activeAlertIndex] ?? null;
  const criticalAlert = formattedAlerts.find((alert) => alert.severity === 'SEVERITY_CRITICAL');
  const statusCopy = STATUS_LABEL[status];
  const refreshLabel = lastRefresh ? lastRefresh.toLocaleTimeString() : '—';
  const filtersSummary = [
    `Gravité ≥ ${SEVERITY_META[minimumSeverity].label}`,
    zoneFilter !== 'ALL' ? `Zone ${zoneFilter}` : null,
    typeFilter !== 'ALL' ? typeFilter : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const resetFilters = () => {
    setMinimumSeverity('SEVERITY_INFO');
    setZoneFilter('ALL');
    setTypeFilter('ALL');
  };

  async function handleSendAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendAlertMutation.isPending) {
      return;
    }
    setSendFeedback(null);
    const trimmedDescription = sendForm.description?.trim();
    await sendAlertMutation.mutateAsync({
      type: sendForm.type.trim(),
      zone: sendForm.zone.trim(),
      severity: sendForm.severity,
      description: trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : undefined,
    });
  }

  return (
    <div className="alerts-page">
      <section className="card alerts-hero">
        <div>
          <p className="hero-eyebrow">Veille en direct</p>
          <h2>Alertes temps réel SmartFlow</h2>
        </div>
        <div className={`status-pill status-pill--${status}`}>
          <span className="status-dot" />
          <div>
            <strong>{statusCopy.label}</strong>
            <small>{statusCopy.detail}</small>
          </div>
        </div>
        <div className="alert-stat-row">
          {(Object.keys(SEVERITY_META) as SeverityKey[]).map((key) => (
            <div key={key} className="alert-stat">
              <span>{SEVERITY_META[key].label}</span>
              <strong>{severityStats[key]}</strong>
            </div>
          ))}
          <div className="alert-stat">
            <span>Zones touchées</span>
            <strong>{impactedZones}</strong>
          </div>
        </div>
        <div className="filter-bar">
          <div className="filter-bar__group">
            <p className="hero-eyebrow">Gravité minimale</p>
            <div className="filter-chip-row">
              {SEVERITY_FILTERS.map(({ key, label }) => (
                <button
                  type="button"
                  key={key}
                  className={`filter-chip ${minimumSeverity === key ? 'filter-chip--active' : ''}`}
                  onClick={() => setMinimumSeverity(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-bar__group">
            <p className="hero-eyebrow">Zone opérateur</p>
            <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} className="filter-select">
              <option value="ALL">Toutes</option>
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-bar__group">
            <p className="hero-eyebrow">Typologie</p>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="filter-select">
              <option value="ALL">Toutes</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <small className="muted">{filtersSummary}</small>
            <div className="filter-actions__buttons">
              <button type="button" className="ghost-button" onClick={() => setRefreshToken((token) => token + 1)}>
                Rafraîchir maintenant
              </button>
              {(minimumSeverity !== 'SEVERITY_INFO' || zoneFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <button type="button" className="ghost-button ghost-button--muted" onClick={resetFilters}>
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="alerts-grid">
        <section className="card alert-stream">
          <div className="alert-stream__header">
            <div>
              <h3>Flux temps réel</h3>
              <p className="muted">
                Dernier événement {highlightedAlert ? highlightedAlert.timestampLabel : 'en attente'} · Rafraîchi à {refreshLabel}
              </p>
            </div>
          </div>
          <div className="alert-marquee">
            {highlightedAlert ? (
              <>
                <span className={`severity-pill severity-pill--${getSeverityTone(highlightedAlert.severity)}`}>
                  {getSeverityLabel(highlightedAlert.severity)}
                </span>
                <div>
                  <strong>{highlightedAlert.type}</strong>
                  <p>
                    Zone {highlightedAlert.zone} — {highlightedAlert.description ?? 'Sans description'}
                  </p>
                </div>
                <small>{highlightedAlert.timestampLabel}</small>
              </>
            ) : (
              <p>Aucune alerte reçue pour le moment.</p>
            )}
          </div>
          <div className="alert-timeline">
            {formattedAlerts.map((alert) => (
              <article key={alert.id} className="alert-tile">
                <div>
                  <span className={`severity-pill severity-pill--${getSeverityTone(alert.severity)}`}>
                    {getSeverityLabel(alert.severity)}
                  </span>
                  <h4>{alert.type}</h4>
                  <p>{alert.description ?? 'Sans description'}</p>
                </div>
                <div className="alert-tile__meta">
                  <small>{alert.timestampLabel}</small>
                  <span>Zone {alert.zone}</span>
                </div>
              </article>
            ))}
            {formattedAlerts.length === 0 && <p className="alert-empty">Aucune alerte reçue sur la fenêtre courante.</p>}
          </div>
        </section>
      </div>
      <section className="card alert-sidepanel">
        <h3>Surveillance avancée</h3>
        <div className="alert-sidepanel__block">
          <p className="hero-eyebrow">Dernière critique</p>
          {criticalAlert ? (
            <div>
              <strong>{criticalAlert.type}</strong>
              <p>{criticalAlert.description ?? 'Sans description'}</p>
              <small>
                Zone {criticalAlert.zone} · {criticalAlert.timestampLabel}
              </small>
            </div>
          ) : (
            <p>Aucune alerte critique détectée ces dernières minutes.</p>
          )}
        </div>
        <div className="alert-sidepanel__block">
          <p className="hero-eyebrow">Procédures rapides</p>
          <ul>
            <li>Escalade automatique après 3 alertes critiques / 10 min</li>
            <li>Synchroniser avec la cellule de crise si ≥ 3 zones impactées</li>
            <li>Basculer sur SafeMode si le statut flux passe en erreur</li>
          </ul>
        </div>
        <div className="alert-sidepanel__block send-alert-cta">
          <p className="hero-eyebrow">Injection SOC</p>
          <strong>SendAlert(Alert)</strong>
          <p className="muted">Déclenchez une alerte gRPC tout en surveillant le flux en direct.</p>
          <form className="alert-send-form" onSubmit={handleSendAlert}>
            <label>
              <span>Type</span>
              <input
                className="input"
                value={sendForm.type}
                onChange={(event) => setSendForm((prev) => ({ ...prev, type: event.target.value }))}
                placeholder="INCIDENT_TRANSPORT"
              />
            </label>
            <label>
              <span>Zone</span>
              <select
                className="select"
                value={sendForm.zone}
                onChange={(event) => setSendForm((prev) => ({ ...prev, zone: event.target.value }))}
              >
                {sendZoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Gravité</span>
              <select
                className="select"
                value={sendForm.severity}
                onChange={(event) => setSendForm((prev) => ({ ...prev, severity: event.target.value as SeverityValue }))}
              >
                {ALERT_SEVERITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Description</span>
              <textarea
                className="textarea"
                value={sendForm.description}
                onChange={(event) => setSendForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={2}
              />
            </label>
            <button className="button secondary" type="submit" disabled={sendAlertMutation.isPending}>
              {sendAlertMutation.isPending ? 'Injection…' : 'Envoyer'}
            </button>
          </form>
          {sendFeedback && (
            <p className={sendFeedback.tone === 'success' ? 'form-success' : 'form-error'}>{sendFeedback.text}</p>
          )}
        </div>
      </section>
    </div>
  );
}
