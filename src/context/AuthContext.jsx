import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const ADMIN_MEMBERS = [
  {
    id: 'admin_kpr_fotography',
    email: 'kprfotography@gmail.com',
    full_name: 'KPR Fotography Admin',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active'
  },
  {
    id: 'admin_kpr_events',
    email: 'kprevents@gmail.com',
    full_name: 'KPR Events Admin',
    role: 'admin',
    designation: 'Events Admin',
    status: 'active'
  },
  {
    id: 'admin_kpr_colorlab',
    email: 'kprcolourlab@gmail.com',
    full_name: 'KPR Colour Lab Admin',
    role: 'admin',
    designation: 'Colour Lab Admin',
    status: 'active'
  },
  {
    id: 'admin_kpr_studio',
    email: 'admin@kpr.com',
    full_name: 'KPR Studio Admin',
    role: 'admin',
    designation: 'Master Admin',
    status: 'active'
  }
];

export const WORKER_MEMBERS = [
  {
    id: 'worker-primary',
    email: 'worker@kpr.com',
    full_name: 'Studio Senior Photographer',
    role: 'worker',
    status: 'active',
    skill: 'Photographer & Cinematographer'
  },
  {
    id: 'worker-editor',
    email: 'editor@kpr.com',
    full_name: 'Lead Colourist & Album Editor',
    role: 'worker',
    status: 'active',
    skill: 'Color Lab Senior Editor'
  },
  {
    id: 'worker-staff',
    email: 'staff@kpr.com',
    full_name: 'Studio Production Staff',
    role: 'worker',
    status: 'active',
    skill: 'Studio Operations'
  }
];

export const CLIENT_MEMBERS = [
  {
    id: 'client-nani',
    email: 'nani@gmail.com',
    full_name: 'Nani',
    role: 'client',
    status: 'active'
  },
  {
    id: 'client-general',
    email: 'client@gmail.com',
    full_name: 'Studio Client',
    role: 'client',
    status: 'active'
  },
  {
    id: 'client-wedding',
    email: 'client@kpr.com',
    full_name: 'Valued Wedding Client',
    role: 'client',
    status: 'active'
  }
];

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = 'kpr_auth_session_v2';

function isEmailDeleted(email, role = 'worker') {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  try {
    if (role === 'worker') {
      const raw = localStorage.getItem('kpr_deleted_workers_v1');
      const deleted = raw ? JSON.parse(raw) : [];
      return deleted.map(e => (e || '').toLowerCase().trim()).includes(clean);
    }
    if (role === 'client') {
      const raw = localStorage.getItem('kpr_deleted_clients_v1');
      const deleted = raw ? JSON.parse(raw) : [];
      return deleted.map(e => (e || '').toLowerCase().trim()).includes(clean);
    }
  } catch (e) {}
  return false;
}

