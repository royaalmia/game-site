import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { apiFetch, setAuthToken } from '../utils/api';

export default function AdminGatewayLogin({ onAdminLoginSuccess, onReturnToSite }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password })
      });

      if (!res.user || !res.user.isAdmin) {
        throw new Error('অ্যাক্সেস ডিনাইড: এই অ্যাকাউন্টে অ্যাডমিন পারমিশন নেই।');
      }

      setAuthToken(res.token);
      localStorage.setItem('ludu_user', JSON.stringify(res.user));
      onAdminLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'অ্যাডমিন লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-purple-500 selection:text-white">
      {/* Return to site button */}
      <button
        onClick={onReturnToSite}
        className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400" />
        মূল গেমিং সাইটে ফিরুন
      </button>

      <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-purple-500/20 text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wide">
            Super Admin Portal
          </h1>
          <p className="text-xs text-purple-300 font-medium mt-1">
            সিস্টেম অ্যাডমিনিস্ট্রেশন ও ম্যানেজমেন্ট কনসোল
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
          <div>
            <label className="text-slate-300 font-bold block mb-1.5">
              অ্যাডমিন ইমেইল বা ইউজারনেম
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="ইমেইল বা ইউজারনেম দিন"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-mono focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1.5">
              অ্যাডমিন পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}