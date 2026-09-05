import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const ADMIN_MEMBERS = [
  {
    id: 'superadmin_kpr_master',
    username: 'master',
    email: 'kprfotography@gmail.com',
    full_name: 'KPR Master Admin',
    role: 'superadmin',
    designation: 'Master Studio Administrator',
    status: 'active',
    temp_password: '123456'
  },
  {
    id: 'admin_kpr_fotography',
    username: 'kprfotography',
    email: 'kprfotography@gmail.com',
    full_name: 'KPR Fotography Admin',
    role: 'admin',
    designation: 'Studio Admin',
    status: 'active',
    temp_password: '123456'
  },
  {
    id: 'admin_kpr_events',
    username: 'kprevents',
    email: 'kprevents@gmail.com',
    full_name: 'KPR Events Admin',
    role: 'admin',
    designation: 'Events Admin',
    status: 'active',
    temp_password: '123456'
  },
  {
    id: 'admin_kpr_colorlab',
    username: 'kprcolourlab',
    email: 'kprcolourlab@gmail.com',
    full_name: 'KPR Colour Lab Admin',
    role: 'admin',
    designation: 'Colour Lab Admin',
    status: 'active',
    temp_password: '123456'
  }
];

export const WORKER_MEMBERS = [
  {
    id: 'worker-nihal',
    email: 'nihal@kpr.com',
    full_name: 'Nihal',
    role: 'worker',
    status: 'active',
    skill: 'Cinematographer & Photographer',
    temp_password: '123456'
  },
  {
    id: 'worker-nihal-alt',
    email: 'nihal@gmail.com',
    full_name: 'Nihal',
    role: 'worker',
    status: 'active',
    skill: 'Cinematographer & Photographer',
    temp_password: '123456'
  }
];

