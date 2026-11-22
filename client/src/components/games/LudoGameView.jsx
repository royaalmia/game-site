import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { 
  Trophy, Clock, MessageSquare, Send, Volume2, VolumeX, 
  RotateCcw, Sparkles, Shield, AlertCircle, ArrowLeft
} from 'lucide-react';

// Coordinates mapping for 15x15 Ludo Board
// Common track: 52 cells
const TRACK_COORDINATES = [
  // Red start arm (left side going right)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Green top vertical arm
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], // top turn
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Green right arm going right
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], // right turn
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Yellow bottom vertical arm going down
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], // bottom turn
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Blue left arm going left
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], // left turn
  [6, 0]  // cell 51, leading to 0
];

// Home column coordinates
const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Base yards token coordinates
const BASE_SLOTS = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue: [[11, 2], [11, 3], [12, 2], [12, 3]]
};

// Realistic 3D Map-Pin Style Pawn Token (Ludo King Edition)
function LudoPinToken({ color, isClickable, label, onClick }) {
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
      className={`absolute inset-0 flex items-center justify-center transition-all duration-200 select-none ${
        isClickable
          ? 'cursor-pointer scale-125 z-30 animate-bounce drop-shadow-[0_0_10px_rgba(251,191,36,1)]'
          : 'z-20 drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]'
      }`}
    >
      <svg viewBox="0 0 40 50" className="w-[88%] h-[88%] max-w-[30px] max-h-[38px]">
        <defs>
          <linearGradient id={`silverGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <radialGradient id={`glossGrad-${color}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="55%" stopColor={c.fill} />
            <stop offset="100%" stopColor={c.shadow} />
          </radialGradient>
        </defs>
        
        {/* Shadow */}
        <ellipse cx="20" cy="46" rx="10" ry="3.5" fill="rgba(0,0,0,0.35)" />

        {/* Outer Silver Contoured Frame (Pawn pin body) */}
        <path
          d="M 20 2 C 11 2, 4 9, 4 19 C 4 27, 13 36, 17 44 L 23 44 C 27 36, 36 27, 36 19 C 36 9, 29 2, 20 2 Z"
          fill={`url(#silverGrad-${color})`}
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Inner Colored Core */}
        <path
          d="M 20 5 C 13 5, 7 11, 7 19 C 7 25, 14 34, 18 42 L 22 42 C 26 34, 33 25, 33 19 C 33 11, 27 5, 20 5 Z"
          fill={`url(#glossGrad-${color})`}
        />

        {/* Center Circular Eye with White Bevel */}
        <circle cx="20" cy="18" r="7.5" fill={c.fill} stroke="#ffffff" strokeWidth="1.6" />
        <circle cx="20" cy="18" r="5" fill={c.eye} />
        <circle cx="18" cy="16" r="2" fill="#ffffff" opacity="0.85" />

        {/* Bottom Pedestal Base */}
        <ellipse cx="20" cy="45" rx="8" ry="2.5" fill="#475569" />
        <ellipse cx="20" cy="44" rx="7" ry="2" fill={`url(#silverGrad-${color})`} />
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

export default function LudoGameView({ match, gameState, currentUser, socket, onLeave }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [validMoves, setValidMoves] = useState([]);
  const [rollingAnim, setRollingAnim] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20);
  const chatBottomRef = useRef(null);

  const players = gameState?.players || match?.players || [];
  const currentTurnUserId = gameState?.currentTurnUserId;
  const isMyTurn = currentTurnUserId === currentUser?.id;
  const myPlayer = players.find(p => p.userId === currentUser?.id);
  const winner = gameState?.winner;

  // Sound toggle
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Turn deadline countdown
  useEffect(() => {
    if (!gameState?.turnDeadline) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.turnDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 250);
    return () => clearInterval(interval);
  }, [gameState?.turnDeadline]);

  // Socket game events
  useEffect(() => {
    if (!socket) return;

    socket.on('ludo_dice_rolled', (data) => {
      sound.playDiceRoll();
      setRollingAnim(true);
      setTimeout(() => setRollingAnim(false), 500);
      if (data.validMoves && isMyTurn) {
        setValidMoves(data.validMoves);
      }
    });

    socket.on('ludo_token_moved', (data) => {
      if (data.res?.capturedOpponent) {
        sound.playCapture();
      } else {
        sound.playTokenMove();
      }
      setValidMoves([]);
    });

    socket.on('chat_received', (msg) => {
      setChatHistory(prev => [...prev, msg]);
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    socket.on('game_settled', (data) => {
      sound.playWin();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    });

    return () => {
      socket.off('ludo_dice_rolled');
      socket.off('ludo_token_moved');
      socket.off('chat_received');
      socket.off('game_settled');
    };
  }, [socket, isMyTurn]);

  // Handle dice roll
  const handleRollDice = () => {
    if (!isMyTurn || gameState.hasRolled || rollingAnim) return;
    sound.playClick();
    socket.emit('ludo_roll_dice', {
      roomId: match.id,
      userId: currentUser.id
    });
  };

  // Handle token click
  const handleTokenClick = (tokenId) => {
    if (!isMyTurn || !gameState.hasRolled) return;
    if (validMoves.length > 0 && !validMoves.includes(tokenId)) return;

    sound.playClick();
    socket.emit('ludo_move_token', {
      roomId: match.id,
      userId: currentUser.id,
      tokenId
    });
    setValidMoves([]);
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

  const handleSendEmoji = (emoji) => {
    socket.emit('send_chat', {
      roomId: match.id,
      userId: currentUser.id,
      emoji
    });
  };

  // Render tokens inside a cell
  const getTokensInCell = (r, c) => {
    const list = [];
    players.forEach(player => {
      player.tokens?.forEach(token => {
        let matchCell = false;
        if (token.position === -1) {
          // In yard
          const slot = BASE_SLOTS[player.color]?.[token.id];
          if (slot && slot[0] === r && slot[1] === c) matchCell = true;
        } else if (token.position >= 100 && token.position <= 104) {
          // Home path
          const homeCoord = HOME_COLUMNS[player.color]?.[token.position - 100];
          if (homeCoord && homeCoord[0] === r && homeCoord[1] === c) matchCell = true;
        } else if (token.position >= 0 && token.position < 52) {
          // Track
          const trackCoord = TRACK_COORDINATES[token.position];
          if (trackCoord && trackCoord[0] === r && trackCoord[1] === c) matchCell = true;
        }

        if (matchCell) {
          list.push({ player, token });
        }
      });
    });
    return list;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto p-2 sm:p-4 items-center lg:items-start justify-center">
      {/* Left/Main Column: Board & Controls */}
      <div className="flex flex-col items-center w-full max-w-[580px]">
        {/* Top Match Bar */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <button 
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" /> Pool: {match.stake * (players.length || 2)} ৳
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              Win: {(match.stake * (players.length || 2) * 0.95).toFixed(0)} ৳
            </div>
          </div>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Turn Indicator & Timer */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={players[gameState?.currentTurnIndex]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=P1'} 
                  alt="avatar" 
                  className={`w-10 h-10 rounded-full border-2 ${
                    players[gameState?.currentTurnIndex]?.color === 'red' ? 'border-red-500' :
                    players[gameState?.currentTurnIndex]?.color === 'yellow' ? 'border-yellow-400' :
                    players[gameState?.currentTurnIndex]?.color === 'green' ? 'border-emerald-500' : 'border-blue-500'
                  }`}
                />
                {isMyTurn && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {players[gameState?.currentTurnIndex]?.username}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    players[gameState?.currentTurnIndex]?.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    players[gameState?.currentTurnIndex]?.color === 'yellow' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                    players[gameState?.currentTurnIndex]?.color === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {players[gameState?.currentTurnIndex]?.color}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  {isMyTurn ? (
                    <span className="text-amber-400 font-semibold animate-pulse">It's YOUR turn!</span>
                  ) : (
                    <span>Waiting for opponent move...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              timeLeft <= 5 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' 
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}>
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* 15x15 Classic Realistic Ludo King Board */}
        <div className="relative aspect-square w-full max-w-[500px] bg-white p-2 sm:p-3 rounded-3xl border-4 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="grid grid-cols-15 grid-rows-15 w-full h-full border border-slate-400 bg-white relative">
            {/* 15x15 Cells */}
            {Array.from({ length: 15 }).map((_, r) =>
              Array.from({ length: 15 }).map((_, c) => {
                // Determine Cell Color/Style
                let bgStyle = 'bg-white border-[0.5px] border-slate-300';
                let isStar = false;
                let arrow = null;
                const isHomeTriangle = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

                // Base Corners (Red, Green, Yellow, Blue)
                if (r < 6 && c < 6) {
                  bgStyle = 'bg-[#e52521] border-none';
                  // White inner slot for tokens inside base
                  if (r >= 1 && r <= 4 && c >= 1 && c <= 4) {
                    bgStyle = 'bg-white border border-slate-200';
                  }
                } else if (r < 6 && c > 8) {
                  bgStyle = 'bg-[#00a859] border-none';
                  if (r >= 1 && r <= 4 && c >= 10 && c <= 13) {
                    bgStyle = 'bg-white border border-slate-200';
                  }
                } else if (r > 8 && c > 8) {
                  bgStyle = 'bg-[#fdb813] border-none';
                  if (r >= 10 && r <= 13 && c >= 10 && c <= 13) {
                    bgStyle = 'bg-white border border-slate-200';
                  }
                } else if (r > 8 && c < 6) {
                  bgStyle = 'bg-[#0080ff] border-none';
                  if (r >= 10 && r <= 13 && c >= 1 && c <= 4) {
                    bgStyle = 'bg-white border border-slate-200';
                  }
                }

                // Colored Home Run Columns
                if (r === 7 && c >= 1 && c <= 5) bgStyle = 'bg-[#e52521] border-[0.5px] border-red-700';
                if (c === 7 && r >= 1 && r <= 5) bgStyle = 'bg-[#00a859] border-[0.5px] border-green-700';
                if (r === 7 && c >= 9 && c <= 13) bgStyle = 'bg-[#fdb813] border-[0.5px] border-amber-600';
                if (c === 7 && r >= 9 && r <= 13) bgStyle = 'bg-[#0080ff] border-[0.5px] border-blue-700';

                // Starting Safe Squares (with star)
                if (r === 6 && c === 1) { bgStyle = 'bg-[#e52521] border-[0.5px] border-red-700'; isStar = true; }
                if (r === 1 && c === 8) { bgStyle = 'bg-[#00a859] border-[0.5px] border-green-700'; isStar = true; }
                if (r === 8 && c === 13) { bgStyle = 'bg-[#fdb813] border-[0.5px] border-amber-600'; isStar = true; }
                if (r === 13 && c === 6) { bgStyle = 'bg-[#0080ff] border-[0.5px] border-blue-700'; isStar = true; }

                // Safe Star Squares on common track
                if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
                  isStar = true;
                }

                // Entry Arrows
                if (r === 7 && c === 0) arrow = '➔';
                if (r === 0 && c === 7) arrow = '⬇';
                if (r === 7 && c === 14) arrow = '⬅';
                if (r === 14 && c === 7) arrow = '⬆';

                // Center Home Triangles
                if (isHomeTriangle) {
                  bgStyle = 'bg-white border-none';
                }

                const tokensHere = getTokensInCell(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative flex items-center justify-center select-none text-[8px] ${bgStyle}`}
                  >
                    {/* Outline Safe Star */}
                    {isStar && !isHomeTriangle && (
                      <span className={`text-base sm:text-lg font-black select-none ${
                        (r === 6 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 13) || (r === 13 && c === 6)
                          ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                          : 'text-slate-400'
                      }`}>
                        ☆
                      </span>
                    )}

                    {/* Entry Arrows */}
                    {arrow && (
                      <span className="text-xs sm:text-sm font-black text-slate-700 select-none">
                        {arrow}
                      </span>
                    )}

                    {/* Center Interlocking Triangles */}
                    {r === 7 && c === 7 && (
                      <div className="absolute inset-[-100%] w-[300%] h-[300%] pointer-events-none z-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Red Left Triangle */}
                          <polygon points="0,0 50,50 0,100" fill="#e52521" />
                          {/* Green Top Triangle */}
                          <polygon points="0,0 50,50 100,0" fill="#00a859" />
                          {/* Yellow Right Triangle */}
                          <polygon points="100,0 50,50 100,100" fill="#fdb813" />
                          {/* Blue Bottom Triangle */}
                          <polygon points="0,100 50,50 100,100" fill="#0080ff" />
                          {/* Center Trophy / Star */}
                          <circle cx="50" cy="50" r="8" fill="#ffffff" />
                          <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                        </svg>
                      </div>
                    )}

                    {/* Realistic 3D Map-Pin Tokens */}
                    {tokensHere.map(({ player, token }) => {
                      const isClickable = isMyTurn && validMoves.includes(token.id) && player.userId === currentUser?.id;
                      return (
                        <LudoPinToken
                          key={`${player.userId}-${token.id}`}
                          color={player.color}
                          isClickable={isClickable}
                          label={token.id + 1}
                          onClick={() => handleTokenClick(token.id)}
                        />
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dice & Action Controls */}
        <div className="w-full mt-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <RealisticDice value={gameState?.diceValue || 1} isRolling={rollingAnim} />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">ডাইস পয়েন্ট</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {gameState?.diceValue ? `${gameState.diceValue}` : '—'}
              </span>
              {gameState?.hasRolled && isMyTurn && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                  👉 চাল দিতে গুটি স্পর্শ করুন
                </span>
              )}
            </div>
          </div>

          {/* Interactive Dice Roll Button */}
          <button
            onClick={handleRollDice}
            disabled={!isMyTurn || gameState?.hasRolled || rollingAnim}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 shadow-xl ${
              isMyTurn && !gameState?.hasRolled
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 glow-gold cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{rollingAnim ? 'ঘুরছে...' : isMyTurn ? 'ডাইস রোল করুন' : 'অপেক্ষা করুন'}</span>
          </button>

          {/* Chat Drawer Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            {chatHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Game Logs, Quick Emojis & Chat */}
      <div className={`w-full lg:w-80 flex flex-col gap-3 ${chatOpen ? 'block' : 'hidden lg:flex'}`}>
        {/* Quick Emoji Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
          <span className="text-xs text-slate-400 font-semibold block mb-2">Quick Reactions</span>
          <div className="flex items-center justify-between">
            {['🔥', '👏', '😂', '😭', '🎯', '🚀'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                className="text-xl p-2 rounded-xl hover:bg-slate-800 transition transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Live Logs / Chat Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-80 shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Match Commentary & Chat
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LIVE</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {/* Logs from Game Engine */}
            {gameState?.logs?.map((log, idx) => (
              <div key={`log-${idx}`} className="text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                <span className="text-slate-500 text-[10px] mr-1.5">{log.time}</span>
                <span>{log.text}</span>
              </div>
            ))}

            {/* In-game Player Chats */}
            {chatHistory.map((chat, idx) => (
              <div 
                key={`chat-${idx}`} 
                className={`p-2 rounded-xl max-w-[85%] ${
                  chat.userId === currentUser.id 
                    ? 'ml-auto bg-amber-500/15 border border-amber-500/30 text-amber-200' 
                    : 'bg-slate-800/80 border border-slate-700 text-slate-200'
                }`}
              >
                <div className="font-bold text-[10px] text-slate-400 mb-0.5">{chat.sender}</div>
                {chat.emoji ? (
                  <span className="text-2xl">{chat.emoji}</span>
                ) : (
                  <span>{chat.text}</span>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Game Over Settlement Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
              🏆
            </div>
            
            <h2 className="text-2xl font-black text-white mb-1">
              {winner.userId === currentUser?.id ? 'VICTORY!' : 'MATCH FINISHED'}
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Winner: <strong className="text-amber-400">{winner.username}</strong>
            </p>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                <span>Total Pool:</span>
                <span className="font-bold text-white">{match.stake * (players.length || 2)} BDT</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                <span>Platform Commission (5%):</span>
                <span className="font-bold text-rose-400">-{(match.stake * (players.length || 2) * 0.05).toFixed(2)} BDT</span>
              </div>
              <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-emerald-400">Winner Net Payout:</span>
                <span className="text-emerald-400 text-base">
                  +{(match.stake * (players.length || 2) * 0.95).toFixed(2)} BDT
                </span>
              </div>
            </div>

            <button
              onClick={onLeave}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-black text-slate-950 shadow-lg glow-gold transition"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
