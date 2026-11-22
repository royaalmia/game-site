import React, { useState, useEffect } from 'react';
import { apiFetch, setAuthToken } from '../utils/api';
import { sound } from '../utils/sound';
import { X, Lock, Mail, User, Phone, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode !== 'register');
      setError('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    // Check if referral code exists in URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferredBy(ref);
      setIsLogin(false);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ emailOrUsername, password })
        });
        setAuthToken(res.token);
        localStorage.setItem('ludu_user', JSON.stringify(res.user));
        sound.playWin();
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email,
            phone,
            password,
            referredBy: referredBy || undefined
          })
        });
        setAuthToken(res.token);
        localStorage.setItem('ludu_user', JSON.stringify(res.user));
        sound.playWin();
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-2.5 text-white shadow-lg glow-gold">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">
            {isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
          </h2>
          <p className="text-xs text-amber-400 font-bold mt-1">
            {isLogin 
              ? 'ম্যাচ খেলতে সাইন ইন করুন' 
              : 'নতুন অ্যাকাউন্ট তৈরি করে খেলা শুরু করুন'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 rounded-2xl mb-4 border border-slate-800 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`py-2 rounded-xl transition cursor-pointer ${
              isLogin ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            লগইন
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`py-2 rounded-xl transition cursor-pointer ${
              !isLogin ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            রেজিস্ট্রেশন
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isLogin ? (
            <>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ইমেইল বা ইউজারনেম:</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="আপনার ইমেইল বা ইউজারনেম"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">পাসওয়ার্ড:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ইউজারনেম:</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="ইউজারনেম দিন"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ইমেইল এড্রেস:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="আপনার ইমেইল এড্রেস"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">মোবাইল নম্বর:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="০১৭XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">পাসওয়ার্ড:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {referredBy && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>রেফারাল কোড যুক্ত হয়েছে: <strong>{referredBy}</strong></span>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm rounded-xl shadow-lg glow-gold transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? 'প্রসেসিং হচ্ছে...' : isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Prompt to switch between login and register */}
          <div className="text-center pt-3 mt-3 border-t border-slate-800">
            {isLogin ? (
              <p className="text-xs text-slate-400">
                অ্যাকাউন্ট নেই?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer ml-1"
                >
                  রেজিস্ট্রেশন করুন
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer ml-1"
                >
                  লগইন করুন
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
