import { supabase } from './supabaseClient';
import { getBackendApiUrl } from './clientUploadsService';

const ADMIN_JOBS_STORAGE_KEY = 'kpr_admin_jobs_v1';
const DELETED_JOBS_STORAGE_KEY = 'kpr_deleted_jobs_v1';

/**
 * Get deleted job IDs from local storage
 */
export function getDeletedJobIds() {
  try {
    const raw = localStorage.getItem(DELETED_JOBS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get local jobs cache
 */
export function getLocalJobs() {
  try {
    const raw = localStorage.getItem(ADMIN_JOBS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save jobs cache locally
 */
export function saveLocalJobs(jobs) {
  try {
    localStorage.setItem(ADMIN_JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Error saving local jobs:', e);
  }
}

/**
 * Check if a job is assigned to a specific worker
 */
export function isJobForWorker(job, user, profile) {
  if (!job) return false;
  const assigned = (job.assigned_worker || '').trim().toLowerCase();
  const assignedName = (job.assigned_worker_name || '').trim().toLowerCase();
  const assignedEmail = (job.assigned_worker_email || '').trim().toLowerCase();

  const userEmail = (user?.email || profile?.email || '').trim().toLowerCase();
  const userId = (user?.id || profile?.id || '').trim().toLowerCase();
  const fullName = (profile?.full_name || user?.user_metadata?.full_name || '').trim().toLowerCase();
  const realEmail = (profile?.real_email || '').trim().toLowerCase();
  const userPrefix = userEmail ? userEmail.split('@')[0] : (userId ? userId.replace(/^worker-/, '') : '');

  // 1. Direct matches with Email or ID
  if (userEmail && (assigned === userEmail || assignedName === userEmail || assignedEmail === userEmail)) return true;
  if (userId && (assigned === userId || assignedName === userId || assignedEmail === userId)) return true;
  if (realEmail && (assigned === realEmail || assignedName === realEmail)) return true;

  // 2. Prefix / username match (e.g. 'hemanth' matches 'hemanth@kpr.com' or 'worker-hemanth')
  if (userPrefix) {
    const cleanAssigned = assigned.replace(/^worker-/, '').replace(/@.*$/, '');
    const cleanAssignedName = assignedName.replace(/^worker-/, '').replace(/@.*$/, '');
    if (cleanAssigned && (cleanAssigned === userPrefix || cleanAssigned.includes(userPrefix) || userPrefix.includes(cleanAssigned))) return true;
    if (cleanAssignedName && (cleanAssignedName === userPrefix || cleanAssignedName.includes(userPrefix) || userPrefix.includes(cleanAssignedName))) return true;
  }

  // 3. Full Name match
  if (fullName) {
    if (assigned === fullName || assignedName === fullName) return true;
    if (assigned.includes(fullName) || fullName.includes(assigned)) return true;
  }

  // 4. Fallback contains prefix
  if (assigned && userPrefix && (assigned.includes(userPrefix) || userPrefix.includes(assigned))) return true;

  return false;
}

/**
 * Fetch all jobs from backend API, Supabase, and local cache
 */
export async function fetchJobs() {
  const jobsMap = new Map();
  const deletedIds = getDeletedJobIds();
  const apiBase = getBackendApiUrl();

  // 1. Fetch from Render Backend API
  try {
    const res = await fetch(`${apiBase}/app/api/jobs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.jobs)) {
        data.jobs.forEach(j => {
          if (j && j.id && !deletedIds.includes(j.id)) {
            jobsMap.set(j.id, j);
          }
        });
      }
    }
  } catch (e) {}

  // 2. Fetch from Supabase
  try {
    const { data: sJobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(sJobs) && sJobs.length > 0) {
      sJobs.forEach(j => {
        if (j && j.id && !deletedIds.includes(j.id)) {
          // Merge or set
          const existing = jobsMap.get(j.id);
          jobsMap.set(j.id, { ...j, ...existing });
        }
      });
    }
  } catch (e) {}

  // 3. Merge with local cache
  const localList = getLocalJobs();
  localList.forEach(j => {
    if (j && j.id && !deletedIds.includes(j.id) && !jobsMap.has(j.id)) {
      jobsMap.set(j.id, j);
    }
  });

  const allJobs = Array.from(jobsMap.values()).filter(j => {
    const t = (j.title || '').toLowerCase();
    const c = (j.client_name || '').toLowerCase();
    return !t.includes('photogrpher') && !c.includes('hemnath');
  });

  // Sort descending by updated_at or created_at
  allJobs.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());

  // Save merged view locally
  saveLocalJobs(allJobs);

  return allJobs;
}

/**
 * Create a new job
 */
export async function createJob(jobData) {
  const apiBase = getBackendApiUrl();
  const workerEmail = (jobData.assigned_worker || '').trim().toLowerCase() || null;
  const shootDateVal = jobData.shoot_date || jobData.date || null;
  const newId = jobData.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const newJob = {
    id: newId,
    title: (jobData.title || '').trim(),
    client_name: (jobData.client_name || '').trim() || null,
    shoot_type: (jobData.shoot_type || 'Photoshoot').trim(),
    shoot_date: shootDateVal,
    date: shootDateVal,
    due_date: shootDateVal,
    assigned_worker: workerEmail,
    assigned_worker_name: jobData.assigned_worker_name || workerEmail,
    notes: (jobData.notes || '').trim() || null,
    status: jobData.status || 'in_progress',
    progress_percent: jobData.progress_percent || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Optimistic Local Storage
  const current = getLocalJobs();
  saveLocalJobs([newJob, ...current.filter(j => j.id !== newId)]);

  // 2. Post to Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
  } catch (e) {}

  // 3. Supabase insert
  try {
    await supabase.from('jobs').insert([{
      title: newJob.title,
      client_name: newJob.client_name,
      shoot_type: newJob.shoot_type,
      shoot_date: newJob.shoot_date,
      assigned_worker: null, // Avoid UUID schema clash
      notes: newJob.notes,
      status: newJob.status,
      progress_percent: newJob.progress_percent
    }]);
  } catch (e) {}

  // 4. Broadcast
  broadcastJobChange({ type: 'create', job: newJob });

  return { success: true, job: newJob };
}

/**
 * Update an existing job
 */
export async function updateJob(jobId, updates) {
  if (!jobId) return { success: false };
  const apiBase = getBackendApiUrl();

  const workerEmail = updates.assigned_worker !== undefined 
    ? ((updates.assigned_worker || '').trim().toLowerCase() || null)
    : undefined;

  const shootDateVal = updates.shoot_date !== undefined ? updates.shoot_date : updates.date;

  const currentList = getLocalJobs();
  const existingJob = currentList.find(j => j.id === jobId) || {};

  const updatedJob = {
    ...existingJob,
    ...updates,
    id: jobId,
    ...(workerEmail !== undefined ? { assigned_worker: workerEmail, assigned_worker_name: updates.assigned_worker_name || workerEmail } : {}),
    ...(shootDateVal !== undefined ? { shoot_date: shootDateVal, date: shootDateVal, due_date: shootDateVal } : {}),
    updated_at: new Date().toISOString()
  };

  // 1. Update Local Storage
  saveLocalJobs(currentList.map(j => j.id === jobId ? updatedJob : j));

  // 2. Update Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedJob)
    });
  } catch (e) {}

  // 3. Update Supabase
  try {
    await supabase
      .from('jobs')
      .update({
        title: updatedJob.title,
        client_name: updatedJob.client_name,
        shoot_type: updatedJob.shoot_type,
        shoot_date: updatedJob.shoot_date,
        notes: updatedJob.notes,
        status: updatedJob.status,
        progress_percent: updatedJob.progress_percent,
        updated_at: updatedJob.updated_at
      })
      .eq('id', jobId);
  } catch (e) {}

  // 4. Broadcast
  broadcastJobChange({ type: 'update', job: updatedJob });

  return { success: true, job: updatedJob };
}

/**
 * Delete a job
 */
export async function deleteJob(jobId) {
  if (!jobId) return { success: false };
  const apiBase = getBackendApiUrl();

  // 1. Add to deleted IDs
  const deletedIds = getDeletedJobIds();
  if (!deletedIds.includes(jobId)) {
    localStorage.setItem(DELETED_JOBS_STORAGE_KEY, JSON.stringify([...deletedIds, jobId]));
  }

  // 2. Remove from local store
  const current = getLocalJobs();
  saveLocalJobs(current.filter(j => j.id !== jobId));

  // 3. Delete from Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  } catch (e) {}

  // 4. Delete from Supabase
  try {
    await supabase.from('jobs').delete().eq('id', jobId);
  } catch (e) {}

  // 5. Broadcast
  broadcastJobChange({ type: 'delete', jobId });

  return { success: true };
}

/**
 * Broadcast job updates across tabs and windows
 */
export function broadcastJobChange(payload) {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_jobs_bc_v1');
      bc.postMessage(payload);
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_jobs_updated', { detail: payload }));
  }
}

/**
 * Subscribe to realtime job updates
 */
export function subscribeToJobsRealtime(callback) {
  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('kpr_jobs_bc_v1');
      bc.onmessage = (event) => {
        if (callback) callback(event.data);
      };
    } catch (e) {}
  }

  const handleCustom = (e) => {
    if (callback) callback(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_jobs_updated', handleCustom);
  }

  // Supabase Realtime channel
  const channel = supabase
    .channel('kpr-jobs-live-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
      if (callback) callback({ type: 'postgres_changes' });
    })
    .subscribe();

  return () => {
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_jobs_updated', handleCustom);
    }
    try {
      supabase.removeChannel(channel);
    } catch (e) {}
  };
}
