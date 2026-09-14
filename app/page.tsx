import { cookies } from 'next/headers';
import PosApp from '@/components/pos/PosApp';
import AuthLogoutButton from '@/components/AuthLogoutButton';
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const user: SessionUser = (await verifySessionToken(session)) || { username: 'local', role: 'admin' };

  return <>
    <AuthLogoutButton user={user} />
    <PosApp currentUser={user} />
  </>;
}
