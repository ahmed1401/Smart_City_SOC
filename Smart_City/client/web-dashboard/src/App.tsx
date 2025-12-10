import { NavLink, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { AlertsPage } from './pages/AlertsPage';
import { ServiceCatalogPage } from './pages/ServiceCatalogPage';
import { AuthPanel } from './components/AuthPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { useSession } from './context/SessionContext';

export default function App() {
  const { user } = useSession();
  const citizenName = user?.fullName ?? user?.email ?? 'Utilisateur démo';
  const citizenIdentifier = user?.id ?? 'citizen-app-user';

  if (!user) {
    return (
      <div className="auth-gate auth-gate--minimal">
        <div className="auth-gate__backdrop" />
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '32px',
          }}
        >
          <div
            className="auth-gate__panel"
            style={{
              width: 'min(540px, 100%)',
              background: 'rgba(7, 12, 24, 0.85)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(3,8,20,0.45)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="hero-eyebrow">smart city interop</p>
              <h1 style={{ marginBottom: '8px' }}>Portail SOC</h1>
              <p className="muted" style={{ margin: 0 }}>
                Accédez au centre de supervision pour suivre l’air, la mobilité et les alertes citoyennes en un seul
                tableau.
              </p>
            </div>
            <AuthPanel variant="hero" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div>
            <p className="hero-eyebrow">smart city interop</p>
            <h1>Control Center</h1>
            <p className="muted">AQI · mobilité · annuaire</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            <span>Dashboard AQI</span>
            <small>Vue temps réel</small>
          </NavLink>
          <NavLink to="/planner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>Planificateur</span>
            <small>Trip multimodal</small>
          </NavLink>
          <NavLink to="/directory" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>Annuaire & Tickets</span>
            <small>GraphQL</small>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>Alertes temps réel</span>
            <small>Polling 5s</small>
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>Services & APIs</span>
            <small>Cartographie Kong</small>
          </NavLink>
        </nav>
        <div className="sidebar__panel">
          <div className="sidebar__panel-header">
            <p className="hero-eyebrow">Espace usager</p>
            <strong>{citizenName}</strong>
            <small>{citizenIdentifier}</small>
          </div>
          <p className="muted" style={{ marginBottom: '12px' }}>
            Gestion des accès, tokens API et réservations synchronisés à chaque connexion.
          </p>
          <AuthPanel />
        </div>
      </aside>
      <main className="main-area">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/planner" element={<TripPlannerPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/services" element={<ServiceCatalogPage />} />
        </Routes>
      </main>
    </div>
  );
}
