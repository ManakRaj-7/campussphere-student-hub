import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/common/Icon';

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    await login(form.email, form.password);
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    await login('alex@campussphere.edu', 'password123');
    setSubmitting(false);
  };


  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-white text-2xl font-bold">CampusSphere</span>
          </div>

          {/* Hero text */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Your AI-Powered
            <br />
            <span className="text-indigo-200">Campus Ecosystem</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-12 max-w-md leading-relaxed">
            Smart scheduling, AI-powered notes, wellness tracking, and community — all in one beautiful platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {['AI Study Assistant', 'Smart Schedule', 'Wellness Hub', 'Campus Community'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-16">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-indigo-200">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-sm text-indigo-200">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-indigo-200">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">CampusSphere</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border ${
                    errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all`}
                  placeholder="you@university.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <Icon name="error" className="text-sm" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border ${
                    errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <Icon name="error" className="text-sm" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <button type="button" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="arrow_forward" className="text-lg" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">OR</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>

          {/* Social login placeholder */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