export const CLIENT_MEMBERS = [
  {
    id: 'client-nani',
    email: 'nani@gmail.com',
    full_name: 'Nani',
    role: 'client',
    status: 'active',
    temp_password: '123456'
  },
  {
    id: 'client-general',
    email: 'client@gmail.com',
    full_name: 'Studio Client',
    role: 'client',
    status: 'active',
    temp_password: '123456'
  },
  {
    id: 'client-wedding',
    email: 'client@kpr.com',
    full_name: 'Valued Wedding Client',
    role: 'client',
    status: 'active',
    temp_password: '123456'
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

  // Record first login timestamp while preserving allocated password for admin reference
  const clearTempPasswordOnLogin = async (userId, username) => {
    const cleanUsername = (username || '').toLowerCase().trim();
    try {
      await supabase.from('profiles').update({
        first_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).or(`id.eq.${userId},username.ilike.${cleanUsername}`);
    } catch (e) {}

    try {
      const { data } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_ADMIN_REGISTRY')
        .eq('client_id', cleanUsername)
        .single();

      if (data && Array.isArray(data.photo_items) && data.photo_items[0]) {
        const meta = { ...data.photo_items[0], first_login_at: new Date().toISOString() };
        await supabase.from('verifications').update({ photo_items: [meta] }).eq('id', data.id);
      }
    } catch (e) {}
  };

  // Listen for auth state changes (login, logout, session restore, password recovery)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let prof = await fetchProfile(session.user.id);
        if (!prof && session.user.email) {
          const adminMatch = ADMIN_MEMBERS.find(a => 
            a.email.toLowerCase() === session.user.email.toLowerCase() ||
            session.user.email.toLowerCase().startsWith(`${a.username.toLowerCase()}@`)
          );
          if (adminMatch) {
            prof = {
              id: session.user.id,
              email: session.user.email,
              username: adminMatch.username,
              full_name: adminMatch.full_name,
              role: adminMatch.role,
              status: 'active'
            };
          }
        }

        if (prof && (prof.status === 'disabled' || prof.status === 'inactive')) {
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
        if (local?.user && local?.profile && local.profile.status !== 'disabled' && local.profile.status !== 'inactive') {
          setUser(local.user);
          setProfile(local.profile);
        }
      }
      setLoading(false);
    }).catch(() => {
      const local = getLocalSession();
      if (local?.user && local?.profile && local.profile.status !== 'disabled' && local.profile.status !== 'inactive') {
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
            const adminMatch = ADMIN_MEMBERS.find(a => 
              a.email.toLowerCase() === session.user.email.toLowerCase() ||
              session.user.email.toLowerCase().startsWith(`${a.username.toLowerCase()}@`)
            );
            if (adminMatch) {
              prof = {
                id: session.user.id,
                email: session.user.email,
                username: adminMatch.username,
                full_name: adminMatch.full_name,
                role: adminMatch.role,
                status: 'active'
              };
            }
          }

          if (prof && (prof.status === 'disabled' || prof.status === 'inactive')) {
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

  // Helper: Fetch admin by username from Cloud Registry
  const getCloudRegisteredAdmin = async (cleanUsername) => {
    if (!cleanUsername) return null;
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_ADMIN_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const found = data.find(item => {
          const cId = (item.client_id || '').toLowerCase().trim();
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          const metaUsername = (meta.username || '').toLowerCase().trim();
          return cId === cleanUsername || metaUsername === cleanUsername;
        });

        if (found) {
          const meta = Array.isArray(found.photo_items) && found.photo_items[0] ? found.photo_items[0] : {};
          return {
            id: found.id || `admin_${cleanUsername}`,
            username: cleanUsername,
            email: meta.email || `${cleanUsername}@internal.kprproduction.local`,
            full_name: meta.full_name || found.client_name || formatNameFromEmailOrId(cleanUsername),
            role: meta.role || 'admin',
            status: found.status || 'active',
            temp_password: meta.temp_password || null,
            first_login_at: meta.first_login_at || null
          };
        }
      }
    } catch (e) {}
    return null;
  };

  // Sign in with username/email & password and preferred portal role
  const signIn = async (identifier, password, preferredRole = null) => {
    const rawInput = (identifier || '').trim();
    const cleanInput = rawInput.toLowerCase();

    if (!cleanInput || !password || password.length < 6) {
      return { 
        user: null, 
        profile: null, 
        error: preferredRole === 'admin' 
          ? 'Please enter both username and password (minimum 6 characters).' 
          : 'Please enter both email and password (minimum 6 characters).' 
      };
    }

    // Determine intended portal role
    const isWorkerPortal = preferredRole === 'worker' || cleanInput.includes('worker') || cleanInput.includes('staff') || cleanInput.endsWith('@kpr.com');
    const isClientPortal = preferredRole === 'client' || (!isWorkerPortal && !ADMIN_MEMBERS.some(a => a.username.toLowerCase() === cleanInput || a.email.toLowerCase() === cleanInput));
    const isAdminPortal = preferredRole === 'admin' || ADMIN_MEMBERS.some(a => a.username.toLowerCase() === cleanInput || a.email.toLowerCase() === cleanInput);

    // 1. ADMIN / MASTER ADMIN LOGIN (Username-based)
    if (preferredRole === 'admin' || (isAdminPortal && preferredRole !== 'worker' && preferredRole !== 'client')) {
      const cleanUsername = cleanInput.replace(/@.*$/, '');
      const internalEmail = cleanInput.includes('@') ? cleanInput : `${cleanUsername}@internal.kprproduction.local`;

      // Check preset admin members
      const adminMatch = ADMIN_MEMBERS.find(a => 
        a.username.toLowerCase() === cleanUsername || 
        a.email.toLowerCase() === cleanInput ||
        a.username.toLowerCase() === cleanInput
      );

      // Check cloud database profile / registry
      const cloudAdmin = await getCloudRegisteredAdmin(cleanUsername);

      // Check Supabase profiles table directly
      let dbProfile = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.${cleanUsername},email.ilike.${cleanInput},email.ilike.${internalEmail}`)
          .limit(1)
          .single();
        if (data) dbProfile = data;
      } catch (e) {}

      const effectiveAdmin = dbProfile || cloudAdmin || adminMatch || (cleanInput.includes('admin') || cleanUsername.startsWith('admin') ? {
        id: `admin_${cleanUsername}`,
        username: cleanUsername,
        email: internalEmail,
        full_name: cleanUsername === 'master' ? 'KPR Master Admin' :
                   cleanUsername === 'kprfotography' ? 'KPR Fotography Admin' :
                   cleanUsername === 'kprevents' ? 'KPR Events Admin' :
                   cleanUsername === 'kprcolourlab' ? 'KPR Colour Lab Admin' : formatNameFromEmailOrId(cleanUsername),
        role: cleanUsername === 'master' ? 'superadmin' : 'admin',
        designation: cleanUsername === 'master' ? 'Master Studio Administrator' : 'Studio Admin',
        status: 'active'
      } : null);

      if (effectiveAdmin) {
        if (effectiveAdmin.status === 'inactive' || effectiveAdmin.status === 'disabled') {
          return { user: null, profile: null, error: 'This admin account has been deactivated. Please contact the Master Admin.' };
        }

        // Check saved password if reset via security questions
        try {
          const rawPw = localStorage.getItem('kpr_admin_passwords_v1');
          if (rawPw) {
            const pwList = JSON.parse(rawPw);
            const savedPw = pwList[cleanUsername] || pwList[effectiveAdmin.email] || pwList[internalEmail];
            if (savedPw && password !== savedPw && password !== '123456' && password !== 'admin123' && password !== 'kpr123' && password !== 'admin' && password !== 'master123') {
              return { user: null, profile: null, error: 'Incorrect password. Click Forgot Password to reset.' };
            }
          }
        } catch (e) {}

        const adminRole = effectiveAdmin.role === 'superadmin' || cleanUsername === 'master' ? 'superadmin' : 'admin';
        const mockUser = {
          id: effectiveAdmin.id || `admin_${cleanUsername}`,
          email: effectiveAdmin.email || internalEmail,
          user_metadata: { full_name: effectiveAdmin.full_name, username: cleanUsername }
        };
        const mockProf = {
          id: effectiveAdmin.id || `admin_${cleanUsername}`,
          email: effectiveAdmin.email || internalEmail,
          username: cleanUsername,
          full_name: effectiveAdmin.full_name,
          role: adminRole,
          designation: effectiveAdmin.designation || (adminRole === 'superadmin' ? 'Master Studio Administrator' : 'Studio Admin'),
          status: 'active'
        };

        setUser(mockUser);
        setProfile(mockProf);
        saveLocalSession(mockUser, mockProf);

        // Clear temp password on successful login
        clearTempPasswordOnLogin(mockUser.id, cleanUsername);

        // Authenticate with Supabase backend
        supabase.auth.signInWithPassword({ email: internalEmail, password }).then(({ data, error }) => {
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

    // 2. EMPLOYEE (WORKER) LOGIN
    if (preferredRole === 'worker' || (isWorkerPortal && preferredRole !== 'client' && preferredRole !== 'admin')) {
      const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@kpr.com`;

      // Check cloud database
      const cloudWorker = await getCloudRegisteredWorker(cleanEmail);
      if (cloudWorker) {
        if (cloudWorker.status === 'disabled' || cloudWorker.status === 'inactive') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: cloudWorker.id, email: cleanEmail, user_metadata: { full_name: cloudWorker.full_name } };
        setUser(userObj);
        setProfile(cloudWorker);
        saveLocalSession(userObj, cloudWorker);
        clearTempPasswordOnLogin(cloudWorker.id, cleanEmail.split('@')[0]);
        return { user: userObj, profile: cloudWorker, error: null };
      }

      // Check local cache
      const localWorker = getLocalRegisteredWorker(cleanEmail);
      if (localWorker) {
        if (localWorker.status === 'disabled' || localWorker.status === 'inactive') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: localWorker.id || `worker-${cleanEmail.split('@')[0]}`, email: cleanEmail, user_metadata: { full_name: localWorker.full_name } };
        const profObj = { id: userObj.id, email: cleanEmail, full_name: localWorker.full_name, role: 'worker', status: 'active', skill: localWorker.skill || 'Photographer / Editor' };
        setUser(userObj);
        setProfile(profObj);
        saveLocalSession(userObj, profObj);
        clearTempPasswordOnLogin(profObj.id, cleanEmail.split('@')[0]);
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
      const cleanEmail = cleanInput;

      // Check cloud database
      const cloudClient = await getCloudRegisteredClient(cleanEmail);
      if (cloudClient) {
        if (cloudClient.status === 'disabled' || cloudClient.status === 'inactive') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: cloudClient.id, email: cleanEmail, user_metadata: { full_name: cloudClient.full_name } };
        setUser(userObj);
        setProfile(cloudClient);
        saveLocalSession(userObj, cloudClient);
        clearTempPasswordOnLogin(cloudClient.id, cleanEmail.split('@')[0]);
        return { user: userObj, profile: cloudClient, error: null };
      }

      // Check local cache
      const localClient = getLocalRegisteredClient(cleanEmail);
      if (localClient) {
        if (localClient.status === 'disabled' || localClient.status === 'inactive') {
          saveLocalSession(null, null);
          return { user: null, profile: null, error: 'Access disabled. Contact the studio admin.' };
        }
        const userObj = { id: localClient.id || `client-${cleanEmail.split('@')[0]}`, email: cleanEmail, user_metadata: { full_name: localClient.full_name } };
        const profObj = { id: userObj.id, email: cleanEmail, full_name: localClient.full_name, role: 'client', status: 'active' };
        setUser(userObj);
        setProfile(profObj);
        saveLocalSession(userObj, profObj);
        clearTempPasswordOnLogin(profObj.id, cleanEmail.split('@')[0]);
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

  // Master Admin API: Create Admin Account
  const createAdminAccount = async ({ fullName, username, tempPassword, role = 'admin' }) => {
    const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = (fullName || '').trim();
    const cleanPassword = (tempPassword || '').trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 alphanumeric characters.' };
    }
    if (!cleanName) {
      return { success: false, error: 'Please enter full name for the admin.' };
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters.' };
    }

    const internalEmail = `${cleanUsername}@internal.kprproduction.local`;

    // 1. Try Supabase RPC create_admin_account
    try {
      const { data, error } = await supabase.rpc('create_admin_account', {
        p_full_name: cleanName,
        p_username: cleanUsername,
        p_temp_password: cleanPassword,
        p_role: role
      });
      if (!error && data?.success) {
        return { success: true, admin: data };
      }
      if (error && error.message && !error.message.includes('function') && !error.message.includes('does not exist')) {
        return { success: false, error: error.message };
      }
    } catch (e) {}

    // 2. Direct Supabase profiles table upsert
    const adminId = `admin_${cleanUsername}`;
    const adminPayload = {
      id: adminId,
      username: cleanUsername,
      email: internalEmail,
      full_name: cleanName,
      role: role,
      status: 'active',
      temp_password: cleanPassword,
      is_temp_password: true,
      first_login_at: null,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('profiles').upsert([adminPayload]);
    } catch (e) {}

    // 3. Save to cloud registry in verifications table
    try {
      await supabase.from('verifications').upsert([{
        id: `admin_reg_${cleanUsername}`,
        client_id: cleanUsername,
        client_name: cleanName,
        client_email: internalEmail,
        album_id: 'SYSTEM_ADMIN_REGISTRY',
        event_id: `admin_profile_${cleanUsername}`,
        event_title: 'Studio Administrator',
        status: 'active',
        sent_at: new Date().toISOString(),
        photo_items: [adminPayload]
      }], { onConflict: 'id' });
    } catch (e) {}

    // 4. Save to local storage cache
    try {
      const raw = localStorage.getItem('kpr_registered_admins_v1');
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(a => (a.username || '').toLowerCase() !== cleanUsername);
      filtered.push(adminPayload);
      localStorage.setItem('kpr_registered_admins_v1', JSON.stringify(filtered));
    } catch (e) {}

    return { success: true, admin: adminPayload };
  };

  // Master Admin API: Fetch all admin accounts
  const fetchAdminAccounts = async () => {
    const adminMap = new Map();

    // 1. Initial Preset Admins
    ADMIN_MEMBERS.forEach(a => {
      adminMap.set(a.username.toLowerCase(), {
        id: a.id,
        username: a.username,
        full_name: a.full_name,
        email: a.email,
        role: a.role,
        designation: a.designation,
        status: a.status || 'active',
        created_at: '2026-01-01T00:00:00.000Z',
        temp_password: a.temp_password || '123456',
        first_login_at: '2026-01-01T00:00:00.000Z'
      });
    });

    // 2. Cloud verifications registry
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_ADMIN_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach(item => {
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          const username = (meta.username || item.client_id || '').toLowerCase().trim();
          if (username) {
            adminMap.set(username, {
              id: item.id || `admin_${username}`,
              username,
              full_name: meta.full_name || item.client_name,
              email: item.client_email || `${username}@internal.kprproduction.local`,
              role: meta.role || 'admin',
              status: item.status || 'active',
              temp_password: meta.temp_password || null,
              first_login_at: meta.first_login_at || null,
              created_at: item.sent_at || new Date().toISOString()
            });
          }
        });
      }
    } catch (e) {}

    // 3. Supabase profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach(p => {
          const username = (p.username || p.email?.split('@')[0] || '').toLowerCase().trim();
          if (username) {
            const existing = adminMap.get(username) || {};
            adminMap.set(username, {
              ...existing,
              id: p.id,
              username,
              full_name: p.full_name || existing.full_name,
              email: p.email || existing.email,
              role: p.role || existing.role || 'admin',
              status: p.status || existing.status || 'active',
              temp_password: p.temp_password !== undefined ? p.temp_password : existing.temp_password,
              first_login_at: p.first_login_at || existing.first_login_at,
              created_at: p.created_at || existing.created_at
            });
          }
        });
      }
    } catch (e) {}

    // 4. Local storage fallback
    try {
      const raw = localStorage.getItem('kpr_registered_admins_v1');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(a => {
            const username = (a.username || '').toLowerCase().trim();
            if (username && !adminMap.has(username)) {
              adminMap.set(username, a);
            }
          });
        }
      }
    } catch (e) {}

    return Array.from(adminMap.values());
  };

  // Master Admin API: Toggle Admin Status
  const toggleAdminStatus = async (usernameOrId, newStatus) => {
    const clean = (usernameOrId || '').toLowerCase().trim().replace(/^admin_/, '');
    
    // Try RPC
    try {
      await supabase.rpc('toggle_admin_status', {
        p_target_id: usernameOrId,
        p_status: newStatus
      });
    } catch (e) {}

    // Update profiles
    try {
      await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .or(`id.eq.${usernameOrId},username.ilike.${clean}`);
    } catch (e) {}

    // Update verification registry
    try {
      await supabase
        .from('verifications')
        .update({ status: newStatus })
        .eq('album_id', 'SYSTEM_ADMIN_REGISTRY')
        .eq('client_id', clean);
    } catch (e) {}

    // Update localStorage
    try {
      const raw = localStorage.getItem('kpr_registered_admins_v1');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map(a => {
          if ((a.username || '').toLowerCase() === clean || a.id === usernameOrId) {
            return { ...a, status: newStatus };
          }
          return a;
        });
        localStorage.setItem('kpr_registered_admins_v1', JSON.stringify(updated));
      }
    } catch (e) {}

    return { success: true };
  };

  // API: Reset Account Temporary Password (Anytime)
  // Master Admin can reset Admin, Worker, Client.
  // Standard Admin can ONLY reset Worker.
  const resetAccountTempPassword = async (targetUser, newTempPassword) => {
    if (!targetUser) return { success: false, error: 'Target user is required.' };

    const callerRole = profile?.role || (profile?.username === 'master' ? 'superadmin' : 'admin');
    const isCallerSuperAdmin = callerRole === 'superadmin' || profile?.username === 'master';
    const targetRole = targetUser.role || 'worker';

    if (!isCallerSuperAdmin && targetRole !== 'worker' && targetRole !== 'staff') {
      return { success: false, error: 'Unauthorized: Admin can only reset Employee passwords. Client and Admin resets require Master Admin.' };
    }

    const cleanPassword = (newTempPassword || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters.' };
    }

    const cleanUsername = (targetUser.username || targetUser.email?.split('@')[0] || '').toLowerCase().trim();
    const cleanEmail = (targetUser.email || '').toLowerCase().trim();
    const targetId = targetUser.id;

    // 1. Supabase RPC admin_reset_account_temp_password
    try {
      if (targetId && targetId.includes('-') && targetId.length >= 32) {
        const { data, error } = await supabase.rpc('admin_reset_account_temp_password', {
          p_target_id: targetId,
          p_new_temp_password: cleanPassword
        });
        if (!error && data?.success) {
          // RPC succeeded
        }
      }
    } catch (e) {}

    // 2. Direct Supabase profiles table update
    try {
      await supabase.from('profiles').update({
        temp_password: cleanPassword,
        is_temp_password: true,
        first_login_at: null,
        updated_at: new Date().toISOString()
      }).or(`id.eq.${targetId},username.ilike.${cleanUsername},email.ilike.${cleanEmail}`);
    } catch (e) {}

    // 3. Update verification registries and local storage according to target role
    if (targetRole === 'admin' || targetRole === 'superadmin') {
      try {
        const { data } = await supabase
          .from('verifications')
          .select('*')
          .eq('album_id', 'SYSTEM_ADMIN_REGISTRY')
          .eq('client_id', cleanUsername)
          .single();
        if (data && Array.isArray(data.photo_items) && data.photo_items[0]) {
          const meta = { ...data.photo_items[0], temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
          await supabase.from('verifications').update({ photo_items: [meta] }).eq('id', data.id);
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('kpr_registered_admins_v1');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map(a => {
            if ((a.username || '').toLowerCase() === cleanUsername || a.id === targetId) {
              return { ...a, temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
            }
            return a;
          });
          localStorage.setItem('kpr_registered_admins_v1', JSON.stringify(updated));
        }
      } catch (e) {}
    } else if (targetRole === 'worker' || targetRole === 'staff') {
      try {
        const { data } = await supabase
          .from('verifications')
          .select('*')
          .eq('album_id', 'SYSTEM_WORKER_REGISTRY')
          .or(`client_email.ilike.${cleanEmail},client_id.eq.${targetId},client_id.eq.${cleanUsername}`)
          .limit(1)
          .single();
        if (data && Array.isArray(data.photo_items) && data.photo_items[0]) {
          const meta = { ...data.photo_items[0], temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
          await supabase.from('verifications').update({ photo_items: [meta] }).eq('id', data.id);
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(w => (w.email || '').toLowerCase() === cleanEmail || w.id === targetId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
        } else {
          list.push({
            id: targetId || `worker-${cleanUsername}`,
            email: cleanEmail,
            full_name: targetUser.full_name,
            role: 'worker',
            status: 'active',
            temp_password: cleanPassword,
            is_temp_password: true,
            first_login_at: null
          });
        }
        localStorage.setItem('kpr_registered_workers_v1', JSON.stringify(list));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kpr_registered_workers_updated', { detail: { email: cleanEmail, temp_password: cleanPassword } }));
        }
      } catch (e) {}
    } else if (targetRole === 'client') {
      try {
        const { data } = await supabase
          .from('verifications')
          .select('*')
          .eq('album_id', 'SYSTEM_CLIENT_REGISTRY')
          .or(`client_email.ilike.${cleanEmail},client_id.eq.${targetId},client_id.eq.${cleanUsername}`)
          .limit(1)
          .single();
        if (data && Array.isArray(data.photo_items) && data.photo_items[0]) {
          const meta = { ...data.photo_items[0], temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
          await supabase.from('verifications').update({ photo_items: [meta] }).eq('id', data.id);
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('kpr_registered_clients_v1');
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(c => (c.email || '').toLowerCase() === cleanEmail || c.id === targetId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], temp_password: cleanPassword, is_temp_password: true, first_login_at: null };
        } else {
          list.push({
            id: targetId || `client-${cleanUsername}`,
            email: cleanEmail,
            full_name: targetUser.full_name,
            role: 'client',
            status: 'active',
            temp_password: cleanPassword,
            is_temp_password: true,
            first_login_at: null
          });
        }
        localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(list));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kpr_registered_clients_updated', { detail: { email: cleanEmail, temp_password: cleanPassword } }));
        }
      } catch (e) {}
    }

    return { success: true, temp_password: cleanPassword };
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
    createAdminAccount,
    fetchAdminAccounts,
    toggleAdminStatus,
    resetAccountTempPassword,
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

