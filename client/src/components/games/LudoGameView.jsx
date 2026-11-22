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

        {/* 15x15 Deluxe Realistic Ludo Board Grid */}
        <div className="relative aspect-square w-full max-w-[500px] bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 p-2.5 sm:p-4 rounded-[2rem] border-[6px] border-amber-900/80 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.15)] overflow-hidden">
          <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-0.5 bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner">
            {/* 15x15 Cells */}
            {Array.from({ length: 15 }).map((_, r) =>
              Array.from({ length: 15 }).map((_, c) => {
                // Determine Cell Color/Style
                let bgStyle = 'bg-slate-900/90';
                let isStar = false;
                let isHomeTriangle = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

                // Base Corners
                if (r < 6 && c < 6) bgStyle = 'bg-gradient-to-br from-red-950 to-red-900/80 border border-red-800/40 shadow-inner';
                else if (r < 6 && c > 8) bgStyle = 'bg-gradient-to-br from-emerald-950 to-emerald-900/80 border border-emerald-800/40 shadow-inner';
                else if (r > 8 && c > 8) bgStyle = 'bg-gradient-to-br from-amber-950 to-yellow-900/80 border border-yellow-800/40 shadow-inner';
                else if (r > 8 && c < 6) bgStyle = 'bg-gradient-to-br from-blue-950 to-blue-900/80 border border-blue-800/40 shadow-inner';

                // Home Paths
                if (r === 7 && c >= 1 && c <= 5) bgStyle = 'bg-red-600/90 shadow-inner';
                if (c === 7 && r >= 1 && r <= 5) bgStyle = 'bg-emerald-600/90 shadow-inner';
                if (r === 7 && c >= 9 && c <= 13) bgStyle = 'bg-yellow-500/90 shadow-inner';
                if (c === 7 && r >= 9 && r <= 13) bgStyle = 'bg-blue-600/90 shadow-inner';

                // Starting Safe Squares
                if (r === 6 && c === 1) { bgStyle = 'bg-red-600'; isStar = true; }
                if (r === 1 && c === 8) { bgStyle = 'bg-emerald-600'; isStar = true; }
                if (r === 8 && c === 13) { bgStyle = 'bg-yellow-500'; isStar = true; }
                if (r === 13 && c === 6) { bgStyle = 'bg-blue-600'; isStar = true; }

                // Star Safe Squares
                if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
                  isStar = true;
                  bgStyle = 'bg-slate-800/90';
                }

                if (isHomeTriangle) {
                  bgStyle = 'bg-gradient-to-br from-red-600 via-emerald-600 via-yellow-500 to-blue-600';
                }

                const tokensHere = getTokensInCell(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative flex items-center justify-center select-none text-[8px] transition ${bgStyle}`}
                  >
                    {isStar && !isHomeTriangle && (
                      <span className="text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] text-[11px] font-black">★</span>
                    )}

                    {isHomeTriangle && r === 7 && c === 7 && (
                      <Trophy className="w-5 h-5 text-amber-300 drop-shadow-md animate-bounce" />
                    )}

                    {/* Tokens rendering */}
                    {tokensHere.map(({ player, token }) => {
                      const isClickable = isMyTurn && validMoves.includes(token.id) && player.userId === currentUser?.id;
                      return (
                        <button
                          key={`${player.userId}-${token.id}`}
                          onClick={() => handleTokenClick(token.id)}
                          disabled={!isClickable}
                          title={`${player.username}'s Token #${token.id + 1}`}
                          className={`absolute w-[86%] h-[86%] rounded-full flex items-center justify-center font-black text-[9px] shadow-[0_4px_8px_rgba(0,0,0,0.7),inset_0_2px_3px_rgba(255,255,255,0.45)] transition-all duration-200 z-10 ${
                            player.color === 'red' ? 'bg-gradient-to-b from-red-400 via-red-500 to-red-700 text-white ring-1 ring-red-200' :
                            player.color === 'yellow' ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-slate-950 ring-1 ring-yellow-100' :
                            player.color === 'green' ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 text-white ring-1 ring-emerald-200' :
                            'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 text-white ring-1 ring-blue-200'
                          } ${
                            isClickable ? 'ring-4 ring-amber-400 animate-pulse-glow cursor-pointer scale-125 z-20 hover:scale-135' : ''
                          }`}
                        >
                          {token.id + 1}
                        </button>
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
