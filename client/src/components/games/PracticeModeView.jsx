import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { Trophy, ArrowLeft, Bot, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';

const TRACK_COORDINATES = [
  // Red start arm (left side going right)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Green top vertical arm
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], // top turn
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Green right arm
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], // right turn
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Yellow bottom vertical arm
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], // bottom turn
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Blue left arm
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], // left turn
  [6, 0]  // cell 51
];

const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

// Realistic 3D Map-Pin Teardrop Pawn Token (Ludo King Edition)
function LudoPinToken({ color, isClickable, isHopping, onClick }) {
  const colorMap = {
    red: { fill: '#e52521', highlight: '#fca5a5', shadow: '#991b1b', eye: '#b91c1c' },
    green: { fill: '#00a859', highlight: '#86efac', shadow: '#065f46', eye: '#047857' },
    yellow: { fill: '#fdb813', highlight: '#fef08a', shadow: '#b45309', eye: '#d97706' },
    blue: { fill: '#0080ff', highlight: '#93c5fd', shadow: '#1e40af', eye: '#1d4ed8' }
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`absolute inset-0 flex items-center justify-center transition-all duration-150 select-none ${
        isHopping
          ? '-translate-y-3 scale-135 z-40 drop-shadow-[0_12px_15px_rgba(0,0,0,0.6)]'
          : isClickable
          ? 'cursor-pointer scale-120 z-30 animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,1)]'
          : 'z-20 drop-shadow-[0_3px_5px_rgba(0,0,0,0.45)]'
      }`}
    >
      <svg viewBox="0 0 40 50" className="w-[88%] h-[88%] max-w-[28px] max-h-[36px]">
        <defs>
          <linearGradient id={`silverGradPrac-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <radialGradient id={`glossGradPrac-${color}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="55%" stopColor={c.fill} />
            <stop offset="100%" stopColor={c.shadow} />
          </radialGradient>
        </defs>
        
        <ellipse cx="20" cy="46" rx="9" ry="3.5" fill="rgba(0,0,0,0.3)" />

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
        <circle cx="18" cy="16" r="2.2" fill="#ffffff" opacity="0.9" />

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
  const [logs, setLogs] = useState([{ text: 'স্মার্ট এআই বটের সাথে প্র্যাকটিস ম্যাচ শুরু হয়েছে!', time: 'এখন' }]);
  const [animatingToken, setAnimatingToken] = useState(null);

  // Bot Turn Automation with Step-by-Step Hopping
  useEffect(() => {
    if (turn === 'bot' && !winner && !animatingToken) {
      const timer = setTimeout(() => {
        sound.playDiceRoll();
        const roll = Math.floor(Math.random() * 6) + 1;
        setDice(roll);

        setTimeout(() => {
          botMakeMove(roll);
        }, 800);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [turn, winner, animatingToken]);

  const botMakeMove = (roll) => {
    // 1. Check bring token out
    if (roll === 6) {
      const yardToken = tokensBot.find(t => t.position === -1);
      if (yardToken) {
        sound.playTokenMove();
        setAnimatingToken({ player: 'bot', tokenId: yardToken.id, position: 26, isHopping: true });
        setTimeout(() => {
          setTokensBot(prev => prev.map(t => t.id === yardToken.id ? { ...t, position: 26, stepCount: 0 } : t));
          setAnimatingToken(null);
          setLogs(l => [{ text: 'বট 🤖 ৬ পেয়ে একটি গুটি মাঠে এনেছে! (বোনাস চাল)', time: 'এখন' }, ...l]);
          setTurn('bot');
          setHasRolled(false);
        }, 250);
        return;
      }
    }

    // 2. Move active token
    const active = tokensBot.find(t => t.position !== -1 && t.position !== 105 && t.stepCount + roll <= 56);
    if (active) {
      const path = [];
      const oldStep = active.stepCount;
      const targetStep = oldStep + roll;
      for (let s = oldStep + 1; s <= targetStep; s++) {
        if (s === 56) path.push(105);
        else if (s > 50) path.push(100 + (s - 51));
        else path.push((26 + s) % 52);
      }

      path.forEach((pos, idx) => {
        setTimeout(() => {
          sound.playTokenMove();
          setAnimatingToken({ player: 'bot', tokenId: active.id, position: pos, isHopping: true });

          if (idx === path.length - 1) {
            setTimeout(() => {
              // Check capture player
              let captured = false;
              if (pos !== 105 && ![0, 8, 13, 21, 26, 34, 39, 47].includes(pos)) {
                tokensPlayer.forEach(pt => {
                  if (pt.position === pos) {
                    captured = true;
                    sound.playCapture();
                    setTokensPlayer(p => p.map(x => x.id === pt.id ? { ...x, position: -1, stepCount: 0 } : x));
                    setLogs(l => [{ text: 'বট 🤖 আপনার গুটি কেটে দিয়েছে!', time: 'এখন' }, ...l]);
                  }
                });
              }

              if (!captured && pos === 105) sound.playWin();

              setTokensBot(prev => {
                const nextBot = prev.map(t => t.id === active.id ? { ...t, position: pos, stepCount: targetStep } : t);
                if (nextBot.every(t => t.position === 105)) {
                  setWinner('বট 🤖');
                }
                return nextBot;
              });

              setAnimatingToken(null);
              setLogs(l => [{ text: `বট 🤖 ${roll} চেলে গুটি এগিয়েছে!`, time: 'এখন' }, ...l]);

              if (roll === 6 || captured) {
                setTurn('bot');
              } else {
                setTurn('player');
                setHasRolled(false);
                setDice(null);
              }
            }, 100);
          }
        }, idx * 130);
      });
      return;
    }

    // No valid move
    setLogs(l => [{ text: `বট 🤖 ${roll} পেয়েছে (চাল নেই)।`, time: 'এখন' }, ...l]);
    setTurn('player');
    setHasRolled(false);
    setDice(null);
  };

  const handlePlayerRoll = () => {
    if (turn !== 'player' || hasRolled || winner || animatingToken) return;
    sound.playDiceRoll();
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    setHasRolled(true);

    const hasMove = tokensPlayer.some(t => {
      if (t.position === 105) return false;
      if (t.position === -1) return roll === 6;
      return t.stepCount + roll <= 56;
    });

    if (!hasMove) {
      setLogs(l => [{ text: `আপনি ${roll} পেয়েছেন (কোনো চাল নেই)।`, time: 'এখন' }, ...l]);
      setTimeout(() => {
        setTurn('bot');
        setHasRolled(false);
        setDice(null);
      }, 900);
    }
  };

  const handlePlayerMove = (tokenId) => {
    if (turn !== 'player' || !hasRolled || !dice || winner || animatingToken) return;
    const token = tokensPlayer.find(t => t.id === tokenId);
    if (!token) return;

    if (token.position === -1 && dice !== 6) return;
    if (token.position !== -1 && token.stepCount + dice > 56) return;

    const roll = dice;

    if (token.position === -1 && roll === 6) {
      sound.playTokenMove();
      setAnimatingToken({ player: 'player', tokenId, position: 0, isHopping: true });
      setTimeout(() => {
        setTokensPlayer(prev => prev.map(t => t.id === tokenId ? { ...t, position: 0, stepCount: 0 } : t));
        setAnimatingToken(null);
        setLogs(l => [{ text: '🎉 আপনি ৬ পেয়ে গুটি মাঠে নামিয়েছেন! (বোনাস চাল)', time: 'এখন' }, ...l]);
        setHasRolled(false);
        setDice(null);
        setTurn('player');
      }, 200);
      return;
    }

    // Track move path
    const path = [];
    const oldStep = token.stepCount;
    const targetStep = oldStep + roll;
    for (let s = oldStep + 1; s <= targetStep; s++) {
      if (s === 56) path.push(105);
      else if (s > 50) path.push(100 + (s - 51));
      else path.push(s % 52);
    }

    path.forEach((pos, idx) => {
      setTimeout(() => {
        sound.playTokenMove();
        setAnimatingToken({ player: 'player', tokenId, position: pos, isHopping: true });

        if (idx === path.length - 1) {
          setTimeout(() => {
            let captured = false;
            if (pos !== 105 && ![0, 8, 13, 21, 26, 34, 39, 47].includes(pos)) {
              tokensBot.forEach(bt => {
                if (bt.position === pos) {
                  captured = true;
                  sound.playCapture();
                  setTokensBot(b => b.map(x => x.id === bt.id ? { ...x, position: -1, stepCount: 0 } : x));
                  setLogs(l => [{ text: '💥 আপনি বটের গুটি কেটে দিয়েছেন! (বোনাস চাল)', time: 'এখন' }, ...l]);
                }
              });
            }

            if (!captured && pos === 105) {
              sound.playWin();
              confetti({ particleCount: 100, spread: 70 });
            }

            setTokensPlayer(prev => {
              const nextPl = prev.map(t => t.id === tokenId ? { ...t, position: pos, stepCount: targetStep } : t);
              if (nextPl.every(t => t.position === 105)) {
                setWinner('আপনি বিজয়ী হয়েছেন! 🏆');
                confetti({ particleCount: 150, spread: 100 });
              }
              return nextPl;
            });

            setAnimatingToken(null);
            setLogs(l => [{ text: `আপনি ${roll} চেলে গুটি এগিয়েছেন!`, time: 'এখন' }, ...l]);

            if (roll === 6 || captured) {
              setHasRolled(false);
              setDice(null);
              setTurn('player');
            } else {
              setTurn('bot');
              setHasRolled(false);
              setDice(null);
            }
          }, 100);
        }
      }, idx * 130);
    });
  };

  const getTokensInCell = (r, c) => {
    const list = [];
    tokensPlayer.forEach(token => {
      let effectivePos = token.position;
      let isHopping = false;
      if (animatingToken && animatingToken.player === 'player' && animatingToken.tokenId === token.id) {
        effectivePos = animatingToken.position;
        isHopping = animatingToken.isHopping;
      }
      let match = false;
      if (effectivePos >= 100 && effectivePos <= 104) {
        const homeCoord = HOME_COLUMNS.red[effectivePos - 100];
        if (homeCoord && homeCoord[0] === r && homeCoord[1] === c) match = true;
      } else if (effectivePos >= 0 && effectivePos < 52) {
        const trk = TRACK_COORDINATES[effectivePos];
        if (trk && trk[0] === r && trk[1] === c) match = true;
      }
      if (match) list.push({ color: 'red', token, isHopping, isPlayer: true });
    });

    tokensBot.forEach(token => {
      let effectivePos = token.position;
      let isHopping = false;
      if (animatingToken && animatingToken.player === 'bot' && animatingToken.tokenId === token.id) {
        effectivePos = animatingToken.position;
        isHopping = animatingToken.isHopping;
      }
      let match = false;
      if (effectivePos >= 100 && effectivePos <= 104) {
        const homeCoord = HOME_COLUMNS.yellow[effectivePos - 100];
        if (homeCoord && homeCoord[0] === r && homeCoord[1] === c) match = true;
      } else if (effectivePos >= 0 && effectivePos < 52) {
        const trk = TRACK_COORDINATES[effectivePos];
        if (trk && trk[0] === r && trk[1] === c) match = true;
      }
      if (match) list.push({ color: 'yellow', token, isHopping, isPlayer: false });
    });

    return list;
  };

  const armCells = [];
  for (let r = 0; r <= 5; r++) for (let c = 6; c <= 8; c++) armCells.push([r, c]);
  for (let r = 9; r <= 14; r++) for (let c = 6; c <= 8; c++) armCells.push([r, c]);
  for (let r = 6; r <= 8; r++) for (let c = 0; c <= 5; c++) armCells.push([r, c]);
  for (let r = 6; r <= 8; r++) for (let c = 9; c <= 14; c++) armCells.push([r, c]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto p-2 sm:p-4 items-center lg:items-start justify-center">
      <div className="flex flex-col items-center w-full max-w-[540px]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> ব্যাক
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold">
            <Bot className="w-3.5 h-3.5" /> ফ্রি প্র্যাকটিস মোড
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Turn Status */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
              turn === 'player' ? 'bg-[#e52521] border-2 border-red-400' : 'bg-[#fdb813] border-2 border-amber-300'
            }`}>
              {turn === 'player' ? 'আপনি' : 'বট'}
            </div>
            <div>
              <span className="text-white font-bold text-sm block">
                {turn === 'player' ? 'আপনার চাল (লাল গুটি)' : 'এআই বট ভাবছে... (হলুদ গুটি)'}
              </span>
              <span className="text-xs text-amber-400">
                {winner ? `বিজয়ী: ${winner}` : turn === 'player' ? (hasRolled ? '👉 চাল দিতে গুটি স্পর্শ করুন' : 'ডাইস রোল করুন') : 'বটের চাল চলছে...'}
              </span>
            </div>
          </div>
        </div>

        {/* 🏆 Pixel-Perfect 15x15 Macro Board */}
        <div className="relative aspect-square w-full max-w-[500px] bg-white p-2.5 sm:p-3 rounded-3xl border-4 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden select-none">
          <div 
            className="w-full h-full relative grid border border-slate-300 rounded-2xl overflow-hidden bg-white"
            style={{
              gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(15, minmax(0, 1fr))'
            }}
          >
            {/* 1. Red Base (Player Yard) */}
            <div 
              className="bg-[#e52521] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-red-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const tok = tokensPlayer.find(t => t.id === slot);
                    const inYard = tok && tok.position === -1 && !(animatingToken?.player === 'player' && animatingToken?.tokenId === slot);
                    const isClickable = turn === 'player' && hasRolled && dice === 6 && inYard;
                    return (
                      <div 
                        key={slot}
                        className="relative w-full aspect-square rounded-full bg-red-50 border-2 border-red-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#e52521] opacity-90 shadow-sm border border-red-600/40" />
                        {inYard && (
                          <LudoPinToken
                            color="red"
                            isClickable={isClickable}
                            isHopping={false}
                            onClick={() => handlePlayerMove(slot)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Green Base (Decorative Classic) */}
            <div 
              className="bg-[#00a859] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-emerald-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => (
                    <div key={slot} className="relative w-full aspect-square rounded-full bg-emerald-50 border-2 border-emerald-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00a859] opacity-90 shadow-sm border border-emerald-600/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Blue Base (Decorative Classic) */}
            <div 
              className="bg-[#0080ff] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-blue-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => (
                    <div key={slot} className="relative w-full aspect-square rounded-full bg-blue-50 border-2 border-blue-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0080ff] opacity-90 shadow-sm border border-blue-600/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Yellow Base (Bot Yard) */}
            <div 
              className="bg-[#fdb813] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-amber-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const tok = tokensBot.find(t => t.id === slot);
                    const inYard = tok && tok.position === -1 && !(animatingToken?.player === 'bot' && animatingToken?.tokenId === slot);
                    return (
                      <div 
                        key={slot}
                        className="relative w-full aspect-square rounded-full bg-amber-50 border-2 border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#fdb813] opacity-90 shadow-sm border border-amber-600/40" />
                        {inYard && (
                          <LudoPinToken
                            color="yellow"
                            isClickable={false}
                            isHopping={false}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Center Home */}
            <div 
              className="relative w-full h-full bg-white flex items-center justify-center overflow-hidden"
              style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                <polygon points="0,0 50,50 0,100" fill="#e52521" />
                <polygon points="0,0 50,50 100,0" fill="#00a859" />
                <polygon points="100,0 50,50 100,100" fill="#fdb813" />
                <polygon points="0,100 50,50 100,100" fill="#0080ff" />
                <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="50,42 52.5,47 58,47.5 54,51.5 55,57 50,54 45,57 46,51.5 42,47.5 47.5,47" fill="#f59e0b" />
              </svg>

              {/* Finished tokens inside Home */}
              {tokensPlayer.filter(t => t.position === 105).map(t => (
                <div key={`p-${t.id}`} className="absolute w-5 h-5 flex items-center justify-center -translate-x-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#e52521] shadow-md border-2 border-white" />
                </div>
              ))}
              {tokensBot.filter(t => t.position === 105).map(t => (
                <div key={`b-${t.id}`} className="absolute w-5 h-5 flex items-center justify-center translate-x-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#fdb813] shadow-md border-2 border-white" />
                </div>
              ))}
            </div>

            {/* 6. Arms Cells */}
            {armCells.map(([r, c]) => {
              let cellBg = 'bg-white';
              let borderColor = 'border-slate-300';

              if (r === 7 && c >= 1 && c <= 5) {
                cellBg = 'bg-[#e52521]';
                borderColor = 'border-red-700';
              } else if (c === 7 && r >= 1 && r <= 5) {
                cellBg = 'bg-[#00a859]';
                borderColor = 'border-emerald-700';
              } else if (r === 7 && c >= 9 && c <= 13) {
                cellBg = 'bg-[#fdb813]';
                borderColor = 'border-amber-600';
              } else if (c === 7 && r >= 9 && r <= 13) {
                cellBg = 'bg-[#0080ff]';
                borderColor = 'border-blue-700';
              }

              let startColor = null;
              if (r === 6 && c === 1) { startColor = 'red'; cellBg = 'bg-[#e52521]'; }
              if (r === 1 && c === 8) { startColor = 'green'; cellBg = 'bg-[#00a859]'; }
              if (r === 8 && c === 13) { startColor = 'yellow'; cellBg = 'bg-[#fdb813]'; }
              if (r === 13 && c === 6) { startColor = 'blue'; cellBg = 'bg-[#0080ff]'; }

              const isStar = startColor !== null || ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2));

              let arrow = null;
              if (r === 7 && c === 0) arrow = { symbol: '➔', color: 'text-[#e52521]' };
              if (r === 0 && c === 7) arrow = { symbol: '⬇', color: 'text-[#00a859]' };
              if (r === 7 && c === 14) arrow = { symbol: '⬅', color: 'text-[#fdb813]' };
              if (r === 14 && c === 7) arrow = { symbol: '⬆', color: 'text-[#0080ff]' };

              const tokensHere = getTokensInCell(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative flex items-center justify-center select-none border-[0.5px] ${cellBg} ${borderColor}`}
                  style={{ gridColumn: c + 1, gridRow: r + 1 }}
                >
                  {isStar && (
                    <span className={`text-sm sm:text-base font-black select-none ${
                      startColor ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-slate-400'
                    }`}>
                      ☆
                    </span>
                  )}

                  {arrow && (
                    <span className={`text-xs sm:text-sm font-black select-none ${arrow.color}`}>
                      {arrow.symbol}
                    </span>
                  )}

                  {tokensHere.map(({ color, token, isHopping, isPlayer }) => {
                    const isClickable = turn === 'player' && hasRolled && isPlayer && (token.stepCount + dice <= 56);
                    return (
                      <LudoPinToken
                        key={`${color}-${token.id}`}
                        color={color}
                        isClickable={isClickable}
                        isHopping={isHopping}
                        onClick={() => handlePlayerMove(token.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dice & Controls */}
        <div className="w-full mt-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <RealisticDice value={dice || 1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">ডাইস পয়েন্ট</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {dice ? `${dice}` : '—'}
              </span>
            </div>
          </div>

          <button
            onClick={handlePlayerRoll}
            disabled={turn !== 'player' || hasRolled || !!winner || !!animatingToken}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 shadow-xl ${
              turn === 'player' && !hasRolled && !winner && !animatingToken
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 glow-gold cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            ডাইস রোল করুন 🎲
          </button>
        </div>
      </div>

      {/* Match Logs */}
      <div className="w-full lg:w-72 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl max-h-[300px] overflow-y-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-400 block mb-2">ম্যাচ অ্যাক্টিভিটি</span>
        <div className="space-y-1.5 text-[11px] text-slate-400">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
              <span className="text-amber-400">•</span>
              <span className="flex-1 text-slate-300">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
