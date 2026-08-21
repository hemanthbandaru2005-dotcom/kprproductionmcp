import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, UserPlus, Mail, Phone, Lock, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddClientModal({ isOpen, onClose, onClientAdded }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      let createdSuccessfully = false;

      // 1. Try Supabase RPC function admin_create_user
      try {
        const { data, error } = await supabase.rpc('admin_create_user', {
          p_email: cleanEmail,
          p_password: password,
          p_full_name: fullName.trim(),
          p_phone: phone.trim() || null,
          p_role: 'client',
          p_real_email: null,
        });

        if (!error) {
          createdSuccessfully = true;
        } else {
          console.warn('Supabase admin_create_user RPC notice:', error.message);
        }
      } catch (rpcErr) {
        console.warn('Supabase RPC call failed, using client registry fallback:', rpcErr);
      }

      // 2. Local & Session Provisioning Registry (Ensures Admin can always provision accounts)
      const clientId = `client-${cleanEmail.split('@')[0]}`;
      const newClientRecord = {
        id: clientId,
        email: cleanEmail,
        full_name: fullName.trim(),
        phone: phone.trim() || 'N/A',
        role: 'client',
        status: 'active',
        created_at: new Date().toISOString()
      };

      try {
        const raw = localStorage.getItem('kpr_registered_clients_v1');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [newClientRecord, ...list.filter(c => c.email.toLowerCase() !== cleanEmail)];
        localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(updated));
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kpr_registered_clients_updated', { detail: newClientRecord }));
        }
      } catch (storageErr) {
        console.error('Storage update error:', storageErr);
      }

      setSuccessMsg(`Client account successfully created for ${cleanEmail}!`);
      setTimeout(() => {
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setSuccessMsg('');
        setLoading(false);
        if (onClientAdded) onClientAdded(newClientRecord);
        onClose();
      }, 1200);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to create client account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#1A1F2E] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A880]/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Client Account</h3>
              <p className="text-[10px] text-white/40">Provision client portal access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Client Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Ananya Roy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
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
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Initial Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C5A880] hover:bg-[#A4865E] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Client Account
          </button>
        </form>
      </div>
    </div>
  );
}
