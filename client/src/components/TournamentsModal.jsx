import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Trophy, Swords, Users, Calendar, CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';

export default function TournamentsModal({ isOpen, onClose, currentUser, onJoined }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/tournaments');
      setTournaments(res.tournaments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMsg('');
      setError('');
      fetchTournaments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinTournament = async (tournamentId) => {
    setError('');
    setMsg('');
    setJoiningId(tournamentId);

    try {
      await apiFetch(`/api/tournaments/${tournamentId}/join`, { method: 'POST' });
      setMsg('You have successfully entered the Tournament bracket!');
      fetchTournaments();
      if (onJoined) onJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Championship Tournaments</h2>
              <span className="text-xs text-slate-400">Compete in Knockout Brackets for Mega Prize Pools</span>
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {msg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {tournaments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No tournaments currently active. Check back soon for weekend mega-brackets!
            </div>
          ) : (
            tournaments.map(t => {
              const isJoined = t.participants?.some(p => p.userId === currentUser?.id);
              const progressPct = ((t.participants?.length || 0) / t.maxPlayers) * 100;

              return (
                <div 
                  key={t.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-white">{t.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.gameType}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" /> Starts: {new Date(t.startTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Prize Pool</span>
                      <span className="font-mono text-xl font-black text-emerald-400">
                        {t.prizePool} ৳
                      </span>
                    </div>
                  </div>

                  {/* Bracket slots progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Registered Players: <strong className="text-white">{t.participants?.length || 0} / {t.maxPlayers}</strong></span>
                      </span>
                      <span className="font-bold text-slate-300">{progressPct.toFixed(0)}% Filled</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-xs text-slate-400">
                      Entry Fee: <strong className="text-white font-mono">{t.entryFee} ৳</strong>
                    </span>

                    {isJoined ? (
                      <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinTournament(t.id)}
                        disabled={joiningId === t.id || t.status !== 'upcoming'}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg glow-gold transition disabled:opacity-50"
                      >
                        {joiningId === t.id ? 'Joining...' : `Join for ${t.entryFee} ৳`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
