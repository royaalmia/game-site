import React, { useState, useEffect } from 'react';
import { sound } from '../utils/sound';
import { Swords, Check, X, Clock, Trophy } from 'lucide-react';

export default function InvitePopupModal({ invite, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(25);

  useEffect(() => {
    if (!invite) return;
    sound.playCapture(); // alert chime
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(invite);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [invite]);

  if (!invite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative glow-gold">
        {/* Countdown Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 font-mono text-xs text-amber-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5" /> {timeLeft}s
        </div>

        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 p-1 mx-auto mb-3 flex items-center justify-center text-3xl">
          <img 
            src={invite.fromUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=invite'} 
            alt="av" 
            className="w-full h-full rounded-full" 
          />
        </div>

        <h3 className="text-base font-black text-white mb-0.5">
          Match Challenge! ⚔️
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          <strong className="text-amber-400">{invite.fromUser?.username}</strong> invited you to play{' '}
          <strong className="text-white uppercase">{invite.gameType} ({invite.mode})</strong>
        </p>

        {/* Stake and Payout Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mb-5 text-xs">
          <div className="flex justify-between items-center mb-1 text-slate-400">
            <span>Match Stake:</span>
            <span className="font-mono font-bold text-white">{invite.stake} ৳</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-1.5 font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Winner Takes:
            </span>
            <span className="font-mono text-emerald-400 text-sm">+{invite.payout} ৳</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onDecline(invite)}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <X className="w-4 h-4" /> Decline
          </button>
          <button
            onClick={() => onAccept(invite)}
            className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg glow-gold transition cursor-pointer"
          >
            <Check className="w-4 h-4" /> Accept & Play
          </button>
        </div>
      </div>
    </div>
  );
}
