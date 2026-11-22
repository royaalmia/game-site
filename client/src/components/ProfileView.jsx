import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Trophy, Swords, TrendingUp, Users, Copy, Check, 
  Calendar, ShieldCheck, ArrowLeft, RefreshCw 
} from 'lucide-react';

export default function ProfileView({ user, onBack }) {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const winRate = user?.matchesPlayed > 0 
    ? ((user.matchesWon || 0) / user.matchesPlayed * 100).toFixed(0) 
    : '0';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </button>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
            alt="avatar"
            className="w-20 h-20 rounded-2xl border-2 border-amber-400/50 bg-slate-950 p-1 shadow-lg"
          />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-white">{user?.username}</h1>
              {user?.isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold w-fit mx-auto sm:mx-0">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">{user?.email}</p>

            {/* Referral Banner */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl w-fit mx-auto sm:mx-0 text-xs">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400">Referral Code:</span>
              <span className="font-mono font-bold text-amber-300">{user?.referralCode || 'LUDUSTAR'}</span>
              <button
                onClick={copyReferral}
                className="ml-2 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 text-[11px] transition"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCode ? 'Copied' : 'Invite'}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center min-w-[130px]">
            <span className="text-[11px] text-slate-400 block mb-0.5">Wallet Balance</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {(user?.balance || 0).toFixed(2)} ৳
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Swords className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <span className="text-xs text-slate-400 block">Total Matches</span>
          <span className="text-xl font-black text-white font-mono">{user?.matchesPlayed || 0}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <span className="text-xs text-slate-400 block">Matches Won</span>
          <span className="text-xl font-black text-emerald-400 font-mono">{user?.matchesWon || 0}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <span className="text-xs text-slate-400 block">Win Rate</span>
          <span className="text-xl font-black text-cyan-400 font-mono">{winRate}%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-lg block mb-1">💰</span>
          <span className="text-xs text-slate-400 block">Total Profit</span>
          <span className="text-xl font-black text-amber-400 font-mono">
            {((user?.totalWon || 0)).toFixed(0)} ৳
          </span>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" /> Match Records & Performance
        </h2>

        {historyData?.matches?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No matches played yet. Join a match in the lobby to start winning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 rounded-l-xl">Game</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Stake</th>
                  <th className="py-3 px-3">Opponent(s)</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-3 rounded-r-xl text-right">Net Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyData?.matches?.map(m => {
                  const isWon = m.winnerUserId === user?.id;
                  const opponents = m.players?.filter(p => p.userId !== user?.id) || [];
                  const netGain = isWon 
                    ? `+${(m.winnerPayout - m.stake).toFixed(2)}` 
                    : `-${m.stake.toFixed(2)}`;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-white uppercase">{m.gameType}</td>
                      <td className="py-3 px-3 text-slate-400">{m.mode}</td>
                      <td className="py-3 px-3 font-mono text-white font-semibold">{m.stake} ৳</td>
                      <td className="py-3 px-3 text-slate-300">
                        {opponents.map(o => o.username).join(', ') || 'Waiting...'}
                      </td>
                      <td className="py-3 px-3">
                        {m.status === 'completed' ? (
                          isWon ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              WON 🏆
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                              LOST
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] capitalize">
                            {m.status}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold ${
                        isWon ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {m.status === 'completed' ? `${netGain} ৳` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
