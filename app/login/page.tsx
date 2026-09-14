"use client";

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!password || loading) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login gagal.');
      window.location.href = '/';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="authLogo"><Sparkles size={26} /></div>
        <span className="authEyebrow">SQUISHY TOY POS</span>
        <h1>Welcome back</h1>
        <p>Enter your access password to open the sales workspace.</p>

        <form onSubmit={login} className="authForm">
          <label htmlFor="site-password">Access Password</label>
          <div className="authPasswordField">
            <LockKeyhole size={18} />
            <input
              id="site-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              autoComplete="current-password"
              autoFocus
              placeholder="Enter password"
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="authShowPassword" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="authError">{error}</div>}
          <button className="authLoginButton" disabled={!password || loading} type="submit">
            {loading ? 'Signing in...' : 'Login to POS'}
          </button>
        </form>
        <small>Secure access • Session expires automatically</small>
      </section>
    </main>
  );
}
