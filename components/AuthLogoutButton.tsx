"use client";

import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function AuthLogoutButton() {
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
    <button className="authFloatingLogout" onClick={logout} disabled={loading} title="Logout">
      <LogOut size={16} />
      <span>{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}
