import PosApp from '@/components/pos/PosApp';
import AuthLogoutButton from '@/components/AuthLogoutButton';

export default function Home() {
  return <>
    <AuthLogoutButton />
    <PosApp />
  </>;
}
