import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { Trophy, ArrowLeft, Bot, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';

const TRACK_COORDINATES = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0]
];

const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

const BASE_SLOTS = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]]
};

// Realistic 3D Map-Pin Style Pawn Token (Ludo King Edition)
function LudoPinToken({ color, isClickable, onClick }) {
  const colorMap = {
    red: { fill: '#e52521', highlight: '#fca5a5', shadow: '#991b1b', eye: '#b91c1c' },
    yellow: { fill: '#fdb813', highlight: '#fef08a', shadow: '#b45309', eye: '#d97706' }
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`absolute inset-0 flex items-center justify-center transition-all duration-200 select-none ${
        isClickable
          ? 'cursor-pointer scale-125 z-30 animate-bounce drop-shadow-[0_0_10px_rgba(251,191,36,1)]'
          : 'z-20 drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]'
      }`}
    >
      <svg viewBox="0 0 40 50" className="w-[88%] h-[88%] max-w-[28px] max-h-[36px]">
        <defs>
          <linearGradient id={`silverGradPrac-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <radialGradient id={`glossGradPrac-${color}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="55%" stopColor={c.fill} />
            <stop offset="100%" stopColor={c.shadow} />
          </radialGradient>
        </defs>
        
        <ellipse cx="20" cy="46" rx="10" ry="3.5" fill="rgba(0,0,0,0.35)" />

        <path
          d="M 20 2 C 11 2, 4 9, 4 19 C 4 27, 13 36, 17 44 L 23 44 C 27 36, 36 27, 36 19 C 36 9, 29 2, 20 2 Z"
          fill={`url(#silverGradPrac-${color})`}
          stroke="#475569"
          strokeWidth="1.2"
        />

        <path
          d="M 20 5 C 13 5, 7 11, 7 19 C 7 25, 14 34, 18 42 L 22 42 C 26 34, 33 25, 33 19 C 33 11, 27 5, 20 5 Z"
          fill={`url(#glossGradPrac-${color})`}
        />

        <circle cx="20" cy="18" r="7.5" fill={c.fill} stroke="#ffffff" strokeWidth="1.6" />
        <circle cx="20" cy="18" r="5" fill={c.eye} />
        <circle cx="18" cy="16" r="2" fill="#ffffff" opacity="0.85" />

        <ellipse cx="20" cy="45" rx="8" ry="2.5" fill="#475569" />
        <ellipse cx="20" cy="44" rx="7" ry="2" fill={`url(#silverGradPrac-${color})`} />
      </svg>
    </button>
  );
}

