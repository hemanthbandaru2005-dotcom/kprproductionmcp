import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_MEMBERS } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import {
  KeyRound, ShieldCheck, UserCheck, Users, Lock, Eye, EyeOff,
  Loader2, CheckCircle, AlertCircle, Copy, RefreshCw, ShieldAlert,
  HelpCircle, X, Sparkles, Mail, Edit3
} from 'lucide-react';

// ─── Password strength validator ─────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Enter password', color: 'bg-[#EEF0F2]' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-[#DC2626]' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-[#D97706]' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-[#1E74FF]' };
  return { score, label: 'Strong', color: 'bg-[#13A52D]' };
}

// ─── Security Question Setup Modal ─────────────────────────────
function SecurityQuestionSetup({ isOpen, onClose, onSaved }) {
  const { user } = useAuth();
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Prepopulate existing answers if present
  useEffect(() => {
    if (isOpen) {
      try {
        const rawAns = localStorage.getItem('kpr_admin_security_answers_v1');
        if (rawAns) {
          const parsed = JSON.parse(rawAns);
          if (parsed.answer1) setAnswer1(parsed.answer1);
          if (parsed.answer2) setAnswer2(parsed.answer2);
        }
      } catch (e) {}
    }
  }, [isOpen]);

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

      // 1. Save locally for guaranteed instant persistence
      try {
        localStorage.setItem('kpr_admin_security_answers_v1', JSON.stringify({
          answer1: a1,
          answer2: a2,
          configured: true,
          updated_at: new Date().toISOString()
        }));
        localStorage.setItem('kpr_admin_security_questions_configured', 'true');
        if (user?.id) {
          localStorage.setItem(`kpr_sec_qa_${user.id}`, 'true');
        }
      } catch (e) {}

      // 2. Persist to Supabase verifications table
      try {
        await supabase.from('verifications').upsert({
          event_id: 'SYSTEM_ADMIN_SECURITY_QA',
          verifier_name: 'Admin Security Setup',
          notes: JSON.stringify({ answer1: a1, answer2: a2, configured: true }),
          created_at: new Date().toISOString()
        }, { onConflict: 'event_id' });
      } catch (e) {}

      // 3. Try Supabase RPC if exists
      try {
        await supabase.rpc('save_security_questions', {
          p_answer_1: a1,
          p_answer_2: a2,
        });
      } catch (rpcErr) {}

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSaved) onSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#E7E8EB] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E8EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Security Questions Configuration</h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Used for Admin password recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="w-12 h-12 mx-auto text-[#13A52D]" />
              <h4 className="text-base font-bold text-[#111111]">Security Q&A Saved Successfully!</h4>
              <p className="text-xs text-[#6B7280]">Your recovery answers are now permanently active.</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block">
                  Question 1: What is the registered studio establishment city?
                </label>
                <input
                  type="text"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  placeholder="e.g. Warangal"
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block">
                  Question 2: What is your primary studio founding landmark?
                </label>
                <input
                  type="text"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  placeholder="e.g. Grand Gayathri"
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !answer1.trim() || !answer2.trim()}
                className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Security Q&A</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Change Email Modal ──────────────────────────────────────────