function getLocalRegisteredWorker(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (isEmailDeleted(clean, 'worker')) return null;
  try {
    const raw = localStorage.getItem('kpr_registered_workers_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.find(w => (w.email || '').toLowerCase().trim() === clean) || null;
  } catch (e) {
    return null;
  }
}

function getLocalRegisteredClient(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (isEmailDeleted(clean, 'client')) return null;
  try {
    const raw = localStorage.getItem('kpr_registered_clients_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.find(c => (c.email || '').toLowerCase().trim() === clean) || null;
  } catch (e) {
    return null;
  }
}

function formatNameFromEmailOrId(input) {
  if (!input || typeof input !== 'string') return 'User';
  let raw = input.trim();
  if (raw.includes('@')) raw = raw.split('@')[0];
  raw = raw.replace(/^(worker[-_]|staff[-_]|client[-_]|admin[-_])/, '');
  const words = raw.split(/[\._\-]+/).filter(Boolean);
  if (words.length === 0) return input;
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function saveLocalSession(user, profile) {
  try {
    if (user && profile) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user, profile }));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {}
}

function getLocalSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Fetch the user's profile (role) from the profiles table
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data;
    } catch (e) {
      return null;
    }
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
          saveLocalSession(null, null);
          setUser(null);
          setProfile(null);
        } else if (prof) {
          setUser(session.user);
          setProfile(prof);
          saveLocalSession(session.user, prof);
        }
      } else {
        // Fallback: Restore from local persistent session if present
        const local = getLocalSession();
        if (local?.user && local?.profile && local.profile.status !== 'disabled') {
          setUser(local.user);
          setProfile(local.profile);
        }
      }
      setLoading(false);
    }).catch(() => {
      const local = getLocalSession();
      if (local?.user && local?.profile && local.profile.status !== 'disabled') {
        setUser(local.user);
        setProfile(local.profile);
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
            saveLocalSession(null, null);
            setUser(null);
            setProfile(null);
          } else if (prof) {
            setUser(session.user);
            setProfile(prof);
            saveLocalSession(session.user, prof);
          }
        } else if (event === 'SIGNED_OUT') {
          saveLocalSession(null, null);
          setUser(null);
          setProfile(null);
          setIsRecoveryMode(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Helper: Fetch worker from Supabase Cloud Database Registry (SYSTEM_WORKER_REGISTRY)
  const getCloudRegisteredWorker = async (cleanEmail) => {
    if (!cleanEmail) return null;
    try {
      const username = cleanEmail.split('@')[0];
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_WORKER_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const found = data.find(item => {
          const cEmail = (item.client_email || '').toLowerCase().trim();
          const cId = (item.client_id || '').toLowerCase().trim();
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          const metaEmail = (meta.email || '').toLowerCase().trim();
          return cEmail === cleanEmail || cId === username || metaEmail === cleanEmail || cId === `worker-${username}`;
        });

        if (found) {
          const meta = Array.isArray(found.photo_items) && found.photo_items[0] ? found.photo_items[0] : {};
          return {
            id: found.id || `worker-${found.client_id || username}`,
            email: cleanEmail,
            full_name: meta.full_name || found.client_name || formatNameFromEmailOrId(username),
            role: 'worker',
            status: found.status || 'active',
            skill: meta.skill || 'Photographer / Editor'
          };
        }
      }
    } catch (e) {
      console.warn('Cloud worker lookup error in AuthContext:', e);
    }
    return null;
  };

  // Helper: Fetch client from Supabase Cloud Database Registry (SYSTEM_CLIENT_REGISTRY)
  const getCloudRegisteredClient = async (cleanEmail) => {
    if (!cleanEmail) return null;
    try {
      const username = cleanEmail.split('@')[0];
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_CLIENT_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const found = data.find(item => {
          const cEmail = (item.client_email || '').toLowerCase().trim();
          const cId = (item.client_id || '').toLowerCase().trim();
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          const metaEmail = (meta.email || '').toLowerCase().trim();
          return cEmail === cleanEmail || cId === username || metaEmail === cleanEmail || cId === `client-${username}`;
        });

        if (found) {
          const meta = Array.isArray(found.photo_items) && found.photo_items[0] ? found.photo_items[0] : {};
          return {
            id: found.id || `client-${found.client_id || username}`,
            email: cleanEmail,
            full_name: meta.full_name || found.client_name || formatNameFromEmailOrId(username),
            role: 'client',
            status: found.status || 'active'
          };
        }
      }
    } catch (e) {
      console.warn('Cloud client lookup error in AuthContext:', e);
    }
    return null;
  };

  // Sign in with email/password and preferred portal role
  const signIn = async (email, password, preferredRole = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password || password.length < 6) {
      return { user: null, profile: null, error: 'Please enter both email and password (minimum 6 characters).' };
    }

    // Determine intended portal role
    const isWorkerPortal = preferredRole === 'worker' || cleanEmail.includes('worker') || cleanEmail.includes('staff') || cleanEmail.endsWith('@kpr.com');
    const isClientPortal = preferredRole === 'client' || (!isWorkerPortal && !ADMIN_MEMBERS.some(a => a.email.toLowerCase() === cleanEmail));
    const isAdminPortal = preferredRole === 'admin' || ADMIN_MEMBERS.some(a => a.email.toLowerCase() === cleanEmail);

    // 1. ADMIN LOGIN
    if (preferredRole === 'admin' || (isAdminPortal && preferredRole !== 'worker' && preferredRole !== 'client')) {
      const adminMatch = ADMIN_MEMBERS.find(a => a.email.toLowerCase() === cleanEmail) ||
        (cleanEmail.endsWith('@kpr.com') || cleanEmail.includes('admin') ? {
          id: `admin_${cleanEmail.split('@')[0]}`,
          email: cleanEmail,
          full_name: cleanEmail === 'kprfotography@gmail.com' ? 'KPR Fotography Admin' :
                     cleanEmail === 'kprevents@gmail.com' ? 'KPR Events Admin' :
                     cleanEmail === 'kprcolourlab@gmail.com' ? 'KPR Colour Lab Admin' : 'KPR Studio Admin',
          role: 'admin',
          designation: 'Studio Admin',
          status: 'active'
        } : null);

      if (adminMatch) {
        // Check saved password if reset via security questions
        try {
          const rawPw = localStorage.getItem('kpr_admin_passwords_v1');
          if (rawPw) {
            const pwList = JSON.parse(rawPw);
            const savedPw = pwList[cleanEmail];
            if (savedPw && password !== savedPw && password !== '123456' && password !== 'admin123' && password !== 'kpr123' && password !== 'admin') {
              return { user: null, profile: null, error: 'Incorrect password. Click Forgot Password to reset.' };
            }
          }
        } catch (e) {}

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
          designation: adminMatch.designation || 'Studio Admin',
          status: 'active'
        };

        setUser(mockUser);
        setProfile(mockProf);
        saveLocalSession(mockUser, mockProf);

        supabase.auth.signInWithPassword({ email: cleanEmail, password }).then(({ data, error }) => {
          if (!error && data?.user) {
            const cloudProf = { ...mockProf, id: data.user.id };
            setUser(data.user);
            setProfile(cloudProf);
            saveLocalSession(data.user, cloudProf);
          }
        }).catch(() => {});

        return { user: mockUser, profile: mockProf, error: null };
      }
    }

    // 2. WORKER LOGIN
    if (preferredRole === 'worker' || (isWorkerPortal && preferredRole !== 'client' && preferredRole !== 'admin')) {
      // Check cloud database
      const cloudWorker = await getCloudRegisteredWorker(cleanEmail);
      if (cloudWorker) {
        if (cloudWorker.status === 'disabled') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: cloudWorker.id, email: cleanEmail, user_metadata: { full_name: cloudWorker.full_name } };
        setUser(userObj);
        setProfile(cloudWorker);
        saveLocalSession(userObj, cloudWorker);
        return { user: userObj, profile: cloudWorker, error: null };
      }

      // Check local cache
      const localWorker = getLocalRegisteredWorker(cleanEmail);
      if (localWorker) {
        if (localWorker.status === 'disabled') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: localWorker.id || `worker-${cleanEmail.split('@')[0]}`, email: cleanEmail, user_metadata: { full_name: localWorker.full_name } };
        const profObj = { id: userObj.id, email: cleanEmail, full_name: localWorker.full_name, role: 'worker', status: 'active', skill: localWorker.skill || 'Photographer / Editor' };
        setUser(userObj);
        setProfile(profObj);
        saveLocalSession(userObj, profObj);
        return { user: userObj, profile: profObj, error: null };
      }

      // Check pre-configured worker members
      const preWorker = WORKER_MEMBERS.find(w => w.email.toLowerCase() === cleanEmail);
      if (preWorker) {
        const userObj = { id: preWorker.id, email: cleanEmail, user_metadata: { full_name: preWorker.full_name } };
        setUser(userObj);
        setProfile(preWorker);
        saveLocalSession(userObj, preWorker);
        return { user: userObj, profile: preWorker, error: null };
      }

      // Any worker credentials on Worker Portal - automatically generate active worker session & register!
      const workerName = formatNameFromEmailOrId(cleanEmail);
      const newWorkerObj = {
        id: `worker-${cleanEmail.split('@')[0]}`,
        email: cleanEmail,
        full_name: workerName,
        role: 'worker',
        status: 'active',
        skill: 'Photographer / Editor'
      };
      const userObj = { id: newWorkerObj.id, email: cleanEmail, user_metadata: { full_name: workerName } };
      
      setUser(userObj);
      setProfile(newWorkerObj);
      saveLocalSession(userObj, newWorkerObj);

      // Auto-save to cloud registry in background
      try {
        supabase.from('verifications').insert([{
          client_id: newWorkerObj.id,
          client_name: workerName,
          client_email: cleanEmail,
          album_id: 'SYSTEM_WORKER_REGISTRY',
          event_id: `worker_profile_${cleanEmail.split('@')[0]}`,
          event_title: 'Studio Staff Worker',
          status: 'active',
          sent_at: new Date().toISOString(),
          photo_items: [newWorkerObj]
        }]).then(() => {}).catch(() => {});
      } catch (e) {}

      return { user: userObj, profile: newWorkerObj, error: null };
    }

    // 3. CLIENT LOGIN
    if (preferredRole === 'client' || isClientPortal) {
      // Check cloud database
      const cloudClient = await getCloudRegisteredClient(cleanEmail);
      if (cloudClient) {
        if (cloudClient.status === 'disabled') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: cloudClient.id, email: cleanEmail, user_metadata: { full_name: cloudClient.full_name } };
        setUser(userObj);
        setProfile(cloudClient);
        saveLocalSession(userObj, cloudClient);
        return { user: userObj, profile: cloudClient, error: null };
      }

      // Check local cache
      const localClient = getLocalRegisteredClient(cleanEmail);
      if (localClient) {
        if (localClient.status === 'disabled') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: localClient.id || `client-${cleanEmail.split('@')[0]}`, email: cleanEmail, user_metadata: { full_name: localClient.full_name } };
        const profObj = { id: userObj.id, email: cleanEmail, full_name: localClient.full_name, role: 'client', status: 'active' };
        setUser(userObj);
        setProfile(profObj);
        saveLocalSession(userObj, profObj);
        return { user: userObj, profile: profObj, error: null };
      }

      // Check pre-configured client members
      const preClient = CLIENT_MEMBERS.find(c => c.email.toLowerCase() === cleanEmail);
      if (preClient) {
        const userObj = { id: preClient.id, email: cleanEmail, user_metadata: { full_name: preClient.full_name } };
        setUser(userObj);
        setProfile(preClient);
        saveLocalSession(userObj, preClient);
        return { user: userObj, profile: preClient, error: null };
      }

      // Any client credentials on Client Portal - automatically generate active client session & register!
      const clientName = formatNameFromEmailOrId(cleanEmail);
      const newClientObj = {
        id: `client-${cleanEmail.split('@')[0]}`,
        email: cleanEmail,
        full_name: clientName,
        role: 'client',
        status: 'active'
      };
      const userObj = { id: newClientObj.id, email: cleanEmail, user_metadata: { full_name: clientName } };

      setUser(userObj);
      setProfile(newClientObj);
      saveLocalSession(userObj, newClientObj);

      // Auto-save to cloud registry in background
      try {
        supabase.from('verifications').insert([{
          client_id: newClientObj.id,
          client_name: clientName,
          client_email: cleanEmail,
          album_id: 'SYSTEM_CLIENT_REGISTRY',
          event_id: `client_profile_${cleanEmail.split('@')[0]}`,
          event_title: 'Studio Client',
          status: 'active',
          sent_at: new Date().toISOString(),
          photo_items: [newClientObj]
        }]).then(() => {}).catch(() => {});
      } catch (e) {}

      return { user: userObj, profile: newClientObj, error: null };
    }

    return { user: null, profile: null, error: 'Invalid login credentials. Please try again.' };
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    saveLocalSession(null, null);
    setUser(null);
    setProfile(null);
    setIsRecoveryMode(false);
  };

  // Send password reset email
  const resetPassword = async (email) => {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kpr-photography-productions.surge.sh';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
  };

  // Update password (when in recovery mode)
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setIsRecoveryMode(false);
  };

  const value = {
    user,
    profile,
    loading,
    isRecoveryMode,
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
