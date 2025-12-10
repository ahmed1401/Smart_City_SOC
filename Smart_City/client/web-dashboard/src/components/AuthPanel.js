import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSession } from '../context/SessionContext';
const initialForm = { fullName: '', email: '', password: '' };
const MODE_CONTENT = {
    login: {
        eyebrow: 'Connexion instantanée',
        title: 'Reprenez votre session SOC',
        description: 'Vos clés API, tickets et réservations sont automatiquement resynchronisés après connexion.',
    },
    register: {
        eyebrow: 'Créer un accès',
        title: 'Ouvrez un profil citoyen',
        description: 'Un compte dédié active un identifiant citoyen isolé pour tester l’écosystème SmartFlow.',
    },
};
const DEMO_ACCOUNT = {
    fullName: 'Compte Démo SOC',
    email: 'demo@soc.local',
    password: 'soc-demo',
};
export function AuthPanel({ variant = 'sidebar' }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const { user, login, register, logout } = useSession();
    function resetFeedback() {
        setMessage('');
        setError('');
    }
    function handleSubmit(event) {
        event.preventDefault();
        resetFeedback();
        setBusy(true);
        try {
            if (mode === 'login') {
                login({ email: form.email.trim().toLowerCase(), password: form.password });
                setMessage('Connexion réussie. Vos en-têtes sont injectés automatiquement.');
            }
            else {
                register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
                setMessage('Compte créé, vous êtes connecté.');
            }
            setForm(initialForm);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'opérer l'action demandée");
        }
        finally {
            setBusy(false);
        }
    }
    function applyDemoCredentials() {
        resetFeedback();
        setMode('login');
        setForm({
            fullName: DEMO_ACCOUNT.fullName,
            email: DEMO_ACCOUNT.email,
            password: DEMO_ACCOUNT.password,
        });
        setMessage('Identifiants de démonstration pré-remplis. Validez pour vous connecter.');
    }
    function handleLogout() {
        logout();
        setMessage('Déconnecté. Les appels restent bloqués tant que vous ne vous reconnectez pas.');
    }
    const containerClass = `session-card${variant === 'hero' ? ' session-card--hero' : ''}`;
    const isHero = variant === 'hero';
    const modeCopy = MODE_CONTENT[mode];
    if (user) {
        return (_jsxs("div", { className: containerClass, children: [_jsx("p", { className: "hero-eyebrow", children: "Session active" }), isHero ? _jsx("h2", { children: user.fullName }) : _jsx("h4", { children: user.fullName }), _jsx("p", { className: "muted", style: { marginBottom: '8px' }, children: user.email }), user.lastLoginAt && _jsxs("small", { children: ["Derni\u00E8re connexion ", new Date(user.lastLoginAt).toLocaleString()] }), _jsx("p", { className: "muted", style: { fontSize: '0.8rem', marginTop: '12px' }, children: "Les cl\u00E9s API/JWT de d\u00E9monstration sont inject\u00E9es automatiquement." }), _jsx("button", { className: "button secondary", type: "button", onClick: handleLogout, children: "Se d\u00E9connecter" }), message && _jsx("small", { style: { color: '#22c55e', marginTop: '8px' }, children: message })] }));
    }
    return (_jsxs("div", { className: containerClass, children: [_jsx("div", { className: "session-tabs", role: "tablist", "aria-label": "Modes d\u2019authentification", children: [
                    { label: 'Connexion', value: 'login' },
                    { label: 'Créer un compte', value: 'register' },
                ].map((tab) => (_jsx("button", { className: `session-tab ${mode === tab.value ? 'active' : ''}`, onClick: () => {
                        setMode(tab.value);
                        resetFeedback();
                    }, type: "button", role: "tab", "aria-selected": mode === tab.value, children: tab.label }, tab.value))) }), _jsxs("div", { className: "auth-panel__intro", children: [_jsx("p", { className: "hero-eyebrow", children: modeCopy.eyebrow }), _jsx("h3", { children: modeCopy.title }), _jsx("p", { className: "muted", style: { marginBottom: '12px' }, children: modeCopy.description })] }), !isHero && (_jsxs("div", { className: "auth-panel__callout", style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                }, children: [_jsxs("div", { children: [_jsx("small", { className: "hero-eyebrow", children: "Acc\u00E8s d\u00E9mo" }), _jsx("strong", { children: DEMO_ACCOUNT.email }), _jsxs("small", { children: ["Mot de passe : ", DEMO_ACCOUNT.password] })] }), _jsx("button", { className: "button secondary", type: "button", onClick: applyDemoCredentials, disabled: busy, children: "Utiliser" })] })), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [mode === 'register' && (_jsxs("label", { children: ["Nom complet", _jsx("input", { className: "input", value: form.fullName, onChange: (event) => setForm((prev) => ({ ...prev, fullName: event.target.value })), placeholder: "Ex. L\u00E9a Martin", required: true, autoComplete: "name" })] })), _jsxs("label", { children: ["Email", _jsx("input", { className: "input", type: "email", value: form.email, onChange: (event) => setForm((prev) => ({ ...prev, email: event.target.value })), placeholder: "vous@example.com", required: true, autoComplete: "email" })] }), _jsxs("label", { children: ["Mot de passe", _jsx("input", { className: "input", type: "password", value: form.password, onChange: (event) => setForm((prev) => ({ ...prev, password: event.target.value })), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6, autoComplete: mode === 'login' ? 'current-password' : 'new-password' })] }), _jsx("button", { className: "button", type: "submit", disabled: busy, children: busy ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer le compte' })] }), _jsx("p", { className: "muted", style: { fontSize: '0.75rem', marginTop: '8px' }, children: "Vos identifiants sont chiffr\u00E9s c\u00F4t\u00E9 navigateur avant de transiter vers Kong." }), _jsxs("div", { "aria-live": "polite", className: "session-feedback", style: { minHeight: '24px' }, children: [error && _jsx("small", { style: { color: '#f87171' }, children: error }), !error && message && _jsx("small", { style: { color: '#22c55e' }, children: message })] })] }));
}
