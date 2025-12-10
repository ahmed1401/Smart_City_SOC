import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '../api/http';
import { useSession } from '../context/SessionContext';

type TripPlanResponse = {
  timestamp: string;
  recommendation: { mode: string; reason: string; caution: string };
  transport: {
    lines: { id: string; name: string; mode: string }[];
    arrivals: { lineId: string; etaMinutes: number }[];
  };
};

type Booking = {
  id: string;
  lineId: string;
  stopFrom: string;
  stopTo: string;
  datetime: string;
  userId: string;
  status: string;
};

type BookingPayload = {
  lineId: string;
  stopFrom: string;
  stopTo: string;
  datetime?: string;
  userId: string;
};

type Schedule = {
  lineId: string;
  date: string;
  trips: {
    departure: string;
    arrival: string;
    stops: { stopId: string; time: string }[];
  }[];
};

type Arrival = {
  lineId: string;
  etaMinutes: number;
};

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
const defaultBooking: BookingPayload = {
  lineId: '',
  stopFrom: STOP_CHOICES[0],
  stopTo: STOP_CHOICES[1],
  datetime: '',
  userId: 'citizen-app-user',
};

function formatDateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function nextStop(current: string) {
  const index = STOP_CHOICES.indexOf(current);
  if (index === -1) {
    return STOP_CHOICES[0];
  }
  return STOP_CHOICES[(index + 1) % STOP_CHOICES.length];
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTripError(err: unknown) {
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
  const [result, setResult] = useState<TripPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSession();
  const sessionUserId = user?.id ?? defaultBooking.userId;
  const [bookingForm, setBookingForm] = useState<BookingPayload>(() => ({ ...defaultBooking, userId: sessionUserId }));
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();
  const citizenName = user?.fullName ?? 'Utilisateur démo';

  const activeUserFilter = bookingForm.userId.trim();

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ['bookings', activeUserFilter || 'all'],
    queryFn: () =>
      http('/api/mobility/bookings', {
        searchParams: activeUserFilter ? { userId: activeUserFilter } : undefined,
      }),
  });

  const {
    data: lineSchedule,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery<Schedule>({
    queryKey: ['lineSchedule', bookingForm.lineId, scheduleDate],
    queryFn: () =>
      http(`/api/mobility/lines/${bookingForm.lineId}/schedule`, {
        searchParams: scheduleDate ? { date: scheduleDate } : undefined,
      }),
    enabled: Boolean(bookingForm.lineId),
  });

  const {
    data: stopArrivals,
    isLoading: arrivalsLoading,
    error: arrivalsError,
  } = useQuery<Arrival[]>({
    queryKey: ['stopArrivals', bookingForm.stopFrom],
    queryFn: () => http(`/api/mobility/stops/${bookingForm.stopFrom}/arrivals`),
    enabled: Boolean(bookingForm.stopFrom),
    refetchInterval: 60_000,
  });

  const bookingMutation = useMutation({
    mutationFn: (payload: BookingPayload) =>
      http<Booking>('/api/mobility/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (booking) => {
      setBookingMessage(`Réservation ${booking.id} confirmée (${booking.status}).`);
      queryClient.invalidateQueries({ queryKey: ['bookings', activeUserFilter || 'all'] });
      setBookingForm((prev) => ({ ...prev, datetime: '' }));
    },
    onError: (err: Error) => {
      setBookingMessage(err.message);
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = await http<TripPlanResponse>('/api/smartflow/trip-plan', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(payload);
    } catch (err) {
      setError(formatTripError(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
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

  return (
    <div className="trip-page">
      <section className="card trip-hero">
        <div>
          <p className="hero-eyebrow">SmartFlow</p>
          <h2>Planificateur multimodal SmartFlow</h2>
          <p className="muted">Simulez un parcours, choisissez le mode idéal et déclenchez une réservation instantanée.</p>
        </div>
        <div className="trip-hero__stats">
          <div>
            <span>Zone suivie</span>
            <strong>{zoneLabel}</strong>
          </div>
          <div>
            <span>Mode préféré</span>
            <strong>{modeLabel}</strong>
          </div>
          <div>
            <span>Arrêt source</span>
            <strong>{form.stopId || '—'}</strong>
          </div>
        </div>
      </section>

      <div className="grid two-columns trip-grid">
        <section className="card trip-config">
          <header className="trip-config__header">
            <div>
              <p className="hero-eyebrow">Configurer la simulation</p>
              <h3>Paramètres SmartFlow</h3>
            </div>
            <div className="trip-config__tags">
              <span className="chip">Données temps réel</span>
              <span className="chip">API orchestrateur</span>
            </div>
          </header>
          <form className="trip-config__form" onSubmit={handleSubmit}>
            <div className="trip-config__grid">
              <label>
                <span>Zone</span>
                <select
                  className="select"
                  value={form.zoneCode}
                  onChange={(event) => setForm((prev) => ({ ...prev, zoneCode: event.target.value }))}
                >
                  {ZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mode préféré</span>
                <select
                  className="select"
                  value={form.preferredMode}
                  onChange={(event) => setForm((prev) => ({ ...prev, preferredMode: event.target.value }))}
                >
                  {MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Arrêt (stopId)</span>
                <select
                  className="select"
                  value={form.stopId}
                  onChange={(event) => setForm((prev) => ({ ...prev, stopId: event.target.value }))}
                >
                  {STOP_CHOICES.map((stop) => (
                    <option key={stop} value={stop}>
                      {stop}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="trip-config__actions">
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Calcul en cours...' : 'Calculer le trajet'}
              </button>
              {error && <p className="form-error">{error}</p>}
            </div>
          </form>
        </section>

        <section className="card trip-result">
          <h3>Résultat</h3>
          {!result && <p>Lancer une simulation pour voir la recommandation.</p>}
          {result && (
            <div>
              <p>
                <strong>Mode recommandé :</strong> {result.recommendation.mode}
              </p>
              <p>{result.recommendation.reason}</p>
              <h4>Lignes disponibles</h4>
              <ul>
                {result.transport.lines.map((line) => (
                  <li key={line.id}>
                    {line.name} ({line.mode})
                  </li>
                ))}
              </ul>
              <h4>Arrivées</h4>
              <ul>
                {result.transport.arrivals.map((arrival) => (
                  <li key={`${arrival.lineId}-${arrival.etaMinutes}`}>
                    {arrival.lineId}: {arrival.etaMinutes} min
                  </li>
                ))}
              </ul>
              <small>Calculé le {new Date(result.timestamp).toLocaleTimeString()}</small>
            </div>
          )}
        </section>
      </div>

      <section className="card trip-schedule">
        <div className="trip-schedule__header" style={{ marginBottom: '16px' }}>
          <div>
            <p className="hero-eyebrow">Mobility REST</p>
            <h3>Horaires & arrivées</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Consultez les horaires complets d'une ligne pour une date donnée puis suivez les passages temps réel à votre arrêt.
            </p>
          </div>
        </div>
        <div className="trip-config__grid" style={{ marginBottom: '16px' }}>
          <label>
            <span>Ligne analysée</span>
            <select
              className="select"
              value={bookingForm.lineId}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, lineId: event.target.value }))}
            >
              <option value="">-- Sélectionner --</option>
              {(result?.transport.lines ?? []).map((line) => (
                <option key={`schedule-${line.id}`} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Date des horaires</span>
            <input
              type="date"
              className="input"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
          </label>
          <label>
            <span>Arrêt suivi</span>
            <select
              className="select"
              value={bookingForm.stopFrom}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, stopFrom: event.target.value as string }))}
            >
              {STOP_CHOICES.map((stop) => (
                <option key={`arrival-stop-${stop}`} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!bookingForm.lineId && <p className="muted">Sélectionnez une ligne pour afficher son planning.</p>}
        {bookingForm.lineId && (
          <div className="trip-schedule__content" style={{ display: 'grid', gap: '16px' }}>
            <div>
              <h4>Horaires détaillés ({scheduleDate || '—'})</h4>
              {scheduleLoading && <p>Chargement des horaires…</p>}
              {scheduleError && <p className="form-error">Impossible de charger les horaires.</p>}
              {lineSchedule && lineSchedule.trips.length === 0 && <p>Aucun trajet prévu pour cette date.</p>}
              {lineSchedule && lineSchedule.trips.length > 0 && (
                <ul className="trip-schedule__list">
                  {lineSchedule.trips.map((trip) => (
                    <li key={`${trip.departure}-${trip.arrival}`}>
                      <div>
                        <strong>
                          {formatTime(trip.departure)} → {formatTime(trip.arrival)}
                        </strong>
                      </div>
                      <small className="muted">
                        {trip.stops.map((stop) => `${stop.stopId} ${formatTime(stop.time)}`).join(' · ')}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4>Arrivées temps réel ({bookingForm.stopFrom})</h4>
              {arrivalsLoading && <p>Mise à jour des arrivées…</p>}
              {arrivalsError && <p className="form-error">Arrivées indisponibles pour le moment.</p>}
              {stopArrivals && stopArrivals.length === 0 && <p>Aucun passage annoncé.</p>}
              {stopArrivals && stopArrivals.length > 0 && (
                <ul>
                  {stopArrivals.map((arrival) => (
                    <li key={`arrival-${arrival.lineId}-${arrival.etaMinutes}`}>
                      {arrival.lineId} · {arrival.etaMinutes} min
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid two-columns trip-grid">
        <section className="card">
          <h3>Réserver un trajet</h3>
          <form className="form" onSubmit={handleBookingSubmit}>
            <label>
              Citoyen
              <input className="input" value={citizenName} disabled readOnly />
            </label>
            <input type="hidden" value={bookingForm.userId} readOnly />
            <label>
              Ligne
              <select
                className="select"
                value={bookingForm.lineId}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, lineId: event.target.value }))}
              >
                <option value="">-- Sélectionner --</option>
                {bookingOptions.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.mode})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Arrêt de départ
              <select
                className="select"
                value={bookingForm.stopFrom}
                onChange={(event) =>
                  setBookingForm((prev) => ({ ...prev, stopFrom: event.target.value as string }))
                }
              >
                {STOP_CHOICES.map((stop) => (
                  <option key={`stop-from-${stop}`} value={stop}>
                    {stop}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Arrêt d'arrivée
              <select
                className="select"
                value={bookingForm.stopTo}
                onChange={(event) =>
                  setBookingForm((prev) => ({ ...prev, stopTo: event.target.value as string }))
                }
              >
                {STOP_CHOICES.filter((stop) => stop !== bookingForm.stopFrom).map((stop) => (
                  <option key={`stop-to-${stop}`} value={stop}>
                    {stop}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date & heure (optionnel)
              <input
                type="datetime-local"
                className="input"
                value={bookingForm.datetime ?? ''}
                min={minBookingDate}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, datetime: event.target.value }))}
              />
            </label>
            <button className="button" type="submit" disabled={bookingMutation.isPending}>
              {bookingMutation.isPending ? 'Enregistrement...' : 'Réserver'}
            </button>
            {bookingMessage && <p style={{ color: bookingMessage.includes('confirmée') ? '#15803d' : '#dc2626' }}>{bookingMessage}</p>}
          </form>
        </section>
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3>Mes réservations</h3>
              <p className="muted">Filtrées sur : {citizenName}</p>
            </div>
            <button className="button secondary" type="button" onClick={() => refetchBookings()} disabled={bookingsLoading}>
              Rafraîchir
            </button>
          </div>
          {bookingsLoading && <p>Chargement des réservations...</p>}
          {!bookingsLoading && (!bookings || bookings.length === 0) && <p>Aucune réservation trouvée.</p>}
          {bookings && bookings.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Parcours</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.lineId}</td>
                    <td>
                      {booking.stopFrom} → {booking.stopTo}
                    </td>
                    <td>{new Date(booking.datetime).toLocaleString()}</td>
                    <td>{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      
    </div>
  );
}
