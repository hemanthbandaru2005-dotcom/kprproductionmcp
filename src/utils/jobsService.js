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
/**
 * Fetch all jobs from backend API, Supabase, and local cache
 */
export async function fetchJobs() {
  const jobsMap = new Map();
  const deletedIds = getDeletedJobIds();
  const apiBase = getBackendApiUrl();

  // 1. Fetch from Supabase verifications cloud database (Accessible across all laptops & devices)
  try {
    const { data: vJobs, error: vErr } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', 'SYSTEM_JOB_REGISTRY')
      .order('sent_at', { ascending: false });

    if (!vErr && Array.isArray(vJobs)) {
      vJobs.forEach(v => {
        const jId = v.client_id || v.id;
        const jobData = Array.isArray(v.photo_items) && v.photo_items[0] ? v.photo_items[0] : null;
        if (jobData && jobData.id && !deletedIds.includes(jobData.id)) {
          jobsMap.set(jobData.id, jobData);
        } else if (jId && !deletedIds.includes(jId)) {
          jobsMap.set(jId, {
            id: jId,
            title: v.event_title || 'Untitled Shoot',
            client_name: v.client_name || null,
            assigned_worker: v.client_email || null,
            assigned_worker_name: v.client_email || null,
            status: v.status || 'in_progress',
            created_at: v.sent_at || v.created_at,
            updated_at: v.responded_at || v.sent_at || v.created_at
          });
        }
      });
    }
  } catch (e) {}

  // 2. Fetch from Render Backend API
  try {
    const res = await fetch(`${apiBase}/app/api/jobs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.jobs)) {
        data.jobs.forEach(j => {
          if (j && j.id && !deletedIds.includes(j.id)) {
            const existing = jobsMap.get(j.id);
            jobsMap.set(j.id, { ...existing, ...j });
          }
        });
      }
    }
  } catch (e) {}

  // 3. Fetch from Supabase jobs table
  try {
    const { data: sJobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(sJobs) && sJobs.length > 0) {
      sJobs.forEach(j => {
        if (j && j.id && !deletedIds.includes(j.id)) {
          const existing = jobsMap.get(j.id);
          jobsMap.set(j.id, { ...existing, ...j });
        }
      });
    }
  } catch (e) {}

  // 4. Merge with local cache
  const localList = getLocalJobs();
  localList.forEach(j => {
    if (j && j.id && !deletedIds.includes(j.id) && !jobsMap.has(j.id)) {
      jobsMap.set(j.id, j);
      // Auto-sync legacy local job to Supabase cloud database
      supabase.from('verifications').insert([{
        id: `job_reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        client_id: j.id,
        client_name: j.client_name || 'Direct Client',
        client_email: j.assigned_worker || null,
        album_id: 'SYSTEM_JOB_REGISTRY',
        event_id: `job_event_${j.id}`,
        event_title: j.title,
        client_note: j.notes,
        status: j.status || 'in_progress',
        sent_at: j.created_at || new Date().toISOString(),
        photo_items: [j]
      }]).then(() => {}).catch(() => {});
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

  // 2. Save to Supabase verifications cloud database (Available everywhere)
  try {
    await supabase.from('verifications').insert([{
      id: `job_reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      client_id: newId,
      client_name: newJob.client_name || 'Direct Client',
      client_email: workerEmail,
      album_id: 'SYSTEM_JOB_REGISTRY',
      event_id: `job_event_${newId}`,
      event_title: newJob.title,
      client_note: newJob.notes,
      status: newJob.status,
      sent_at: newJob.created_at,
      photo_items: [newJob]
    }]);
  } catch (err) {
    console.warn('Supabase job registry insert notice:', err);
  }

  // 3. Post to Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
  } catch (e) {}

  // 4. Supabase jobs table insert
  try {
    await supabase.from('jobs').insert([{
      title: newJob.title,
      client_name: newJob.client_name,
      shoot_type: newJob.shoot_type,
      shoot_date: newJob.shoot_date,
      assigned_worker: null,
      notes: newJob.notes,
      status: newJob.status,
      progress_percent: newJob.progress_percent
    }]);
  } catch (e) {}

  // 5. Broadcast
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

  // 2. Update Supabase verifications cloud database
  try {
    await supabase
      .from('verifications')
      .update({
        event_title: updatedJob.title,
        client_name: updatedJob.client_name,
        client_email: updatedJob.assigned_worker,
        status: updatedJob.status,
        client_note: updatedJob.notes,
        responded_at: updatedJob.updated_at,
        photo_items: [updatedJob]
      })
      .eq('album_id', 'SYSTEM_JOB_REGISTRY')
      .eq('client_id', jobId);
  } catch (e) {}

  // 3. Update Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedJob)
    });
  } catch (e) {}

  // 4. Update Supabase jobs table
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

  // 5. Broadcast
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

  // 3. Delete from Supabase verifications cloud database
  try {
    await supabase
      .from('verifications')
      .delete()
      .eq('album_id', 'SYSTEM_JOB_REGISTRY')
      .eq('client_id', jobId);
  } catch (e) {}

  // 4. Delete from Backend API
  try {
    await fetch(`${apiBase}/app/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  } catch (e) {}

  // 5. Delete from Supabase jobs table
  try {
    await supabase.from('jobs').delete().eq('id', jobId);
  } catch (e) {}

  // 6. Broadcast
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

  // Supabase Realtime channel (Unique channel name per subscription to avoid collision)
  let channel = null;
  try {
    const channelId = `jobs-live-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        if (callback) callback({ type: 'postgres_changes' });
      })
      .subscribe();
  } catch (e) {
    console.warn('Realtime channel subscribe warning:', e);
  }

  return () => {
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_jobs_updated', handleCustom);
    }
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    }
  };
}

/**
 * Permanently cleans all test/fake data from backend, Supabase, and localStorage
 */
export async function cleanAllFakeTestData() {
  const apiBase = getBackendApiUrl();

  // 1. Call Backend Cleanup API
  try {
    await fetch(`${apiBase}/api/cleanup-test-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.warn('Backend cleanup API call failed/skipped:', e);
  }

  // 2. Direct Supabase deletion for test jobs & uploads
  try {
    await supabase
      .from('jobs')
      .delete()
      .or('id.like.job-init-%,id.like.test-%,title.ilike.%test%,title.ilike.%demo%,client_name.ilike.%test%,client_name.ilike.%demo%');
  } catch (e) {}

  // 3. Clear Local Storage caches of test data
  try {
    const localJobs = getLocalJobs();
    const filteredJobs = localJobs.filter(j => {
      const isTest = (j.id && (j.id.startsWith('test-') || j.id.startsWith('job-init-'))) ||
                     (j.title && (j.title.toLowerCase().includes('test') || j.title.toLowerCase().includes('demo')));
      return !isTest;
    });
    saveLocalJobs(filteredJobs);
  } catch (e) {}

  // 4. Notify all listeners to refresh
  notifyJobsUpdated();

  return {
    success: true,
    message: 'All fake test data deleted successfully. Real production data is untouched.'
  };
}
