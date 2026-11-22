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
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto p-2 sm:p-4 items-center lg:items-start justify-center">
      {/* Board Column */}
      <div className="flex flex-col items-center w-full max-w-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <button 
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
              Pool: {match.stake * 2} ৳
            </span>
            <span className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              Win: {(match.stake * 2 * 0.95).toFixed(0)} ৳
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 font-bold">
            <Clock className="w-3.5 h-3.5" /> {timeLeft}s
          </div>
        </div>

        {/* Players Score Bar */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 flex items-center justify-between">
          {players.map((p, idx) => (
            <div key={idx} className={`flex items-center gap-2.5 ${p.userId === currentTurnUserId ? 'opacity-100 font-bold' : 'opacity-60'}`}>
              <div className={`w-3.5 h-3.5 rounded-full border ${p.side === 'white' ? 'bg-amber-100 border-white' : 'bg-slate-900 border-slate-600'}`} />
              <div className="text-xs">
                <span className="text-white block">{p.username} ({p.side})</span>
                <span className="text-amber-400 font-bold">{p.score || 0} pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Deluxe Realistic Carrom Board */}
        <div className="relative aspect-square w-full max-w-[480px] bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 rounded-[2.5rem] border-[8px] border-amber-900/90 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.15)] p-3 sm:p-4 overflow-hidden">
          <svg viewBox="0 0 600 600" className="w-full h-full rounded-2xl shadow-inner">
            {/* Board Background */}
            <rect width="600" height="600" fill="#f8e7b9" />
            
            {/* Outer border & Baseline frame */}
            <rect x="25" y="25" width="550" height="550" fill="none" stroke="#78350f" strokeWidth="5" />
            
            {/* 4 Corner Pockets with Brass Trim */}
            <circle cx="45" cy="45" r="30" fill="#020617" stroke="#b45309" strokeWidth="4" />
            <circle cx="555" cy="45" r="30" fill="#020617" stroke="#b45309" strokeWidth="4" />
            <circle cx="45" cy="555" r="30" fill="#020617" stroke="#b45309" strokeWidth="4" />
            <circle cx="555" cy="555" r="30" fill="#020617" stroke="#b45309" strokeWidth="4" />

            {/* Center Circle */}
            <circle cx="300" cy="300" r="70" fill="none" stroke="#b45309" strokeWidth="3" />
            <circle cx="300" cy="300" r="20" fill="#b45309" opacity="0.3" />

            {/* Baselines */}
            <line x1="150" y1="520" x2="450" y2="520" stroke="#b45309" strokeWidth="3" strokeDasharray="6 4" />
            <circle cx="150" cy="520" r="14" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
            <circle cx="450" cy="520" r="14" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />

            <line x1="150" y1="80" x2="450" y2="80" stroke="#b45309" strokeWidth="3" strokeDasharray="6 4" />
            <circle cx="150" cy="80" r="14" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
            <circle cx="450" cy="80" r="14" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />

            {/* Coins on Board */}
            {coins.filter(c => !c.pocketed).map(coin => (
              <circle
                key={coin.id}
                cx={coin.x}
                cy={coin.y}
                r={coin.radius}
                fill={coin.type === 'queen' ? '#dc2626' : coin.type === 'white' ? '#f8fafc' : '#1e293b'}
                stroke={coin.type === 'queen' ? '#991b1b' : coin.type === 'white' ? '#cbd5e1' : '#0f172a'}
                strokeWidth="2"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"
              />
            ))}

            {/* Active Striker */}
            <circle
              cx={strikerX}
              cy={myPlayer?.side === 'white' ? 520 : 80}
              r="18"
              fill="#06b6d4"
              stroke="#0891b2"
              strokeWidth="3"
              filter="drop-shadow(0 3px 5px rgba(0,0,0,0.5))"
            />

            {/* Aim Trajectory Arrow */}
            {isMyTurn && (
              <line
                x1={strikerX}
                y1={myPlayer?.side === 'white' ? 520 : 80}
                x2={strikerX + Math.cos((angle * Math.PI) / 180) * (power * 1.5)}
                y2={(myPlayer?.side === 'white' ? 520 : 80) + (myPlayer?.side === 'white' ? -Math.sin((angle * Math.PI) / 180) : Math.sin((angle * Math.PI) / 180)) * (power * 1.5)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        </div>

        {/* Striker Controls */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-3 shadow-xl">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Striker Position</span>
                <span className="font-mono text-cyan-400">{strikerX}</span>
              </div>
              <input
                type="range"
                min="150"
                max="450"
                value={strikerX}
                disabled={!isMyTurn}
                onChange={(e) => setStrikerX(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Aim Angle</span>
                  <span className="font-mono text-amber-400">{angle}°</span>
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
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Strike Power</span>
                  <span className="font-mono text-rose-400">{power}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={power}
                  disabled={!isMyTurn}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleStrike}
              disabled={!isMyTurn}
              className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                isMyTurn
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 glow-cyan cursor-pointer scale-[1.02]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" /> {isMyTurn ? 'STRIKE!' : 'WAITING FOR OPPONENT'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Chat & Commentary */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-80 shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
            <span className="text-xs font-bold text-slate-300">Carrom Commentary</span>
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
