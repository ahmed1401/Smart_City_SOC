import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { graphQL } from '../api/http';
import { useSession } from '../context/SessionContext';
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
    const [services, setServices] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                    graphQL(servicesQuery, {}),
                    graphQL(ticketsQuery, { filter: { citizenId } }),
                ]);
                setServices(svcResult.services);
                setForm((prev) => ({ ...prev, serviceId: svcResult.services[0]?.id ?? '', citizenId }));
                setTickets(ticketResult.tickets);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        bootstrap();
    }, [citizenId]);
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        try {
            const response = await graphQL(createTicketMutation, { input: { ...form, citizenId } });
            setTickets((prev) => [response.createTicket, ...prev]);
            setForm((prev) => ({ ...prev, subject: '', description: '' }));
        }
        catch (err) {
            setError(err.message);
        }
    }
    async function refreshTickets() {
        setRefreshingTickets(true);
        try {
            const ticketResult = await graphQL(ticketsQuery, { filter: { citizenId } });
            setTickets(ticketResult.tickets);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setRefreshingTickets(false);
        }
    }
    const ticketStats = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            acc.total += 1;
            if (ticket.status === 'OPEN')
                acc.open += 1;
            if (ticket.status === 'IN_PROGRESS')
                acc.inProgress += 1;
            if (ticket.status === 'CLOSED')
                acc.closed += 1;
            return acc;
        }, { total: 0, open: 0, inProgress: 0, closed: 0 });
    }, [tickets]);
    const categoryCount = useMemo(() => new Set(services.map((svc) => svc.category)).size, [services]);
    const lastTicketUpdate = useMemo(() => {
        if (tickets.length === 0) {
            return null;
        }
        return tickets.reduce((latest, ticket) => {
            if (!latest) {
                return ticket.updatedAt;
            }
            return new Date(ticket.updatedAt).getTime() > new Date(latest).getTime() ? ticket.updatedAt : latest;
        }, null);
    }, [tickets]);
    const lastTicketLabel = lastTicketUpdate ? new Date(lastTicketUpdate).toLocaleString() : '—';
    return (_jsxs("div", { className: "directory-page", children: [_jsxs("section", { className: "card directory-hero", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "GraphQL \u00B7 Citizen Ops" }), _jsx("h2", { children: "Annuaire & tickets citoyens" }), _jsx("p", { className: "muted", children: "Gestion centralis\u00E9e des services municipaux et de vos tickets personnels, filtr\u00E9s automatiquement sur votre profil citoyen." })] }), _jsxs("div", { className: "directory-hero__stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Citoyen" }), _jsx("strong", { children: citizenName }), _jsx("small", { children: citizenId })] }), _jsxs("div", { children: [_jsx("span", { children: "Services r\u00E9f\u00E9renc\u00E9s" }), _jsx("strong", { children: services.length || '—' }), _jsxs("small", { children: [categoryCount, " domaines"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Tickets ouverts" }), _jsx("strong", { children: ticketStats.open }), _jsxs("small", { children: [ticketStats.inProgress, " en cours"] })] })] })] }), loading && _jsx("p", { className: "muted", children: "Chargement des donn\u00E9es GraphQL\u2026" }), error && _jsx("p", { className: "form-error", children: error }), _jsxs("div", { className: "grid two-columns directory-grid", children: [_jsxs("section", { className: "card directory-form", children: [_jsxs("header", { children: [_jsx("p", { className: "hero-eyebrow", children: "Cr\u00E9er un ticket" }), _jsx("h3", { children: "Demande citoyenne" })] }), _jsxs("form", { className: "directory-form__form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "directory-form__grid", children: [_jsxs("label", { children: [_jsx("span", { children: "Sujet" }), _jsx("input", { className: "input", value: form.subject, onChange: (event) => setForm({ ...form, subject: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "Priorit\u00E9" }), _jsxs("select", { className: "select", value: form.priority, onChange: (event) => setForm({ ...form, priority: event.target.value }), children: [_jsx("option", { value: "LOW", children: "Basse" }), _jsx("option", { value: "MEDIUM", children: "Moyenne" }), _jsx("option", { value: "HIGH", children: "Haute" }), _jsx("option", { value: "CRITICAL", children: "Critique" })] })] })] }), _jsxs("label", { children: [_jsx("span", { children: "Description" }), _jsx("textarea", { className: "textarea", value: form.description, onChange: (event) => setForm({ ...form, description: event.target.value }) })] }), _jsxs("label", { children: [_jsx("span", { children: "Service concern\u00E9" }), _jsx("select", { className: "select", value: form.serviceId, onChange: (event) => setForm({ ...form, serviceId: event.target.value }), children: services.map((service) => (_jsx("option", { value: service.id, children: service.name }, service.id))) })] }), _jsx("button", { className: "button", type: "submit", children: "Enregistrer le ticket" })] })] }), _jsxs("section", { className: "card directory-tickets", children: [_jsxs("div", { className: "directory-tickets__header", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "Tickets r\u00E9cents" }), _jsxs("h3", { children: ["Filtr\u00E9s sur ", citizenName] }), _jsxs("p", { className: "muted", children: ["Derni\u00E8re mise \u00E0 jour : ", lastTicketLabel] })] }), _jsx("button", { className: "button secondary", type: "button", onClick: refreshTickets, disabled: refreshingTickets, children: refreshingTickets ? 'Actualisation…' : 'Actualiser' })] }), _jsxs("div", { className: "directory-tickets__meta", children: [_jsxs("div", { children: [_jsx("span", { children: "Ouverts" }), _jsx("strong", { children: ticketStats.open })] }), _jsxs("div", { children: [_jsx("span", { children: "En cours" }), _jsx("strong", { children: ticketStats.inProgress })] }), _jsxs("div", { children: [_jsx("span", { children: "Cl\u00F4tur\u00E9s" }), _jsx("strong", { children: ticketStats.closed })] }), _jsxs("div", { children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: ticketStats.total })] })] }), _jsx("div", { className: "directory-table-wrapper", children: tickets.length === 0 ? (_jsx("p", { className: "muted", children: "Aucun ticket enregistr\u00E9 pour cet identifiant." })) : (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Sujet" }), _jsx("th", { children: "Service" }), _jsx("th", { children: "Statut" }), _jsx("th", { children: "Priorit\u00E9" }), _jsx("th", { children: "Mise \u00E0 jour" })] }) }), _jsx("tbody", { children: tickets.map((ticket) => (_jsxs("tr", { children: [_jsx("td", { children: ticket.subject }), _jsx("td", { children: ticket.service.name }), _jsx("td", { children: _jsx("span", { className: `ticket-badge ticket-badge--${ticket.status.toLowerCase()}`, children: ticket.status.replace(/_/g, ' ') }) }), _jsx("td", { children: _jsx("span", { className: `priority-chip priority-chip--${ticket.priority.toLowerCase()}`, children: ticket.priority }) }), _jsx("td", { children: new Date(ticket.updatedAt).toLocaleString() })] }, ticket.id))) })] })) })] })] }), _jsxs("section", { className: "card directory-services", children: [_jsxs("header", { children: [_jsx("p", { className: "hero-eyebrow", children: "Services municipaux" }), _jsx("h3", { children: "R\u00E9f\u00E9rentiel Annuaire" })] }), _jsxs("ul", { className: "directory-services__list", children: [services.map((service) => (_jsxs("li", { className: "directory-service", children: [_jsxs("div", { className: "directory-service__header", children: [_jsx("strong", { children: service.name }), _jsx("span", { className: "chip", children: service.category })] }), _jsxs("div", { className: "directory-service__body", children: [_jsx("span", { children: "Contact :" }), _jsx("p", { children: service.contact.email ?? service.contact.phone ?? 'N/A' })] }), _jsxs("small", { children: ["Horaires : ", service.hours.map((hour) => `${hour.day} ${hour.open}-${hour.close}`).join(', ')] })] }, service.id))), !services.length && _jsx("li", { className: "muted", children: "Aucun service disponible." })] })] })] }));
}
