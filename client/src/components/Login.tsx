import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { loginUser, isAuthenticated } from '../utils/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [username, setUsername] = useState('Naik-ShankaraOnline');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Simulate minor network delay for smooth UX feel
      await new Promise((resolve) => setTimeout(resolve, 300));

      const result = await loginUser(username, password, rememberMe);

      if (result.success) {
        setLoginSuccess(true);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 350);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30">
      <div className="w-full max-w-md">
        {/* Brand Header & Logo */}
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-2xl bg-white border border-gray-200/80 shadow-xs mb-3">
            <img
              src="/shankara-logo.png"
              alt="Shankara Online Solutions"
              className="h-10 sm:h-12 w-auto max-w-[240px] object-contain mx-auto"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 tracking-tight">
            Admin Portal Access
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Sign in with your administrator credentials to manage invoices, retainers, and expenses.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 backdrop-blur-sm">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Notification */}
          {loginSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">Authenticated! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your admin username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50/60 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600">Remember this session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>256-bit cryptographically verified JWT session</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-gray-400">
          Shankara Online Solutions LLP • Internal Administration
        </div>
      </div>
    </div>
  );
};

export default Login;
