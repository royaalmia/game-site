import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { 
  Trophy, Clock, Volume2, VolumeX, ArrowLeft, Send, Sparkles, MessageSquare, Plus
} from 'lucide-react';

// Player configurations
const PLAYER_CONFIGS = [
  { id: 0, color: 'red', name: 'Red', startPos: 0, homeEntryTile: 50 },
  { id: 1, color: 'green', name: 'Green', startPos: 13, homeEntryTile: 11 },
  { id: 2, color: 'yellow', name: 'Yellow', startPos: 26, homeEntryTile: 24 },
  { id: 3, color: 'blue', name: 'Blue', startPos: 39, homeEntryTile: 37 }
];

// 52-tile circuit coordinates on 15x15 board
const TRACK_COORDINATES = [
  // Red start arm (left side going right)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Green top vertical arm (going up then down)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], // top turn
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Green right arm (going right)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], // right turn
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Yellow bottom vertical arm (going down then up)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], // bottom turn
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Blue left arm (going left)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], // left turn
  [6, 0]  // cell 51, leads back to 0
];

// Home column coordinates
const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Realistic 3D Map-Pin Teardrop Pawn Token (Pixel-Perfect Ludo King Edition)
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
          <linearGradient id={`silverGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <radialGradient id={`glossGrad-${color}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={c.highlight} />
            <stop offset="55%" stopColor={c.fill} />
            <stop offset="100%" stopColor={c.shadow} />
          </radialGradient>
        </defs>
        
        {/* Soft ground contact shadow */}
        <ellipse cx="20" cy="46" rx="9" ry="3.5" fill="rgba(0,0,0,0.3)" />

        {/* Chrome metallic contour body */}
        <path
          d="M 20 2 C 11 2, 4 9, 4 19 C 4 27, 13 36, 17 44 L 23 44 C 27 36, 36 27, 36 19 C 36 9, 29 2, 20 2 Z"
          fill={`url(#silverGrad-${color})`}
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Vibrant colored bulb */}
        <path
          d="M 20 5 C 13 5, 7 11, 7 19 C 7 25, 14 34, 18 42 L 22 42 C 26 34, 33 25, 33 19 C 33 11, 27 5, 20 5 Z"
          fill={`url(#glossGrad-${color})`}
        />

        {/* Center circular eye with white bevel */}
        <circle cx="20" cy="18" r="7.5" fill={c.fill} stroke="#ffffff" strokeWidth="1.6" />
        <circle cx="20" cy="18" r="5" fill={c.eye} />
        <circle cx="18" cy="16" r="2.2" fill="#ffffff" opacity="0.9" />

        {/* Base pedestal ring */}
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
  const [localState, setLocalState] = useState(gameState);
  const [animatingToken, setAnimatingToken] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [validMoves, setValidMoves] = useState([]);
  const [rollingAnim, setRollingAnim] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20);
  const chatBottomRef = useRef(null);

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = localState || gameState;
  }, [localState, gameState]);

  useEffect(() => {
    if (!animatingToken && gameState) {
      setLocalState(gameState);
    }
  }, [gameState, animatingToken]);

  const activeGame = localState || gameState;
  const players = activeGame?.players || match?.players || [];
  const currentTurnUserId = activeGame?.currentTurnUserId;
  const isMyTurn = currentTurnUserId === currentUser?.id;
  const winner = activeGame?.winner;

  // Sound toggle
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Turn deadline countdown
  useEffect(() => {
    if (!activeGame?.turnDeadline) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeGame.turnDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 250);
    return () => clearInterval(interval);
  }, [activeGame?.turnDeadline]);

  // Socket game events with step-by-step hopping animation
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

    socket.on('ludo_token_moved', ({ res, state }) => {
      setValidMoves([]);
      const prevState = stateRef.current;

      // Detect which token moved
      let movedP = null, movedT = null, oldStep = 0, oldPos = -1;
      if (prevState?.players && state?.players) {
        for (const p of state.players) {
          const oldP = prevState.players.find(x => x.userId === p.userId);
          if (!oldP) continue;
          for (const t of p.tokens) {
            const oldT = oldP.tokens.find(x => x.id === t.id);
            if (oldT && (oldT.position !== t.position || oldT.stepCount !== t.stepCount)) {
              movedP = p;
              movedT = t;
              oldPos = oldT.position;
              oldStep = oldT.stepCount;
              break;
            }
          }
          if (movedT) break;
        }
      }

      // If token not identified, fallback to direct state update
      if (!movedT) {
        if (res?.capturedOpponent) sound.playCapture();
        else sound.playTokenMove();
        setLocalState(state);
        return;
      }

      const config = PLAYER_CONFIGS.find(c => c.color === movedP.color) || PLAYER_CONFIGS[0];

      // Build intermediate hop path (Ludo King step-by-step)
      const path = [];
      if (oldPos === -1 && movedT.position >= 0) {
        path.push(config.startPos);
      } else {
        for (let s = oldStep + 1; s <= movedT.stepCount; s++) {
          if (s === 56) path.push(105);
          else if (s > 50) path.push(100 + (s - 51));
          else path.push((config.startPos + s) % 52);
        }
      }

      if (path.length === 0) {
        setLocalState(state);
        return;
      }

      // Step-by-step jump animation with wood tap on every cell
      path.forEach((pos, idx) => {
        setTimeout(() => {
          sound.playTokenMove();
          setAnimatingToken({
            userId: movedP.userId,
            tokenId: movedT.id,
            position: pos,
            isHopping: true
          });

          if (idx === path.length - 1) {
            setTimeout(() => {
              if (res?.capturedOpponent) {
                sound.playCapture();
              } else if (pos === 105) {
                sound.playWin();
                confetti({ particleCount: 80, spread: 70 });
              }
              setAnimatingToken(null);
              setLocalState(state);
            }, 100);
          }
        }, idx * 130);
      });
    });

    socket.on('chat_received', (msg) => {
      setChatHistory(prev => [...prev, msg]);
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    socket.on('game_settled', () => {
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
    if (!isMyTurn || activeGame?.hasRolled || rollingAnim) return;
    sound.playClick();
    socket.emit('ludo_roll_dice', {
      roomId: match.id,
      userId: currentUser.id
    });
  };

  // Handle token click
  const handleTokenClick = (tokenId) => {
    if (!isMyTurn || !activeGame?.hasRolled) return;
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

  // Helper to fetch tokens in a specific cell
  const getTokensInCell = (r, c) => {
    const list = [];
    players.forEach(player => {
      player.tokens?.forEach(token => {
        let effectivePos = token.position;
        let isHopping = false;

        if (animatingToken && animatingToken.userId === player.userId && animatingToken.tokenId === token.id) {
          effectivePos = animatingToken.position;
          isHopping = animatingToken.isHopping;
        }

        let matchCell = false;
        if (effectivePos >= 100 && effectivePos <= 104) {
          const homeCoord = HOME_COLUMNS[player.color]?.[effectivePos - 100];
          if (homeCoord && homeCoord[0] === r && homeCoord[1] === c) matchCell = true;
        } else if (effectivePos >= 0 && effectivePos < 52) {
          const trackCoord = TRACK_COORDINATES[effectivePos];
          if (trackCoord && trackCoord[0] === r && trackCoord[1] === c) matchCell = true;
        }

        if (matchCell) {
          list.push({ player, token, isHopping });
        }
      });
    });
    return list;
  };

  // Find player by color
  const getPlayerByColor = (color) => players.find(p => p.color === color);

  // Check if token in yard is animating out
  const isTokenInYard = (player, tokenId) => {
    if (!player) return false;
    const token = player.tokens?.find(t => t.id === tokenId);
    if (!token) return false;
    if (animatingToken && animatingToken.userId === player.userId && animatingToken.tokenId === tokenId) {
      return false; // animating on track
    }
    return token.position === -1;
  };

  // Safe square check
  const isStartSquare = (r, c) => {
    if (r === 6 && c === 1) return 'red';
    if (r === 1 && c === 8) return 'green';
    if (r === 8 && c === 13) return 'yellow';
    if (r === 13 && c === 6) return 'blue';
    return null;
  };

  const isSafeStarSquare = (r, c) => {
    return (r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2);
  };

  // Entry arrows
  const getArrow = (r, c) => {
    if (r === 7 && c === 0) return { symbol: '➔', color: 'text-[#e52521]' };
    if (r === 0 && c === 7) return { symbol: '⬇', color: 'text-[#00a859]' };
    if (r === 7 && c === 14) return { symbol: '⬅', color: 'text-[#fdb813]' };
    if (r === 14 && c === 7) return { symbol: '⬆', color: 'text-[#0080ff]' };
    return null;
  };

  // Arms cell coordinates generator
  const armCells = [];
  // Top arm: 6 rows (0..5), 3 cols (6..8)
  for (let r = 0; r <= 5; r++) {
    for (let c = 6; c <= 8; c++) armCells.push([r, c]);
  }
  // Bottom arm: 6 rows (9..14), 3 cols (6..8)
  for (let r = 9; r <= 14; r++) {
    for (let c = 6; c <= 8; c++) armCells.push([r, c]);
  }
  // Left arm: 3 rows (6..8), 6 cols (0..5)
  for (let r = 6; r <= 8; r++) {
    for (let c = 0; c <= 5; c++) armCells.push([r, c]);
  }
  // Right arm: 3 rows (6..8), 6 cols (9..14)
  for (let r = 6; r <= 8; r++) {
    for (let c = 9; c <= 14; c++) armCells.push([r, c]);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto p-2 sm:p-4 items-center lg:items-start justify-center">
      {/* Left/Main Column: Board & Controls */}
      <div className="flex flex-col items-center w-full max-w-[540px]">
        {/* Top Match Bar */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <button 
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> ব্যাক
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" /> মোট পুল: {match.stake * (players.length || 2)} ৳
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              পুরস্কার: {(match.stake * (players.length || 2) * 0.95).toFixed(0)} ৳
            </div>
          </div>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
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
                  src={players[activeGame?.currentTurnIndex]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=P1'} 
                  alt="avatar" 
                  className={`w-10 h-10 rounded-full border-2 ${
                    players[activeGame?.currentTurnIndex]?.color === 'red' ? 'border-red-500' :
                    players[activeGame?.currentTurnIndex]?.color === 'yellow' ? 'border-yellow-400' :
                    players[activeGame?.currentTurnIndex]?.color === 'green' ? 'border-emerald-500' : 'border-blue-500'
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
                    {players[activeGame?.currentTurnIndex]?.username}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    players[activeGame?.currentTurnIndex]?.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    players[activeGame?.currentTurnIndex]?.color === 'yellow' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                    players[activeGame?.currentTurnIndex]?.color === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {players[activeGame?.currentTurnIndex]?.color}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  {isMyTurn ? (
                    <span className="text-amber-400 font-semibold animate-pulse">👉 আপনার চালের পালা!</span>
                  ) : (
                    <span>প্রতিপক্ষের চালের জন্য অপেক্ষা করুন...</span>
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

        {/* 🏆 Pixel-Perfect Ludo King Board (Matching Reference Image) */}
        <div className="relative aspect-square w-full max-w-[500px] bg-white p-2.5 sm:p-3 rounded-3xl border-4 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden select-none">
          <div 
            className="w-full h-full relative grid border border-slate-300 rounded-2xl overflow-hidden bg-white"
            style={{
              gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(15, minmax(0, 1fr))'
            }}
          >
            {/* 1. Red Base (Top-Left 6x6) */}
            <div 
              className="bg-[#e52521] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-red-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const redPlayer = getPlayerByColor('red');
                    const inYard = isTokenInYard(redPlayer, slot);
                    const isClickable = isMyTurn && inYard && validMoves.includes(slot) && redPlayer?.userId === currentUser?.id;
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
                            onClick={() => handleTokenClick(slot)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Green Base (Top-Right 6x6) */}
            <div 
              className="bg-[#00a859] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-emerald-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const greenPlayer = getPlayerByColor('green');
                    const inYard = isTokenInYard(greenPlayer, slot);
                    const isClickable = isMyTurn && inYard && validMoves.includes(slot) && greenPlayer?.userId === currentUser?.id;
                    return (
                      <div 
                        key={slot} 
                        className="relative w-full aspect-square rounded-full bg-emerald-50 border-2 border-emerald-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00a859] opacity-90 shadow-sm border border-emerald-600/40" />
                        {inYard && (
                          <LudoPinToken 
                            color="green"
                            isClickable={isClickable}
                            isHopping={false}
                            onClick={() => handleTokenClick(slot)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Blue Base (Bottom-Left 6x6) */}
            <div 
              className="bg-[#0080ff] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-blue-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const bluePlayer = getPlayerByColor('blue');
                    const inYard = isTokenInYard(bluePlayer, slot);
                    const isClickable = isMyTurn && inYard && validMoves.includes(slot) && bluePlayer?.userId === currentUser?.id;
                    return (
                      <div 
                        key={slot} 
                        className="relative w-full aspect-square rounded-full bg-blue-50 border-2 border-blue-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0080ff] opacity-90 shadow-sm border border-blue-600/40" />
                        {inYard && (
                          <LudoPinToken 
                            color="blue"
                            isClickable={isClickable}
                            isHopping={false}
                            onClick={() => handleTokenClick(slot)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Yellow Base (Bottom-Right 6x6) */}
            <div 
              className="bg-[#fdb813] p-2.5 sm:p-3.5 flex items-center justify-center relative shadow-sm"
              style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-inner p-2 sm:p-3 flex items-center justify-center border border-amber-200/60">
                <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 w-full h-full max-w-[125px] max-h-[125px]">
                  {[0, 1, 2, 3].map(slot => {
                    const yellowPlayer = getPlayerByColor('yellow');
                    const inYard = isTokenInYard(yellowPlayer, slot);
                    const isClickable = isMyTurn && inYard && validMoves.includes(slot) && yellowPlayer?.userId === currentUser?.id;
                    return (
                      <div 
                        key={slot} 
                        className="relative w-full aspect-square rounded-full bg-amber-50 border-2 border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] flex items-center justify-center"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#fdb813] opacity-90 shadow-sm border border-amber-600/40" />
                        {inYard && (
                          <LudoPinToken 
                            color="yellow"
                            isClickable={isClickable}
                            isHopping={false}
                            onClick={() => handleTokenClick(slot)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Center Home (Center 3x3 Triangles) */}
            <div 
              className="relative w-full h-full bg-white flex items-center justify-center overflow-hidden"
              style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                {/* Red Left Triangle */}
                <polygon points="0,0 50,50 0,100" fill="#e52521" />
                {/* Green Top Triangle */}
                <polygon points="0,0 50,50 100,0" fill="#00a859" />
                {/* Yellow Right Triangle */}
                <polygon points="100,0 50,50 100,100" fill="#fdb813" />
                {/* Blue Bottom Triangle */}
                <polygon points="0,100 50,50 100,100" fill="#0080ff" />
                {/* Center Star Disc */}
                <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <polygon points="50,42 52.5,47 58,47.5 54,51.5 55,57 50,54 45,57 46,51.5 42,47.5 47.5,47" fill="#f59e0b" />
              </svg>

              {/* Finished tokens inside Home */}
              {players.map(p => 
                p.tokens?.filter(t => t.position === 105).map(t => (
                  <div key={`${p.userId}-${t.id}`} className="absolute w-5 h-5 flex items-center justify-center">
                    <div className={`w-3.5 h-3.5 rounded-full shadow-md border-2 border-white ${
                      p.color === 'red' ? 'bg-[#e52521]' :
                      p.color === 'green' ? 'bg-[#00a859]' :
                      p.color === 'yellow' ? 'bg-[#fdb813]' : 'bg-[#0080ff]'
                    }`} />
                  </div>
                ))
              )}
            </div>

            {/* 6. Arms Cells (Top, Bottom, Left, Right) */}
            {armCells.map(([r, c]) => {
              // Background color
              let cellBg = 'bg-white';
              let borderColor = 'border-slate-300';

              // Colored Home Columns
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

              // Starting Squares
              const startColor = isStartSquare(r, c);
              if (startColor === 'red') cellBg = 'bg-[#e52521]';
              if (startColor === 'green') cellBg = 'bg-[#00a859]';
              if (startColor === 'yellow') cellBg = 'bg-[#fdb813]';
              if (startColor === 'blue') cellBg = 'bg-[#0080ff]';

              const isStar = startColor !== null || isSafeStarSquare(r, c);
              const arrow = getArrow(r, c);
              const tokensHere = getTokensInCell(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative flex items-center justify-center select-none border-[0.5px] ${cellBg} ${borderColor}`}
                  style={{ gridColumn: c + 1, gridRow: r + 1 }}
                >
                  {/* Outline Safe Star */}
                  {isStar && (
                    <span className={`text-sm sm:text-base font-black select-none ${
                      startColor ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-slate-400'
                    }`}>
                      ☆
                    </span>
                  )}

                  {/* Entry Arrows */}
                  {arrow && (
                    <span className={`text-xs sm:text-sm font-black select-none ${arrow.color}`}>
                      {arrow.symbol}
                    </span>
                  )}

                  {/* Tokens standing in this cell */}
                  {tokensHere.map(({ player, token, isHopping }) => {
                    const isClickable = isMyTurn && validMoves.includes(token.id) && player.userId === currentUser?.id;
                    return (
                      <LudoPinToken
                        key={`${player.userId}-${token.id}`}
                        color={player.color}
                        isClickable={isClickable}
                        isHopping={isHopping}
                        onClick={() => handleTokenClick(token.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dice & Action Controls */}
        <div className="w-full mt-4 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <RealisticDice value={activeGame?.diceValue || 1} isRolling={rollingAnim} />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">ডাইস পয়েন্ট</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {activeGame?.diceValue ? `${activeGame.diceValue}` : '—'}
              </span>
              {activeGame?.hasRolled && isMyTurn && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                  👉 চাল দিতে গুটি স্পর্শ করুন
                </span>
              )}
            </div>
          </div>

          {/* Interactive Dice Roll Button */}
          <button
            onClick={handleRollDice}
            disabled={!isMyTurn || activeGame?.hasRolled || rollingAnim}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 shadow-xl ${
              isMyTurn && !activeGame?.hasRolled
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 glow-gold cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {rollingAnim ? (
              <span>ডাইস ঘুরছে...</span>
            ) : (
              <span>ডাইস রোল করুন 🎲</span>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: In-game Live Chat & Logs */}
      <div className="w-full lg:w-72 flex flex-col gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col h-[320px]">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-300 text-xs font-bold">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>ইন-গেম চ্যাট</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs no-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="text-center text-slate-500 text-[11px] py-8">
                ম্যাচে এখনো কোনো চ্যাট হয়নি। হাই বলুন! 👋
              </div>
            ) : (
              chatHistory.map((m, idx) => (
                <div key={idx} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-amber-400 text-[10px] block">{m.username}</span>
                  <span className="text-slate-200 text-xs">{m.text || m.emoji}</span>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Chat Presets */}
          <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar border-t border-slate-800">
            {['👋 হাই', '👏 দারুণ', '🔥 সাবাশ', '😂 হাহা'].map(text => (
              <button
                key={text}
                onClick={() => {
                  socket.emit('send_chat', {
                    roomId: match.id,
                    userId: currentUser.id,
                    text
                  });
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg whitespace-nowrap transition cursor-pointer"
              >
                {text}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1.5 pt-2 border-t border-slate-800">
            <input
              type="text"
              placeholder="মেসেজ লিখুন..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Game Activity Log */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl max-h-[220px] overflow-y-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 block mb-2">গেম অ্যাক্টিভিটি</span>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            {activeGame?.logs?.slice(0, 10).map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                <span className="text-amber-400">•</span>
                <span className="flex-1 text-slate-300">{log.text}</span>
              </div>
            )) || <span className="text-slate-500">কোনো রেকর্ড নেই</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
