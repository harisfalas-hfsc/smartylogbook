import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { offlineFirst } from '@/lib/offline/offline-first';
import {
  OFFLINE_SESSION_FLAG,
  rememberDevice,
  refreshRememberedSession,
  readLocalSessionUser,
} from '@/lib/offline/device-auth';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);

  // The profile is cached on the device so the header, name and avatar render
  // with no internet.
  const fetchProfile = async (userId: string) => {
    const data = await offlineFirst<Profile | null>(
      'account:profile',
      async () => {
        const { data: row } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        return (row as Profile | null) ?? null;
      },
      userId,
    ).catch(() => null);
    setProfile(data ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const local = !session && !signingOut.current ? readLocalSessionUser() : null;
        setSession(session);
        setUser(session?.user ?? (local ? ({ id: local.id, email: local.email ?? undefined } as User) : null));
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          refreshRememberedSession(session.user.email);
        } else if (local) {
          setTimeout(() => fetchProfile(local.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
          return;
        }
        // The backend client may return no session while a stored session is
        // being refreshed. Keep the device identity so cached rows stay scoped
        // to the correct member instead of briefly rendering an empty account.
        const local = readLocalSessionUser();
        setUser(local ? ({ id: local.id, email: local.email ?? undefined } as User) : null);
        if (local) fetchProfile(local.id);
      })
      .catch(() => {
        const local = readLocalSessionUser();
        setSession(null);
        setUser(local ? ({ id: local.id, email: local.email ?? undefined } as User) : null);
        if (local) fetchProfile(local.id);
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });
    if (!error) await rememberDevice(email, password);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Remember this device so the member can sign in again with no internet.
    if (!error) await rememberDevice(email, password);
    return { error };
  };

  const signOut = async () => {
    // Local sign-out leaves the encrypted device verifier and downloaded world
    // intact, so this member can deliberately sign back in during a long outage.
    signingOut.current = true;
    sessionStorage.removeItem(OFFLINE_SESSION_FLAG);
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setProfile(null);
    signingOut.current = false;
    // Keep this account's encrypted, user-scoped offline copy on the device.
    // This is what allows the same member to sign back in and read their
    // downloaded logbook while there is no connection.
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const deleteAccount = async () => {
    // Sign out, actual deletion would need an edge function with service role
    await signOut();
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signOut, resetPassword, updatePassword, deleteAccount, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
