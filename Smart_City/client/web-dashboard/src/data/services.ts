export type EndpointProtocol = 'REST' | 'GraphQL' | 'SOAP' | 'gRPC' | 'SSE';

export type EndpointDefinition = {
  method: string;
  path: string;
  description: string;
  protocol: EndpointProtocol;
};

export type ServiceDefinition = {
  id: string;
  name: string;
  tagline: string;
  basePath: string;
  upstream: string;
  techStack: string;
  protocols: EndpointProtocol[];
  docs?: string;
  endpoints: EndpointDefinition[];
};

export const servicesCatalog: ServiceDefinition[] = [
  {
    id: 'smartflow',
    name: 'SmartFlow Orchestrator',
    tagline: 'Agrégation REST/SOAP/gRPC + cache Redis + SSE',
    basePath: '/api/smartflow',
    upstream: 'http://smartflow:7000',
    techStack: 'Node.js · Express · pino',
    protocols: ['REST', 'SSE'],
    docs: 'docs/description.md#smartflow-orchestrator',
    endpoints: [
      {
        method: 'GET',
        path: '/metrics/overview',
        description: 'AQI + lignes filtrées + ETA + 5 dernières alertes',
        protocol: 'REST',
      },
      {
        method: 'POST',
        path: '/trip-plan',
        description: 'Recommandation multimodale basée sur le niveau AQI et les préférences',
        protocol: 'REST',
      },
      {
        method: 'GET',
        path: '/alerts/recent',
        description: 'Alertes Emergency gRPC cache 50 entrées',
        protocol: 'REST',
      },
      {
        method: 'GET',
        path: '/alerts/stream',
        description: 'Flux SSE convertissant SubscribeAlerts gRPC',
        protocol: 'SSE',
      },
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility REST',
    tagline: 'Lignes, horaires, arrivées et réservations citoyennes',
    basePath: '/api/mobility',
    upstream: 'http://mobility-rest:8080/mobility/api',
    techStack: 'Spring Boot · Java 17',
    protocols: ['REST'],
    docs: 'docs/description.md#mobility-rest-servicesmobility-rest',
    endpoints: [
      {
        method: 'GET',
        path: '/lines?mode=&status=',
        description: 'Filtre sur mode (bus/tram/etc.) et statut opérationnel',
        protocol: 'REST',
      },
      {
        method: 'GET',
        path: '/lines/{id}',
        description: 'Détails d\'une ligne et arrêts associés',
        protocol: 'REST',
      },
      {
        method: 'GET',
        path: '/lines/{id}/schedule',
        description: 'Génère un planning (stop times + trips) à partir de now+5min',
        protocol: 'REST',
      },
      {
        method: 'GET',
        path: '/stops/{stopId}/arrivals',
        description: 'ETA simulé par arrêt avec jitter ±1 minute',
        protocol: 'REST',
      },
      {
        method: 'POST',
        path: '/bookings',
        description: 'Crée une réservation avec statut confirmed',
        protocol: 'REST',
      },
    ],
  },
  {
    id: 'directory',
    name: 'Directory Service',
    tagline: 'Annuaire municipal + tickets citoyens (GraphQL)',
    basePath: '/api/directory',
    upstream: 'http://directory-service:8082/graphql',
    techStack: 'Spring Boot · GraphQL',
    protocols: ['GraphQL'],
    docs: 'docs/description.md#directory-service-servicesdirectory-service',
    endpoints: [
      {
        method: 'Query',
        path: 'service(id)',
        description: 'Récupère un service par identifiant',
        protocol: 'GraphQL',
      },
      {
        method: 'Query',
        path: 'services(filter)',
        description: 'Filtre par catégorie ou texte plein',
        protocol: 'GraphQL',
      },
      {
        method: 'Query',
        path: 'tickets(filter)',
        description: 'Filtre par statut ou service',
        protocol: 'GraphQL',
      },
      {
        method: 'Mutation',
        path: 'createTicket(input)',
        description: 'Ajoute un ticket (status OPEN)',
        protocol: 'GraphQL',
      },
      {
        method: 'Mutation',
        path: 'closeTicket(id)',
        description: 'Met à jour le statut en CLOSED',
        protocol: 'GraphQL',
      },
    ],
  },
  {
    id: 'airquality',
    name: 'AirQuality SOAP',
    tagline: 'Rapports AQI et polluants (service SOAP)',
    basePath: '/api/airquality',
    upstream: 'http://airquality-soap:8081/airquality',
    techStack: 'Jakarta EE · JAX-WS',
    protocols: ['SOAP'],
    docs: 'docs/description.md#airquality-soap-servicesairquality-soap',
    endpoints: [
      {
        method: 'SOAP',
        path: 'GetAQI(zoneCode)',
        description: 'Retourne AQI, catégorie et recommandation',
        protocol: 'SOAP',
      },
      {
        method: 'SOAP',
        path: 'GetPollutants(zoneCode)',
        description: 'Liste les taux PM2.5/PM10/NO2 simulés',
        protocol: 'SOAP',
      },
      {
        method: 'SOAP',
        path: 'CompareZones(zoneA, zoneB)',
        description: 'Calcule delta AQI et zone la plus touchée',
        protocol: 'SOAP',
      },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency Service (gRPC)',
    tagline: 'Collecte et diffusion des alertes critiques',
    basePath: '/smartcity.emergency.EmergencyService',
    upstream: 'grpc://emergency-service:50051',
    techStack: 'Spring Boot · gRPC',
    protocols: ['gRPC'],
    docs: 'docs/description.md#emergency-service-servicesemergency-service',
    endpoints: [
      {
        method: 'Unary',
        path: 'SendAlert(Alert)',
        description: 'Enregistre une alerte et renvoie un Ack',
        protocol: 'gRPC',
      },
      {
        method: 'Unary',
        path: 'GetRecentAlerts(RecentRequest)',
        description: 'Retourne les alerts les plus récentes (limite 50)',
        protocol: 'gRPC',
      },
      {
        method: 'ServerStream',
        path: 'SubscribeAlerts(AlertFilter)',
        description: 'Flux streaming filtré par type/zone/severity',
        protocol: 'gRPC',
      },
    ],
  },
];

export const totalEndpointCount = servicesCatalog.reduce((total, service) => total + service.endpoints.length, 0);

export const protocolFilters = Array.from(
  new Set(servicesCatalog.flatMap((service) => service.protocols)),
).sort() as EndpointProtocol[];
