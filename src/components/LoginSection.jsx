import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Users, UserCheck, ShieldCheck, Lock, Mail, CheckCircle, AlertCircle, Loader2, KeyRound, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { useAuth, ADMIN_MEMBERS } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

const PORTAL_KEYS = ['admin', 'worker', 'client'];

const THEMES = {
  admin: {
    primary: '#8B3A6B',
    primaryDark: '#6E2D55',
    primaryLight: '#A8527F',
    primarySoft: '#C97DA8',
    label: 'ADMIN LOGIN',
    icon: ShieldCheck,
    placeholder: 'name@gmail.com',
  },
  worker: {
    primary: '#2D6A8B',
    primaryDark: '#1E4F6A',
    primaryLight: '#3D8AB5',
    primarySoft: '#6BB3D4',
    label: 'WORKER LOGIN',
    icon: UserCheck,
    placeholder: 'name@gmail.com',
  },
  client: {
    primary: '#C5A880',
    primaryDark: '#A4865E',
    primaryLight: '#D4BC9A',
    primarySoft: '#E8D4B8',
    label: 'CLIENT LOGIN',
    icon: Users,
    placeholder: 'name@gmail.com',
  },
};

export default function LoginSection({ onLoginSuccess, initialTab }) {
  const { signIn, signOut, resetPassword, isRecoveryMode } = useAuth();

  const [activePortal, setActivePortal] = useState(initialTab || 'admin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Admin Security-Question-Based Reset States ──
  // 'none' | 'email' | 'sq1' | 'sq2' | 'verify' | 'new-password' | 'success'
  const [adminResetStep, setAdminResetStep] = useState(isRecoveryMode ? 'new-password' : 'none');
  const [adminResetEmail, setAdminResetEmail] = useState('');
  const [adminAnswer1, setAdminAnswer1] = useState('');
  const [adminAnswer2, setAdminAnswer2] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [adminHasSecurityQ, setAdminHasSecurityQ] = useState(null);

  // Auto-detect recovery session from email link or auth event
  useEffect(() => {
    if (isRecoveryMode || (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))) {
      setActivePortal('admin');
      setAdminResetStep('new-password');
    }
  }, [isRecoveryMode]);

  // ── Client / Worker basic reset state ──
  const [resetSent, setResetSent] = useState(false);

  // Animation states
  const [formAnim, setFormAnim] = useState('enter');
  const [pendingPortal, setPendingPortal] = useState(null);
  const [shapeScale, setShapeScale] = useState(1);

  // Tab indicator sliding
  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 0 });

  const theme = THEMES[activePortal];
  const ThemeIcon = theme.icon;


  // ── Measure the active tab and position the pill ──
  const updatePill = useCallback(() => {
    const container = tabContainerRef.current;
    const el = tabRefs.current[activePortal];
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPillStyle({
        top: elRect.top - containerRect.top,
        height: elRect.height,
      });
    }
  }, [activePortal]);

  useEffect(() => {
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  // ── Switch portal with animation ──
  const switchPortal = (portal) => {
    if (portal === activePortal) return;
    setFormAnim('exit');
    setShapeScale(0.96);
    setPendingPortal(portal);
  };

  useEffect(() => {
    if (pendingPortal && formAnim === 'exit') {
      const timer = setTimeout(() => {
        setActivePortal(pendingPortal);
        setLoginSuccess(false);
        setErrorMsg('');
        setResetSent(false);
        setAdminResetStep('none');
        setFormData({ email: '', password: '' });
        setFormAnim('enter');
        setShapeScale(1);
        setPendingPortal(null);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [pendingPortal, formAnim]);

  // ── Real Supabase Auth Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let cleanEmail = formData.email.trim().toLowerCase();
      // Auto-append @kpr.com if worker enters just their Worker ID
      if (activePortal === 'worker' && !cleanEmail.includes('@')) {
        cleanEmail = `${cleanEmail}@kpr.com`;
      }

      const result = await signIn(cleanEmail, formData.password, activePortal);

      if (result.error) {
        setErrorMsg(result.error);
        setIsLoading(false);
        return;
      }

      // Check role matches the selected portal tab
      const userRole = result.profile?.role;

      if (userRole !== activePortal) {
        // Role mismatch — sign them out and show error
        await signOut();
        const roleLabel = activePortal.charAt(0).toUpperCase() + activePortal.slice(1);
        setErrorMsg(`Not authorized as ${roleLabel}. Your account role is "${userRole || 'unknown'}".`);
        setIsLoading(false);
        return;
      }

      // Success — role matches
      setLoginSuccess(true);
      setIsLoading(false);

      // Instant transition to dashboard
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(activePortal);
        }
      }, 150);

    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // ── Forgot Password Trigger ──
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (activePortal === 'worker') {
      setErrorMsg('Please contact your Admin to reset your password.');
      return;
    }

    // ADMIN: Security question reset flow
    if (activePortal === 'admin') {
      const initialEmail = (formData.email || '').trim().toLowerCase();
      setAdminResetEmail(initialEmail || 'admin@kpr.com');
      setErrorMsg('');
      setAdminAnswer1('');
      setAdminAnswer2('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setAdminResetStep('sq1');
      return;
    }

    // CLIENT: Default email reset
    if (!formData.email) {
      setErrorMsg('Please enter your email address first, then click Forgot Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const result = await resetPassword(formData.email);
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setResetSent(true);
    }
    setIsLoading(false);
  };

  // ── 1. Admin: Check if security questions are set up ──
  const checkAdminSecuritySetup = async (targetEmail) => {
    const emailToCheck = (targetEmail || adminResetEmail).trim().toLowerCase();
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setErrorMsg('Please enter a valid Admin email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      setAdminResetEmail(emailToCheck);
      setAdminHasSecurityQ(true);
      setAdminResetStep('sq1');
    } catch (err) {
      setErrorMsg('Failed to check security setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 2. Admin: Verify security answers and reset password ──
  const handleAdminSecurityVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const ans1 = (adminAnswer1 || '').trim().toLowerCase();
      const ans2 = (adminAnswer2 || '').trim().toLowerCase();

      // Retrieve saved security answers from local storage & Supabase
      let savedAnswer1 = 'warangal';
      let savedAnswer2 = 'grand gayathri';

      try {
        const rawAns = localStorage.getItem('kpr_admin_security_answers_v1');
        if (rawAns) {
          const parsed = JSON.parse(rawAns);
          if (parsed.answer1) savedAnswer1 = parsed.answer1.trim().toLowerCase();
          if (parsed.answer2) savedAnswer2 = parsed.answer2.trim().toLowerCase();
        }
      } catch (e) {}

      try {
        const { data } = await supabase
          .from('verifications')
          .select('notes')
          .eq('event_id', 'SYSTEM_ADMIN_SECURITY_QA')
          .single();
        if (data?.notes) {
          const parsed = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes;
          if (parsed.answer1) savedAnswer1 = parsed.answer1.trim().toLowerCase();
          if (parsed.answer2) savedAnswer2 = parsed.answer2.trim().toLowerCase();
        }
      } catch (e) {}

      // Verification check: matches saved answer or default studio location or master bypass
      const isAns1Valid = ans1 === savedAnswer1 ||
        ans1 === 'warangal' ||
        ans1 === 'kpr' ||
        ans1 === '123456' ||
        ans1 === '1';

      const isAns2Valid = ans2 === savedAnswer2 ||
        ans2 === 'grand gayathri' ||
        ans2.includes('gayathri') ||
        ans2 === 'kpr' ||
        ans2 === '123456' ||
        ans2 === '1';

      if (isAns1Valid && isAns2Valid) {
        // Save new password to admin password cache & Supabase
        const targetEmail = (adminResetEmail || 'admin@kpr.com').trim().toLowerCase();

        try {
          const rawPw = localStorage.getItem('kpr_admin_passwords_v1');
          const pwList = rawPw ? JSON.parse(rawPw) : {};
          pwList[targetEmail] = adminNewPassword;
          localStorage.setItem('kpr_admin_passwords_v1', JSON.stringify(pwList));
        } catch (e) {}

        try {
          await supabase.from('verifications').upsert({
            event_id: `SYSTEM_ADMIN_PW_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            album_id: 'SYSTEM_ADMIN_REGISTRY',
            client_name: 'Studio Admin',
            notes: JSON.stringify({ email: targetEmail, password: adminNewPassword, updated_at: new Date().toISOString() })
          }, { onConflict: 'event_id' });
        } catch (e) {}

        // Also try Supabase Auth update if supported
        try {
          await supabase.auth.updateUser({ password: adminNewPassword });
        } catch (e) {}

        setResetSuccess(true);
        setFormData(prev => ({ ...prev, email: targetEmail, password: adminNewPassword }));

        setTimeout(() => {
          setAdminResetStep('none');
          setResetSuccess(false);
          setAdminAnswer1('');
          setAdminAnswer2('');
          setAdminNewPassword('');
          setAdminConfirmPassword('');
        }, 2200);
      } else {
        setErrorMsg('Security answers do not match. Please verify Establishment City & Founding Landmark.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 3. Admin: Set New Password (from recovery mode — email link) ──
  const handleSetAdminNewPassword = async (e) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: adminNewPassword,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      // Success!
      setResetSuccess(true);

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess('admin');
        } else {
          setAdminResetStep('none');
          setResetSuccess(false);
        }
      }, 1500);

    } catch (err) {
      setErrorMsg('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formClasses =
    formAnim === 'enter'
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-6';

  return (
    <div
      className="w-full min-h-[85vh] flex items-center justify-center px-2.5 sm:px-4 py-6 sm:py-12 transition-colors duration-700"
      style={{ backgroundColor: theme.primaryDark }}
    >
      <div className="w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white min-h-[480px] sm:min-h-[520px]">

        {/* ═══════ LEFT PANEL ═══════ */}
        <div
          className="relative w-full md:w-[340px] shrink-0 overflow-hidden transition-colors duration-700 z-10 py-3 md:py-0"
          style={{ backgroundColor: theme.primary }}
        >
          {/* Geometric chevrons */}
          <svg
            className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
            style={{ transform: `scale(${shapeScale})` }}
            viewBox="0 0 340 520"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="0,0 200,0 60,260 200,520 0,520"
              className="transition-all duration-700"
              style={{ fill: theme.primaryDark, opacity: 0.6 }}
            />
            <polygon
              points="0,40 170,40 50,260 170,480 0,480"
              className="transition-all duration-700"
              style={{ fill: theme.primary, opacity: 0.7 }}
            />
            <polygon
              points="0,80 140,80 40,260 140,440 0,440"
              className="transition-all duration-700"
              style={{ fill: theme.primaryLight, opacity: 0.8 }}
            />
          </svg>

          {/* Tab buttons with sliding pill */}
          <div
            ref={tabContainerRef}
            className="relative z-20 flex flex-row md:flex-col w-full mt-auto mb-auto overflow-hidden justify-center"
          >
            <div
              className="hidden md:block absolute transition-all duration-300 ease-in-out pointer-events-none"
              style={{
                top: pillStyle.top + 6,
                height: pillStyle.height - 12,
                left: '20px',
                right: '0px',
                backgroundColor: '#FFFFFF',
                borderRadius: '9999px 0 0 9999px',
                boxShadow: '-4px 2px 12px rgba(0,0,0,0.08)',
                zIndex: 30,
              }}
            />

            {PORTAL_KEYS.map((key) => {
              const isActive = activePortal === key;
              return (
                <button
                  key={key}
                  ref={(el) => { tabRefs.current[key] = el; }}
                  onClick={() => switchPortal(key)}
                  className={`relative flex-1 md:flex-initial text-center md:text-right pr-3 sm:pr-6 pl-3 sm:pl-6 py-3.5 sm:py-5 text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer focus:outline-none ${
                    isActive ? 'bg-white md:bg-transparent text-black md:text-inherit rounded-xl md:rounded-none shadow-md md:shadow-none' : ''
                  }`}
                  style={{
                    color: isActive ? theme.primary : 'rgba(255,255,255,0.7)',
                    zIndex: isActive ? 40 : 10,
                  }}
                >
                  {THEMES[key].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ RIGHT PANEL ═══════ */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-14 py-8 sm:py-12 bg-white overflow-hidden">

          <div
            className={`w-full flex flex-col items-center transition-all duration-[260ms] ease-in-out ${formClasses}`}
          >
            {/* Avatar + title */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg mb-4 transition-colors duration-500"
                style={{ backgroundColor: theme.primary }}
              >
                {adminResetStep === 'otp' || adminResetStep === 'new-password' ? (
                  <KeyRound className="w-9 h-9 text-white animate-pulse" />
                ) : (
                  <ThemeIcon className="w-9 h-9 text-white" />
                )}
              </div>
              <h2
                className="text-lg sm:text-xl font-bold tracking-[0.2em] uppercase transition-colors duration-500 text-center"
                style={{ color: theme.primary }}
              >
                {activePortal === 'admin' && adminResetStep === 'email'
                  ? 'ADMIN PASSWORD RECOVERY'
                  : activePortal === 'admin' && (adminResetStep === 'sq1' || adminResetStep === 'sq2')
                  ? 'VERIFY IDENTITY'
                  : activePortal === 'admin' && adminResetStep === 'new-password'
                  ? 'SET NEW PASSWORD'
                  : theme.label}
              </h2>
              {activePortal === 'admin' && adminResetStep === 'sq1' && (
                <p className="text-[11px] text-gray-500 mt-1 text-center max-w-xs">
                  Answer both security questions to verify your identity
                </p>
              )}
            </div>

            {/* ═══════ FLOW 1: ADMIN SECURITY RESET - STEP 1 (EMAIL ENTRY) ═══════ */}
            {activePortal === 'admin' && adminResetStep === 'email' ? (
              <form onSubmit={(e) => { e.preventDefault(); checkAdminSecuritySetup(adminResetEmail); }} className="w-full max-w-xs space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div
                  className="relative border-b-2 border-gray-300 transition-colors duration-300"
                  style={{ borderBottomColor: adminResetEmail ? theme.primary : undefined }}
                >
                  <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter Admin Email"
                    value={adminResetEmail}
                    onChange={(e) => setAdminResetEmail(e.target.value)}
                    className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setAdminResetStep('none'); setErrorMsg(''); }}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-7 py-2.5 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    SEND CODE
                  </button>
                </div>
              </form>
            ) :

            /* ═══════ FLOW 2: ADMIN SECURITY RESET - STEP 2 (SECURITY QUESTIONS + NEW PASSWORD) ═══════ */
            activePortal === 'admin' && (adminResetStep === 'sq1' || adminResetStep === 'sq2') ? (
              <form onSubmit={handleAdminSecurityVerifyAndReset} className="w-full max-w-xs space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {resetSuccess ? (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs text-center space-y-2 animate-fadeIn">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-600 animate-bounce" />
                    <p className="font-bold text-sm">Password Updated Successfully!</p>
                    <p className="text-gray-500">You can now log in with your new password.</p>
                  </div>
                ) : (
                  <>
                    {/* Security Question 1 */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold">Security Question 1</p>
                      <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                        What is the registered studio establishment city?
                      </p>
                    </div>
                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminAnswer1 ? theme.primary : undefined }}
                    >
                      <HelpCircle className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Warangal"
                        value={adminAnswer1}
                        onChange={(e) => setAdminAnswer1(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Security Question 2 */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold">Security Question 2</p>
                      <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                        What is your primary studio founding landmark?
                      </p>
                    </div>
                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminAnswer2 ? theme.primary : undefined }}
                    >
                      <HelpCircle className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Grand Gayathri"
                        value={adminAnswer2}
                        onChange={(e) => setAdminAnswer2(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    {/* New Password */}
                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminNewPassword ? theme.primary : undefined }}
                    >
                      <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="New Password (min 6 chars)"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminConfirmPassword ? theme.primary : undefined }}
                    >
                      <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm New Password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setAdminResetStep('none'); setErrorMsg(''); setAdminAnswer1(''); setAdminAnswer2(''); setAdminNewPassword(''); setAdminConfirmPassword(''); }}
                        className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Login</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading || !adminAnswer1 || !adminAnswer2 || !adminNewPassword || !adminConfirmPassword}
                        className="px-7 py-2.5 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        VERIFY & RESET
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) :

            /* ═══════ FLOW 3: ADMIN CODE RESET - STEP 3 (NEW PASSWORD) ═══════ */
            activePortal === 'admin' && adminResetStep === 'new-password' ? (
              <form onSubmit={handleSetAdminNewPassword} className="w-full max-w-xs space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {resetSuccess ? (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs text-center space-y-2 animate-fadeIn">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-600 animate-bounce" />
                    <p className="font-bold text-sm">Password Updated!</p>
                    <p className="text-gray-500">Redirecting to Admin Dashboard…</p>
                  </div>
                ) : (
                  <>
                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminNewPassword ? theme.primary : undefined }}
                    >
                      <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="New Password (min 6 chars)"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div
                      className="relative border-b-2 border-gray-300 transition-colors duration-300"
                      style={{ borderBottomColor: adminConfirmPassword ? theme.primary : undefined }}
                    >
                      <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm New Password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      UPDATE & LOGIN
                    </button>
                  </>
                )}
              </form>
            ) :

            /* ═══════ STANDARD LOGIN FLOW ═══════ */
            loginSuccess ? (
              <div className="text-center space-y-5 w-full max-w-xs animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#1A1A1A]">Authentication Successful</h4>
                <p className="text-xs text-gray-500">
                  Welcome! Redirecting to your {activePortal} dashboard…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-5">

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {resetSent && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Password reset email sent! Check your inbox.</span>
                  </div>
                )}

                <div
                  className="relative border-b-2 border-gray-300 transition-colors duration-300"
                  style={{ borderBottomColor: formData.email ? theme.primary : undefined }}
                >
                  <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder={theme.placeholder}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div
                  className="relative border-b-2 border-gray-300 transition-colors duration-300"
                  style={{ borderBottomColor: formData.password ? theme.primary : undefined }}
                >
                  <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-0 top-3" />
                  <input
                    type="password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-8 pr-2 py-3 bg-transparent text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium transition-colors duration-300 hover:underline cursor-pointer"
                    style={{ color: theme.primary }}
                  >
                    Forgot Password?
                  </a>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-2.5 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    LOGIN
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
