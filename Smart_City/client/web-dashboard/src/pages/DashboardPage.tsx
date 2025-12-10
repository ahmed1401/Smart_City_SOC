import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';

import { http } from '../api/http';
import { CompareZonesCard } from '../components/CompareZonesCard';
import { zoneOptions } from '../constants/zones';

type PollutantLevel = {
  name: string;
  value: number;
  unit: string;
};

type OverviewMetrics = {
  zoneCode: string;
  updatedAt: string;
  aqi: { value: number; category: string; recommendation: string; trend: string };
  pollutants: { zoneCode: string; pollutants: PollutantLevel[] };
  transport: {
    lines: { id: string; name: string; mode: string; status: string }[];
    arrivals: { lineId: string; etaMinutes: number }[];
    stopId: string;
  };
  alerts: { id: string; type: string; zone: string; description?: string; severity: string }[];
};

export function DashboardPage() {
  const [zone, setZone] = useState(zoneOptions[0].value);
  const { data, isLoading, isFetching, refetch, error } = useQuery<OverviewMetrics>({
    queryKey: ['overview', zone],
    queryFn: () => http(`/api/smartflow/metrics/overview`, { searchParams: { zoneCode: zone } }),
    staleTime: 1000 * 30,
  });
  const pollutants = data?.pollutants?.pollutants ?? [];
  const zoneLabel = zoneOptions.find((option) => option.value === zone)?.label ?? zone;
  const columnsStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  };
  const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
  const updatedAtLabel = data ? new Date(data.updatedAt).toLocaleTimeString() : '';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="hero-eyebrow">AirQuality Service</p>
          <h2 className="page-title">Tableau de bord AQI</h2>
          <p className="muted">Consultez l’indice AQI, les principaux polluants et comparez deux zones sans quitter l’écran.</p>
        </div>
        <div className="dashboard-controls">
          <label>
            <span>Zone</span>
            <select className="select" value={zone} onChange={(event) => setZone(event.target.value)}>
              {zoneOptions.map((option) => (
                <option key={`dashboard-zone-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button" onClick={() => refetch()} disabled={isFetching}>
            Actualiser
          </button>
        </div>
      </header>

      {isLoading && <p>Chargement des indicateurs...</p>}
      {error && (
        <p className="form-error">Impossible de charger SmartFlow (détails : {(error as Error).message}).</p>
      )}

      {data && (
        <div className="dashboard-columns" style={columnsStyle}>
            <div className="dashboard-column" style={columnStyle}>
              <section className="card aqi-card">
                <p className="hero-eyebrow">Grand Tunis</p>
                <h3>{zoneLabel}</h3>
                <p className="aqi-value">{data.aqi.value}</p>
                <p className="aqi-category">{data.aqi.category}</p>
                <p className="muted">{data.aqi.recommendation}</p>
                <small>Dernière mise à jour {updatedAtLabel}</small>
              </section>

              <section className="card">
                <h3>Focus zone</h3>
                <ul className="dashboard-list">
                  <li>
                    <span>Code zone</span>
                    <strong>{zone}</strong>
                  </li>
                  <li>
                    <span>Tendance</span>
                    <strong>{data.aqi.trend}</strong>
                  </li>
                  <li>
                    <span>Indice AQI</span>
                    <strong>{data.aqi.value}</strong>
                  </li>
                </ul>
              </section>

              <CompareZonesCard
                eyebrow="Comparaison multi-zones"
                title="CompareZones SOAP"
                description="Sélectionnez deux quartiers pour analyser les deltas AQI instantanément."
                variant="compact"
              />
            </div>

            <div className="dashboard-column" style={columnStyle}>
              <section className="card pollutant-card">
                <div className="pollutant-card__header">
                  <div>
                    <p className="hero-eyebrow">Profil tunisien</p>
                    <h3>Polluants dominants</h3>
                  </div>
                </div>
                <div
                  className="pollutant-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}
                >
                  {pollutants.length === 0 && <p className="muted">En attente de mesures SOAP.</p>}
                  {pollutants.map((pollutant) => (
                    <article
                      key={pollutant.name}
                      className="pollutant-chip"
                      style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div>
                        <strong>{pollutant.name}</strong>
                        <small>{pollutant.unit}</small>
                      </div>
                      <p className="pollutant-chip__value" style={{ fontSize: '1.75rem', fontWeight: 600, margin: '8px 0' }}>
                        {pollutant.value}
                      </p>
                      <div className="pollutant-bar">
                        <span style={{ width: `${Math.min(100, pollutant.value)}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="card">
                <h3>Lignes recommandées</h3>
                <ul className="dashboard-list">
                  {data.transport.lines.slice(0, 4).map((line) => (
                    <li key={line.id}>
                      <strong>{line.name}</strong>
                      <span>
                        {line.mode} · {line.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <h3>Prochains passages ({data.transport.stopId})</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ligne</th>
                      <th>Arrivée (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transport.arrivals.map((arrival) => (
                      <tr key={`${arrival.lineId}-${arrival.etaMinutes}`}>
                        <td>{arrival.lineId}</td>
                        <td>{arrival.etaMinutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            <div className="dashboard-column" style={columnStyle}>
              <section className="card">
                <h3>Alertes récentes</h3>
                <div className="alert-feed">
                  {data.alerts.length === 0 && <p>Aucune alerte en cours.</p>}
                  {data.alerts.map((alert) => (
                    <article key={alert.id} className="alert-item" data-severity={alert.severity}>
                      <strong>{alert.type}</strong> — Zone {alert.zone}
                      <p style={{ margin: '4px 0' }}>{alert.description ?? 'Sans description'}</p>
                      <small>Criticité : {alert.severity.replace('SEVERITY_', '')}</small>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
      )}
    </div>
  );
}
