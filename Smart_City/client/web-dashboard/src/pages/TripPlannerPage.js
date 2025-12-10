import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { useSession } from '../context/SessionContext';
const ZONES = [
    { value: 'TUNIS-CENTRE', label: 'Tunis Centre (Bab Bhar)' },
    { value: 'LAC-2', label: 'Berges du Lac 2' },
    { value: 'LA-MARSA', label: 'La Marsa' },
    { value: 'SIDI-BOU-SAID', label: 'Sidi Bou Saïd' },
    { value: 'ARIANA', label: 'Ariana Ville' },
    { value: 'BEN-AROUS', label: 'Ben Arous' },
];
const MODES = [
    { value: 'tram', label: 'Tram' },
    { value: 'metro', label: 'Métro' },
    { value: 'bus', label: 'Bus' },
    { value: 'bike', label: 'Vélo' },
];
const STOP_CHOICES = ['STOP-A', 'STOP-B', 'STOP-C', 'STOP-D'];
const defaultPayload = { zoneCode: ZONES[0].value, preferredMode: MODES[0].value, stopId: STOP_CHOICES[0] };
const defaultBooking = {
    lineId: '',
    stopFrom: STOP_CHOICES[0],
    stopTo: STOP_CHOICES[1],
    datetime: '',
    userId: 'citizen-app-user',
};
function formatDateInput(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}
function nextStop(current) {
    const index = STOP_CHOICES.indexOf(current);
    if (index === -1) {
        return STOP_CHOICES[0];
    }
    return STOP_CHOICES[(index + 1) % STOP_CHOICES.length];
}
function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatTripError(err) {
    if (err instanceof Error) {
        if (/502/.test(err.message)) {
            return 'SmartFlow indisponible (Gateway 502). Vérifiez l’orchestrateur ou Emergency.';
        }
        return err.message;
    }
    return 'Erreur inconnue renvoyée par SmartFlow.';
}
export function TripPlannerPage() {
    const [form, setForm] = useState(defaultPayload);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useSession();
    const sessionUserId = user?.id ?? defaultBooking.userId;
    const [bookingForm, setBookingForm] = useState(() => ({ ...defaultBooking, userId: sessionUserId }));
    const [bookingMessage, setBookingMessage] = useState(null);
    const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
    const queryClient = useQueryClient();
    const citizenName = user?.fullName ?? 'Utilisateur démo';
    const activeUserFilter = bookingForm.userId.trim();
    const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
        queryKey: ['bookings', activeUserFilter || 'all'],
        queryFn: () => http('/api/mobility/bookings', {
            searchParams: activeUserFilter ? { userId: activeUserFilter } : undefined,
        }),
    });
    const { data: lineSchedule, isLoading: scheduleLoading, error: scheduleError, } = useQuery({
        queryKey: ['lineSchedule', bookingForm.lineId, scheduleDate],
        queryFn: () => http(`/api/mobility/lines/${bookingForm.lineId}/schedule`, {
            searchParams: scheduleDate ? { date: scheduleDate } : undefined,
        }),
        enabled: Boolean(bookingForm.lineId),
    });
    const { data: stopArrivals, isLoading: arrivalsLoading, error: arrivalsError, } = useQuery({
        queryKey: ['stopArrivals', bookingForm.stopFrom],
        queryFn: () => http(`/api/mobility/stops/${bookingForm.stopFrom}/arrivals`),
        enabled: Boolean(bookingForm.stopFrom),
        refetchInterval: 60000,
    });
    const bookingMutation = useMutation({
        mutationFn: (payload) => http('/api/mobility/bookings', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
        onSuccess: (booking) => {
            setBookingMessage(`Réservation ${booking.id} confirmée (${booking.status}).`);
            queryClient.invalidateQueries({ queryKey: ['bookings', activeUserFilter || 'all'] });
            setBookingForm((prev) => ({ ...prev, datetime: '' }));
        },
        onError: (err) => {
            setBookingMessage(err.message);
        },
    });
    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = await http('/api/smartflow/trip-plan', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setResult(payload);
        }
        catch (err) {
            setError(formatTripError(err));
            setResult(null);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleBookingSubmit(event) {
        event.preventDefault();
        setBookingMessage(null);
        if (!bookingForm.lineId.trim()) {
            setBookingMessage('Veuillez sélectionner une ligne avant de réserver.');
            return;
        }
        const selectedLine = bookingOptions.find((line) => line.id === bookingForm.lineId);
        if (selectedLine?.mode === 'bike') {
            setBookingMessage('Les réservations vélo ne sont pas disponibles via le SOC.');
            return;
        }
        if (!bookingForm.stopFrom.trim() || !bookingForm.stopTo.trim()) {
            setBookingMessage('Merci de renseigner les arrêts de départ et d’arrivée.');
            return;
        }
        if (bookingForm.stopFrom === bookingForm.stopTo) {
            setBookingMessage('Les arrêts de départ et d’arrivée doivent être différents.');
            return;
        }
        if (!bookingForm.userId.trim()) {
            setBookingMessage('Un identifiant utilisateur est requis.');
            return;
        }
        if (bookingForm.datetime) {
            const bookingDate = new Date(bookingForm.datetime);
            if (bookingDate.getTime() < Date.now()) {
                setBookingMessage('Impossible de réserver dans le passé.');
                return;
            }
        }
        await bookingMutation.mutateAsync({
            ...bookingForm,
            datetime: bookingForm.datetime && bookingForm.datetime.length > 0 ? new Date(bookingForm.datetime).toISOString() : undefined,
        });
    }
    useEffect(() => {
        if (result?.transport.lines.length && !bookingForm.lineId) {
            setBookingForm((prev) => ({ ...prev, lineId: result.transport.lines[0].id }));
        }
    }, [result, bookingForm.lineId]);
    useEffect(() => {
        if (sessionUserId && bookingForm.userId !== sessionUserId) {
            setBookingForm((prev) => ({ ...prev, userId: sessionUserId }));
        }
    }, [sessionUserId, bookingForm.userId]);
    const bookingOptions = useMemo(() => {
        return (result?.transport.lines ?? []).filter((line) => line.mode !== 'bike');
    }, [result]);
    useEffect(() => {
        if (!result?.transport.lines?.length) {
            return;
        }
        const currentLine = result.transport.lines.find((line) => line.id === bookingForm.lineId);
        if (currentLine && currentLine.mode !== 'bike') {
            return;
        }
        const fallback = result.transport.lines.find((line) => line.mode !== 'bike');
        if (fallback) {
            setBookingForm((prev) => ({ ...prev, lineId: fallback.id }));
        }
    }, [result, bookingForm.lineId]);
    useEffect(() => {
        setBookingForm((prev) => {
            const normalized = STOP_CHOICES.includes(form.stopId) ? form.stopId : STOP_CHOICES[0];
            if (prev.stopFrom === normalized) {
                return prev;
            }
            const updatedStopTo = prev.stopTo === normalized ? nextStop(normalized) : prev.stopTo;
            return { ...prev, stopFrom: normalized, stopTo: updatedStopTo };
        });
    }, [form.stopId]);
    useEffect(() => {
        if (bookingForm.stopFrom === bookingForm.stopTo) {
            setBookingForm((prev) => ({ ...prev, stopTo: nextStop(prev.stopFrom) }));
        }
    }, [bookingForm.stopFrom, bookingForm.stopTo]);
    const zoneLabel = useMemo(() => ZONES.find((zone) => zone.value === form.zoneCode)?.label ?? '—', [form.zoneCode]);
    const modeLabel = useMemo(() => MODES.find((mode) => mode.value === form.preferredMode)?.label ?? '—', [form.preferredMode]);
    const minBookingDate = formatDateInput(new Date());
    return (_jsxs("div", { className: "trip-page", children: [_jsxs("section", { className: "card trip-hero", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "SmartFlow" }), _jsx("h2", { children: "Planificateur multimodal SmartFlow" }), _jsx("p", { className: "muted", children: "Simulez un parcours, choisissez le mode id\u00E9al et d\u00E9clenchez une r\u00E9servation instantan\u00E9e." })] }), _jsxs("div", { className: "trip-hero__stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Zone suivie" }), _jsx("strong", { children: zoneLabel })] }), _jsxs("div", { children: [_jsx("span", { children: "Mode pr\u00E9f\u00E9r\u00E9" }), _jsx("strong", { children: modeLabel })] }), _jsxs("div", { children: [_jsx("span", { children: "Arr\u00EAt source" }), _jsx("strong", { children: form.stopId || '—' })] })] })] }), _jsxs("div", { className: "grid two-columns trip-grid", children: [_jsxs("section", { className: "card trip-config", children: [_jsxs("header", { className: "trip-config__header", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "Configurer la simulation" }), _jsx("h3", { children: "Param\u00E8tres SmartFlow" })] }), _jsxs("div", { className: "trip-config__tags", children: [_jsx("span", { className: "chip", children: "Donn\u00E9es temps r\u00E9el" }), _jsx("span", { className: "chip", children: "API orchestrateur" })] })] }), _jsxs("form", { className: "trip-config__form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "trip-config__grid", children: [_jsxs("label", { children: [_jsx("span", { children: "Zone" }), _jsx("select", { className: "select", value: form.zoneCode, onChange: (event) => setForm((prev) => ({ ...prev, zoneCode: event.target.value })), children: ZONES.map((zone) => (_jsx("option", { value: zone.value, children: zone.label }, zone.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "Mode pr\u00E9f\u00E9r\u00E9" }), _jsx("select", { className: "select", value: form.preferredMode, onChange: (event) => setForm((prev) => ({ ...prev, preferredMode: event.target.value })), children: MODES.map((mode) => (_jsx("option", { value: mode.value, children: mode.label }, mode.value))) })] }), _jsxs("label", { children: [_jsx("span", { children: "Arr\u00EAt (stopId)" }), _jsx("select", { className: "select", value: form.stopId, onChange: (event) => setForm((prev) => ({ ...prev, stopId: event.target.value })), children: STOP_CHOICES.map((stop) => (_jsx("option", { value: stop, children: stop }, stop))) })] })] }), _jsxs("div", { className: "trip-config__actions", children: [_jsx("button", { className: "button", type: "submit", disabled: loading, children: loading ? 'Calcul en cours...' : 'Calculer le trajet' }), error && _jsx("p", { className: "form-error", children: error })] })] })] }), _jsxs("section", { className: "card trip-result", children: [_jsx("h3", { children: "R\u00E9sultat" }), !result && _jsx("p", { children: "Lancer une simulation pour voir la recommandation." }), result && (_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Mode recommand\u00E9 :" }), " ", result.recommendation.mode] }), _jsx("p", { children: result.recommendation.reason }), _jsx("h4", { children: "Lignes disponibles" }), _jsx("ul", { children: result.transport.lines.map((line) => (_jsxs("li", { children: [line.name, " (", line.mode, ")"] }, line.id))) }), _jsx("h4", { children: "Arriv\u00E9es" }), _jsx("ul", { children: result.transport.arrivals.map((arrival) => (_jsxs("li", { children: [arrival.lineId, ": ", arrival.etaMinutes, " min"] }, `${arrival.lineId}-${arrival.etaMinutes}`))) }), _jsxs("small", { children: ["Calcul\u00E9 le ", new Date(result.timestamp).toLocaleTimeString()] })] }))] })] }), _jsxs("section", { className: "card trip-schedule", children: [_jsx("div", { className: "trip-schedule__header", style: { marginBottom: '16px' }, children: _jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "Mobility REST" }), _jsx("h3", { children: "Horaires & arriv\u00E9es" }), _jsx("p", { className: "muted", style: { marginBottom: 0 }, children: "Consultez les horaires complets d'une ligne pour une date donn\u00E9e puis suivez les passages temps r\u00E9el \u00E0 votre arr\u00EAt." })] }) }), _jsxs("div", { className: "trip-config__grid", style: { marginBottom: '16px' }, children: [_jsxs("label", { children: [_jsx("span", { children: "Ligne analys\u00E9e" }), _jsxs("select", { className: "select", value: bookingForm.lineId, onChange: (event) => setBookingForm((prev) => ({ ...prev, lineId: event.target.value })), children: [_jsx("option", { value: "", children: "-- S\u00E9lectionner --" }), (result?.transport.lines ?? []).map((line) => (_jsx("option", { value: line.id, children: line.name }, `schedule-${line.id}`)))] })] }), _jsxs("label", { children: [_jsx("span", { children: "Date des horaires" }), _jsx("input", { type: "date", className: "input", value: scheduleDate, onChange: (event) => setScheduleDate(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "Arr\u00EAt suivi" }), _jsx("select", { className: "select", value: bookingForm.stopFrom, onChange: (event) => setBookingForm((prev) => ({ ...prev, stopFrom: event.target.value })), children: STOP_CHOICES.map((stop) => (_jsx("option", { value: stop, children: stop }, `arrival-stop-${stop}`))) })] })] }), !bookingForm.lineId && _jsx("p", { className: "muted", children: "S\u00E9lectionnez une ligne pour afficher son planning." }), bookingForm.lineId && (_jsxs("div", { className: "trip-schedule__content", style: { display: 'grid', gap: '16px' }, children: [_jsxs("div", { children: [_jsxs("h4", { children: ["Horaires d\u00E9taill\u00E9s (", scheduleDate || '—', ")"] }), scheduleLoading && _jsx("p", { children: "Chargement des horaires\u2026" }), scheduleError && _jsx("p", { className: "form-error", children: "Impossible de charger les horaires." }), lineSchedule && lineSchedule.trips.length === 0 && _jsx("p", { children: "Aucun trajet pr\u00E9vu pour cette date." }), lineSchedule && lineSchedule.trips.length > 0 && (_jsx("ul", { className: "trip-schedule__list", children: lineSchedule.trips.map((trip) => (_jsxs("li", { children: [_jsx("div", { children: _jsxs("strong", { children: [formatTime(trip.departure), " \u2192 ", formatTime(trip.arrival)] }) }), _jsx("small", { className: "muted", children: trip.stops.map((stop) => `${stop.stopId} ${formatTime(stop.time)}`).join(' · ') })] }, `${trip.departure}-${trip.arrival}`))) }))] }), _jsxs("div", { children: [_jsxs("h4", { children: ["Arriv\u00E9es temps r\u00E9el (", bookingForm.stopFrom, ")"] }), arrivalsLoading && _jsx("p", { children: "Mise \u00E0 jour des arriv\u00E9es\u2026" }), arrivalsError && _jsx("p", { className: "form-error", children: "Arriv\u00E9es indisponibles pour le moment." }), stopArrivals && stopArrivals.length === 0 && _jsx("p", { children: "Aucun passage annonc\u00E9." }), stopArrivals && stopArrivals.length > 0 && (_jsx("ul", { children: stopArrivals.map((arrival) => (_jsxs("li", { children: [arrival.lineId, " \u00B7 ", arrival.etaMinutes, " min"] }, `arrival-${arrival.lineId}-${arrival.etaMinutes}`))) }))] })] }))] }), _jsxs("div", { className: "grid two-columns trip-grid", children: [_jsxs("section", { className: "card", children: [_jsx("h3", { children: "R\u00E9server un trajet" }), _jsxs("form", { className: "form", onSubmit: handleBookingSubmit, children: [_jsxs("label", { children: ["Citoyen", _jsx("input", { className: "input", value: citizenName, disabled: true, readOnly: true })] }), _jsx("input", { type: "hidden", value: bookingForm.userId, readOnly: true }), _jsxs("label", { children: ["Ligne", _jsxs("select", { className: "select", value: bookingForm.lineId, onChange: (event) => setBookingForm((prev) => ({ ...prev, lineId: event.target.value })), children: [_jsx("option", { value: "", children: "-- S\u00E9lectionner --" }), bookingOptions.map((line) => (_jsxs("option", { value: line.id, children: [line.name, " (", line.mode, ")"] }, line.id)))] })] }), _jsxs("label", { children: ["Arr\u00EAt de d\u00E9part", _jsx("select", { className: "select", value: bookingForm.stopFrom, onChange: (event) => setBookingForm((prev) => ({ ...prev, stopFrom: event.target.value })), children: STOP_CHOICES.map((stop) => (_jsx("option", { value: stop, children: stop }, `stop-from-${stop}`))) })] }), _jsxs("label", { children: ["Arr\u00EAt d'arriv\u00E9e", _jsx("select", { className: "select", value: bookingForm.stopTo, onChange: (event) => setBookingForm((prev) => ({ ...prev, stopTo: event.target.value })), children: STOP_CHOICES.filter((stop) => stop !== bookingForm.stopFrom).map((stop) => (_jsx("option", { value: stop, children: stop }, `stop-to-${stop}`))) })] }), _jsxs("label", { children: ["Date & heure (optionnel)", _jsx("input", { type: "datetime-local", className: "input", value: bookingForm.datetime ?? '', min: minBookingDate, onChange: (event) => setBookingForm((prev) => ({ ...prev, datetime: event.target.value })) })] }), _jsx("button", { className: "button", type: "submit", disabled: bookingMutation.isPending, children: bookingMutation.isPending ? 'Enregistrement...' : 'Réserver' }), bookingMessage && _jsx("p", { style: { color: bookingMessage.includes('confirmée') ? '#15803d' : '#dc2626' }, children: bookingMessage })] })] }), _jsxs("section", { className: "card", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("h3", { children: "Mes r\u00E9servations" }), _jsxs("p", { className: "muted", children: ["Filtr\u00E9es sur : ", citizenName] })] }), _jsx("button", { className: "button secondary", type: "button", onClick: () => refetchBookings(), disabled: bookingsLoading, children: "Rafra\u00EEchir" })] }), bookingsLoading && _jsx("p", { children: "Chargement des r\u00E9servations..." }), !bookingsLoading && (!bookings || bookings.length === 0) && _jsx("p", { children: "Aucune r\u00E9servation trouv\u00E9e." }), bookings && bookings.length > 0 && (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ligne" }), _jsx("th", { children: "Parcours" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Statut" })] }) }), _jsx("tbody", { children: bookings.map((booking) => (_jsxs("tr", { children: [_jsx("td", { children: booking.lineId }), _jsxs("td", { children: [booking.stopFrom, " \u2192 ", booking.stopTo] }), _jsx("td", { children: new Date(booking.datetime).toLocaleString() }), _jsx("td", { children: booking.status })] }, booking.id))) })] }))] })] })] }));
}
