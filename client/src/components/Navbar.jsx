import React from 'react';
import { 
  Wallet, User, LogOut, Plus, LogIn, 
  Users, Trophy, Swords, HelpCircle, ArrowDownRight, ArrowUpRight, Gamepad2, Download 
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onlineCount = 1,
  onOpenAuth, 
  onOpenWallet, 
  onOpenProfile, 
  onOpenFriends,
  onOpenLeaderboard,
  onOpenTournaments,
  onOpenDisputes,
  onLogout,
  onInstallPwa
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Brand Logo & Online Badge */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.location.reload();
          }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg glow-gold group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-base sm:text-lg text-white tracking-wide block leading-none">
              Ludu<span className="text-amber-400">Star</span> <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold ml-0.5">PRO</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">রিয়েল মানি অ্যারেনা</span>
          </div>
        </div>

        {/* Live Online Dot */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{onlineCount} Online</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        {onInstallPwa && (
          <button
            onClick={onInstallPwa}
            title="লুডুস্টার প্রো অ্যাপ ইনস্টল করুন"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
            <span className="sm:hidden">ইনস্টল</span>
          </button>
        )}

        {currentUser ? (
          <>
            {/* Wallet Balance Badge with Direct Deposit / Withdraw */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 pl-2.5 rounded-2xl shadow-sm">
              <div 
                onClick={() => onOpenWallet({ tab: 'history' })}
                className="flex flex-col text-left cursor-pointer pr-1"
                title="ক্লিক করে লেনদেন হিস্টোরি দেখুন"
              >
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">ব্যালেন্স</span>
                <span className="text-xs font-black font-mono text-emerald-400">
                  {(currentUser.balance || 0).toFixed(2)} ৳
                </span>
              </div>

              {/* Direct 1-click Deposit button */}
              <button 
                onClick={() => onOpenWallet({ tab: 'deposit' })}
                title="টাকা রিচার্জ করুন"
                className="px-2 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow-sm flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">রিচার্জ</span>
              </button>

              {/* Direct 1-click Withdraw button */}
              <button 
                onClick={() => onOpenWallet({ tab: 'withdraw' })}
                title="টাকা উত্তোলন করুন"
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">উত্তোলন</span>
              </button>
            </div>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-white transition cursor-pointer"
            >
              <img 
                src={currentUser.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'} 
                alt="av" 
                className="w-5 h-5 rounded-full" 
              />
              <span className="hidden sm:inline">{currentUser.username}</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="লগআউট"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-amber-400" /> লগইন
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg glow-gold transition cursor-pointer hidden sm:flex items-center gap-1"
            >
              রেজিস্ট্রেশন
            </button>
          </div>
        )}
      </div>
    </header>
  );
}