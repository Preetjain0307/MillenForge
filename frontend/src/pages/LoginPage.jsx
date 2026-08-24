/**
 * NeuraMinds — Login & Registration Page
 */
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  requestOtp,
  verifyOtp,
  clearAuthError,
  resetOtpState,
  decrementCooldown,
} from '../features/auth/authSlice';
import NmButton from '../components/NmButton';
import NmInput from '../components/NmInput';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { isAuthenticated, submitting, error, otpSent, otpEmail, resendCooldown } = useSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [urlError, setUrlError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle URL errors (e.g. from Google OAuth redirect failure)
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      setUrlError(errParam);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = searchParams.get('redirect') || '/workspace';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Timer for OTP resend cooldown
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        dispatch(decrementCooldown());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown, dispatch]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    dispatch(clearAuthError());
    setUrlError('');
    setSuccessMsg('');
    dispatch(requestOtp(email.trim()));
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) return;
    dispatch(clearAuthError());
    setUrlError('');
    setSuccessMsg('');
    dispatch(verifyOtp({ email: otpEmail || email, otp: otp.trim() }));
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleChangeEmail = () => {
    dispatch(resetOtpState());
    setOtp('');
    setSuccessMsg('');
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    dispatch(clearAuthError());
    setSuccessMsg('');
    const res = await dispatch(requestOtp(otpEmail || email));
    if (requestOtp.fulfilled.match(res)) {
      setSuccessMsg('New verification code sent! Check server console / email.');
      setOtp('');
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[var(--nm-bg-primary)] to-[var(--nm-bg-surface)]">
      <div className="w-full max-w-md bg-[rgba(15,23,42,0.8)] border border-[var(--nm-border-subtle)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--nm-accent)] to-[var(--nm-accent-glow)] flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_var(--nm-accent-glow)]">
            <i className="pi pi-bolt text-white text-2xl" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold nm-gradient-text tracking-tight">NeuraMinds</h1>
          <p className="text-sm text-[var(--nm-text-muted)] mt-1">
            Sign in or create an account to start building
          </p>
        </div>

        {/* Global Error Banner */}
        {(error || urlError) && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <i className="pi pi-exclamation-triangle mt-0.5 text-red-400" aria-hidden="true" />
            <span>{error || urlError}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-green-300 text-xs sm:text-sm flex items-start gap-2">
            <i className="pi pi-check-circle mt-0.5 text-green-400" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {!otpSent ? (
          /* Step 1: Email Entry & Social Login */
          <div className="space-y-5">
            {/* Google Auth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-[var(--nm-border-subtle)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--nm-text-primary)] font-medium text-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[var(--nm-border-subtle)]" />
              <span className="text-xs text-[var(--nm-text-muted)] font-mono uppercase">OR</span>
              <div className="flex-1 h-px bg-[var(--nm-border-subtle)]" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <NmInput
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <NmButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting || !email.includes('@')}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                    <span>Sending Code...</span>
                  </span>
                ) : (
                  'Continue with Email'
                )}
              </NmButton>
            </form>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-[var(--nm-text-muted)]">Code sent to:</p>
              <p className="text-sm font-semibold text-[var(--nm-accent-light)] font-mono">
                {otpEmail}
              </p>
            </div>

            {/* 6-digit OTP Input */}
            <div>
              <label className="block text-xs font-medium text-[var(--nm-text-secondary)] mb-1.5 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] outline-none transition-all"
                required
                autoFocus
              />
            </div>

            <NmButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                  <span>Verifying...</span>
                </span>
              ) : (
                'Verify & Log In'
              )}
            </NmButton>

            {/* OTP Actions: Resend & Change Email */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)] transition-colors cursor-pointer"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || submitting}
                className={`transition-colors cursor-pointer ${
                  resendCooldown > 0
                    ? 'text-[var(--nm-text-muted)] cursor-not-allowed'
                    : 'text-[var(--nm-accent-light)] hover:underline font-medium'
                }`}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
