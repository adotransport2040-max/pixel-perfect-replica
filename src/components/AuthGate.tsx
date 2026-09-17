import React, { useEffect, useState } from 'react';
import { Truck, Mail, Lock, LogIn, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

interface AuthGateProps {
  children: (session: Session) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Loading your books…
      </div>
    );
  }

  if (session) return <>{children(session)}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo('Account created. Check your email and click the confirmation link to sign in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError('Google sign-in could not be completed. Please try again.');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-lg bg-teal-600 flex items-center justify-center text-white">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">ADO Transport</h1>
            <p className="text-xs text-slate-400">VAT Billing & Accounting</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'signin' ? 'Sign in to your books' : 'Create your account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your bills, parties and VAT records are stored securely in the cloud and visible only
              to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-3.5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            <label className="block">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Email
              </span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="accounts@adotransport.com.np"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Password
              </span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {mode === 'signin' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[11px] text-slate-400 uppercase">or</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Continue with Google
            </button>

            <p className="text-center text-xs text-slate-500 pt-1">
              {mode === 'signin' ? "Don't have an account yet?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                  setInfo(null);
                }}
                className="font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
