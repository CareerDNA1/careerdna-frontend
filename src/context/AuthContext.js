import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Error getting auth session:', error.message);
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(data?.session ?? null);
      setLoading(false);
    }

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      // Any sign-out (this tab or another) must drop every per-user in-memory
      // cache, or the next account sees the previous account's data for a moment.
      if (event === 'SIGNED_OUT' || !newSession) {
        try { window.dispatchEvent(new Event('cdna:signed-out')); } catch (_) { /* ignore */ }
      }
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut: async () => {
        try { window.dispatchEvent(new Event('cdna:signed-out')); } catch (_) { /* ignore */ }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
