import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { HiSparkles, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Login failed. Try using Quick Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    toast.success('Signed in as Demo User (Priya Sharma)');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 no-underline">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-2xl font-bold gradient-text">SafePath</span>
        </Link>

        <div className="glass-card p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HiShieldCheck className="text-primary-400 w-6 h-6" />
            <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
          </div>
          <p className="text-surface-200 text-sm text-center mb-6">Sign in to access your safety dashboard</p>

          {/* Quick Demo Login Banner */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-900/40 to-accent-900/40 border border-primary-500/30 text-center">
            <div className="text-xs text-purple-200 font-medium mb-2">
              Ready to explore right away?
            </div>
            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-600/30 cursor-pointer border-none"
            >
              <HiSparkles className="w-4 h-4 text-amber-300" />
              1-Click Demo Sign In (Priya Sharma)
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs text-surface-200/60 uppercase">or sign in with email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-200 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-surface-200 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium no-underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
