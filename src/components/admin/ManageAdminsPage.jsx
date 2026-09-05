import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck, UserPlus, RefreshCw, Eye, EyeOff, Copy, Check,
  Search, Lock, User, AlertCircle, CheckCircle, Trash2, X,
  ShieldAlert, Sparkles, Phone, Power, CheckCircle2, Key, Loader2, MessageSquare
} from 'lucide-react';

export default function ManageAdminsPage() {
  const { profile, fetchAdminAccounts, createAdminAccount, toggleAdminStatus, resetAccountTempPassword } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  // Add Admin form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [createdAdminCreds, setCreatedAdminCreds] = useState(null);
  const [copied, setCopied] = useState(false);

  // Status toggle confirmation modal
  const [statusConfirmAdmin, setStatusConfirmAdmin] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Reset Password State
  const [resetModalAdmin, setResetModalAdmin] = useState(null);
  const [resetAdminTempPw, setResetAdminTempPw] = useState('');
  const [resetAdminLoading, setResetAdminLoading] = useState(false);
  const [resetAdminError, setResetAdminError] = useState('');
  const [resetAdminSuccessCreds, setResetAdminSuccessCreds] = useState(null);
  const [resetAdminCopied, setResetAdminCopied] = useState(false);

  const isMasterAdmin = profile?.role === 'superadmin' || profile?.username === 'master';

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminAccounts();
      setAdmins(list || []);
    } catch (e) {
      console.warn('Failed loading admins:', e);
    }
    setLoading(false);
  };

  const handleOpenResetModal = (admin) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetModalAdmin(admin);
    setResetAdminTempPw(pass);
    setResetAdminError('');
    setResetAdminSuccessCreds(null);
    setResetAdminCopied(false);
  };

  const handleExecuteAdminPasswordReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetModalAdmin) return;
    const cleanPw = resetAdminTempPw.trim();
    if (!cleanPw || cleanPw.length < 6) {
      setResetAdminError('Password must be at least 6 characters.');
      return;
    }

    setResetAdminLoading(true);
    setResetAdminError('');

    try {
      const res = await resetAccountTempPassword(resetModalAdmin, cleanPw);
      if (!res.success) {
        setResetAdminError(res.error || 'Failed to reset admin password.');
        setResetAdminLoading(false);
        return;
      }

      // Update in table
      setAdmins(prev => prev.map(a => {
        if ((a.username && a.username.toLowerCase() === resetModalAdmin.username?.toLowerCase()) || a.id === resetModalAdmin.id) {
          return {
            ...a,
            temp_password: cleanPw,
            is_temp_password: true,
            first_login_at: null
          };
        }
        return a;
      }));

      setResetAdminSuccessCreds({
        fullName: resetModalAdmin.full_name || resetModalAdmin.username,
        username: resetModalAdmin.username,
        password: cleanPw
      });
      showToast(`Password for "${resetModalAdmin.username}" reset successfully!`);
    } catch (err) {
      setResetAdminError(err.message || 'Failed to reset admin password.');
    } finally {
      setResetAdminLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setUsername('');
    generatePassword();
    setShowFormPassword(false);
    setFormError('');
    setCreatedAdminCreds(null);
    setCopied(false);
    setIsAddModalOpen(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanFullName = fullName.trim();
    const cleanPassword = tempPassword.trim();

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (cleanUsername.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }

    if (cleanPassword.length < 6) {
      setFormError('Temporary password must be at least 6 characters.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const res = await createAdminAccount({
        fullName: cleanFullName,
        username: cleanUsername,
        tempPassword: cleanPassword,
        role: 'admin'
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to create admin account.');
        setFormLoading(false);
        return;
      }

      setCreatedAdminCreds({
        fullName: cleanFullName,
        username: cleanUsername,
        password: cleanPassword
      });
      await loadAdmins();
      showToast(`Admin account "${cleanUsername}" created successfully!`);
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    }
    setFormLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!statusConfirmAdmin) return;
    setStatusUpdating(true);
    const target = statusConfirmAdmin;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';

    try {
      await toggleAdminStatus(target.username || target.id, newStatus);
      await loadAdmins();
      showToast(`Admin "${target.username}" ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
    } catch (e) {
      showToast(`Failed to update admin status.`);
    }
    setStatusUpdating(false);
    setStatusConfirmAdmin(null);
  };

  const togglePasswordVisibility = (adminKey) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [adminKey]: !prev[adminKey]
    }));
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isMasterAdmin) {
    return (
      <div className="bg-white rounded-[24px] p-8 border border-[#E7E8EB] text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#111111]">Access Restricted</h3>
        <p className="text-xs text-[#6B7280] max-w-md mx-auto">
          Only the <strong>Master Admin (Superadmin)</strong> is authorized to view and manage Studio Admin accounts.
        </p>
      </div>
    );
  }

  const filteredAdmins = admins.filter(a => {
    const q = search.toLowerCase().trim();
    return (
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.username || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ════════════════════════════════════════════════════════════════════════════
          HEADER BAR: Title, Search & "+ Add Admin" Action
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E7E8EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#111111] tracking-tight">
              Manage Admins
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
              Master Admin Control
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Create, monitor, and manage secondary studio admins with username-based credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadAdmins}
            disabled={loading}
            className="p-2.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer"
            title="Refresh Admin List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Admin</span>
          </button>
        </div>
      </div>

      {/* Global Toast Alert */}
      {toastMsg && (
        <div className="w-full bg-[#DFF5E3] border border-[#16A34A]/30 text-[#16A34A] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-[#16A34A] hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          SEARCH & TABLE SECTION
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E8EB] overflow-hidden shadow-xs">
        
        {/* Search Input Filter */}
        <div className="p-4 sm:p-5 border-b border-[#E7E8EB] flex items-center justify-between gap-3 bg-[#FAFAFA]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin by name or username…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]"
            />
          </div>
          <span className="text-xs text-[#6B7280] font-mono font-bold">
            {filteredAdmins.length} Admin{filteredAdmins.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Admins Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase tracking-wider text-[10px] border-b border-[#E7E8EB]">
                <th className="py-3.5 px-4 sm:px-6">Admin Name</th>
                <th className="py-3.5 px-4 sm:px-6">Username</th>
                <th className="py-3.5 px-4 sm:px-6">Role</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Created On</th>
                <th className="py-3.5 px-4 sm:px-6">Temp Password</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E8EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                    <div className="w-6 h-6 border-2 border-[#141414] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading admins...</span>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                    No admin accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSuper = admin.role === 'superadmin' || admin.username === 'master';
                  const adminKey = admin.username || admin.id;
                  const isPwRevealed = !!revealedPasswords[adminKey];
                  const hasNeverLoggedIn = !admin.first_login_at && !!admin.temp_password;

                  return (
                    <tr key={adminKey} className="hover:bg-[#F9FAFB] transition-colors">
                      {/* 1. Admin Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                            isSuper ? 'bg-[#7E22CE]' : 'bg-[#141414]'
                          }`}>
                            {(admin.full_name || admin.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#111111] block">
                              {admin.full_name || 'Admin User'}
                            </span>
                            {isSuper && (
                              <span className="text-[9px] font-semibold text-[#7E22CE]">Master Administrator</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Username */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-mono font-bold text-[#111111] bg-[#F1F2F4] px-2.5 py-1 rounded-md text-[11px]">
                          {admin.username}
                        </span>
                      </td>

                      {/* 3. Role */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSuper
                            ? 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]'
                            : 'bg-[#F1F2F4] text-[#374151]'
                        }`}>
                          {admin.role}
                        </span>
                      </td>

                      {/* 4. Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          admin.status === 'active'
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            admin.status === 'active' ? 'bg-[#059669]' : 'bg-[#DC2626]'
                          }`} />
                          <span>{admin.status || 'active'}</span>
                        </span>
                      </td>

                      {/* 5. Created Date */}
                      <td className="py-3.5 px-4 sm:px-6 text-[#6B7280] font-mono text-[11px]">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* 6. Temp Password Visibility */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {hasNeverLoggedIn ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-[#111111] bg-[#F9FAFB] border border-[#E7E8EB] px-2 py-0.5 rounded">
                              {isPwRevealed ? admin.temp_password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(adminKey)}
                              className="p-1 text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                              title={isPwRevealed ? 'Hide temp password' : 'View temp password'}
                            >
                              {isPwRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#9CA3AF] font-medium italic">
                            Set by user (hidden)
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {!isSuper ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenResetModal(admin)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF] transition-colors cursor-pointer flex items-center gap-1"
                              title="Reset Password (Anytime)"
                            >
                              <Key className="w-3 h-3" />
                              <span>Reset</span>
                            </button>

                            <button
                              onClick={() => setStatusConfirmAdmin(admin)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                                admin.status === 'active'
                                  ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                                  : 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                              }`}
                              title={admin.status === 'active' ? 'Deactivate Admin' : 'Activate Admin'}
                            >
                              <Power className="w-3 h-3" />
                              <span>{admin.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#9CA3AF] font-semibold">
                            Primary
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          ADD ADMIN MODAL
          ════════════════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7E8EB] shadow-2xl w-full max-w-lg overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E8EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Add New Studio Admin</h3>
                  <p className="text-xs text-[#6B7280]">Create an admin account using Username only (no email required).</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Confirmation */}
            {createdAdminCreds ? (
              <div className="p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#065F46]">Admin Account Created Successfully!</h4>
                  <p className="text-xs text-[#047857]">
                    Share these initial login credentials with the admin.
                  </p>
                </div>

                {/* Plain-text Credentials Card */}
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E7E8EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">Full Name:</span>
                    <span className="text-xs font-bold text-[#111111]">{createdAdminCreds.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">Username:</span>
                    <span className="text-xs font-mono font-bold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#E7E8EB]">
                      {createdAdminCreds.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">Temporary Password:</span>
                    <span className="text-xs font-mono font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded border border-[#E9D5FF]">
                      {createdAdminCreds.password}
                    </span>
                  </div>
                </div>

                {/* Actions: Copy Password & WhatsApp Share */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(
                      `KPR Productions Admin Login:\nUsername: ${createdAdminCreds.username}\nPassword: ${createdAdminCreds.password}\nLogin Portal: https://kprproductionmcp-hemanthbandaru2005-4637s-projects.vercel.app/#login`
                    )}
                    className="w-full flex-1 py-3 px-4 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hello! Here are your KPR Studio Admin credentials:\n\n👤 Username: ${createdAdminCreds.username}\n🔑 Password: ${createdAdminCreds.password}\n\nLogin here: https://kprproductionmcp-hemanthbandaru2005-4637s-projects.vercel.app/#login`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold underline cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl text-[#DC2626] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Username * (Login Identifier)
                    </label>
                    <span className="text-[10px] text-[#9CA3AF]">No @ symbol needed</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. admin_ramesh"
                      className="w-full px-4 py-2.5 font-mono bg-[#F9FAFB] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]"
                    />
                  </div>
                </div>

                {/* Temporary Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-bold text-[#7E22CE] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate New</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Enter or auto-generate temp password"
                      className="w-full pl-9 pr-10 py-2.5 font-mono bg-[#F9FAFB] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111111] transition-colors p-1"
                      title={showFormPassword ? 'Hide password' : 'Show password'}
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E7E8EB]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-full border border-[#E7E8EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{formLoading ? 'Creating...' : 'Create Admin'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          DEACTIVATE / ACTIVATE CONFIRMATION MODAL
          ════════════════════════════════════════════════════════════════════════════ */}
      {statusConfirmAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7E8EB] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                statusConfirmAdmin.status === 'active' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'
              }`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  {statusConfirmAdmin.status === 'active' ? 'Deactivate Admin Account?' : 'Reactivate Admin Account?'}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Admin: <strong>{statusConfirmAdmin.full_name || statusConfirmAdmin.username}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B7280] leading-relaxed">
              {statusConfirmAdmin.status === 'active'
                ? 'Deactivating this admin blocks all future login attempts immediately. All previous activity, jobs, and records created by this admin will be preserved.'
                : 'Reactivating this admin allows them to log in again with their existing credentials.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E7E8EB]">
              <button
                type="button"
                onClick={() => setStatusConfirmAdmin(null)}
                className="px-4 py-2 rounded-full border border-[#E7E8EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleToggleStatus}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
                  statusConfirmAdmin.status === 'active'
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                    : 'bg-[#059669] hover:bg-[#047857]'
                }`}
              >
                {statusUpdating ? 'Updating...' : statusConfirmAdmin.status === 'active' ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          RESET ADMIN PASSWORD MODAL (MASTER ADMIN ONLY)
          ════════════════════════════════════════════════════════════════════════════ */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn text-[#111111]">
          <div className="bg-white rounded-3xl border border-[#E7E8EB] shadow-2xl w-full max-w-lg overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E8EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Reset Studio Admin Password</h3>
                  <p className="text-xs text-[#6B7280]">Generates a new temporary login password</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalAdmin(null)}
                className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {resetAdminSuccessCreds ? (
              <div className="p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#065F46]">Admin Password Reset Successfully!</h4>
                  <p className="text-xs text-[#047857]">
                    Share these new login credentials with the studio admin.
                  </p>
                </div>

                {/* Plain-text Credentials Card */}
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E7E8EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">Full Name:</span>
                    <span className="text-xs font-bold text-[#111111]">{resetAdminSuccessCreds.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">Username:</span>
                    <span className="text-xs font-mono font-bold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#E7E8EB]">
                      {resetAdminSuccessCreds.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">New Temp Password:</span>
                    <span className="text-xs font-mono font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded border border-[#E9D5FF]">
                      {resetAdminSuccessCreds.password}
                    </span>
                  </div>
                </div>

                {/* Actions: Copy Password & WhatsApp Share */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `KPR Productions Admin Login:\nUsername: ${resetAdminSuccessCreds.username}\nNew Password: ${resetAdminSuccessCreds.password}\nLogin Portal: ${window.location.origin}/#login`;
                      navigator.clipboard.writeText(text);
                      setResetAdminCopied(true);
                      setTimeout(() => setResetAdminCopied(false), 2500);
                    }}
                    className="w-full flex-1 py-3 px-4 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {resetAdminCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{resetAdminCopied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hello! Here are your updated KPR Studio Admin credentials:\n\n👤 Username: ${resetAdminSuccessCreds.username}\n🔑 New Password: ${resetAdminSuccessCreds.password}\n\nLogin here: ${window.location.origin}/#login`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setResetModalAdmin(null)}
                    className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold underline cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteAdminPasswordReset} className="p-6 space-y-4">
                {resetAdminError && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl text-[#DC2626] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetAdminError}</span>
                  </div>
                )}

                <div className="bg-[#F8F9FA] border border-[#E7E8EB] rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Admin Name:</span>
                    <strong className="text-[#111111]">{resetModalAdmin.full_name || resetModalAdmin.username}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Username:</span>
                    <span className="font-mono text-[#7E22CE] font-bold">{resetModalAdmin.username}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      New Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                        let pass = '';
                        for (let i = 0; i < 10; i++) {
                          pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setResetAdminTempPw(pass);
                      }}
                      className="text-[11px] font-bold text-[#7E22CE] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate New</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={resetAdminTempPw}
                      onChange={(e) => setResetAdminTempPw(e.target.value)}
                      placeholder="Enter or auto-generate temp password"
                      className="w-full pl-9 pr-4 py-2.5 font-mono bg-[#F9FAFB] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]"
                    />
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">
                    This password will remain visible in the table until the admin logs in again.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E7E8EB]">
                  <button
                    type="button"
                    onClick={() => setResetModalAdmin(null)}
                    className="px-4 py-2.5 rounded-full border border-[#E7E8EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetAdminLoading || !resetAdminTempPw.trim()}
                    className="px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {resetAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>{resetAdminLoading ? 'Resetting...' : 'Confirm Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
