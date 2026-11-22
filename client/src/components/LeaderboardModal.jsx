import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Trophy, Medal, Flame, X, RefreshCw } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/matches/leaderboard');
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Hall of Fame & Leaderboard <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              </h2>
              <span className="text-xs text-slate-400">Top earning players on LuduStar Pro</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading champions...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No players ranked yet. Win matches to claim the #1 spot!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                let rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                    #{rank}
                  </span>
                );

                if (rank === 1) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                      👑 1
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                      🥈 2
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-md">
                      🥉 3
                    </span>
                  );
                }

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      rank === 1
                        ? 'bg-amber-500/10 border-amber-500/40 glow-gold'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {rankBadge}
                      <img
                        src={player.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=rank'}
                        alt="av"
                        className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900"
                      />
                      <div>
                        <span className="font-bold text-xs text-white block">{player.username}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{player.matchesWon || 0} Wins</span>
                          <span>•</span>
                          <span>{player.winRate}% Win Rate</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-amber-400 text-sm block">
                        {(player.totalWon || 0).toFixed(0)} ৳
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Total Profit
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
