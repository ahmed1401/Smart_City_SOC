import { FormEvent, useEffect, useMemo, useState } from 'react';

import { graphQL } from '../api/http';
import { useSession } from '../context/SessionContext';

type Service = {
  id: string;
  name: string;
  category: string;
  contact: { phone?: string; email?: string };
  hours: { day: string; open: string; close: string }[];
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  citizenId: string;
  updatedAt: string;
  service: { name: string };
};

const servicesQuery = `
  query Services($filter: ServiceFilter) {
    services(filter: $filter) {
      id
      name
      category
      contact { phone email }
      hours { day open close }
    }
  }
`;

const ticketsQuery = `
  query Tickets($filter: TicketFilter) {
    tickets(filter: $filter) {
      id
      subject
      status
      priority
      citizenId
      updatedAt
      service { name }
    }
  }
`;

const createTicketMutation = `
  mutation CreateTicket($input: TicketInput!) {
    createTicket(input: $input) {
      id
      subject
      status
      priority
      citizenId
      updatedAt
      service { name }
    }
  }
`;

export function DirectoryPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingTickets, setRefreshingTickets] = useState(false);
  const { user } = useSession();
  const citizenId = user?.id ?? 'citizen-app-user';
  const citizenName = user?.fullName ?? 'Utilisateur démo';
  const [form, setForm] = useState({
    subject: '',
    description: '',
    serviceId: '',
    priority: 'MEDIUM',
    citizenId,
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        const [svcResult, ticketResult] = await Promise.all([
          graphQL<{ services: Service[] }>(servicesQuery, {}),
          graphQL<{ tickets: Ticket[] }>(ticketsQuery, { filter: { citizenId } }),
        ]);
        setServices(svcResult.services);
        setForm((prev) => ({ ...prev, serviceId: svcResult.services[0]?.id ?? '', citizenId }));
        setTickets(ticketResult.tickets);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [citizenId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await graphQL<{ createTicket: Ticket }>(createTicketMutation, { input: { ...form, citizenId } });
      setTickets((prev) => [response.createTicket, ...prev]);
      setForm((prev) => ({ ...prev, subject: '', description: '' }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshTickets() {
    setRefreshingTickets(true);
    try {
      const ticketResult = await graphQL<{ tickets: Ticket[] }>(ticketsQuery, { filter: { citizenId } });
      setTickets(ticketResult.tickets);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshingTickets(false);
    }
  }

  const ticketStats = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;
        if (ticket.status === 'OPEN') acc.open += 1;
        if (ticket.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (ticket.status === 'CLOSED') acc.closed += 1;
        return acc;
      },
      { total: 0, open: 0, inProgress: 0, closed: 0 }
    );
  }, [tickets]);

  const categoryCount = useMemo(() => new Set(services.map((svc) => svc.category)).size, [services]);

  const lastTicketUpdate = useMemo(() => {
    if (tickets.length === 0) {
      return null;
    }
    return tickets.reduce<string | null>((latest, ticket) => {
      if (!latest) {
        return ticket.updatedAt;
      }
      return new Date(ticket.updatedAt).getTime() > new Date(latest).getTime() ? ticket.updatedAt : latest;
    }, null);
  }, [tickets]);

  const lastTicketLabel = lastTicketUpdate ? new Date(lastTicketUpdate).toLocaleString() : '—';

  return (
    <div className="directory-page">
      <section className="card directory-hero">
        <div>
          <p className="hero-eyebrow">GraphQL · Citizen Ops</p>
          <h2>Annuaire & tickets citoyens</h2>
          <p className="muted">
            Gestion centralisée des services municipaux et de vos tickets personnels, filtrés automatiquement sur votre profil citoyen.
          </p>
        </div>
        <div className="directory-hero__stats">
          <div>
            <span>Citoyen</span>
            <strong>{citizenName}</strong>
            <small>{citizenId}</small>
          </div>
          <div>
            <span>Services référencés</span>
            <strong>{services.length || '—'}</strong>
            <small>{categoryCount} domaines</small>
          </div>
          <div>
            <span>Tickets ouverts</span>
            <strong>{ticketStats.open}</strong>
            <small>{ticketStats.inProgress} en cours</small>
          </div>
        </div>
      </section>

      {loading && <p className="muted">Chargement des données GraphQL…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid two-columns directory-grid">
        <section className="card directory-form">
          <header>
            <p className="hero-eyebrow">Créer un ticket</p>
            <h3>Demande citoyenne</h3>
          </header>
          <form className="directory-form__form" onSubmit={handleSubmit}>
            <div className="directory-form__grid">
              <label>
                <span>Sujet</span>
                <input className="input" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              </label>
              <label>
                <span>Priorité</span>
                <select className="select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="CRITICAL">Critique</option>
                </select>
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              <span>Service concerné</span>
              <select className="select" value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" type="submit">
              Enregistrer le ticket
            </button>
          </form>
        </section>

        <section className="card directory-tickets">
          <div className="directory-tickets__header">
            <div>
              <p className="hero-eyebrow">Tickets récents</p>
              <h3>Filtrés sur {citizenName}</h3>
              <p className="muted">Dernière mise à jour : {lastTicketLabel}</p>
            </div>
            <button className="button secondary" type="button" onClick={refreshTickets} disabled={refreshingTickets}>
              {refreshingTickets ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
          <div className="directory-tickets__meta">
            <div>
              <span>Ouverts</span>
              <strong>{ticketStats.open}</strong>
            </div>
            <div>
              <span>En cours</span>
              <strong>{ticketStats.inProgress}</strong>
            </div>
            <div>
              <span>Clôturés</span>
              <strong>{ticketStats.closed}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{ticketStats.total}</strong>
            </div>
          </div>
          <div className="directory-table-wrapper">
            {tickets.length === 0 ? (
              <p className="muted">Aucun ticket enregistré pour cet identifiant.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Sujet</th>
                    <th>Service</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.subject}</td>
                      <td>{ticket.service.name}</td>
                      <td>
                        <span className={`ticket-badge ticket-badge--${ticket.status.toLowerCase()}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-chip priority-chip--${ticket.priority.toLowerCase()}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>{new Date(ticket.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className="card directory-services">
        <header>
          <p className="hero-eyebrow">Services municipaux</p>
          <h3>Référentiel Annuaire</h3>
        </header>
        <ul className="directory-services__list">
          {services.map((service) => (
            <li key={service.id} className="directory-service">
              <div className="directory-service__header">
                <strong>{service.name}</strong>
                <span className="chip">{service.category}</span>
              </div>
              <div className="directory-service__body">
                <span>Contact :</span>
                <p>{service.contact.email ?? service.contact.phone ?? 'N/A'}</p>
              </div>
              <small>
                Horaires : {service.hours.map((hour) => `${hour.day} ${hour.open}-${hour.close}`).join(', ')}
              </small>
            </li>
          ))}
          {!services.length && <li className="muted">Aucun service disponible.</li>}
        </ul>
      </section>
    </div>
  );
}
