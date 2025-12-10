import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { compareZones } from '../api/airQuality';
import { zoneOptions } from '../constants/zones';
export function CompareZonesCard({ eyebrow = 'SOAP live demo', title = 'Comparer deux zones AQI', description = 'L\'appel frappe directement CompareZones via Kong. Renseignez deux zones et observez delta AQI + polluant dominant.', className, variant = 'full', }) {
    const [zoneA, setZoneA] = useState(zoneOptions[0].value);
    const [zoneB, setZoneB] = useState(zoneOptions[1].value);
    const [isComparing, setIsComparing] = useState(false);
    const [compareError, setCompareError] = useState(null);
    const [compareResult, setCompareResult] = useState(null);
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
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message.includes('Failed to fetch')
                    ? 'Impossible d\'appeler la gateway (vérifiez les en-têtes JWT/API key dans le panneau de gauche).'
                    : error.message
                : 'Impossible de comparer les zones';
            setCompareError(message);
            setCompareResult(null);
        }
        finally {
            setIsComparing(false);
        }
    }
    return (_jsxs("section", { className: `card compare-card ${variant === 'compact' ? 'compact' : ''} ${className ?? ''}`, children: [_jsxs("div", { children: [eyebrow && _jsx("p", { className: "hero-eyebrow", children: eyebrow }), _jsx("h3", { children: title }), description && _jsx("p", { className: "muted", children: description })] }), _jsxs("div", { className: "compare-form", children: [_jsxs("label", { children: ["Zone A", _jsx("select", { value: zoneA, onChange: (event) => setZoneA(event.target.value), children: zoneOptions.map((zone) => (_jsx("option", { value: zone.value, children: zone.label }, `cmp-a-${zone.value}`))) })] }), _jsx("button", { className: "ghost-button", type: "button", onClick: swapZones, "aria-label": "Inverser les zones", children: "\u21C6" }), _jsxs("label", { children: ["Zone B", _jsx("select", { value: zoneB, onChange: (event) => setZoneB(event.target.value), children: zoneOptions.map((zone) => (_jsx("option", { value: zone.value, children: zone.label }, `cmp-b-${zone.value}`))) })] }), _jsx("button", { className: "button", type: "button", onClick: handleCompareZones, disabled: isComparing, children: isComparing ? 'Comparaison…' : 'Comparer' })] }), _jsx("p", { className: "muted", style: { fontSize: '0.8rem' }, children: "Pensez \u00E0 renseigner la cl\u00E9 API (`citizen-api-key`) et le JWT de d\u00E9mo dans le panneau Auth." }), compareError && _jsx("p", { className: "error-text", children: compareError }), compareResult && (_jsxs("div", { className: "compare-result", children: [_jsxs("div", { children: [_jsx("span", { children: "Zone la plus touch\u00E9e" }), _jsx("strong", { children: compareResult.higherZone })] }), _jsxs("div", { children: [_jsx("span", { children: "Delta AQI" }), _jsx("strong", { children: compareResult.deltaAQI })] }), _jsxs("div", { children: [_jsx("span", { children: "Polluant dominant" }), _jsx("strong", { children: compareResult.dominantPollutant })] })] }))] }));
}
