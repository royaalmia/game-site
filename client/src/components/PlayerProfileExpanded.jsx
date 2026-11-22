import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { sound } from '../utils/sound';
import { translations } from '../utils/i18n';
import { 
  Trophy, Swords, TrendingUp, Users, Copy, Check, 
  Calendar, ShieldCheck, ArrowLeft, RefreshCw, Settings, 
  Lock, Globe, Volume2, VolumeX, Shield, Edit3, Headphones, ChevronRight, HelpCircle 
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=ProGamer1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LudoKing2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberStrike3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=GoldDice4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=QueenHunter5',
  'https://api.dicebear.com/7.x/bottts/svg?seed=MasterMind6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SpeedRunner7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=StarChampion8'
];

export default function PlayerProfileExpanded({ 
  user, 
  lang = 'bn', 
  onToggleLang, 
  onBack, 
  onLogout,
  onUserUpdate,
  onOpenDisputes 
}) {
  const t = translations[lang] || translations.bn;
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'history' | 'settings'
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0]);
  const [soundOn, setSoundOn] = useState(true);
  const [msg, setMsg] = useState('');

  // Password reset fields
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const playerId = user?.id ? `LUDU-${user.id.slice(0, 6).toUpperCase()}` : 'LUDU-849201';

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/matches/my-history');
      setHistoryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const copyReferral = () => {
    if (!user?.referralCode) return;
    const inviteUrl = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleUpdateAvatar = async (av) => {
    setSelectedAvatar(av);
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatar: av })
      });
      setMsg('Profile picture updated!');
      if (onUserUpdate) onUserUpdate();
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const winRate = user?.matchesPlayed > 0 
    ? ((user.matchesWon || 0) / user.matchesPlayed * 100).toFixed(0) 
    : '0';

  const userLevel = Math.max(1, Math.floor((user?.matchesPlayed || 0) / 5) + 1);
  const xpPercent = Math.min(100, (((user?.matchesPlayed || 0) % 5) / 5) * 100);

  return (
    <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> {t.nav_home}
        </button>

        <div className="flex items-center gap-2">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold text-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center">
          {msg}
        </div>
      )}

      {/* Profile Identity Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt="avatar"
              className="w-16 h-16 rounded-2xl border-2 border-amber-400/60 bg-slate-950 p-1 shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow">
              LVL {userLevel}
            </span>
          </div>

          <div className="flex-1">
            <h2 className="text-base font-black text-white">{user?.username}</h2>
            <span className="font-mono text-[11px] text-amber-400 font-bold block">{playerId}</span>
            <span className="text-[10px] text-slate-400 block">{user?.email}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Wallet</span>
            <span className="font-mono text-base font-black text-emerald-400">
              {(user?.balance || 0).toFixed(0)} ৳
            </span>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
            <span>Level {userLevel} Veteran</span>
            <span className="font-bold text-amber-400">{xpPercent.toFixed(0)}% to Level {userLevel + 1}</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 24/7 Customer Support & Disputes Card */}
      <div 
        onClick={onOpenDisputes}
        className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-500/60 p-4 rounded-3xl flex items-center justify-between cursor-pointer shadow-lg transition transform active:scale-98"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-white text-xs block">২৪/৭ কাস্টমার সাপোর্ট ও হেল্প</span>
            <span className="text-[11px] text-purple-300 block">যেকোনো সমস্যা, রিচার্জ বা অভিযোগ জানাতে ক্লিক করুন</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'stats' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
          }`}
        >
          Match History
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
          }`}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Win Rate</span>
              <span className="font-mono text-base font-black text-cyan-400">{winRate}%</span>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Matches Won</span>
              <span className="font-mono text-base font-black text-emerald-400">{user?.matchesWon || 0}</span>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 block mb-0.5">Total Profit</span>
              <span className="font-mono text-base font-black text-amber-400">
                {(user?.totalWon || 0).toFixed(0)} ৳
              </span>
            </div>
          </div>

          {/* Avatar Customizer Gallery */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
            <span className="text-xs font-bold text-white block">Choose Avatar Photo</span>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {AVATAR_OPTIONS.map((av, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUpdateAvatar(av)}
                  className={`p-1 rounded-2xl border-2 transition ${
                    selectedAvatar === av ? 'border-amber-400 bg-amber-500/20 scale-105' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={av} alt="avatar option" className="w-full aspect-square rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Referral Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Invite Friends & Earn 10 ৳</span>
              <span className="text-[11px] font-mono text-amber-400">{user?.referralCode}</span>
            </div>
            <button
              onClick={copyReferral}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied' : 'Share Link'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MATCH HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {historyData?.matches?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matches played yet.
            </div>
          ) : (
            historyData?.matches?.map(m => {
              const isWon = m.winnerUserId === user?.id;
              const net = isWon ? `+${(m.winnerPayout - m.stake).toFixed(0)}` : `-${m.stake}`;

              return (
                <div key={m.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-black text-white uppercase">{m.gameType}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-400">
                        {m.mode}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Stake: {m.stake} ৳ • {new Date(m.startedAt || m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block mb-0.5 ${
                      isWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {isWon ? 'WON 🏆' : 'LOST'}
                    </span>
                    <span className={`font-mono font-bold block text-xs ${isWon ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {net} ৳
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT SETTINGS & SECURITY */}
      {activeTab === 'settings' && (
        <div className="space-y-4 text-xs">
          {/* Audio toggle */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" /> Sound Effects & Chimes
            </span>
            <button
              onClick={() => {
                sound.enabled = !soundOn;
                setSoundOn(!soundOn);
              }}
              className={`px-3 py-1 rounded-xl font-bold ${
                soundOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundOn ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
            <span className="font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Active Session
            </span>
            <span className="text-[11px] text-slate-400 block">Device: Mobile Web / Chrome</span>
            <span className="text-[10px] text-emerald-400 font-mono">🟢 Secure Token Encrypted</span>
          </div>

          {/* Support in Settings */}
          <div 
            onClick={onOpenDisputes}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition"
          >
            <span className="font-bold text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-400" /> কাস্টমার সাপোর্ট ও অভিযোগ
            </span>
            <span className="text-[11px] text-purple-400 font-bold">ওপেন করুন ➔</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 rounded-2xl font-black text-xs transition"
          >
            {t.log_out}
          </button>
        </div>
      )}
    </div>
  );
}
