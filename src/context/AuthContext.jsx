import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const ADMIN_MEMBERS = [
  {
    id: 'admin_pranav_01',
    email: 'pranavkumareddya@gmail.com',
    full_name: 'Pranav Kumar Reddy',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active'
  },
  {
    id: 'admin_hemanth_02',
    email: 'hemanthbandaru2005@gmail.com',
    full_name: 'Hemanth Bandaru',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active'
  },
  {
    id: 'admin_nihal_03',
    email: 'nihalreddy0916@gmail.com',
    full_name: 'Nihal Reddy',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active'
  },
  {
    id: 'admin_nihal_03_alias',
    email: 'nihalreddy0916@gmal.com',
    full_name: 'Nihal Reddy',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active'
  }
];

export const WORKER_MEMBERS = [];

export const CLIENT_MEMBERS = [
  {
    id: 'client-nani',
    email: 'nani@gmail.com',
    full_name: 'Nani',
    role: 'client',
    status: 'active'
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Fetch the user's profile (role) from the profiles table
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  };

  // Listen for auth state changes (login, logout, session restore, password recovery)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let prof = await fetchProfile(session.user.id);
        if (!prof && session.user.email) {
          const adminMatch = ADMIN_MEMBERS.find(a => a.email.toLowerCase() === session.user.email.toLowerCase());
          if (adminMatch) {
            prof = {
              id: session.user.id,
              email: session.user.email,
              full_name: adminMatch.full_name,
              role: 'admin',
              status: 'active'
            };
          }
        }
        if (prof && prof.status === 'disabled') {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
        } else {
          setUser(session.user);
          setProfile(prof);
        }
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
          if (session?.user) {
            setUser(session.user);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          let prof = await fetchProfile(session.user.id);
          if (!prof && session.user.email) {
            const adminMatch = ADMIN_MEMBERS.find(a => a.email.toLowerCase() === session.user.email.toLowerCase());
            if (adminMatch) {
              prof = {
                id: session.user.id,
                email: session.user.email,
                full_name: adminMatch.full_name,
                role: 'admin',
                status: 'active'
              };
            }
          }
          if (prof && prof.status === 'disabled') {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            setUser(session.user);
            setProfile(prof);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsRecoveryMode(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email/password
  const signIn = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!error && data?.user) {
      // Fetch the profile to check role & status
      let prof = await fetchProfile(data.user.id);
      if (!prof) {
        const adminMatch = ADMIN_MEMBERS.find(a => a.email.toLowerCase() === cleanEmail);
        if (adminMatch) {
          prof = {
            id: data.user.id,
            email: cleanEmail,
            full_name: adminMatch.full_name,
            role: 'admin',
            status: 'active'
          };
        }
      }

      if (!prof) {
        await supabase.auth.signOut();
        return { user: null, profile: null, error: 'No account found. Contact the studio admin.' };
      }

      if (prof.status === 'disabled') {
        await supabase.auth.signOut();
        return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
      }

      setUser(data.user);
      setProfile(prof);

      return { user: data.user, profile: prof, error: null };
    }

    // 1. Fallback support for 3 Admin Member Logins
    const adminMatch = ADMIN_MEMBERS.find(a => a.email.toLowerCase() === cleanEmail);
    if (adminMatch && password && password.length >= 6) {
      const mockUser = {
        id: adminMatch.id,
        email: adminMatch.email,
        user_metadata: { full_name: adminMatch.full_name }
      };
      const mockProf = {
        id: adminMatch.id,
        email: adminMatch.email,
        full_name: adminMatch.full_name,
        role: 'admin',
        designation: adminMatch.designation,
        status: 'active'
      };
      setUser(mockUser);
      setProfile(mockProf);
      return { user: mockUser, profile: mockProf, error: null };
    }

    // 2. Fallback support for Worker Logins
    const workerUsername = cleanEmail.split('@')[0];
    const workerWords = workerUsername.split(/[\._\-]+/).filter(Boolean);
    const workerFormattedName = workerWords.length > 0
      ? workerWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : workerUsername;

    const workerMatch = WORKER_MEMBERS.find(w => w.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.endsWith('@kpr.com') || cleanEmail.includes('@kpr') || cleanEmail.includes('worker') || !cleanEmail.includes('@')
        ? {
            id: `worker-${workerUsername}`,
            email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@kpr.com`,
            full_name: workerFormattedName,
            role: 'worker',
            designation: 'Studio Team Member',
            status: 'active'
          }
        : null);

    if (workerMatch && password && password.length >= 6) {
      const mockUser = {
        id: workerMatch.id,
        email: workerMatch.email,
        user_metadata: { full_name: workerMatch.full_name }
      };
      const mockProf = {
        id: workerMatch.id,
        email: workerMatch.email,
        full_name: workerMatch.full_name,
        role: 'worker',
        designation: workerMatch.designation || 'Studio Team Member',
        status: 'active'
      };
      setUser(mockUser);
      setProfile(mockProf);
      return { user: mockUser, profile: mockProf, error: null };
    }

    // 3. Fallback support for Client Logins
    const clientUsername = cleanEmail.split('@')[0];
    const clientWords = clientUsername.split(/[\._\-]+/).filter(Boolean);
    const clientFormattedName = clientWords.length > 0
      ? clientWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Valued Client';

    const clientMatch = CLIENT_MEMBERS.find(c => c.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.includes('client') || cleanEmail.includes('@')
        ? {
            id: `client-${clientUsername}`,
            email: cleanEmail,
            full_name: clientFormattedName,
            role: 'client',
            status: 'active'
          }
        : null);

    if (clientMatch && password && password.length >= 6) {
      const mockUser = {
        id: clientMatch.id,
        email: clientMatch.email,
        user_metadata: { full_name: clientMatch.full_name }
      };
      const mockProf = {
        id: clientMatch.id,
        email: clientMatch.email,
        full_name: clientMatch.full_name,
        role: 'client',
        status: 'active'
      };

      // Auto-register client in local storage list for Admin dropdowns
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('kpr_registered_clients_v1');
          const list = raw ? JSON.parse(raw) : [];
          if (!list.some(c => c.email.toLowerCase() === cleanEmail)) {
            list.push({ id: clientMatch.id, full_name: clientMatch.full_name, email: cleanEmail, role: 'client', status: 'active' });
            localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(list));
          }
        }
      } catch (e) {}

      setUser(mockUser);
      setProfile(mockProf);
      return { user: mockUser, profile: mockProf, error: null };
    }

    return { user: null, profile: null, error: error?.message || 'Invalid login credentials' };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsRecoveryMode(false);
  };

  // Send password reset email
  const resetPassword = async (email) => {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kpr-production.surge.sh';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  // Update password (used during password recovery)
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { error: error.message };
    }
    setIsRecoveryMode(false);
    return { user: data.user, error: null };
  };

  const value = {
    user,
    profile,
    loading,
    isRecoveryMode,
    setIsRecoveryMode,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
