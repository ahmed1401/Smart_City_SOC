const API_KEY_STORAGE = 'smartcity_api_key';
const JWT_STORAGE = 'smartcity_jwt';

// Long-lived JWT signed with the citizen secret so demo users see data without manual steps.
const DEFAULT_CITIZEN_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjaXRpemVuLWFwcCIsImV4cCI6MTg5MzQ1NjAwMH0.OTeecNtCYb7hbOKxemMCYYzrQIzUxieFLfKaLdLeGuI';

const fallbackApiKey = (import.meta.env.VITE_GATEWAY_API_KEY ?? 'citizen-api-key').trim();
const fallbackJwtFromEnv = (import.meta.env.VITE_GATEWAY_JWT ?? DEFAULT_CITIZEN_JWT).trim();

const fallbackAuth = {
  apiKey: fallbackApiKey,
  jwt: sanitizeJwt(fallbackJwtFromEnv, fallbackJwtFromEnv),
};

export function getDefaultAuthState(): AuthState {
  return { ...fallbackAuth };
}

export type AuthState = { apiKey: string; jwt: string };

export function readAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return fallbackAuth;
  }
  return {
    apiKey: sanitizeApiKey(window.localStorage.getItem(API_KEY_STORAGE)),
    jwt: sanitizeJwt(window.localStorage.getItem(JWT_STORAGE)),
  };
}

export function persistAuthState(state: AuthState) {
  if (typeof window === 'undefined') {
    return;
  }
  const apiKey = sanitizeApiKey(state.apiKey);
  const jwt = sanitizeJwt(state.jwt);
  window.localStorage.setItem(API_KEY_STORAGE, apiKey);
  window.localStorage.setItem(JWT_STORAGE, jwt);
  document.cookie = `gateway_token=${jwt}; path=/; max-age=604800`; // allow SSE/cookie auth fallback
}

function sanitizeApiKey(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallbackApiKey;
}

function sanitizeJwt(value?: string | null, fallback = fallbackAuth.jwt) {
  if (!value) {
    return fallback;
  }
  let normalized = value.trim();
  if (normalized.toLowerCase().startsWith('bearer ')) {
    normalized = normalized.slice(7).trim();
  }
  if (!looksLikeJwt(normalized)) {
    return fallback;
  }
  return normalized.length > 0 ? normalized : fallback;
}

function looksLikeJwt(token: string) {
  return token.split('.').length === 3;
}
