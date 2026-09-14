"use client";

import { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';

export default function AuthLogoutButton({ user }: { user: SessionUser }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    try {
      setLoading(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <div className="authFloatingUser">
      <div className="authUserIdentity"><ShieldCheck size={16} /><span><b>{user.username}</b><small>{user.role}</small></span></div>
      <button className="authFloatingLogout" onClick={logout} disabled={loading} title="Logout"><LogOut size={16} /><span>{loading ? 'Logging out...' : 'Logout'}</span></button>
    </div>
  );
}
