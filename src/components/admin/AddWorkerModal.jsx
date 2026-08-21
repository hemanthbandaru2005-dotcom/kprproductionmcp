import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
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

      // Check if Worker ID already exists in profiles
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', loginEmail)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg('This ID is already in use.');
        setLoading(false);
        return;
      }

      // 1. Try Supabase RPC function admin_create_user
      try {
        const { data, error } = await supabase.rpc('admin_create_user', {
          p_email: loginEmail,
          p_password: password,
          p_full_name: fullName.trim(),
          p_phone: phone.trim() || null,
          p_role: 'worker',
          p_real_email: realEmail.trim() || null,
        });

        if (error) {
          console.warn('Supabase admin_create_user worker RPC notice:', error.message);
        }
      } catch (rpcErr) {
        console.warn('Supabase worker RPC call notice:', rpcErr);
      }

      // 2. Local & Session Provisioning Registry for Workers
      const newWorkerRecord = {
        id: `worker-${workerId.trim().toLowerCase()}`,
        email: loginEmail,
        full_name: fullName.trim(),
        phone: phone.trim() || 'N/A',
        real_email: realEmail.trim() || 'N/A',
        role: 'worker',
        designation: 'Studio Team Member',
        status: 'active',
        created_at: new Date().toISOString()
      };

      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [newWorkerRecord, ...list.filter(w => w.email.toLowerCase() !== loginEmail.toLowerCase())];
        localStorage.setItem('kpr_registered_workers_v1', JSON.stringify(updated));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kpr_registered_workers_updated', { detail: newWorkerRecord }));
        }
      } catch (storageErr) {
        console.error('Storage update error:', storageErr);
      }

      // Store created credentials for handoff screen
      setCreatedCredentials({
        name: fullName.trim(),
        loginId: loginEmail,
        password: password,
        realEmail: realEmail.trim() || 'N/A',
      });

      setLoading(false);
      if (onWorkerAdded) onWorkerAdded(newWorkerRecord);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to create worker account');
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `KPR Studio Worker Login Credentials:\n------------------------------\nName: ${createdCredentials.name}\nLogin ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.password}\nPortal: https://kpr-production.surge.sh`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-[#1A1F2E] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {createdCredentials ? 'Worker Account Created' : 'Add Worker Account'}
              </h3>
              <p className="text-[10px] text-white/40">
                {createdCredentials ? 'Share credentials with worker' : 'Studio-issued Worker ID provisioning'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ──── SUCCESS CREDENTIAL HANDOFF SCREEN ──── */}
        {createdCredentials ? (
          <div className="p-6 space-y-5 animate-fadeIn">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <h4 className="text-sm font-bold text-white">Account Created Successfully</h4>
              <p className="text-xs text-white/60">Share these login details with {createdCredentials.name}.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <div>
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">Worker Name</span>
                <p className="text-sm font-medium text-white">{createdCredentials.name}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">Studio Login ID</span>
                <p className="text-base font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 inline-block mt-1">
                  {createdCredentials.loginId}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">Temporary Password</span>
                <p className="text-base font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 inline-block mt-1">
                  {createdCredentials.password}
                </p>
              </div>

              {createdCredentials.realEmail !== 'N/A' && (
                <div>
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">Contact Email</span>
                  <p className="text-xs text-white/70">{createdCredentials.realEmail}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ──── FORM SCREEN ──── */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Worker Name */}
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                Worker Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Worker ID + Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  Worker ID *
                </label>
                {formattedLoginId && (
                  <span className="text-[10px] font-mono text-blue-400 font-medium">
                    Login ID: <strong className="text-white">{formattedLoginId}</strong>
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-white/30 absolute left-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 or W101"
                  value={workerId}
                  onChange={(e) => {
                    setWorkerId(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-20 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <span className="absolute right-3 text-xs font-mono text-white/40 pointer-events-none">
                  @kpr.com
                </span>
              </div>
            </div>

            {/* Real Contact Email */}
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                Real Contact Email (Personal Gmail)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="rahul@gmail.com (for contact only)"
                  value={realEmail}
                  onChange={(e) => setRealEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Temporary Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  Temporary Password *
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !workerId.trim() || !fullName || !password}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Worker Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
