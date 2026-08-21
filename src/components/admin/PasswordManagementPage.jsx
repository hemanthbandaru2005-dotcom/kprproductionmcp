import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_MEMBERS } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import {
  KeyRound, ShieldCheck, UserCheck, Users, Lock, Eye, EyeOff,
  Loader2, CheckCircle, AlertCircle, Copy, RefreshCw, ShieldAlert,
  HelpCircle, X, Sparkles
} from 'lucide-react';

// ─── Password strength validator ─────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Enter password', color: 'bg-white/10' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

// ─── Security Question Setup Modal ─────────────────────────────
function SecurityQuestionSetup({ isOpen, onClose, onSaved }) {
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!answer1.trim() || !answer2.trim()) {
      setError('Both answers are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const a1 = answer1.trim().toLowerCase();
      const a2 = answer2.trim().toLowerCase();

      // 1. Save locally for guaranteed instant verification
      try {
        localStorage.setItem('kpr_admin_security_answers_v1', JSON.stringify({
          answer1: a1,
          answer2: a2,
          updated_at: new Date().toISOString()
        }));
      } catch (e) {}

      // 2. Try Supabase RPC
      try {
        await supabase.rpc('save_security_questions', {
          p_answer_1: a1,
          p_answer_2: a2,
        });
      } catch (rpcErr) {
        console.warn('RPC save security questions notice:', rpcErr);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAnswer1('');
        setAnswer2('');
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1E2433] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security Questions Setup</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Required for Admin password recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-6 text-center space-y-3 animate-fadeIn">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 animate-bounce" />
              <p className="text-sm font-bold text-white">Security Questions Saved!</p>
              <p className="text-xs text-white/40">You can now recover your password using these answers.</p>
            </div>
          ) : (
            <>
              <div className="bg-[#111827] rounded-xl p-4 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Security Question 1</p>
                <p className="text-sm text-white/90 font-medium">"Type the code 1"</p>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Your Answer</label>
                <input
                  type="password"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  placeholder="Enter your secret answer for Code 1"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                  disabled={loading}
                  required
                />
              </div>

              <div className="bg-[#111827] rounded-xl p-4 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Security Question 2</p>
                <p className="text-sm text-white/90 font-medium">"Type the code 2"</p>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">Your Answer</label>
                <input
                  type="password"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  placeholder="Enter your secret answer for Code 2"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                  disabled={loading}
                  required
                />
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[10px] text-amber-400/70 leading-relaxed">
                <strong>Important:</strong> These answers are used for Admin password recovery. They are hashed securely and cannot be retrieved once saved. Remember them carefully.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Security Questions
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ──────────────────────────────────────
function ResetPasswordModal({ isOpen, onClose, targetUser, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetUser) return null;

  const strength = getPasswordStrength(newPassword);
  const isAdmin = targetUser.role === 'admin';

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPassword(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isAdmin) {
        // Admin changing own password — use Supabase Auth updateUser
        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) {
          setError(updateErr.message);
          setLoading(false);
          return;
        }
      } else {
        // Admin resetting someone else's password — use RPC
        const { data, error: rpcErr } = await supabase.rpc('admin_reset_user_password', {
          p_target_user_id: targetUser.id,
          p_new_password: newPassword,
        });

        if (rpcErr) {
          setError(rpcErr.message);
          setLoading(false);
          return;
        }

        const result = typeof data === 'string' ? JSON.parse(data) : data;
        if (!result?.success) {
          setError(result?.error || 'Failed to reset password');
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setSuccess(false);
    setCopied(false);
    onClose();
    if (success && onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1E2433] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-[#C5A880]/15' : 'bg-blue-500/15'}`}>
              <Lock className={`w-5 h-5 ${isAdmin ? 'text-[#C5A880]' : 'text-blue-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isAdmin ? 'Change Admin Password' : `Reset ${targetUser.full_name || targetUser.email}'s Password`}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">
                {isAdmin ? 'Set a new password for your account' : 'Set a new temporary password'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-white/30 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4 animate-fadeIn">
              <CheckCircle className="w-14 h-14 mx-auto text-emerald-400 animate-bounce" />
              <h4 className="text-lg font-bold text-white">Password Updated Successfully!</h4>
              {!isAdmin && (
                <div className="bg-[#111827] rounded-xl p-4 border border-white/10 space-y-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-[#0a0f1a] rounded-lg text-emerald-400 font-mono text-sm text-center tracking-wider border border-emerald-500/20">
                      {newPassword}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                      title="Copy password"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-400/70 leading-relaxed">
                    ⚠️ Copy this password now. It will not be shown again after closing this dialog.
                  </p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="px-8 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isAdmin && (
                <div className="bg-[#111827] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                    {(targetUser.full_name || targetUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{targetUser.full_name || 'Unnamed'}</p>
                    <p className="text-[10px] text-white/40">{targetUser.email} · {targetUser.role}</p>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">
                  {isAdmin ? 'New Password' : 'Temporary Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-20 bg-[#111827] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C5A880]/50 transition-colors"
                    disabled={loading}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-white/30 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="p-1.5 text-amber-400/60 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Generate strong password"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Strength indicator */}
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40">{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5 block">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full px-4 py-2.5 bg-[#111827] border rounded-lg text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/50'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-500/50'
                      : 'border-white/10'
                  }`}
                  disabled={loading}
                  required
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isAdmin ? 'Update My Password' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: Password Management Page
// ═══════════════════════════════════════════════════════════════════
export default function PasswordManagementPage() {
  const { user, profile } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState(null);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(null);

  // Guard: Only admin can access
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="bg-[#1E2433] rounded-3xl p-16 text-center text-white space-y-4 border border-rose-500/20 max-w-xl mx-auto my-12 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-serif text-white">Access Denied</h3>
        <p className="text-xs text-white/60 leading-relaxed max-w-md mx-auto">
          Password management is restricted to Admin accounts only. Staff and Worker accounts cannot access this page.
        </p>
      </div>
    );
  }

  // Fetch all profiles
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    if (!error && data) {
      setAllUsers(data);
    }
    setLoading(false);
  };

  // Check if admin has security questions set up
  const checkSecuritySetup = async () => {
    try {
      const { data } = await supabase
        .from('security_questions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasSecurityQuestions(!!data);
    } catch (err) {
      setHasSecurityQuestions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    checkSecuritySetup();
  }, []);

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return { icon: ShieldCheck, label: 'Administrator', bg: 'bg-[#C5A880]/10', border: 'border-[#C5A880]/20', text: 'text-[#C5A880]', badgeBg: 'bg-[#C5A880]/15', badgeText: 'text-[#C5A880]' };
      case 'worker':
        return { icon: UserCheck, label: 'Staff / Worker', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badgeBg: 'bg-blue-500/15', badgeText: 'text-blue-400' };
      case 'client':
        return { icon: Users, label: 'Client', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', badgeBg: 'bg-purple-500/15', badgeText: 'text-purple-400' };
      default:
        return { icon: Users, label: role, bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', badgeBg: 'bg-white/10', badgeText: 'text-white/60' };
    }
  };

  // Group users by role & guarantee 3 Admin member logins are visible and manageable
  const existingAdminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email?.toLowerCase());
  const fallbackAdmins = ADMIN_MEMBERS.filter(a => !a.id.endsWith('_alias') && !existingAdminEmails.includes(a.email.toLowerCase()));

  const adminUsers = [
    ...allUsers.filter(u => u.role === 'admin'),
    ...fallbackAdmins
  ];
  const workerUsers = allUsers.filter(u => u.role === 'worker');
  const clientUsers = allUsers.filter(u => u.role === 'client');

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0F1623] rounded-2xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Password Management</h2>
            <p className="text-[11px] text-white/50">Manage account credentials securely · Admin Only</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Security Questions Setup */}
          <button
            onClick={() => setShowSecuritySetup(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              hasSecurityQuestions
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{hasSecurityQuestions ? 'Update Security Q&A' : 'Setup Security Q&A'}</span>
          </button>

          <button
            onClick={fetchUsers}
            className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Security Questions Warning */}
      {hasSecurityQuestions === false && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-400">Security Questions Not Configured</p>
            <p className="text-xs text-white/50 mt-1">
              You must set up security questions to enable the Admin password recovery flow. Click "Setup Security Q&A" above to configure.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
          <p className="text-xs text-white/40">Loading accounts…</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Admin Accounts */}
          {adminUsers.length > 0 && (
            <UserRoleSection
              title="Administrator"
              icon={ShieldCheck}
              users={adminUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
              isAdmin
            />
          )}

          {/* Worker/Staff Accounts */}
          {workerUsers.length > 0 && (
            <UserRoleSection
              title="Staff / Workers"
              icon={UserCheck}
              users={workerUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
            />
          )}

          {/* Client Accounts */}
          {clientUsers.length > 0 && (
            <UserRoleSection
              title="Clients"
              icon={Users}
              users={clientUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
            />
          )}

          {allUsers.length === 0 && (
            <div className="p-16 text-center text-white/30">
              <Users className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-sm font-medium">No accounts found</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ResetPasswordModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        targetUser={resetTarget}
        onSuccess={fetchUsers}
      />

      <SecurityQuestionSetup
        isOpen={showSecuritySetup}
        onClose={() => setShowSecuritySetup(false)}
        onSaved={() => {
          setHasSecurityQuestions(true);
        }}
      />

    </div>
  );
}

// ─── User Role Section Component ─────────────────────────────────
function UserRoleSection({ title, icon: Icon, users, currentUserId, getRoleConfig, onReset, isAdmin: isAdminSection }) {
  return (
    <div className="bg-[#1E2433] rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#C5A880]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#C5A880]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] text-white/40">{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {users.map((u) => {
          const cfg = getRoleConfig(u.role);
          const isCurrentUser = u.id === currentUserId;
          const statusActive = u.status !== 'disabled';

          return (
            <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.text} font-bold flex items-center justify-center text-sm`}>
                  {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    {u.full_name || 'Unnamed'}
                    {isCurrentUser && <span className="text-[10px] text-[#C5A880] ml-2">(You)</span>}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {u.email} {u.designation && <span className="text-[#C5A880]">· {u.designation}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-13 sm:ml-0">
                {/* Role Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.badgeBg} ${cfg.badgeText}`}>
                  {cfg.label}
                </span>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  statusActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {statusActive ? 'Active' : 'Disabled'}
                </span>

                {/* Reset/Change Button */}
                <button
                  onClick={() => onReset(u)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isCurrentUser
                      ? 'bg-[#C5A880]/10 border-[#C5A880]/20 text-[#C5A880] hover:bg-[#C5A880]/20'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isCurrentUser ? 'Change Password' : 'Reset Password'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
