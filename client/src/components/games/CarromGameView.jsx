import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { Trophy, Clock, ArrowLeft, Send, Sparkles, Target, Zap } from 'lucide-react';

export default function CarromGameView({ match, gameState, currentUser, socket, onLeave }) {
  const [strikerX, setStrikerX] = useState(300);
  const [angle, setAngle] = useState(90);
  const [power, setPower] = useState(65);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25);
  const chatBottomRef = useRef(null);

  const players = gameState?.players || match?.players || [];
  const currentTurnUserId = gameState?.currentTurnUserId;
  const isMyTurn = currentTurnUserId === currentUser?.id;
  const myPlayer = players.find(p => p.userId === currentUser?.id);
  const coins = gameState?.coins || [];
  const winner = gameState?.winner;

  // Countdown timer
  useEffect(() => {
    if (!gameState?.turnDeadline) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.turnDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 250);
    return () => clearInterval(interval);
  }, [gameState?.turnDeadline]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('carrom_struck', (data) => {
      sound.playTokenMove();
    });

    socket.on('chat_received', (msg) => {
      setChatHistory(prev => [...prev, msg]);
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    socket.on('game_settled', () => {
      sound.playWin();
      confetti({ particleCount: 110, spread: 75 });
    });

    return () => {
      socket.off('carrom_struck');
      socket.off('chat_received');
      socket.off('game_settled');
    };
  }, [socket]);

  const handleStrike = () => {
    if (!isMyTurn) return;
    sound.playClick();
    socket.emit('carrom_strike', {
      roomId: match.id,
      userId: currentUser.id,
      strikerX,
      angle,
      power
    });
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('send_chat', {
      roomId: match.id,
      userId: currentUser.id,
      text: chatMessage.trim()
    });
    setChatMessage('');
  };

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-start p-2 sm:p-4 bg-[#20050d] bg-[radial-gradient(ellipse_at_top,_#47091a_0%,_#1a030a_100%)] text-slate-100 rounded-3xl shadow-2xl">
      {/* Board Column */}
      <div className="flex flex-col items-center w-full max-w-[490px]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between w-full mb-2 px-1">
          <button 
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-900/50 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> প্রস্থান
          </button>
          <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-xl bg-slate-900/90 text-amber-400 border border-amber-800/40 font-bold shadow-md">
            <Clock className="w-3.5 h-3.5" /> {timeLeft}s
          </div>
        </div>

        {/* 🏆 Carrom Pool Top Pot & Player Header (Ref: Carrom Pool App) */}
        <div className="w-full bg-slate-950/60 border border-amber-900/40 rounded-3xl p-3 mb-3 flex items-center justify-between backdrop-blur-sm shadow-xl">
          {/* Player 1 (White) */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg">
                <img
                  src={players[0]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=CarromPro1'}
                  alt="p1"
                  className="w-full h-full rounded-2xl bg-slate-900 object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-400 shadow-sm flex items-center justify-center text-[9px]">⚪</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-white block max-w-[85px] truncate">
                {players[0]?.username || 'Player 1'}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-white shadow-sm inline-block" />
                <span className="font-mono text-sm font-black text-white">
                  {players[0]?.score || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Center Stake / Pot Badge with Stack of Gold Coins */}
          <div className="flex flex-col items-center">
            <div className="text-2xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]">
              🪙🪙
            </div>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono tracking-tight drop-shadow-md">
              {match.stake * 2} ৳
            </span>
            <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
              বোর্ড প্রাইজ
            </span>
          </div>

          {/* Player 2 (Black) */}
          <div className="flex items-center gap-2 flex-row-reverse text-right">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-500 p-0.5 shadow-lg">
                <img
                  src={players[1]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=CarromKing2'}
                  alt="p2"
                  className="w-full h-full rounded-2xl bg-slate-900 object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-600 shadow-sm flex items-center justify-center text-[9px]">⚫</span>
            </div>
            <div>
              <span className="text-xs font-black text-white block max-w-[85px] truncate">
                {players[1]?.username || 'Player 2'}
              </span>
              <div className="flex items-center justify-end gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600 shadow-sm inline-block" />
                <span className="font-mono text-sm font-black text-slate-300">
                  {players[1]?.score || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 The Deluxe Carrom Board Frame */}
        <div className="relative aspect-square w-full max-w-[460px] bg-[#d97706] rounded-[2.5rem] border-[10px] border-[#b45309] shadow-[0_30px_70px_rgba(0,0,0,0.9),inset_0_4px_6px_rgba(255,255,255,0.3)] p-2.5 sm:p-3 overflow-hidden">
          {/* Inner Blue Cushion Rim */}
          <div className="w-full h-full rounded-[1.8rem] border-[6px] border-[#0284c7] overflow-hidden shadow-inner relative bg-[#f5e1b8]">
            <svg viewBox="0 0 600 600" className="w-full h-full select-none">
              <defs>
                {/* Natural Wood Board Gradient */}
                <radialGradient id="carromWood" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#faecd1" />
                  <stop offset="60%" stopColor="#f5dcab" />
                  <stop offset="100%" stopColor="#e8c78c" />
                </radialGradient>
                {/* Deep Pocket Radial Shadow */}
                <radialGradient id="pocketDepth" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="70%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
              </defs>

              {/* Surface */}
              <rect width="600" height="600" fill="url(#carromWood)" />
              
              {/* Outer baseline boundary square */}
              <rect x="55" y="55" width="490" height="490" fill="none" stroke="#78350f" strokeWidth="2" opacity="0.6" />

              {/* 4 Corner Pockets */}
              <circle cx="42" cy="42" r="32" fill="url(#pocketDepth)" stroke="#78350f" strokeWidth="3" />
              <circle cx="558" cy="42" r="32" fill="url(#pocketDepth)" stroke="#78350f" strokeWidth="3" />
              <circle cx="42" cy="558" r="32" fill="url(#pocketDepth)" stroke="#78350f" strokeWidth="3" />
              <circle cx="558" cy="558" r="32" fill="url(#pocketDepth)" stroke="#78350f" strokeWidth="3" />

              {/* Pocket Corner Diagonal Arrows */}
              <line x1="85" y1="85" x2="160" y2="160" stroke="#9a3412" strokeWidth="2" />
              <circle cx="160" cy="160" r="16" fill="none" stroke="#9a3412" strokeWidth="2" />
              <line x1="515" y1="85" x2="440" y2="160" stroke="#9a3412" strokeWidth="2" />
              <circle cx="440" cy="160" r="16" fill="none" stroke="#9a3412" strokeWidth="2" />
              <line x1="85" y1="515" x2="160" y2="440" stroke="#9a3412" strokeWidth="2" />
              <circle cx="160" cy="440" r="16" fill="none" stroke="#9a3412" strokeWidth="2" />
              <line x1="515" y1="515" x2="440" y2="440" stroke="#9a3412" strokeWidth="2" />
              <circle cx="440" cy="440" r="16" fill="none" stroke="#9a3412" strokeWidth="2" />

              {/* Baselines (Player & Opponent) */}
              {/* Bottom Baseline */}
              <line x1="150" y1="480" x2="450" y2="480" stroke="#78350f" strokeWidth="2.5" />
              <line x1="150" y1="486" x2="450" y2="486" stroke="#78350f" strokeWidth="1" strokeDasharray="5 3" />
              <circle cx="150" cy="483" r="16" fill="#c2410c" stroke="#78350f" strokeWidth="2" />
              <circle cx="450" cy="483" r="16" fill="#c2410c" stroke="#78350f" strokeWidth="2" />

              {/* Top Baseline */}
              <line x1="150" y1="120" x2="450" y2="120" stroke="#78350f" strokeWidth="2.5" />
              <line x1="150" y1="114" x2="450" y2="114" stroke="#78350f" strokeWidth="1" strokeDasharray="5 3" />
              <circle cx="150" cy="117" r="16" fill="#c2410c" stroke="#78350f" strokeWidth="2" />
              <circle cx="450" cy="117" r="16" fill="#c2410c" stroke="#78350f" strokeWidth="2" />

              {/* Center Concentric Circles with Rosette Design */}
              <circle cx="300" cy="300" r="75" fill="none" stroke="#78350f" strokeWidth="2.5" />
              <circle cx="300" cy="300" r="25" fill="#fef08a" stroke="#b45309" strokeWidth="2" opacity="0.4" />
              <circle cx="300" cy="300" r="6" fill="#b45309" />

              {/* Carrom Men (Pucks) on Board */}
              {coins.filter(c => !c.pocketed).map(coin => (
                <g key={coin.id}>
                  <circle
                    cx={coin.x}
                    cy={coin.y}
                    r={coin.radius}
                    fill={
                      coin.type === 'queen' ? '#dc2626' :
                      coin.type === 'white' ? '#f8fafc' : '#1e293b'
                    }
                    stroke={
                      coin.type === 'queen' ? '#991b1b' :
                      coin.type === 'white' ? '#cbd5e1' : '#0f172a'
                    }
                    strokeWidth="2.5"
                    filter="drop-shadow(0 3px 4px rgba(0,0,0,0.45))"
                  />
                  {coin.type === 'queen' && (
                    <circle cx={coin.x} cy={coin.y} r={coin.radius * 0.45} fill="#fef08a" />
                  )}
                  {coin.type !== 'queen' && (
                    <circle
                      cx={coin.x}
                      cy={coin.y}
                      r={coin.radius * 0.4}
                      fill="none"
                      stroke={coin.type === 'white' ? '#e2e8f0' : '#334155'}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              ))}

              {/* Striker Guide Line */}
              {isMyTurn && (
                <line
                  x1={strikerX}
                  y1={myPlayer?.side === 'white' ? 483 : 117}
                  x2={strikerX + Math.cos((angle * Math.PI) / 180) * (power * 2)}
                  y2={(myPlayer?.side === 'white' ? 483 : 117) + (myPlayer?.side === 'white' ? -Math.sin((angle * Math.PI) / 180) : Math.sin((angle * Math.PI) / 180)) * (power * 2)}
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  filter="drop-shadow(0 0 6px rgba(16,185,129,0.8))"
                />
              )}

              {/* Active Striker (Emerald Glowing Striker from reference) */}
              <g>
                <circle
                  cx={strikerX}
                  cy={myPlayer?.side === 'white' ? 483 : 117}
                  r="21"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="3"
                  filter="drop-shadow(0 4px 8px rgba(0,0,0,0.6))"
                />
                <circle
                  cx={strikerX}
                  cy={myPlayer?.side === 'white' ? 483 : 117}
                  r="13"
                  fill="#047857"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />
                {/* Crosshair / Direction Pointer */}
                <line
                  x1={strikerX - 7}
                  y1={myPlayer?.side === 'white' ? 483 : 117}
                  x2={strikerX + 7}
                  y2={myPlayer?.side === 'white' ? 483 : 117}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <line
                  x1={strikerX}
                  y1={(myPlayer?.side === 'white' ? 483 : 117) - 7}
                  x2={strikerX}
                  y2={(myPlayer?.side === 'white' ? 483 : 117) + 7}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* 🎚️ Mobile Striker Baseline Slider (Exact Match to Reference Image) */}
        <div className="w-full max-w-[440px] mt-4 px-2">
          <div className="relative flex items-center justify-center py-2">
            {/* The Gradient Slider Capsule Bar */}
            <div className="w-full h-8 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-amber-600 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_10px_rgba(0,0,0,0.5)] border-2 border-slate-700 relative overflow-hidden">
              <div className="w-full h-full flex items-center justify-between px-6 opacity-30 pointer-events-none">
                <span className="w-0.5 h-3 bg-slate-900" />
                <span className="w-0.5 h-3 bg-slate-900" />
                <span className="w-0.5 h-3 bg-slate-900" />
                <span className="w-0.5 h-3 bg-slate-900" />
                <span className="w-0.5 h-3 bg-slate-900" />
              </div>
            </div>

            {/* Draggable Striker Slider Input */}
            <input
              type="range"
              min="160"
              max="440"
              value={strikerX}
              disabled={!isMyTurn}
              onChange={(e) => setStrikerX(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Custom Circular Thumb with `< >` directional arrows (From User Image) */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white border-4 border-amber-500 shadow-[0_4px_10px_rgba(0,0,0,0.6)] text-emerald-600 font-black text-sm"
              style={{ left: `calc(${((strikerX - 160) / (440 - 160)) * 100}% - 22px)` }}
            >
              &lt; &gt;
            </div>
          </div>
        </div>

        {/* Strike Aim, Power & Button Controls */}
        <div className="w-full max-w-[440px] bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mt-2 shadow-xl space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5 font-bold">
                <span>লক্ষ্য এঙ্গেল</span>
                <span className="text-amber-400 font-mono">{angle}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="160"
                value={angle}
                disabled={!isMyTurn}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5 font-bold">
                <span>স্ট্রাইক পাওয়ার</span>
                <span className="text-emerald-400 font-mono">{power}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                value={power}
                disabled={!isMyTurn}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleStrike}
            disabled={!isMyTurn}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
              isMyTurn
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 glow-emerald scale-[1.02]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Zap className="w-4 h-4" /> {isMyTurn ? 'স্ট্রাইক করুন! ➔' : 'প্রতিপক্ষের চালের জন্য অপেক্ষা করুন...'}
          </button>
        </div>
      </div>

      {/* Right Column: Chat & Commentary */}
      <div className="w-full max-w-[440px] lg:w-72 mt-3 lg:mt-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col h-64 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> লাইভ চ্যাট</span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {gameState?.logs?.map((log, idx) => (
              <div key={idx} className="text-slate-400 bg-slate-950/40 p-2 rounded-lg">
                <span className="text-slate-500 mr-1.5">{log.time}</span>
                <span>{log.text}</span>
              </div>
            ))}
            {chatHistory.map((chat, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-800 text-slate-200">
                <span className="font-bold text-[10px] text-cyan-400 block">{chat.sender}</span>
                <span>{chat.text}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Chat..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <button type="submit" className="p-2 bg-cyan-500 text-slate-950 rounded-xl font-bold">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              🏆
            </div>
            <h2 className="text-2xl font-black text-white mb-1">CARROM CHAMPION!</h2>
            <p className="text-slate-400 text-sm mb-4">Winner: <strong className="text-amber-400">{winner.username}</strong></p>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 text-left text-xs space-y-1">
              <div className="flex justify-between"><span>Total Pool:</span><span className="font-bold text-white">{match.stake * 2} BDT</span></div>
              <div className="flex justify-between"><span>Commission (5%):</span><span className="font-bold text-rose-400">-{(match.stake * 2 * 0.05).toFixed(2)} BDT</span></div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                <span>Winner Payout:</span><span>+{(match.stake * 2 * 0.95).toFixed(2)} BDT</span>
              </div>
            </div>
            <button onClick={onLeave} className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black">
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
