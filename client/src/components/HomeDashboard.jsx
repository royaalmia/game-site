import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import HomeSlider from './HomeSlider';
import { 
  Sparkles, Zap, Trophy, Users, Swords, 
  Flame, Gift, ArrowRight, ShieldCheck, Download, Bot,
  Wallet, ArrowDownRight, ArrowUpRight, LogIn, UserPlus,
  CheckCircle, Play, Key, ChevronRight, Gamepad2, Crown, Target, Award
} from 'lucide-react';

const RECENT_WINNERS = [
  { name: 'তানভীর', game: 'লুডু ১v১', amount: 190 },
  { name: 'সাকিব', game: 'দাবা ১v১', amount: 380 },
  { name: 'রাকিবুল', game: 'ক্যারাম ১v১', amount: 95 },
  { name: 'আশিক রহমান', game: 'লুডু ৪-প্লেয়ার', amount: 475 },
  { name: 'ফারহান', game: 'লুডু ১v১', amount: 950 },
  { name: 'মেহেদী', game: 'দাবা ১v১', amount: 190 }
];

export default function HomeDashboard({
  currentUser,
  friends = [],
  onlineUserIds = [],
  tournaments = [],
  lang = 'bn',
  onSelectGame,
  onOpenWallet,
  onOpenAuth,
  onOpenTournaments,
  onSelectTab,
  onInviteFriend,
  onStartPractice,
  onJoinRoomCode
}) {
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  // Auto rotate winner ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % RECENT_WINNERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleClaimDaily = async () => {
    if (!currentUser) return onOpenAuth();
    if (dailyClaimed || claiming) return;

    setClaiming(true);
    try {
      const res = await apiFetch('/api/wallet/claim-daily', { method: 'POST' });
      sound.playWin();
      confetti({ particleCount: 70, spread: 60 });
      setDailyClaimed(true);
      if (currentUser && res.user) {
        currentUser.balance = res.user.balance;
      }
    } catch (err) {
      alert(err.message);
      setDailyClaimed(true);
    } finally {
      setClaiming(false);
    }
  };

  const handleGameClick = (gameId) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    onSelectGame(gameId);
  };

  const handleRoomCodeSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!roomCode.trim()) return;
    if (onJoinRoomCode) {
      onJoinRoomCode(roomCode.trim().toUpperCase());
    } else {
      onSelectGame('ludo');
    }
  };

  const currentWinner = RECENT_WINNERS[tickerIndex];
  const onlineFriends = friends.filter(f => onlineUserIds.includes(f.id));

  return (
    <div className="max-w-md mx-auto px-4 pb-28 space-y-4 font-sans">
      {/* 1. Live Winners Rolling Ticker (Continuous Smooth Marquee) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-2.5 text-xs overflow-hidden shadow-lg relative">
        <div className="flex items-center gap-1.5 shrink-0 z-10 bg-slate-900 pr-2 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-amber-400 font-black text-[11px] shrink-0 uppercase tracking-wide">লাইভ জয়:</span>
        </div>

        <div className="overflow-hidden flex-1 relative whitespace-nowrap">
          <div className="animate-marquee flex items-center gap-6">
            {[...RECENT_WINNERS, ...RECENT_WINNERS].map((w, idx) => (
              <div key={idx} className="inline-flex items-center gap-1.5 shrink-0 text-xs">
                <span className="text-white font-bold">{w.name}</span>
                <span className="text-slate-400 text-[11px]">({w.game})</span>
                <span className="text-emerald-400 font-mono font-black">+{w.amount} ৳</span>
                <span className="text-slate-600 mx-1">•</span>
              </div>
            ))}
          </div>
        </div>

        <span className="text-[9px] text-emerald-400/90 font-mono font-bold uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 z-10">
          LIVE
        </span>
      </div>

      {/* 2. Top User Card / Clean Balance & Quick Cashier */}
      {currentUser ? (
        <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={currentUser.username}
                className="w-10 h-10 rounded-full bg-slate-950 border border-slate-700 object-cover"
              />
              <div>
                <span className="text-xs text-slate-400 font-medium block">স্বাগতম</span>
                <span className="font-bold text-sm text-white tracking-wide">{currentUser.username}</span>
              </div>
            </div>

            {/* Daily Streak Claim Button */}
            <button
              onClick={handleClaimDaily}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dailyClaimed
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              {dailyClaimed ? 'সংগৃহীত' : 'দৈনিক রিওয়ার্ড'}
            </button>
          </div>

          {/* Balance & Direct Cashier Buttons */}
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                উপলব্ধ ব্যালেন্স
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {(currentUser.balance || 0).toFixed(2)} ৳
              </span>
            </div>

            {/* Direct Recharge & Withdraw */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenWallet({ tab: 'deposit' })}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                রিচার্জ
              </button>

              <button
                onClick={() => onOpenWallet({ tab: 'withdraw' })}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-amber-400" />
                উত্তোলন
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Guest High-Conversion Banner */
        <div className="relative rounded-3xl p-5 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden space-y-3">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              রিয়েল মাল্টিপ্লেয়ার গেমিং
            </div>

            <h2 className="text-xl font-black text-white leading-tight">
              লুডু, দাবা ও ক্যারাম রিয়েল মানি অ্যারেনা
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              অনলাইনে সরাসরি খেলোয়াড়দের সাথে খেলুন এবং ৯৫% উইনিং ব্যালেন্স ৫ মিনিটে বিকাশ বা নগদে তুলে নিন।
            </p>

            <div className="pt-1 flex items-center gap-2.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> লগইন
              </button>

              <button
                onClick={onStartPractice}
                title="Practice Mode"
                className="px-3.5 py-3 bg-slate-800 hover:bg-slate-750 text-cyan-400 rounded-2xl border border-slate-700 flex items-center justify-center text-xs font-bold gap-1 transition cursor-pointer"
              >
                <Bot className="w-4 h-4" /> প্র্যাকটিস
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Promotional Carousel Slider */}
      <HomeSlider
        currentUser={currentUser}
        onOpenWallet={onOpenWallet}
        onOpenTournaments={onOpenTournaments}
        onOpenAuth={onOpenAuth}
        onSelectAction={(action) => {
          if (action === 'games') onSelectGame('ludo');
          if (action === 'profile' && onSelectTab) onSelectTab('profile');
        }}
      />

      {/* 4. Featured Games */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-amber-400" /> গেমস সমূহ
          </span>
          <span className="text-[10px] text-slate-400">৫% প্ল্যাটফর্ম ফি</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* LUDO CARD */}
          <div 
            onClick={() => handleGameClick('ludo')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 shadow-xl transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-white text-sm">লুডু প্রো</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    জনপ্রিয়
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">১v১ এবং ৪-প্লেয়ার বোর্ড ম্যাচ</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded font-mono text-amber-400 font-bold border border-slate-800">
                    ২০ ৳ – ১,০০০ ৳
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">৯৫% পেআউট</span>
                </div>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md transition-colors shrink-0">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>

          {/* CHESS CARD */}
          <div 
            onClick={() => handleGameClick('chess')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-400/40 shadow-xl transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm group-hover:scale-105 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-white text-sm">দাবা মাস্টার</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    কৌশলী
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">১ বনাম ১ লাইভ দাবা ম্যাচ</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded font-mono text-cyan-400 font-bold border border-slate-800">
                    ২০ ৳ – ১,০০০ ৳
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">৯৫% পেআউট</span>
                </div>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md transition-colors shrink-0">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>

          {/* CARROM CARD */}
          <div 
            onClick={() => handleGameClick('carrom')}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-400/40 shadow-xl transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-white text-sm">ক্যারাম ক্ল্যাশ</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ক্লাসিক
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">স্ট্রাইকার ও কয়েন পকেট বোর্ড</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded font-mono text-emerald-400 font-bold border border-slate-800">
                    ২০ ৳ – ১,০০০ ৳
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">৯৫% পেআউট</span>
                </div>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition-colors shrink-0">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Join / Create Private Room Box (Only Visible When Logged In) */}
      {currentUser && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" /> বন্ধুদের প্রাইভেট রুম
            </span>
            <span className="text-[10px] text-amber-400 font-medium">কোড বা তৈরি</span>
          </div>

          <form onSubmit={handleRoomCodeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="৬ অক্ষরের রুম কোড"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase tracking-widest focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              যুক্ত হোন
            </button>
          </form>

          <button
            onClick={() => onSelectGame('ludo')}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" /> নতুন প্রাইভেট রুম তৈরি করুন
          </button>
        </div>
      )}

      {/* 6. Online Friends Stories Carousel (if logged in) */}
      {currentUser && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> অনলাইন বন্ধুরা ({onlineFriends.length})
            </span>
            <span className="text-[10px] text-slate-500">ম্যাচ চ্যালেঞ্জ</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {onlineFriends.length === 0 ? (
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl w-full text-center text-xs text-slate-400">
                বর্তমানে কোনো বন্ধু অনলাইনে নেই। ইউজারনেম দিয়ে বন্ধু যোগ করুন।
              </div>
            ) : (
              onlineFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => onInviteFriend(friend)}
                  className="flex flex-col items-center shrink-0 group cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-md group-hover:scale-105 transition-transform">
                      <img
                        src={friend.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=friend'}
                        alt={friend.username}
                        className="w-full h-full rounded-full bg-slate-950 object-cover"
                      />
                    </div>
                    <span className="w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full absolute bottom-0 right-0" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 mt-1 max-w-[65px] truncate">
                    {friend.username}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. Platform Features / Trust Badges */}
      <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/70 space-y-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          প্ল্যাটফর্ম নিরাপত্তা
        </span>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">নিরাপদ এসক্রো</span>
            <span className="text-[9px] text-slate-400">১০০% গ্যারান্টি</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">দ্রুত ক্যাশআউট</span>
            <span className="text-[9px] text-slate-400">বিকাশ / নগদ</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-850">
            <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-white block">মাত্র ৫% ফি</span>
            <span className="text-[9px] text-slate-400">৯৫% উইনার পে</span>
          </div>
        </div>
      </div>
    </div>
  );
}