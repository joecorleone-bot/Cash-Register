export const SESSION_COOKIE = 'squishy_pos_session';
export type UserRole = 'admin' | 'cashier';
export type SessionUser = { username: string; role: UserRole };

type SessionPayload = SessionUser & { exp: number };

const SESSION_HOURS = 12;

function authSecret() {
  return process.env.AUTH_SECRET || [
    process.env.ADMIN_PASSWORD,
    process.env.CASHIER_PASSWORD,
    process.env.SITE_PASSWORD,
    'squishy-pos-auth-v2',
  ].filter(Boolean).join(':');
}

function configuredAccounts() {
  return [
    {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || process.env.SITE_PASSWORD || '',
      role: 'admin' as const,
    },
    {
      username: process.env.CASHIER_USERNAME || 'cashier',
      password: process.env.CASHIER_PASSWORD || '',
      role: 'cashier' as const,
    },
  ].filter((account) => Boolean(account.password));
}

export function authEnabled() {
  return configuredAccounts().length > 0;
}

export function authenticateUser(username: string, password: string): SessionUser | null {
  const normalized = username.trim().toLowerCase();
  const account = configuredAccounts().find(
    (item) => item.username.trim().toLowerCase() === normalized && item.password === password,
  );
  return account ? { username: account.username, role: account.role } : null;
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${await sign(encoded)}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || signature !== await sign(encoded)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as SessionPayload;
    if (!payload.username || !['admin', 'cashier'].includes(payload.role) || !payload.exp || payload.exp < Date.now()) return null;
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_HOURS * 60 * 60;
