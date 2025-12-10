import { getDefaultAuthState, persistAuthState } from './auth';

export const USERS_STORAGE_KEY = 'smartcity_users';
export const SESSION_STORAGE_KEY = 'smartcity_session';

const autoSessionEnabled = (import.meta.env.VITE_AUTO_SESSION ?? '1') !== '0';
const demoUserProfile = {
  id: 'demo-citizen-operator',
  fullName: 'Cheffe Opérations SOC',
  email: 'citizen@app.local',
  password: 'Passw0rd!'
};

type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type SessionUser = Pick<StoredUser, 'id' | 'fullName' | 'email'> & { lastLoginAt?: string };

type Credentials = { email: string; password: string };

type RegistrationPayload = {
  fullName: string;
  email: string;
  password: string;
};

function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    lastLoginAt: user.lastLoginAt,
  };
}

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StoredUser[]) : [];
}

function saveUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function persistSession(user: SessionUser | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function getCurrentSession(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

function ensureDemoUser(users: StoredUser[]): StoredUser {
  const normalizedEmail = demoUserProfile.email.toLowerCase();
  let user = users.find((candidate) => candidate.email === normalizedEmail);

  if (!user) {
    user = {
      id: demoUserProfile.id,
      fullName: demoUserProfile.fullName,
      email: normalizedEmail,
      password: demoUserProfile.password,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.push(user);
  } else if (!user.lastLoginAt) {
    user.lastLoginAt = new Date().toISOString();
  }

  return user;
}

export function bootstrapDemoSession(): SessionUser | null {
  if (!autoSessionEnabled || typeof window === 'undefined') {
    return null;
  }

  const users = readUsers();
  const demoUser = ensureDemoUser(users);
  saveUsers(users);
  const sessionUser = toSessionUser(demoUser);
  persistSession(sessionUser);
  persistAuthState(getDefaultAuthState());
  return sessionUser;
}

export function registerUser(payload: RegistrationPayload): SessionUser {
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error('Un compte existe déjà avec cet e-mail.');
  }
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  const sessionUser = toSessionUser(newUser);
  persistSession(sessionUser);
  persistAuthState(getDefaultAuthState());
  return sessionUser;
}

export function loginUser(credentials: Credentials): SessionUser {
  const users = readUsers();
  const user = users.find((candidate) => candidate.email === credentials.email.toLowerCase());
  if (!user || user.password !== credentials.password) {
    throw new Error('Identifiants invalides.');
  }
  user.lastLoginAt = new Date().toISOString();
  saveUsers(users);
  const sessionUser = toSessionUser(user);
  persistSession(sessionUser);
  persistAuthState(getDefaultAuthState());
  return sessionUser;
}

export function logoutUser() {
  persistSession(null);
}