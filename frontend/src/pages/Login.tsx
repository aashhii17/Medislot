import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Lock, Mail, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Login State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/google/', {
        token: response.credential
      });
      const { access, refresh, user } = res.data;
      login(access, refresh, user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'Google authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initGoogle = () => {
        const google = (window as any).google;
        if (google) {
          google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "564146584485-bpqen88ijrnqvksc31ob4d6faodfmi50.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
          });
          google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            { theme: "dark", size: "large", type: "standard", width: 350 }
          );
        }
      };
      const timer = setTimeout(initGoogle, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/otp/send/', { email });
      setOtpSent(true);
      if (res.data.code) {
        setOtpCode(res.data.code); // auto-fill for testing/sandbox ease
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send OTP. Please check your email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode) {
      setError('Please fill in both email and OTP code.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/otp/verify/', { email, code: otpCode });
      const { access, refresh, user } = res.data;
      login(access, refresh, user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginRes = await api.post('/api/auth/login/', {
        username,
        password,
      });
      
      const { access, refresh } = loginRes.data;

      const meRes = await axios.get('/api/auth/me/', {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      login(access, refresh, meRes.data);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        'Invalid username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#FDFBF7] dark:bg-[#1A1613] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden text-stone-850 dark:text-stone-100">
      {/* Decorative colored glow background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-[#25201C] p-8 rounded-[36px] border border-stone-200 dark:border-stone-850 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Sign in to manage your medical consultations
            </p>
          </div>

          {error && (
            <div className="alert alert-error bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm shadow-sm rounded-xl p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                loginMethod === 'password'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'text-stone-550 dark:text-stone-400 hover:text-stone-800'
              }`}
              onClick={() => { setLoginMethod('password'); setError(''); }}
            >
              Password Sign In
            </button>
            <button
              type="button"
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                loginMethod === 'otp'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'text-stone-550 dark:text-stone-400 hover:text-stone-800'
              }`}
              onClick={() => { setLoginMethod('otp'); setError(''); }}
            >
              Secure OTP Sign In
            </button>
          </div>

          {loginMethod === 'password' ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-12 text-sm"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs font-bold text-amber-600 hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input input-bordered w-full pl-11 pr-10 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-12 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-12 gap-2 border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all mt-6"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <div className="divider text-stone-400 text-[10px] uppercase font-bold tracking-wider my-4">OR CONTINUE WITH</div>
              <div id="google-login-btn" className="w-full flex justify-center mt-2"></div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    disabled={otpSent}
                    className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-12 text-sm"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">One-Time Password (OTP)</label>
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)} 
                      className="text-xs font-bold text-amber-600 hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-12 text-sm font-bold tracking-widest text-center"
                      placeholder="------"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 font-medium">* Check backend logs/console for the OTP code.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading}
                className="btn btn-primary w-full h-12 gap-2 border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all mt-6"
              >
                {otpLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : otpSent ? (
                  <>
                    <span>Verify & Login</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    <span>Request Login OTP</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <div className="divider text-stone-400 text-[10px] uppercase font-bold tracking-wider my-4">OR CONTINUE WITH</div>
              <div id="google-login-btn" className="w-full flex justify-center mt-2"></div>
            </form>
          )}

          <div className="text-center pt-2">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-amber-600 hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
