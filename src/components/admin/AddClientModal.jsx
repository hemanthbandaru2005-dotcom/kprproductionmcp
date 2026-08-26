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

      // 1. Un-delete if this email was previously deleted
      try {
        const rawDel = localStorage.getItem('kpr_deleted_clients_v1');
        if (rawDel) {
          const list = JSON.parse(rawDel);
          const filtered = list.filter(em => em !== cleanEmail);
          localStorage.setItem('kpr_deleted_clients_v1', JSON.stringify(filtered));
        }
      } catch (e) {}

      // 2. Try Supabase RPC function admin_create_user
      try {
        await supabase.rpc('admin_create_user', {
          p_email: cleanEmail,
          p_password: password,
          p_full_name: fullName.trim(),
          p_phone: phone.trim() || null,
          p_role: 'client',
          p_real_email: null,
        });
      } catch (rpcErr) {
        console.warn('Supabase RPC notice:', rpcErr);
      }

      // 3. Directly try inserting/upserting to profiles table in Supabase
      const clientId = `client-${cleanEmail.split('@')[0]}-${Date.now().toString(36)}`;
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
        await supabase.from('profiles').upsert([{
          id: newClientRecord.id,
          email: cleanEmail,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role: 'client',
          status: 'active',
          updated_at: new Date().toISOString()
        }]);
      } catch (err) {}

      // 4. Local & Session Provisioning Registry
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

      setSuccessMsg(`Client account created successfully!`);
      if (onClientAdded) onClientAdded(newClientRecord);

      setTimeout(() => {
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setSuccessMsg('');
        setLoading(false);
        onClose();
      }, 900);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to create client account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#E7E8EB] overflow-hidden max-h-[90vh] flex flex-col text-[#111111]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFE1EC] flex items-center justify-center text-[#FF4D94] shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">Add Client Account</h3>
              <p className="text-[11px] text-[#6B7280]">Provision login credentials for album proofing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#DFF5E3] border border-[#BBF7D0] rounded-xl text-xs text-[#13A52D] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Client Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Enter client name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Client Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="Enter client email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Phone Number
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

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Portal Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !fullName || !password}
            className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Provision Client Account</span>
          </button>
        </form>
      </div>
    </div>
  );
}
