import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeRegistration, googleLogin, sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCOPE = 'openid email profile';
const TEN_DIGIT_RULE = /^[6-9]\d{9}$/;

function parseHashParams(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return {
    idToken: params.get('id_token'),
    error: params.get('error')
  };
}

const toTenDigitPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    return digits.slice(digits.length - 10);
  }
  return digits.slice(0, 10);
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [registrationToken, setRegistrationToken] = useState('');
  const [registrationMode, setRegistrationMode] = useState('');
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '' });
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regPhoneVerified, setRegPhoneVerified] = useState(false);
  const [regPhoneVerificationToken, setRegPhoneVerificationToken] = useState('');
  const [regOtpLoading, setRegOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const googleAuthUrl = useMemo(() => {
    if (!googleClientId) return '';
    const nonce = Math.random().toString(36).slice(2);
    const redirectUri = `${window.location.origin}/login`;
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'id_token token',
      scope: GOOGLE_SCOPE,
      nonce,
      prompt: 'select_account'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, [googleClientId]);

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const resetRegistrationPhoneVerification = () => {
    setRegOtpCode('');
    setRegOtpSent(false);
    setRegPhoneVerified(false);
    setRegPhoneVerificationToken('');
  };

  const goAfterAuth = (user) => {
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    navigate('/dashboard');
  };

  const handleAuthResult = (data) => {
    if (data.requiresRegistration) {
      const mode = data.authType || (data.prefill?.phone ? 'phone' : 'google');
      const prefillPhone = toTenDigitPhone(data.prefill?.phone || '');

      setRegistrationMode(mode);
      setRegistrationToken(data.registrationToken);
      setRegisterForm({
        name: data.prefill?.name || '',
        email: data.prefill?.email || '',
        phone: prefillPhone
      });

      if (mode === 'phone') {
        setRegPhoneVerified(true);
        setRegPhoneVerificationToken('');
        setRegOtpSent(false);
        setRegOtpCode('');
      } else {
        resetRegistrationPhoneVerification();
      }

      setMessage(
        mode === 'phone'
          ? 'Phone verified. Complete registration to continue.'
          : 'Google verified. Add phone number and verify OTP to complete registration.'
      );
      return;
    }

    login(data);
    goAfterAuth(data.user);
  };

  useEffect(() => {
    const { idToken, error: hashError } = parseHashParams(window.location.hash);
    if (!idToken && !hashError) return;

    if (hashError) {
      setError('Google login was cancelled or failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const run = async () => {
      try {
        setGoogleLoading(true);
        const { data } = await googleLogin({ idToken });
        handleAuthResult(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed');
      } finally {
        setGoogleLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    run();
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    resetMessages();

    const normalizedPhone = toTenDigitPhone(phone);
    if (!TEN_DIGIT_RULE.test(normalizedPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await sendOtp({ phone: normalizedPhone });
      setOtpSent(true);
      setPhone(normalizedPhone);
      setMessage(
        data.userExists
          ? 'User found. Enter OTP to login.'
          : 'New number detected. Verify OTP to continue registration.'
      );
      if (data.devCode) {
        setMessage((prev) => `${prev} Dev code: ${data.devCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();

    const normalizedPhone = toTenDigitPhone(phone);
    if (!TEN_DIGIT_RULE.test(normalizedPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!otpCode.trim()) {
      setError('Please enter OTP');
      return;
    }

    try {
      setLoading(true);
      const { data } = await verifyOtp({
        phone: normalizedPhone,
        code: otpCode.trim()
      });
      handleAuthResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegistrationOtp = async () => {
    resetMessages();

    const normalizedPhone = toTenDigitPhone(registerForm.phone);
    if (!TEN_DIGIT_RULE.test(normalizedPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      setRegOtpLoading(true);
      const { data } = await sendOtp({ phone: normalizedPhone });
      if (data.userExists) {
        setError('This phone number is already registered. Please login with phone OTP.');
        return;
      }

      setRegisterForm((prev) => ({ ...prev, phone: normalizedPhone }));
      setRegOtpSent(true);
      setMessage('OTP sent to your phone. Verify OTP to complete profile.');
      if (data.devCode) {
        setMessage((prev) => `${prev} Dev code: ${data.devCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setRegOtpLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    resetMessages();

    const normalizedPhone = toTenDigitPhone(registerForm.phone);
    if (!TEN_DIGIT_RULE.test(normalizedPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!regOtpCode.trim()) {
      setError('Please enter OTP');
      return;
    }

    try {
      setRegOtpLoading(true);
      const { data } = await verifyOtp({
        phone: normalizedPhone,
        code: regOtpCode.trim(),
        registrationToken
      });

      setRegPhoneVerified(true);
      setRegPhoneVerificationToken(data.phoneVerificationToken || '');
      setMessage('Phone number verified successfully. You can now complete registration.');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setRegOtpLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!registerForm.name.trim()) {
      setError('Name is required');
      return;
    }

    const normalizedRegPhone = toTenDigitPhone(registerForm.phone);

    if (registrationMode === 'google') {
      if (!TEN_DIGIT_RULE.test(normalizedRegPhone)) {
        setError('Phone number is required and must be 10 digits.');
        return;
      }
      if (!regPhoneVerified || !regPhoneVerificationToken) {
        setError('Please verify your phone number with OTP before completing registration.');
        return;
      }
    }

    try {
      setRegisterLoading(true);
      const payload = {
        registrationToken,
        name: registerForm.name.trim(),
        email: registerForm.email.trim() || undefined,
        phone: normalizedRegPhone || undefined,
        phoneVerificationToken: registrationMode === 'google' ? regPhoneVerificationToken : undefined
      };
      const { data } = await completeRegistration(payload);
      login(data);
      goAfterAuth(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen md:grid-cols-12">
        <div className="relative hidden md:col-span-8 md:block">
          <img
            src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80"
            alt="Luxury apartment"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/55"></div>
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="w-full max-w-xl rounded-3xl border border-white/30 bg-white/10 p-8 text-white backdrop-blur-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                <i className="fas fa-house-user"></i>
                Flatex
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight">Live where you love.</h1>
              <p className="mt-3 text-slate-100">Verified rooms, trusted owners, and secure bookings in one modern platform.</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-white/15 p-3 text-center"><p className="text-xl font-bold">2.4K+</p><p>Rooms</p></div>
                <div className="rounded-xl bg-white/15 p-3 text-center"><p className="text-xl font-bold">18.5K+</p><p>Users</p></div>
                <div className="rounded-xl bg-white/15 p-3 text-center"><p className="text-xl font-bold">4.9/5</p><p>Rating</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-8 md:col-span-4">
          <div className="w-full max-w-sm">
            <div className="mb-5 text-center">
              <h2 className="text-3xl font-bold text-slate-900">{registrationToken ? 'Complete Profile' : 'Welcome Back'}</h2>
              <p className="mt-1 text-slate-600">{registrationToken ? 'Finish registration to continue' : 'Login with Google'}</p>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

            {!registrationToken ? (
              <>
                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3">
                  {/* <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(toTenDigitPhone(e.target.value))}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-24 pr-4 text-sm placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                        disabled={loading || otpSent || googleLoading}
                      />
                    </div>
                  </div> */}

                  {otpSent && (
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">OTP</label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="input"
                        placeholder="Enter OTP"
                        maxLength={8}
                        disabled={loading || googleLoading}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {otpSent && (
                      <button
                        type="button"
                        className="btn-secondary flex-1"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          resetMessages();
                        }}
                        disabled={loading || googleLoading}
                      >
                        Back
                      </button>
                    )}
                    {/* <button type="submit" className="btn-primary flex-1" disabled={loading || googleLoading}>
                      {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
                    </button> */}
                  </div>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-xs font-semibold text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                {googleClientId ? (
                  <a href={googleAuthUrl} className="btn-secondary w-full" onClick={() => resetMessages()}>
                    <i className="fab fa-google"></i>
                    {googleLoading ? 'Please wait...' : 'Continue with Google'}
                  </a>
                ) : (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    Google login is not configured. Set `VITE_GOOGLE_CLIENT_ID` in frontend env.
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleCompleteRegistration} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Your full name"
                    disabled={registerLoading}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Email {registrationMode === 'phone' ? '(optional)' : ''}</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="you@example.com"
                    disabled={registerLoading}
                  />
                </div>

                {registrationMode === 'phone' ? (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Phone Number (Verified)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">+91</span>
                      <input
                        type="tel"
                        value={registerForm.phone}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-24 pr-4 text-sm text-slate-600"
                        disabled
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Phone Number <span className="text-rose-600">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">+91</span>
                        <input
                          type="tel"
                          value={registerForm.phone}
                          onChange={(e) => {
                            const nextPhone = toTenDigitPhone(e.target.value);
                            setRegisterForm((prev) => ({ ...prev, phone: nextPhone }));
                            if (regPhoneVerified || regPhoneVerificationToken || regOtpSent) {
                              resetRegistrationPhoneVerification();
                            }
                          }}
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-24 pr-4 text-sm placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          placeholder="10-digit mobile number"
                          inputMode="numeric"
                          maxLength={10}
                          disabled={registerLoading || regOtpLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleSendRegistrationOtp}
                        disabled={registerLoading || regOtpLoading || !TEN_DIGIT_RULE.test(toTenDigitPhone(registerForm.phone))}
                      >
                        {regOtpLoading ? 'Please wait...' : regOtpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleVerifyRegistrationOtp}
                        disabled={registerLoading || regOtpLoading || !regOtpSent || !regOtpCode.trim() || regPhoneVerified}
                      >
                        {regPhoneVerified ? 'Verified' : 'Verify OTP'}
                      </button>
                    </div>

                    {regOtpSent && (
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Enter OTP</label>
                        <input
                          type="text"
                          value={regOtpCode}
                          onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className="input"
                          placeholder="Enter OTP"
                          maxLength={8}
                          disabled={registerLoading || regOtpLoading || regPhoneVerified}
                        />
                      </div>
                    )}

                    <div className={`rounded-lg border p-2 text-xs ${regPhoneVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {regPhoneVerified ? 'Phone verified successfully.' : 'Phone verification is required for Google registration.'}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={registerLoading || (registrationMode === 'google' && !regPhoneVerified)}
                >
                  {registerLoading ? 'Creating account...' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
