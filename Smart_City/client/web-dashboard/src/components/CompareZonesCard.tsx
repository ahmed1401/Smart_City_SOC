import { useState } from 'react';

import { compareZones, CompareZonesResult } from '../api/airQuality';
import { zoneOptions } from '../constants/zones';

type CompareZonesCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'full' | 'compact';
};

export function CompareZonesCard({
  eyebrow = 'SOAP live demo',
  title = 'Comparer deux zones AQI',
  description =
    'L\'appel frappe directement CompareZones via Kong. Renseignez deux zones et observez delta AQI + polluant dominant.',
  className,
  variant = 'full',
}: CompareZonesCardProps) {
  const [zoneA, setZoneA] = useState(zoneOptions[0].value);
  const [zoneB, setZoneB] = useState(zoneOptions[1].value);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<CompareZonesResult | null>(null);

  function swapZones() {
    setZoneA(zoneB);
    setZoneB(zoneA);
  }

  async function handleCompareZones() {
    if (zoneA === zoneB) {
      setCompareError('Choisissez deux zones distinctes.');
      setCompareResult(null);
      return;
    }
    setCompareError(null);
    setIsComparing(true);
    try {
      const result = await compareZones(zoneA, zoneB);
      setCompareResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.includes('Failed to fetch')
            ? 'Impossible d\'appeler la gateway (vérifiez les en-têtes JWT/API key dans le panneau de gauche).'
            : error.message
          : 'Impossible de comparer les zones';
      setCompareError(message);
      setCompareResult(null);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <section className={`card compare-card ${variant === 'compact' ? 'compact' : ''} ${className ?? ''}`}>
      <div>
        {eyebrow && <p className="hero-eyebrow">{eyebrow}</p>}
        <h3>{title}</h3>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="compare-form">
        <label>
          Zone A
          <select value={zoneA} onChange={(event) => setZoneA(event.target.value)}>
            {zoneOptions.map((zone) => (
              <option key={`cmp-a-${zone.value}`} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>
        <button className="ghost-button" type="button" onClick={swapZones} aria-label="Inverser les zones">
          ⇆
        </button>
        <label>
          Zone B
          <select value={zoneB} onChange={(event) => setZoneB(event.target.value)}>
            {zoneOptions.map((zone) => (
              <option key={`cmp-b-${zone.value}`} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>
        <button className="button" type="button" onClick={handleCompareZones} disabled={isComparing}>
          {isComparing ? 'Comparaison…' : 'Comparer'}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.8rem' }}>
        Pensez à renseigner la clé API (`citizen-api-key`) et le JWT de démo dans le panneau Auth.
      </p>
      {compareError && <p className="error-text">{compareError}</p>}
      {compareResult && (
        <div className="compare-result">
          <div>
            <span>Zone la plus touchée</span>
            <strong>{compareResult.higherZone}</strong>
          </div>
          <div>
            <span>Delta AQI</span>
            <strong>{compareResult.deltaAQI}</strong>
          </div>
          <div>
            <span>Polluant dominant</span>
            <strong>{compareResult.dominantPollutant}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
