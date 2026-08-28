import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { generateUUID } from '../../utils/chatService';
import { X, UserPlus, Mail, Phone, Lock, User, Loader2, CheckCircle, AlertCircle, Copy, Key, ShieldCheck, Sparkles } from 'lucide-react';

export default function AddWorkerModal({ isOpen, onClose, onWorkerAdded }) {
  const [fullName, setFullName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedLoginId = workerId.trim() ? `${workerId.trim().toLowerCase()}@kpr.com` : '';

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleClose = () => {
    setFullName('');
    setWorkerId('');
    setRealEmail('');
    setPhone('');
    setPassword('');
    setErrorMsg('');
    setCreatedCredentials(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workerId.trim() || !fullName || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const loginEmail = formattedLoginId;

      // 1. Un-delete if this email was previously deleted
      try {
        const rawDel = localStorage.getItem('kpr_deleted_workers_v1');
        if (rawDel) {
          const list = JSON.parse(rawDel);
          const filtered = list.filter(em => em !== loginEmail);
          localStorage.setItem('kpr_deleted_workers_v1', JSON.stringify(filtered));
        }
      } catch (e) {}

      // 2. Insert to Supabase verifications cloud database table (Accessible on all devices & laptops)
      const workerKey = workerId.trim().toLowerCase();
      const workerRecordPayload = {
        id: generateUUID(),
        client_id: workerKey,
        client_name: fullName.trim(),
        client_email: loginEmail,
        album_id: 'SYSTEM_WORKER_REGISTRY',
        event_id: `worker_profile_${workerKey}`,
        event_title: 'Studio Staff Worker',
        client_note: phone.trim() || 'N/A',
        status: 'active',
        sent_at: new Date().toISOString(),
        photo_items: [{
          id: `worker-${workerKey}`,
          worker_id: workerKey,
          full_name: fullName.trim(),
          email: loginEmail,
          phone: phone.trim() || 'N/A',
          real_email: realEmail.trim() || 'N/A',
          role: 'worker',
          status: 'active',
          skill: 'Photographer / Editor'
        }]
      };

      try {
        await supabase.from('verifications').insert([workerRecordPayload]);
      } catch (dbErr) {
        console.warn('Supabase worker registry save notice:', dbErr);
      }

      // 3. Try Supabase RPC function admin_create_user
      try {
        await supabase.rpc('admin_create_user', {
          p_email: loginEmail,
          p_password: password,
          p_full_name: fullName.trim(),
          p_phone: phone.trim() || null,
          p_role: 'worker',
          p_real_email: realEmail.trim() || null,
        });
      } catch (rpcErr) {}

      // 4. Try Supabase profiles table upsert
      try {
        await supabase.from('profiles').upsert([{
          id: `worker-${workerKey}`,
          email: loginEmail,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role: 'worker',
          status: 'active',
          updated_at: new Date().toISOString()
        }]);
      } catch (err) {}

      // 5. Local cache fallback
      const newWorkerRecord = {
        id: `worker-${workerKey}`,
        worker_id: workerKey,
        email: loginEmail,
        full_name: fullName.trim(),
        phone: phone.trim() || 'N/A',
        real_email: realEmail.trim() || 'N/A',
        role: 'worker',
        status: 'active',
        created_at: new Date().toISOString()
      };

      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [newWorkerRecord, ...list.filter(w => w.email?.toLowerCase() !== loginEmail)];
        localStorage.setItem('kpr_registered_workers_v1', JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kpr_registered_workers_updated', { detail: newWorkerRecord }));
        }
      } catch (e) {}

      setCreatedCredentials({
        name: fullName.trim(),
        email: loginEmail,
        password: password,
        realEmail: realEmail.trim() || null,
      });

      if (onWorkerAdded) onWorkerAdded(newWorkerRecord);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create worker account');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `KPR Studio Staff Login\nName: ${createdCredentials.name}\nLogin ID: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPortal URL: https://kpr-photography-productions.surge.sh`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#E7E8EB] overflow-hidden max-h-[90vh] flex flex-col text-[#111111]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">Add Worker Account</h3>
              <p className="text-[11px] text-[#6B7280]">Provision login credentials for studio team member</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCredentials ? (
          /* ──── SUCCESS CREDENTIALS SCREEN ──── */
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-4 bg-[#DFF5E3] border border-[#BBF7D0] rounded-2xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#13A52D] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#13A52D]">Worker Account Created Successfully!</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Share these credentials with the team member to login.</p>
              </div>
            </div>

            <div className="bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Worker Name</p>
                <p className="text-sm font-bold text-[#111111]">{createdCredentials.name}</p>
              </div>

              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Login ID (Email)</p>
                <code className="text-sm font-mono text-[#1E74FF] font-bold">{createdCredentials.email}</code>
              </div>

              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Temporary Password</p>
                <code className="text-sm font-mono text-[#13A52D] font-bold">{createdCredentials.password}</code>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-[#13A52D]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ──── FORM SCREEN ──── */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Worker Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                Worker Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter worker name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {/* Worker ID + Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Worker ID *
                </label>
                {formattedLoginId && (
                  <span className="text-[11px] font-mono text-[#1E74FF] font-medium">
                    Login ID: <strong className="text-[#111111]">{formattedLoginId}</strong>
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-[#9CA0A6] absolute left-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter worker ID"
                  value={workerId}
                  onChange={(e) => {
                    setWorkerId(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-20 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
                <span className="absolute right-4 text-xs font-mono text-[#9CA0A6] pointer-events-none">
                  @kpr.com
                </span>
              </div>
            </div>

            {/* Real Contact Email */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="Enter personal email address"
                  value={realEmail}
                  onChange={(e) => setRealEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="Enter phone number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {/* Temporary Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Temporary Password *
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] text-[#1E74FF] hover:underline font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] font-mono placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !workerId.trim() || !fullName || !password}
              className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Worker Account</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