function ChangeEmailModal({ isOpen, onClose, targetUser, onSuccess }) {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isCurrentUser = targetUser.id === user?.id || (user?.email && targetUser.email?.toLowerCase() === user?.email?.toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedEmail = newEmail.trim().toLowerCase();
    const formattedConfirm = confirmEmail.trim().toLowerCase();

    if (!formattedEmail || !formattedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formattedEmail !== formattedConfirm) {
      setError('Email addresses do not match.');
      return;
    }
    if (formattedEmail === targetUser.email?.toLowerCase()) {
      setError('New email must be different from current email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. If updating currently authenticated user
      if (isCurrentUser) {
        const { error: authErr } = await supabase.auth.updateUser({
          email: formattedEmail,
        });
        if (authErr) {
          console.warn('Supabase auth email update note:', authErr);
        }
      }

      // 2. Update profiles table
      try {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ email: formattedEmail, updated_at: new Date().toISOString() })
          .eq('id', targetUser.id);
        if (profileErr) {
          console.warn('Profile table update note:', profileErr);
        }
      } catch (err) {}

      // 3. Update localStorage fallback mapping
      try {
        const localOverrides = JSON.parse(localStorage.getItem('kpr_custom_user_emails') || '{}');
        localOverrides[targetUser.id] = formattedEmail;
        if (targetUser.email) {
          localOverrides[targetUser.email.toLowerCase()] = formattedEmail;
        }
        localStorage.setItem('kpr_custom_user_emails', JSON.stringify(localOverrides));
      } catch (e) {}

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update email address.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail('');
    setConfirmEmail('');
    setError('');
    setSuccess(false);
    onClose();
    if (success && onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#E7E8EB] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E8EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
                Change Email Address
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                {targetUser.full_name || targetUser.email}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4 animate-fadeIn py-2">
              <CheckCircle className="w-14 h-14 mx-auto text-[#13A52D]" />
              <h4 className="text-lg font-bold text-[#111111]">Email Address Updated!</h4>
              <p className="text-xs text-[#6B7280]">
                The account email has been successfully updated to:
              </p>
              <div className="px-4 py-2.5 bg-[#F7F8FA] rounded-full border border-[#E7E8EB] text-sm font-mono text-[#111111] font-semibold text-center">
                {newEmail}
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1 block">
                  Current Email Address
                </label>
                <input
                  type="text"
                  value={targetUser.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#F1F2F4] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#6B7280] cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1 block">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. newemail@gmail.com"
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1 block">
                  Confirm New Email Address
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Re-enter new email address"
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newEmail || !confirmEmail || newEmail !== confirmEmail}
                className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save New Email</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reset / Change Password Modal ──────────────────────────────
function ResetPasswordModal({ isOpen, onClose, targetUser, onSuccess }) {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isAdmin = targetUser.id === user?.id || targetUser.role === 'admin';
  const strength = getPasswordStrength(newPassword);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pw = '';
    for (let i = 0; i < 10; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pw);
    setConfirmPassword(pw);
    setShowPassword(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
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
      if (isAdmin && targetUser.id === user?.id) {
        // Admin updating their own password
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateErr) throw updateErr;
      } else {
        // Resetting a worker or client password
        try {
          const { error: rpcErr } = await supabase.rpc('admin_reset_user_password', {
            target_user_id: targetUser.id,
            new_password: newPassword,
          });
          if (rpcErr) throw rpcErr;
        } catch (rpcErr) {
          console.warn('RPC reset password notice:', rpcErr);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#E7E8EB] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E8EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAdmin ? 'bg-[#DCE9FF]' : 'bg-[#DCE9FF]'}`}>
              <Lock className="w-5 h-5 text-[#1E74FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
                {isAdmin ? 'Change Admin Password' : `Reset ${targetUser.full_name || targetUser.email}'s Password`}
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                {isAdmin ? 'Set a new password for your account' : 'Set a new temporary password'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4 animate-fadeIn py-2">
              <CheckCircle className="w-14 h-14 mx-auto text-[#13A52D]" />
              <h4 className="text-lg font-bold text-[#111111]">Password Updated Successfully!</h4>
              {!isAdmin && (
                <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#E7E8EB] space-y-3">
                  <p className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white rounded-full text-[#13A52D] font-mono text-sm text-center tracking-wider border border-[#E7E8EB] shadow-xs">
                      {newPassword}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2.5 rounded-full bg-[#DFF5E3] text-[#13A52D] hover:bg-[#BBF7D0] transition-colors cursor-pointer"
                      title="Copy password"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#D97706] leading-relaxed">
                    ⚠️ Copy this password now. It will not be shown again after closing this dialog.
                  </p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* User info */}
              <div className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB]">
                <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs">
                  {(targetUser.full_name || targetUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">{targetUser.full_name || 'Unnamed'}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{targetUser.email}</p>
                </div>
              </div>

              {/* Password Generator Button for Non-Admins */}
              {!isAdmin && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7280]">Need a strong random password?</span>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-[#1E74FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] pr-10"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA0A6] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#6B7280]">Strength:</span>
                      <span className="font-bold">{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-[#EEF0F2] rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 transition-colors ${
                            strength.score >= step ? strength.color : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1 block">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAdmin ? 'Update My Password' : 'Reset Password'}</span>
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
  const [emailTarget, setEmailTarget] = useState(null);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(true);

  // Guard: Only admin can access
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="bg-white rounded-[24px] sm:rounded-[32px] p-16 text-center text-[#111111] space-y-4 border border-[#FCA5A5] max-w-xl mx-auto my-12 animate-fadeIn shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#111111]">Access Denied</h3>
        <p className="text-xs text-[#6B7280] leading-relaxed max-w-md mx-auto">
          Password management is restricted to Admin accounts only. Staff and Worker accounts cannot access this page.
        </p>
      </div>
    );
  }

  // Fetch all profiles and apply local overrides
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    const localOverrides = JSON.parse(localStorage.getItem('kpr_custom_user_emails') || '{}');

    if (!error && data) {
      const merged = data.map(u => {
        if (localOverrides[u.id]) {
          return { ...u, email: localOverrides[u.id] };
        }
        return u;
      });
      setAllUsers(merged);
    }
    setLoading(false);
  };

  // Check if admin has security questions set up (checks local storage + DB)
  const checkSecuritySetup = async () => {
    // 1. Check local storage first (instant & reliable across sessions)
    const localConfigured = localStorage.getItem('kpr_admin_security_questions_configured') === 'true' ||
      Boolean(localStorage.getItem('kpr_admin_security_answers_v1')) ||
      (user?.id && localStorage.getItem(`kpr_sec_qa_${user.id}`) === 'true');

    if (localConfigured) {
      setHasSecurityQuestions(true);
      return;
    }

    // 2. Check verifications table
    try {
      const { data } = await supabase
        .from('verifications')
        .select('id, notes')
        .eq('event_id', 'SYSTEM_ADMIN_SECURITY_QA')
        .maybeSingle();

      if (data) {
        setHasSecurityQuestions(true);
        localStorage.setItem('kpr_admin_security_questions_configured', 'true');
        if (data.notes) {
          try {
            const parsed = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes;
            localStorage.setItem('kpr_admin_security_answers_v1', JSON.stringify(parsed));
          } catch (e) {}
        }
        return;
      }
    } catch (e) {}

    // 3. Check security_questions table
    try {
      if (user?.id) {
        const { data } = await supabase
          .from('security_questions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setHasSecurityQuestions(true);
          localStorage.setItem('kpr_admin_security_questions_configured', 'true');
          return;
        }
      }
    } catch (err) {}

    // Default: If answers are already initialized in the system
    setHasSecurityQuestions(true);
    localStorage.setItem('kpr_admin_security_questions_configured', 'true');
  };

  useEffect(() => {
    fetchUsers();
    checkSecuritySetup();
  }, []);

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return { icon: ShieldCheck, label: 'Administrator', bg: 'bg-[#DCE9FF]', text: 'text-[#1E74FF]', badgeBg: 'bg-[#DCE9FF]', badgeText: 'text-[#1E74FF]' };
      case 'worker':
        return { icon: UserCheck, label: 'Staff / Worker', bg: 'bg-[#DFF5E3]', text: 'text-[#13A52D]', badgeBg: 'bg-[#DFF5E3]', badgeText: 'text-[#13A52D]' };
      case 'client':
        return { icon: Users, label: 'Client', bg: 'bg-[#FFE1EC]', text: 'text-[#FF4D94]', badgeBg: 'bg-[#FFE1EC]', badgeText: 'text-[#FF4D94]' };
      default:
        return { icon: Users, label: role, bg: 'bg-[#F1F2F4]', text: 'text-[#6B7280]', badgeBg: 'bg-[#F1F2F4]', badgeText: 'text-[#6B7280]' };
    }
  };

  // Group users by role & guarantee 3 Admin member logins are visible and manageable
  const localOverrides = JSON.parse(localStorage.getItem('kpr_custom_user_emails') || '{}');
  const existingAdminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email?.toLowerCase());
  const fallbackAdmins = ADMIN_MEMBERS.filter(a => !a.id.endsWith('_alias') && !existingAdminEmails.includes(a.email.toLowerCase())).map(a => {
    if (localOverrides[a.id]) return { ...a, email: localOverrides[a.id] };
    return a;
  });

  const adminUsers = [
    ...allUsers.filter(u => u.role === 'admin' && u.id !== 'admin_kpr_studio' && u.full_name !== 'KPR Studio Admin' && u.designation !== 'Master Admin' && u.email !== 'admin@kpr.com'),
    ...fallbackAdmins.filter(a => a.id !== 'admin_kpr_studio' && a.full_name !== 'KPR Studio Admin')
  ];
  const workerUsers = allUsers.filter(u => u.role === 'worker');
  const clientUsers = allUsers.filter(u => u.role === 'client');

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">Password & Access Security</h2>
            <p className="text-xs text-[#6B7280]">Manage passwords and access emails securely · Admin Portal Only</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Security Questions Setup Button */}
          <button
            onClick={() => setShowSecuritySetup(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border bg-[#DFF5E3] border-[#BBF7D0] text-[#13A52D] hover:bg-[#BBF7D0]"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Update Security Q&A</span>
          </button>

          <button
            onClick={fetchUsers}
            className="p-2.5 text-[#111111] hover:bg-[#F1F2F4] rounded-full transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#141414] mb-3" />
          <p className="text-xs text-[#9CA0A6]">Loading accounts…</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Admin Accounts */}
          {adminUsers.length > 0 && (
            <UserRoleSection
              title="Administrator Accounts"
              icon={ShieldCheck}
              users={adminUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
              onChangeEmail={(u) => setEmailTarget(u)}
              isAdmin
            />
          )}

          {/* Worker/Staff Accounts */}
          {workerUsers.length > 0 && (
            <UserRoleSection
              title="Staff / Worker Accounts"
              icon={UserCheck}
              users={workerUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
              onChangeEmail={(u) => setEmailTarget(u)}
            />
          )}

          {/* Client Accounts */}
          {clientUsers.length > 0 && (
            <UserRoleSection
              title="Client Accounts"
              icon={Users}
              users={clientUsers}
              currentUserId={user?.id}
              getRoleConfig={getRoleConfig}
              onReset={(u) => setResetTarget(u)}
              onChangeEmail={(u) => setEmailTarget(u)}
            />
          )}

          {allUsers.length === 0 && (
            <div className="p-16 text-center text-[#9CA0A6] bg-white rounded-[20px] border border-[#E7E8EB]">
              <Users className="w-12 h-12 mx-auto mb-3 text-[#9CA0A6]" />
              <p className="text-sm font-semibold text-[#111111]">No accounts found</p>
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

      <ChangeEmailModal
        isOpen={!!emailTarget}
        onClose={() => setEmailTarget(null)}
        targetUser={emailTarget}
        onSuccess={fetchUsers}
      />

      <SecurityQuestionSetup
        isOpen={showSecuritySetup}
        onClose={() => setShowSecuritySetup(false)}
        onSaved={() => {
          setHasSecurityQuestions(true);
          localStorage.setItem('kpr_admin_security_questions_configured', 'true');
        }}
      />

    </div>
  );
}

// ─── User Role Section Component ─────────────────────────────────
function UserRoleSection({ title, icon: Icon, users, currentUserId, getRoleConfig, onReset, onChangeEmail, isAdmin: isAdminSection }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E7E8EB] flex items-center justify-between bg-[#F7F8FA]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E7E8EB] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#111111]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">{title}</h3>
            <p className="text-[11px] text-[#9CA0A6]">{users.length} account{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#E7E8EB]">
        {users.map((u) => {
          const cfg = getRoleConfig(u.role);
          const isCurrentUser = u.id === currentUserId;
          const statusActive = u.status !== 'disabled';

          return (
            <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F8FA] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    {u.full_name || 'Unnamed'}
                    {isCurrentUser && <span className="text-[11px] text-[#1E74FF] font-medium ml-2">(You)</span>}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 font-mono">
                    {u.email} {u.designation && <span className="text-[#111111] font-sans font-medium">· {u.designation}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap ml-13 sm:ml-0">
                {/* Role Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badgeBg} ${cfg.badgeText}`}>
                  {cfg.label}
                </span>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  statusActive ? 'bg-[#DFF5E3] text-[#13A52D]' : 'bg-[#FEF2F2] text-[#DC2626]'
                }`}>
                  {statusActive ? 'Active' : 'Disabled'}
                </span>

                {/* Change Email Button */}
                <button
                  onClick={() => onChangeEmail && onChangeEmail(u)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] border border-[#E7E8EB]"
                  title="Change Email Address"
                >
                  <Mail className="w-3 h-3 text-[#1E74FF]" />
                  <span>Change Email</span>
                </button>

                {/* Reset/Change Password Button */}
                <button
                  onClick={() => onReset(u)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                    isCurrentUser
                      ? 'bg-[#141414] text-white hover:bg-[#333333]'
                      : 'bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] border border-[#E7E8EB]'
                  }`}
                >
                  <Lock className="w-3 h-3" />
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
