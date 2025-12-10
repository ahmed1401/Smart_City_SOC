import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { protocolFilters, servicesCatalog, totalEndpointCount, } from '../data/services';
function matchesSearch(service, query) {
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
    const [protocol, setProtocol] = useState('ALL');
    const filteredServices = useMemo(() => {
        return servicesCatalog.filter((service) => {
            const protocolOk = protocol === 'ALL' || service.protocols.includes(protocol);
            return protocolOk && matchesSearch(service, search.trim());
        });
    }, [protocol, search]);
    const endpointsVisible = filteredServices.reduce((total, service) => total + service.endpoints.length, 0);
    const protocolSummary = useMemo(() => protocolFilters.map((item) => ({
        name: item,
        count: servicesCatalog.filter((service) => service.protocols.includes(item)).length,
    })), []);
    const heroMetrics = [
        { label: 'Services routés', value: servicesCatalog.length },
        { label: 'Endpoints catalogués', value: totalEndpointCount },
        { label: 'Protocoles gérés', value: protocolFilters.length },
    ];
    return (_jsxs("div", { className: "services-page", children: [_jsx("section", { className: "services-hero", children: _jsxs("div", { className: "hero-copy", children: [_jsx("p", { className: "hero-eyebrow", children: "cartographie gateway" }), _jsx("h2", { children: "Services expos\u00E9s via Kong" }), _jsx("p", { className: "hero-text", children: "Surveillez les domaines branch\u00E9s sur l'API Gateway et filtrez rapidement le catalogue par protocole/texte." }), _jsx("div", { className: "hero-metrics", children: heroMetrics.map((metric) => (_jsxs("div", { className: "hero-metric", children: [_jsx("span", { children: metric.value }), _jsx("p", { children: metric.label })] }, metric.label))) }), _jsx("div", { className: "protocol-summary", children: protocolSummary.map((item) => (_jsxs("div", { className: "protocol-chip", children: [_jsx("span", { children: item.name }), _jsx("strong", { children: item.count })] }, item.name))) })] }) }), _jsxs("section", { className: "card filters-panel", children: [_jsxs("div", { className: "filters-left", children: [_jsx("input", { type: "search", className: "input search-input", placeholder: "Rechercher par service, chemin ou description", value: search, onChange: (event) => setSearch(event.target.value) }), _jsx("div", { className: "protocol-pills", children: ['ALL', ...protocolFilters].map((item) => (_jsx("button", { type: "button", className: `pill ${protocol === item ? 'active' : ''}`, onClick: () => setProtocol(item), children: item === 'ALL' ? 'Tous' : item }, item))) })] }), _jsxs("div", { className: "filters-stats", children: [_jsxs("div", { children: [_jsx("p", { className: "muted", children: "Endpoints visibles" }), _jsx("strong", { children: endpointsVisible })] }), _jsxs("div", { children: [_jsx("p", { className: "muted", children: "Filtre appliqu\u00E9" }), _jsx("strong", { children: protocol === 'ALL' ? 'Tous protocoles' : protocol })] }), _jsx("div", { children: _jsx(Link, { className: "button secondary", to: "/", children: "Retour dashboard" }) })] })] }), filteredServices.length === 0 && (_jsxs("section", { className: "card service-empty", children: [_jsxs("p", { children: ["Aucun service ne correspond \u00E0 la recherche \u00AB ", search, " \u00BB."] }), _jsx("button", { className: "button secondary", onClick: () => setSearch(''), children: "R\u00E9initialiser le filtre" })] })), _jsx("div", { className: "service-grid redesigned", children: filteredServices.map((service) => (_jsxs("article", { className: "card service-card", children: [_jsxs("div", { className: "service-card__header", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: service.techStack }), _jsx("h3", { children: service.name }), _jsx("p", { className: "muted", children: service.tagline })] }), _jsx("div", { className: "service-card__tags", children: service.protocols.map((item) => (_jsx("span", { className: "badge", children: item }, item))) })] }), _jsxs("div", { className: "service-meta", children: [_jsxs("div", { children: [_jsx("span", { children: "Gateway" }), _jsx("p", { className: "mono", children: service.basePath })] }), _jsxs("div", { children: [_jsx("span", { children: "Upstream" }), _jsx("p", { className: "mono", children: service.upstream })] }), _jsxs("div", { children: [_jsx("span", { children: "Doc interne" }), _jsx("p", { className: "mono", children: service.docs ?? '—' })] })] }), _jsx("ul", { className: "endpoint-list", children: service.endpoints.map((endpoint) => (_jsxs("li", { children: [_jsx("span", { className: `method-chip ${endpoint.protocol.toLowerCase()}`, children: endpoint.method }), _jsxs("div", { children: [_jsx("p", { className: "mono endpoint-path", children: endpoint.path }), _jsx("p", { className: "endpoint-desc", children: endpoint.description })] })] }, `${service.id}-${endpoint.method}-${endpoint.path}`))) })] }, service.id))) })] }));
}
