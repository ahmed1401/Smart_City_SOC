import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GatewayPaths, http } from '../api/http';
function parseAlertTimestamp(value) {
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
};
const INITIAL_STATS = {
    SEVERITY_CRITICAL: 0,
    SEVERITY_WARNING: 0,
    SEVERITY_INFO: 0,
};
const DEFAULT_SEND_ALERT = {
    type: 'INCIDENT_TRANSPORT',
    zone: 'CENTRE',
    severity: 'SEVERITY_INFO',
    description: '',
};
const SEVERITY_FILTERS = [
    { key: 'SEVERITY_INFO', label: 'Info +' },
    { key: 'SEVERITY_WARNING', label: 'Alerte +' },
    { key: 'SEVERITY_CRITICAL', label: 'Critique' },
];
const STATUS_LABEL = {
    idle: { label: 'Initialisation', detail: 'Connexion au relais REST (5s)' },
    connected: { label: 'Flux synchronisé', detail: 'SmartFlow → Emergency gRPC toutes les 5s' },
    error: { label: 'Erreur de connexion', detail: 'Nouvelle tentative REST + SendAlert dispo' },
};
const ALERT_SEVERITIES = [
    { value: 'SEVERITY_INFO', label: 'Info' },
    { value: 'SEVERITY_WARNING', label: 'Alerte' },
    { value: 'SEVERITY_CRITICAL', label: 'Critique' },
];
const POLLING_INTERVAL_MS = 5000;
const MAX_ALERTS = 20;
function getSeverityTone(severity) {
    return SEVERITY_META[severity]?.tone ?? 'info';
}
function getSeverityLabel(severity) {
    return SEVERITY_META[severity]?.label ?? severity.replace('SEVERITY_', '');
}
export function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState('idle');
    const [lastRefresh, setLastRefresh] = useState(null);
    const [activeAlertIndex, setActiveAlertIndex] = useState(0);
    const [minimumSeverity, setMinimumSeverity] = useState('SEVERITY_INFO');
    const [zoneFilter, setZoneFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [refreshToken, setRefreshToken] = useState(0);
    const [sendForm, setSendForm] = useState(() => ({ ...DEFAULT_SEND_ALERT }));
    const [sendFeedback, setSendFeedback] = useState(null);
    const searchParams = useMemo(() => {
        const params = {
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
                const payload = await http(GatewayPaths.alertsRecent, { searchParams });
                if (cancelled) {
                    return;
                }
                setAlerts(payload.alerts.slice(0, MAX_ALERTS));
                setStatus('connected');
                setLastRefresh(new Date());
                setActiveAlertIndex(0);
            }
            catch (error) {
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
            const key = alert.severity;
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
        mutationFn: (payload) => http(GatewayPaths.alertsSend, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
        onSuccess: (ack) => {
            setSendFeedback({ tone: 'success', text: `Alerte ${ack.alertId} injectée.` });
            setSendForm({ ...DEFAULT_SEND_ALERT });
            setRefreshToken((token) => token + 1);
        },
        onError: (error) => {
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
    async function handleSendAlert(event) {
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
    return (_jsxs("div", { className: "alerts-page", children: [_jsxs("section", { className: "card alerts-hero", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "Veille en direct" }), _jsx("h2", { children: "Alertes temps r\u00E9el SmartFlow" }), _jsx("p", { className: "muted", children: "Relais REST 5s via SmartFlow (bridge Emergency gRPC + filtres serveur)." })] }), _jsxs("div", { className: `status-pill status-pill--${status}`, children: [_jsx("span", { className: "status-dot" }), _jsxs("div", { children: [_jsx("strong", { children: statusCopy.label }), _jsx("small", { children: statusCopy.detail })] })] }), _jsxs("div", { className: "alert-stat-row", children: [Object.keys(SEVERITY_META).map((key) => (_jsxs("div", { className: "alert-stat", children: [_jsx("span", { children: SEVERITY_META[key].label }), _jsx("strong", { children: severityStats[key] })] }, key))), _jsxs("div", { className: "alert-stat", children: [_jsx("span", { children: "Zones touch\u00E9es" }), _jsx("strong", { children: impactedZones })] })] }), _jsxs("div", { className: "filter-bar", children: [_jsxs("div", { className: "filter-bar__group", children: [_jsx("p", { className: "hero-eyebrow", children: "Gravit\u00E9 minimale" }), _jsx("div", { className: "filter-chip-row", children: SEVERITY_FILTERS.map(({ key, label }) => (_jsx("button", { type: "button", className: `filter-chip ${minimumSeverity === key ? 'filter-chip--active' : ''}`, onClick: () => setMinimumSeverity(key), children: label }, key))) })] }), _jsxs("div", { className: "filter-bar__group", children: [_jsx("p", { className: "hero-eyebrow", children: "Zone op\u00E9rateur" }), _jsxs("select", { value: zoneFilter, onChange: (event) => setZoneFilter(event.target.value), className: "filter-select", children: [_jsx("option", { value: "ALL", children: "Toutes" }), zoneOptions.map((zone) => (_jsx("option", { value: zone, children: zone }, zone)))] })] }), _jsxs("div", { className: "filter-bar__group", children: [_jsx("p", { className: "hero-eyebrow", children: "Typologie" }), _jsxs("select", { value: typeFilter, onChange: (event) => setTypeFilter(event.target.value), className: "filter-select", children: [_jsx("option", { value: "ALL", children: "Toutes" }), typeOptions.map((type) => (_jsx("option", { value: type, children: type }, type)))] })] }), _jsxs("div", { className: "filter-actions", children: [_jsx("small", { className: "muted", children: filtersSummary }), _jsxs("div", { className: "filter-actions__buttons", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: () => setRefreshToken((token) => token + 1), children: "Rafra\u00EEchir maintenant" }), (minimumSeverity !== 'SEVERITY_INFO' || zoneFilter !== 'ALL' || typeFilter !== 'ALL') && (_jsx("button", { type: "button", className: "ghost-button ghost-button--muted", onClick: resetFilters, children: "R\u00E9initialiser" }))] })] })] })] }), _jsx("div", { className: "alerts-grid", children: _jsxs("section", { className: "card alert-stream", children: [_jsx("div", { className: "alert-stream__header", children: _jsxs("div", { children: [_jsx("h3", { children: "Flux temps r\u00E9el" }), _jsxs("p", { className: "muted", children: ["Dernier \u00E9v\u00E9nement ", highlightedAlert ? highlightedAlert.timestampLabel : 'en attente', " \u00B7 Rafra\u00EEchi \u00E0 ", refreshLabel] })] }) }), _jsx("div", { className: "alert-marquee", children: highlightedAlert ? (_jsxs(_Fragment, { children: [_jsx("span", { className: `severity-pill severity-pill--${getSeverityTone(highlightedAlert.severity)}`, children: getSeverityLabel(highlightedAlert.severity) }), _jsxs("div", { children: [_jsx("strong", { children: highlightedAlert.type }), _jsxs("p", { children: ["Zone ", highlightedAlert.zone, " \u2014 ", highlightedAlert.description ?? 'Sans description'] })] }), _jsx("small", { children: highlightedAlert.timestampLabel })] })) : (_jsx("p", { children: "Aucune alerte re\u00E7ue pour le moment." })) }), _jsxs("div", { className: "alert-timeline", children: [formattedAlerts.map((alert) => (_jsxs("article", { className: "alert-tile", children: [_jsxs("div", { children: [_jsx("span", { className: `severity-pill severity-pill--${getSeverityTone(alert.severity)}`, children: getSeverityLabel(alert.severity) }), _jsx("h4", { children: alert.type }), _jsx("p", { children: alert.description ?? 'Sans description' })] }), _jsxs("div", { className: "alert-tile__meta", children: [_jsx("small", { children: alert.timestampLabel }), _jsxs("span", { children: ["Zone ", alert.zone] })] })] }, alert.id))), formattedAlerts.length === 0 && _jsx("p", { className: "alert-empty", children: "Aucune alerte re\u00E7ue sur la fen\u00EAtre courante." })] })] }) }), _jsxs("section", { className: "card alert-sidepanel", children: [_jsx("h3", { children: "Surveillance avanc\u00E9e" }), _jsx("p", { className: "muted", children: "Synth\u00E8se SOC pour anticiper les escalades." }), _jsxs("div", { className: "alert-sidepanel__block", children: [_jsx("p", { className: "hero-eyebrow", children: "Derni\u00E8re critique" }), criticalAlert ? (_jsxs("div", { children: [_jsx("strong", { children: criticalAlert.type }), _jsx("p", { children: criticalAlert.description ?? 'Sans description' }), _jsxs("small", { children: ["Zone ", criticalAlert.zone, " \u00B7 ", criticalAlert.timestampLabel] })] })) : (_jsx("p", { children: "Aucune alerte critique d\u00E9tect\u00E9e ces derni\u00E8res minutes." }))] }), _jsxs("div", { className: "alert-sidepanel__block", children: [_jsx("p", { className: "hero-eyebrow", children: "Proc\u00E9dures rapides" }), _jsxs("ul", { children: [_jsx("li", { children: "Escalade automatique apr\u00E8s 3 alertes critiques / 10 min" }), _jsx("li", { children: "Synchroniser avec la cellule de crise si \u2265 3 zones impact\u00E9es" }), _jsx("li", { children: "Basculer sur SafeMode si le statut flux passe en erreur" })] })] }), _jsxs("div", { className: "alert-sidepanel__block send-alert-cta", children: [_jsx("p", { className: "hero-eyebrow", children: "Injection SOC" }), _jsx("strong", { children: "SendAlert(Alert)" }), _jsx("p", { className: "muted", children: "D\u00E9clenchez une alerte gRPC tout en surveillant le flux en direct." }), _jsxs("form", { className: "alert-send-form", onSubmit: handleSendAlert, children: [_jsxs("label", { children: [_jsx("span", { children: "Type" }), _jsx("input", { className: "input", value: sendForm.type, onChange: (event) => setSendForm((prev) => ({ ...prev, type: event.target.value })), placeholder: "INCIDENT_TRANSPORT" })] }), _jsxs("label", { children: [_jsx("span", { children: "Zone" }), _jsx("select", { className: "select", value: sendForm.zone, onChange: (event) => setSendForm((prev) => ({ ...prev, zone: event.target.value })), children: sendZoneOptions.map((zone) => (_jsx("option", { value: zone, children: zone }, zone))) })] }), _jsxs("label", { children: [_jsx("span", { children: "Gravit\u00E9" }), _jsx("select", { className: "select", value: sendForm.severity, onChange: (event) => setSendForm((prev) => ({ ...prev, severity: event.target.value })), children: ALERT_SEVERITIES.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "Description" }), _jsx("textarea", { className: "textarea", value: sendForm.description, onChange: (event) => setSendForm((prev) => ({ ...prev, description: event.target.value })), rows: 2 })] }), _jsx("button", { className: "button secondary", type: "submit", disabled: sendAlertMutation.isPending, children: sendAlertMutation.isPending ? 'Injection…' : 'Envoyer' })] }), sendFeedback && (_jsx("p", { className: sendFeedback.tone === 'success' ? 'form-success' : 'form-error', children: sendFeedback.text }))] })] })] }));
}
