import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Trophy, Swords, Users, Sparkles, Plus, Key, 
  ArrowRight, ShieldCheck, Zap, RefreshCw, Share2, Check,
  Wallet, ArrowDownRight, ArrowUpRight, AlertCircle, AlertTriangle,
  Gamepad2, Crown, Target, Coins
} from 'lucide-react';

const GAMES = [
  {
    id: 'ludo',
    name: 'লুডু প্রো',
    english: 'Ludo Pro Arena',
    icon: Gamepad2,
    desc: '১v১ এবং ৪-প্লেয়ার ক্লাসিক বোর্ড। গুটি কাটা ও সেফ স্পট।',
    color: 'from-amber-500 to-orange-600',
    modes: ['1v1', '4player'],
    badge: 'জনপ্রিয়'
  },
  {
    id: 'chess',
    name: 'দাবা মাস্টার',
    english: 'Grandmaster Chess',
    icon: Crown,
    desc: '১v১ মস্তিষ্কের কৌশল। চেকমেট বা সময়ের ভিত্তিতে নগদ জয়।',
    color: 'from-cyan-500 to-blue-600',
    modes: ['1v1'],
    badge: 'কৌশলী'
  },
  {
    id: 'carrom',
    name: 'ক্যারাম ক্ল্যাশ',
    english: 'Carrom Board Clash',
    icon: Target,
    desc: 'স্ট্রাইকার দিয়ে কয়েন পকেট করুন, রেড কুইন কভার করুন।',
    color: 'from-emerald-500 to-teal-600',
    modes: ['1v1'],
    badge: 'ক্লাসিক'
  }
];

const STAKES = [50, 100, 200, 500, 1000, 2000];

