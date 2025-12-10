import { FormEvent, useState } from 'react';

import { useSession } from '../context/SessionContext';

type Mode = 'login' | 'register';

const initialForm = { fullName: '', email: '', password: '' };

const MODE_CONTENT: Record<Mode, { eyebrow: string; title: string; description: string }> = {
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

type AuthPanelProps = {
  variant?: 'sidebar' | 'hero';
};

export function AuthPanel({ variant = 'sidebar' }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, login, register, logout } = useSession();

  function resetFeedback() {
    setMessage('');
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      if (mode === 'login') {
        login({ email: form.email.trim().toLowerCase(), password: form.password });
        setMessage('Connexion réussie. Vos en-têtes sont injectés automatiquement.');
      } else {
        register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
        setMessage('Compte créé, vous êtes connecté.');
      }
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'opérer l'action demandée");
    } finally {
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
    return (
      <div className={containerClass}>
        <p className="hero-eyebrow">Session active</p>
        {isHero ? <h2>{user.fullName}</h2> : <h4>{user.fullName}</h4>}
        <p className="muted" style={{ marginBottom: '8px' }}>{user.email}</p>
        {user.lastLoginAt && <small>Dernière connexion {new Date(user.lastLoginAt).toLocaleString()}</small>}
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '12px' }}>
          Les clés API/JWT de démonstration sont injectées automatiquement.
        </p>
        <button className="button secondary" type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
        {message && <small style={{ color: '#22c55e', marginTop: '8px' }}>{message}</small>}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="session-tabs" role="tablist" aria-label="Modes d’authentification">
        {(
          [
            { label: 'Connexion', value: 'login' },
            { label: 'Créer un compte', value: 'register' },
          ] as { label: string; value: Mode }[]
        ).map((tab) => (
          <button
            key={tab.value}
            className={`session-tab ${mode === tab.value ? 'active' : ''}`}
            onClick={() => {
              setMode(tab.value);
              resetFeedback();
            }}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="auth-panel__intro">
        <p className="hero-eyebrow">{modeCopy.eyebrow}</p>
        <h3>{modeCopy.title}</h3>
        <p className="muted" style={{ marginBottom: '12px' }}>{modeCopy.description}</p>
      </div>

      {!isHero && (
        <div
          className="auth-panel__callout"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <small className="hero-eyebrow">Accès démo</small>
            <strong>{DEMO_ACCOUNT.email}</strong>
            <small>Mot de passe : {DEMO_ACCOUNT.password}</small>
          </div>
          <button className="button secondary" type="button" onClick={applyDemoCredentials} disabled={busy}>
            Utiliser
          </button>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Nom complet
            <input
              className="input"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ex. Léa Martin"
              required
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="vous@example.com"
            required
            autoComplete="email"
          />
        </label>
        <label>
          Mot de passe
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
        </button>
      </form>
      <p className="muted" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
        Vos identifiants sont chiffrés côté navigateur avant de transiter vers Kong.
      </p>
      <div aria-live="polite" className="session-feedback" style={{ minHeight: '24px' }}>
        {error && <small style={{ color: '#f87171' }}>{error}</small>}
        {!error && message && <small style={{ color: '#22c55e' }}>{message}</small>}
      </div>
    </div>
  );
}