function RealisticDice({ value = 1, isRolling = false }) {
  const pipsMap = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
  };
  const activePips = pipsMap[value] || [[1, 1]];

  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-slate-300 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.9)] p-2 grid grid-cols-3 grid-rows-3 transition-transform ${isRolling ? 'animate-spin' : ''}`}>
      {Array.from({ length: 3 }).map((_, r) =>
        Array.from({ length: 3 }).map((_, c) => {
          const hasPip = activePips.some(([pr, pc]) => pr === r && pc === c);
          return (
            <div key={`${r}-${c}`} className="flex items-center justify-center">
              {hasPip && (
                <div className={`w-2 h-2 rounded-full ${value === 1 ? 'bg-red-600' : 'bg-slate-900'} shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]`} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function PracticeModeView({ currentUser, onLeave }) {
  const [tokensPlayer, setTokensPlayer] = useState([
    { id: 0, position: -1, stepCount: 0 },
    { id: 1, position: -1, stepCount: 0 },
    { id: 2, position: -1, stepCount: 0 },
    { id: 3, position: -1, stepCount: 0 }
  ]);
  const [tokensBot, setTokensBot] = useState([
    { id: 0, position: -1, stepCount: 0 },
    { id: 1, position: -1, stepCount: 0 },
    { id: 2, position: -1, stepCount: 0 },
    { id: 3, position: -1, stepCount: 0 }
  ]);

  const [turn, setTurn] = useState('player'); // 'player' | 'bot'
  const [dice, setDice] = useState(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [winner, setWinner] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [logs, setLogs] = useState([{ text: 'Solo Practice Mode vs Smart AI Bot started!', time: 'Now' }]);

  // Bot Turn Automation
  useEffect(() => {
    if (turn === 'bot' && !winner) {
      const timer = setTimeout(() => {
        // 1. Bot rolls dice
        sound.playDiceRoll();
        const roll = Math.floor(Math.random() * 6) + 1;
        setDice(roll);

        // 2. Bot selects best move
        setTimeout(() => {
          botMakeMove(roll);
        }, 800);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [turn, winner]);

  const botMakeMove = (roll) => {
    setTokensBot(prev => {
      const newBot = [...prev];
      // Priority 1: Bring token out on 6
      if (roll === 6) {
        const yardToken = newBot.find(t => t.position === -1);
        if (yardToken) {
          yardToken.position = 26; // Yellow start position
          yardToken.stepCount = 0;
          sound.playTokenMove();
          setLogs(l => [{ text: 'Bot 🤖 rolled a 6 and brought a token out!', time: 'Now' }, ...l]);
          // Bonus turn on 6!
          setTurn('bot');
          return newBot;
        }
      }

      // Priority 2: Move active token
      const active = newBot.find(t => t.position !== -1 && t.position !== 105 && t.stepCount + roll <= 56);
      if (active) {
        const newStep = active.stepCount + roll;
        active.stepCount = newStep;
        if (newStep === 56) {
          active.position = 105;
          sound.playWin();
        } else if (newStep > 50) {
          active.position = 100 + (newStep - 51);
          sound.playTokenMove();
        } else {
          active.position = (26 + newStep) % 52;
          sound.playTokenMove();
        }

        setLogs(l => [{ text: `Bot 🤖 rolled ${roll} and advanced token!`, time: 'Now' }, ...l]);

        // Check if all bot tokens home
        if (newBot.every(t => t.position === 105)) {
          setWinner('Bot 🤖');
          return newBot;
        }

        if (roll === 6) {
          setTurn('bot');
        } else {
          setTurn('player');
          setHasRolled(false);
          setDice(null);
        }
        return newBot;
      }

      // No move
      setLogs(l => [{ text: `Bot 🤖 rolled ${roll} (no valid moves).`, time: 'Now' }, ...l]);
      setTurn('player');
      setHasRolled(false);
      setDice(null);
      return newBot;
    });
  };

  const handlePlayerRoll = () => {
    if (turn !== 'player' || hasRolled || winner) return;
    sound.playDiceRoll();
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    setHasRolled(true);

    // Check if player has any moves
    const hasMove = tokensPlayer.some(t => {
      if (t.position === 105) return false;
      if (t.position === -1) return roll === 6;
      return t.stepCount + roll <= 56;
    });

    if (!hasMove) {
      setLogs(l => [{ text: `You rolled a ${roll} (no valid moves).`, time: 'Now' }, ...l]);
      setTimeout(() => {
        setTurn('bot');
        setHasRolled(false);
        setDice(null);
      }, 900);
    }
  };

  const handlePlayerMove = (tokenId) => {
    if (turn !== 'player' || !hasRolled || !dice || winner) return;

    const token = tokensPlayer.find(t => t.id === tokenId);
    if (!token) return;

    if (token.position === -1 && dice !== 6) return;
    if (token.position !== -1 && token.stepCount + dice > 56) return;

    setTokensPlayer(prev => {
      const copy = [...prev];
      const tok = copy.find(t => t.id === tokenId);
      let extraTurn = false;

      if (tok.position === -1 && dice === 6) {
        tok.position = 0; // Red start
        tok.stepCount = 0;
        extraTurn = true;
        sound.playTokenMove();
      } else {
        const newStep = tok.stepCount + dice;
        tok.stepCount = newStep;
        if (newStep === 56) {
          tok.position = 105;
          extraTurn = true;
          sound.playWin();
        } else if (newStep > 50) {
          tok.position = 100 + (newStep - 51);
          sound.playTokenMove();
        } else {
          tok.position = (0 + newStep) % 52;
          sound.playTokenMove();
        }
        if (dice === 6) extraTurn = true;
      }

      // Check win
      if (copy.every(t => t.position === 105)) {
        setWinner('You (Winner! 🎉)');
        confetti({ particleCount: 120, spread: 80 });
        return copy;
      }

      setHasRolled(false);
      setDice(null);

      if (!extraTurn) {
        setTurn('bot');
      }

      return copy;
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-24 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Practice
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> Practice Mode (Free)
          </span>
        </div>
      </div>

      {/* Turn Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full ${turn === 'player' ? 'bg-red-500 animate-ping' : 'bg-yellow-400'}`} />
          <span className="text-xs font-black text-white">
            {turn === 'player' ? 'Your Turn (Red)' : 'Bot 🤖 Thinking...'}
          </span>
        </div>
        <span className="font-mono text-xs text-amber-400 font-bold">
          {dice ? `${dice} 🎲` : 'Roll Dice'}
        </span>
      </div>

      {/* Classic Realistic 15x15 Ludo King Board */}
      <div className="aspect-square w-full max-w-[480px] mx-auto bg-white p-2 sm:p-3 rounded-3xl border-4 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full border border-slate-400 bg-white relative">
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => {
              let bg = 'bg-white border-[0.5px] border-slate-300';
              let isStar = false;
              let arrow = null;
              const isHomeTriangle = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

              // 4 Corner Home Bases
              if (r < 6 && c < 6) {
                bg = 'bg-[#e52521] border-none';
                if (r >= 1 && r <= 4 && c >= 1 && c <= 4) bg = 'bg-white border border-slate-200';
              } else if (r < 6 && c > 8) {
                bg = 'bg-[#00a859] border-none';
                if (r >= 1 && r <= 4 && c >= 10 && c <= 13) bg = 'bg-white border border-slate-200';
              } else if (r > 8 && c > 8) {
                bg = 'bg-[#fdb813] border-none';
                if (r >= 10 && r <= 13 && c >= 10 && c <= 13) bg = 'bg-white border border-slate-200';
              } else if (r > 8 && c < 6) {
                bg = 'bg-[#0080ff] border-none';
                if (r >= 10 && r <= 13 && c >= 1 && c <= 4) bg = 'bg-white border border-slate-200';
              }

              // Colored Home Columns
              if (r === 7 && c >= 1 && c <= 5) bg = 'bg-[#e52521] border-[0.5px] border-red-700';
              if (c === 7 && r >= 1 && r <= 5) bg = 'bg-[#00a859] border-[0.5px] border-green-700';
              if (r === 7 && c >= 9 && c <= 13) bg = 'bg-[#fdb813] border-[0.5px] border-amber-600';
              if (c === 7 && r >= 9 && r <= 13) bg = 'bg-[#0080ff] border-[0.5px] border-blue-700';

              // Starting Safe Squares
              if (r === 6 && c === 1) { bg = 'bg-[#e52521] border-[0.5px] border-red-700'; isStar = true; }
              if (r === 1 && c === 8) { bg = 'bg-[#00a859] border-[0.5px] border-green-700'; isStar = true; }
              if (r === 8 && c === 13) { bg = 'bg-[#fdb813] border-[0.5px] border-amber-600'; isStar = true; }
              if (r === 13 && c === 6) { bg = 'bg-[#0080ff] border-[0.5px] border-blue-700'; isStar = true; }

              // Common track safe stars
              if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
                isStar = true;
              }

              // Entry Arrows
              if (r === 7 && c === 0) arrow = '➔';
              if (r === 0 && c === 7) arrow = '⬇';
              if (r === 7 && c === 14) arrow = '⬅';
              if (r === 14 && c === 7) arrow = '⬆';

              if (isHomeTriangle) bg = 'bg-white border-none';

              // Tokens check
              const redToken = tokensPlayer.find(t => {
                if (t.position === -1) {
                  const s = BASE_SLOTS.red[t.id];
                  return s && s[0] === r && s[1] === c;
                }
                if (t.position >= 100 && t.position <= 104) {
                  const s = HOME_COLUMNS.red[t.position - 100];
                  return s && s[0] === r && s[1] === c;
                }
                if (t.position >= 0 && t.position < 52) {
                  const s = TRACK_COORDINATES[t.position];
                  return s && s[0] === r && s[1] === c;
                }
                return false;
              });

              const botToken = tokensBot.find(t => {
                if (t.position === -1) {
                  const s = BASE_SLOTS.yellow[t.id];
                  return s && s[0] === r && s[1] === c;
                }
                if (t.position >= 100 && t.position <= 104) {
                  const s = HOME_COLUMNS.yellow[t.position - 100];
                  return s && s[0] === r && s[1] === c;
                }
                if (t.position >= 0 && t.position < 52) {
                  const s = TRACK_COORDINATES[t.position];
                  return s && s[0] === r && s[1] === c;
                }
                return false;
              });

              return (
                <div key={`${r}-${c}`} className={`relative flex items-center justify-center text-[7px] ${bg}`}>
                  {isStar && !isHomeTriangle && (
                    <span className={`text-sm sm:text-base font-black select-none ${
                      (r === 6 && c === 1) || (r === 8 && c === 13)
                        ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                        : 'text-slate-400'
                    }`}>
                      ☆
                    </span>
                  )}

                  {arrow && (
                    <span className="text-xs font-black text-slate-700 select-none">
                      {arrow}
                    </span>
                  )}

                  {r === 7 && c === 7 && (
                    <div className="absolute inset-[-100%] w-[300%] h-[300%] pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <polygon points="0,0 50,50 0,100" fill="#e52521" />
                        <polygon points="0,0 50,50 100,0" fill="#00a859" />
                        <polygon points="100,0 50,50 100,100" fill="#fdb813" />
                        <polygon points="0,100 50,50 100,100" fill="#0080ff" />
                        <circle cx="50" cy="50" r="8" fill="#ffffff" />
                        <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                      </svg>
                    </div>
                  )}

                  {redToken && (
                    <LudoPinToken
                      color="red"
                      isClickable={turn === 'player' && hasRolled}
                      onClick={() => handlePlayerMove(redToken.id)}
                    />
                  )}
                  {botToken && (
                    <LudoPinToken
                      color="yellow"
                      isClickable={false}
                      onClick={() => {}}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Realistic Dice & Action Controls */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <RealisticDice value={dice || 1} />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400">ডাইস পয়েন্ট</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {dice ? `${dice}` : '—'}
            </span>
          </div>
        </div>

        <button
          onClick={handlePlayerRoll}
          disabled={turn !== 'player' || hasRolled || winner}
          className={`px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl transition ${
            turn === 'player' && !hasRolled && !winner
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 glow-gold scale-[1.02] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {hasRolled ? '👉 চাল দিতে গুটি স্পর্শ করুন' : 'ডাইস রোল করুন'}
        </button>
      </div>

      {/* Logs feed */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs space-y-1 max-h-32 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="text-slate-400 text-[11px]">
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
}
