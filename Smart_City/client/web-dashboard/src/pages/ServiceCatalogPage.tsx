import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  protocolFilters,
  servicesCatalog,
  ServiceDefinition,
  totalEndpointCount,
} from '../data/services';

function matchesSearch(service: ServiceDefinition, query: string) {
  if (!query) {
    return true;
  }
  const haystack = [
    service.name,
    service.tagline,
    service.basePath,
    service.upstream,
    service.techStack,
    service.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path} ${endpoint.description}`).join(' '),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function ServiceCatalogPage() {
  const [search, setSearch] = useState('');
  const [protocol, setProtocol] = useState<'ALL' | (typeof protocolFilters)[number]>('ALL');

  const filteredServices = useMemo(() => {
    return servicesCatalog.filter((service) => {
      const protocolOk = protocol === 'ALL' || service.protocols.includes(protocol);
      return protocolOk && matchesSearch(service, search.trim());
    });
  }, [protocol, search]);

  const endpointsVisible = filteredServices.reduce((total, service) => total + service.endpoints.length, 0);
  const protocolSummary = useMemo(
    () =>
      protocolFilters.map((item) => ({
        name: item,
        count: servicesCatalog.filter((service) => service.protocols.includes(item)).length,
      })),
    [],
  );

  const heroMetrics = [
    { label: 'Services routés', value: servicesCatalog.length },
    { label: 'Endpoints catalogués', value: totalEndpointCount },
    { label: 'Protocoles gérés', value: protocolFilters.length },
  ];

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">cartographie gateway</p>
          <h2>Services exposés via Kong</h2>
          <p className="hero-text">
            Surveillez les domaines branchés sur l'API Gateway et filtrez rapidement le catalogue par protocole/texte.
          </p>
          <div className="hero-metrics">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="hero-metric">
                <span>{metric.value}</span>
                <p>{metric.label}</p>
              </div>
            ))}
          </div>
          <div className="protocol-summary">
            {protocolSummary.map((item) => (
              <div key={item.name} className="protocol-chip">
                <span>{item.name}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card filters-panel">
        <div className="filters-left">
          <input
            type="search"
            className="input search-input"
            placeholder="Rechercher par service, chemin ou description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="protocol-pills">
            {['ALL', ...protocolFilters].map((item) => (
              <button
                key={item}
                type="button"
                className={`pill ${protocol === item ? 'active' : ''}`}
                onClick={() => setProtocol(item as 'ALL' | (typeof protocolFilters)[number])}
              >
                {item === 'ALL' ? 'Tous' : item}
              </button>
            ))}
          </div>
        </div>
        <div className="filters-stats">
          <div>
            <p className="muted">Endpoints visibles</p>
            <strong>{endpointsVisible}</strong>
          </div>
          <div>
            <p className="muted">Filtre appliqué</p>
            <strong>{protocol === 'ALL' ? 'Tous protocoles' : protocol}</strong>
          </div>
          <div>
            <Link className="button secondary" to="/">
              Retour dashboard
            </Link>
          </div>
        </div>
      </section>

      {filteredServices.length === 0 && (
        <section className="card service-empty">
          <p>Aucun service ne correspond à la recherche « {search} ».</p>
          <button className="button secondary" onClick={() => setSearch('')}>
            Réinitialiser le filtre
          </button>
        </section>
      )}

      <div className="service-grid redesigned">
        {filteredServices.map((service) => (
          <article key={service.id} className="card service-card">
            <div className="service-card__header">
              <div>
                <p className="hero-eyebrow">{service.techStack}</p>
                <h3>{service.name}</h3>
                <p className="muted">{service.tagline}</p>
              </div>
              <div className="service-card__tags">
                {service.protocols.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="service-meta">
              <div>
                <span>Gateway</span>
                <p className="mono">{service.basePath}</p>
              </div>
              <div>
                <span>Upstream</span>
                <p className="mono">{service.upstream}</p>
              </div>
              <div>
                <span>Doc interne</span>
                <p className="mono">{service.docs ?? '—'}</p>
              </div>
            </div>
            <ul className="endpoint-list">
              {service.endpoints.map((endpoint) => (
                <li key={`${service.id}-${endpoint.method}-${endpoint.path}`}>
                  <span className={`method-chip ${endpoint.protocol.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <div>
                    <p className="mono endpoint-path">{endpoint.path}</p>
                    <p className="endpoint-desc">{endpoint.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