export default function GameLobby({ 
  currentUser, 
  socket, 
  initialGame = 'ludo',
  onMatchStarted, 
  onOpenWallet, 
  onOpenAuth 
}) {
  const [selectedGame, setSelectedGame] = useState(initialGame || 'ludo');
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedStake, setSelectedStake] = useState(50);
  const [inQueue, setInQueue] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');

  // Insufficient balance modal state
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [rechargeShortage, setRechargeShortage] = useState(0);

  useEffect(() => {
    if (initialGame) {
      setSelectedGame(initialGame);
      if (initialGame !== 'ludo') setSelectedMode('1v1');
    }
  }, [initialGame]);

  // Socket match handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('queue_waiting', () => {
      setInQueue(true);
    });

    socket.on('queue_left', () => {
      setInQueue(false);
    });

    socket.on('room_created', ({ roomId, roomCode, match }) => {
      setCreatedRoom({ roomId, roomCode, match });
    });

    socket.on('room_joined', () => {
      setError('');
    });

    socket.on('player_joined', ({ match }) => {
      if (createdRoom && createdRoom.match.id === match.id) {
        setCreatedRoom(prev => ({ ...prev, match }));
      }
    });

    socket.on('match_started', ({ roomId, match, state }) => {
      setInQueue(false);
      setCreatedRoom(null);
      onMatchStarted(match, state);
    });

    socket.on('error', (err) => {
      setError(typeof err === 'string' ? err : err.message);
      setInQueue(false);
    });

    return () => {
      socket.off('queue_waiting');
      socket.off('queue_left');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('match_started');
      socket.off('error');
    };
  }, [socket, createdRoom, onMatchStarted]);

  // Calculations for 5% commission
  const playersCount = (selectedGame === 'ludo' && selectedMode === '4player') ? 4 : 2;
  const totalPool = selectedStake * playersCount;
  const commission = (totalPool * 0.05).toFixed(2);
  const winnerPayout = (totalPool * 0.95).toFixed(2);

  const checkBalanceOrPrompt = () => {
    if (!currentUser) {
      onOpenAuth();
      return false;
    }
    const bal = currentUser.balance || 0;
    if (bal < selectedStake) {
      setRechargeShortage(selectedStake - bal);
      setShowInsufficientModal(true);
      return false;
    }
    return true;
  };

  const handleJoinQueue = () => {
    if (!checkBalanceOrPrompt()) return;
    setError('');
    socket.emit('join_queue', {
      userId: currentUser.id,
      gameType: selectedGame,
      mode: selectedMode,
      stake: selectedStake
    });
  };

  const handleLeaveQueue = () => {
    if (!currentUser) return;
    socket.emit('leave_queue', { userId: currentUser.id });
    setInQueue(false);
  };

  const handleCreateRoom = (isPrivate = true) => {
    if (!checkBalanceOrPrompt()) return;
    setError('');
    socket.emit('create_room', {
      userId: currentUser.id,
      gameType: selectedGame,
      mode: selectedMode,
      stake: selectedStake,
      isPrivate
    });
  };

  const handleJoinByCode = (e) => {
    e?.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!roomCodeInput.trim()) return;
    setError('');
    socket.emit('join_room_by_code', {
      userId: currentUser.id,
      roomCode: roomCodeInput.trim().toUpperCase()
    });
  };

  const copyRoomLink = () => {
    if (!createdRoom) return;
    const link = `${window.location.origin}?room=${createdRoom.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentBal = currentUser?.balance || 0;

  return (
    <div className="max-w-md mx-auto px-4 pb-28 space-y-4">
      {/* Top Wallet & Recharge Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              আপনার ব্যালেন্স
            </span>
            <span className="text-base font-black text-emerald-400 font-mono leading-none">
              {currentBal.toFixed(2)} ৳
            </span>
          </div>
        </div>

        <button
          onClick={() => onOpenWallet ? onOpenWallet({ tab: 'deposit', amount: selectedStake }) : null}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          রিচার্জ করুন
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError('')} className="font-bold underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* 1. Game Selector Pills */}
      <div>
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 px-1">
          ১. গেম সিলেক্ট করুন:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GAMES.map(g => {
            const isSelected = selectedGame === g.id;
            const IconComp = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGame(g.id);
                  if (g.modes.length === 1) setSelectedMode(g.modes[0]);
                }}
                className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/30 shadow-lg'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <IconComp className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-black truncate w-full">{g.name}</span>
                <span className="text-[9px] text-amber-400 font-bold">{g.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mode Selector (1v1 vs 4-Player for Ludo) */}
      {selectedGame === 'ludo' && (
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 px-1">
            ২. প্লেয়ার মোড বেছে নিন:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedMode('1v1')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                selectedMode === '1v1'
                  ? 'border-amber-400 bg-amber-500/15 text-white font-bold ring-2 ring-amber-400/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="text-sm font-black text-white">১ বনাম ১ ডুয়েট</div>
              <span className="text-[10px] text-slate-400">২ জন মুখোমুখি ম্যাচ</span>
            </button>
            <button
              onClick={() => setSelectedMode('4player')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                selectedMode === '4player'
                  ? 'border-amber-400 bg-amber-500/15 text-white font-bold ring-2 ring-amber-400/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div className="text-sm font-black text-white">৪-প্লেয়ার ক্লাসিক</div>
              <span className="text-[10px] text-slate-400">৪ জন প্লেয়ার / ২ বনাম ২ টিম</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Stake Selector & 5% Payout Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            ৩. এন্ট্রি ফি ও বাজি নির্ধারণ:
          </label>
          <span className="text-[10px] text-amber-400 font-bold">৫% কমিশন এসক্রো</span>
        </div>

        {/* Stake Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STAKES.map(stake => (
            <button
              key={stake}
              onClick={() => setSelectedStake(stake)}
              className={`py-2.5 rounded-2xl border font-mono font-bold text-xs transition cursor-pointer ${
                selectedStake === stake
                  ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black scale-105'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
              }`}
            >
              {stake} ৳
            </button>
          ))}
        </div>

        {/* 5% Breakdown Banner */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">মোট প্রাইজ পুল</span>
            <span className="font-mono text-sm font-bold text-white">{totalPool} ৳</span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400 text-[10px] block">৫% প্ল্যাটফর্ম চার্জ</span>
            <span className="font-mono text-sm font-bold text-rose-400">-{commission} ৳</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-right">
            <span className="text-emerald-400 font-bold text-[10px] block">বিজয়ী পাবে (৯৫%)</span>
            <span className="text-sm font-black text-emerald-400 font-mono">+{winnerPayout} ৳</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {inQueue ? (
            <button
              onClick={handleLeaveQueue}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl transition animate-pulse flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5 animate-spin" /> প্রতিপক্ষ খোঁজা হচ্ছে... বাতিল করুন
            </button>
          ) : (
            <button
              onClick={handleJoinQueue}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base rounded-2xl shadow-xl glow-gold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-5 h-5 fill-current" /> দ্রুত খেলুন — {selectedStake} ৳
            </button>
          )}

          <button
            onClick={() => handleCreateRoom(true)}
            className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" /> বন্ধুদের জন্য রুম তৈরি করুন
          </button>
        </div>
      </div>

      {/* 4. Join Friend's Room with Code Box */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Key className="w-4 h-4 text-amber-400" /> রুম কোড দিয়ে সরাসরি জয়েন করুন
        </span>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="কোড লিখুন (যেমন: 9X2AB4)"
            maxLength={6}
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase tracking-widest focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
          >
            জয়েন করুন
          </button>
        </form>
      </div>

      {/* Insufficient Balance Prompt Modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
              <Coins className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">পর্যাপ্ত ব্যালেন্স নেই</h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedStake} ৳ এন্ট্রি ফির ম্যাচে অংশ নিতে অ্যাকাউন্টে পর্যাপ্ত টাকা নেই।
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-slate-400">
                <span>ম্যাচ ফি:</span>
                <strong className="text-white font-mono">{selectedStake} ৳</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>আপনার ব্যালেন্স:</span>
                <strong className="text-amber-400 font-mono">{currentBal.toFixed(2)} ৳</strong>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold">
                <span className="text-rose-400">ঘাটতি:</span>
                <strong className="text-rose-400 font-mono">+{rechargeShortage.toFixed(2)} ৳</strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  onOpenWallet({ tab: 'deposit', amount: selectedStake });
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" /> 
                এখনই রিচার্জ করুন ({selectedStake} ৳)
              </button>

              <button
                onClick={() => setShowInsufficientModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Room Popup when User creates Room */}
      {createdRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-black text-white mb-1">রুম তৈরি হয়েছে</h2>
            <p className="text-xs text-slate-400 mb-4">
              বন্ধুকে নিচের কোডটি শেয়ার করুন। সে যুক্ত হওয়া মাত্রই ম্যাচ শুরু হবে!
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4">
              <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">রুম কোড</span>
              <span className="text-3xl font-black font-mono text-amber-400 tracking-widest">
                {createdRoom.roomCode}
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={copyRoomLink}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                {copiedLink ? 'লিঙ্ক কপি হয়েছে!' : 'ইনভাইট লিঙ্ক কপি করুন'}
              </button>
            </div>

            <button
              onClick={() => setCreatedRoom(null)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 text-xs font-bold rounded-xl"
            >
              রুম বাতিল করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}