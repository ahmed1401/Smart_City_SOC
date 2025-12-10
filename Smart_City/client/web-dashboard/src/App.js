import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsxs("div", { className: "auth-gate auth-gate--minimal", children: [_jsx("div", { className: "auth-gate__backdrop" }), _jsx("div", { style: {
                        minHeight: '100vh',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '32px',
                    }, children: _jsxs("div", { className: "auth-gate__panel", style: {
                            width: 'min(540px, 100%)',
                            background: 'rgba(7, 12, 24, 0.85)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            padding: '32px',
                            boxShadow: '0 20px 60px rgba(3,8,20,0.45)',
                        }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '24px' }, children: [_jsx("p", { className: "hero-eyebrow", children: "smart city interop" }), _jsx("h1", { style: { marginBottom: '8px' }, children: "Portail SOC" }), _jsx("p", { className: "muted", style: { margin: 0 }, children: "Acc\u00E9dez au centre de supervision pour suivre l\u2019air, la mobilit\u00E9 et les alertes citoyennes en un seul tableau." })] }), _jsx(AuthPanel, { variant: "hero" })] }) })] }));
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "sidebar__brand", children: [_jsxs("div", { children: [_jsx("p", { className: "hero-eyebrow", children: "smart city interop" }), _jsx("h1", { children: "Control Center" }), _jsx("p", { className: "muted", children: "AQI \u00B7 mobilit\u00E9 \u00B7 annuaire" })] }), _jsx(ThemeToggle, {})] }), _jsxs("nav", { className: "nav-links", children: [_jsxs(NavLink, { to: "/", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, end: true, children: [_jsx("span", { children: "Dashboard AQI" }), _jsx("small", { children: "Vue temps r\u00E9el" })] }), _jsxs(NavLink, { to: "/planner", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: [_jsx("span", { children: "Planificateur" }), _jsx("small", { children: "Trip multimodal" })] }), _jsxs(NavLink, { to: "/directory", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: [_jsx("span", { children: "Annuaire & Tickets" }), _jsx("small", { children: "GraphQL" })] }), _jsxs(NavLink, { to: "/alerts", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: [_jsx("span", { children: "Alertes temps r\u00E9el" }), _jsx("small", { children: "Polling 5s" })] }), _jsxs(NavLink, { to: "/services", className: ({ isActive }) => `nav-link${isActive ? ' active' : ''}`, children: [_jsx("span", { children: "Services & APIs" }), _jsx("small", { children: "Cartographie Kong" })] })] }), _jsxs("div", { className: "sidebar__panel", children: [_jsxs("div", { className: "sidebar__panel-header", children: [_jsx("p", { className: "hero-eyebrow", children: "Espace usager" }), _jsx("strong", { children: citizenName }), _jsx("small", { children: citizenIdentifier })] }), _jsx("p", { className: "muted", style: { marginBottom: '12px' }, children: "Gestion des acc\u00E8s, tokens API et r\u00E9servations synchronis\u00E9s \u00E0 chaque connexion." }), _jsx(AuthPanel, {})] })] }), _jsx("main", { className: "main-area", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/planner", element: _jsx(TripPlannerPage, {}) }), _jsx(Route, { path: "/directory", element: _jsx(DirectoryPage, {}) }), _jsx(Route, { path: "/alerts", element: _jsx(AlertsPage, {}) }), _jsx(Route, { path: "/services", element: _jsx(ServiceCatalogPage, {}) })] }) })] }));
}
