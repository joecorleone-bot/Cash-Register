const SESSION_COOKIE = 'squishy_pos_session';
const SESSION_SALT = 'squishy-pos-v1';

export { SESSION_COOKIE };

export async function sessionToken(password: string) {
  const data = new TextEncoder().encode(`${SESSION_SALT}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
