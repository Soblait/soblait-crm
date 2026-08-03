import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('Ophir.shalev@soblait.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/10 via-white to-brand-pink/10 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 px-4">
      <div className="w-full max-w-sm card p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-white font-bold text-2xl mb-3">
            S
          </div>
          <h1 className="text-xl font-semibold">Welcome to Soblait</h1>
          <p className="text-sm text-gray-400">Your CRM, simplified</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading} className="w-full btn-gradient justify-center flex py-2.5 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <div className="font-semibold mb-1">Demo credentials</div>
          <div>Email: Ophir.shalev@soblait.com</div>
          <div>Password: demo1234</div>
        </div>

        <p className="text-sm text-center text-gray-400 mt-4">
          No account?{' '}
          <Link to="/register" className="text-brand-purple font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
