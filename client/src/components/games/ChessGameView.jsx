import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/sound';
import { Trophy, Clock, Flag, MessageSquare, Send, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

const PIECE_SYMBOLS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

export default function ChessGameView({ match, gameState, currentUser, socket, onLeave }) {
  const [selectedSquare, setSelectedSquare] = useState(null); // { r, c }
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chatBottomRef = useRef(null);

  const players = gameState?.players || match?.players || [];
  const currentTurn = gameState?.currentTurn || 'white';
  const myPlayer = players.find(p => p.userId === currentUser?.id);
  const isMyTurn = myPlayer && myPlayer.color === currentTurn;
  const board = gameState?.board || [];
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

    socket.on('chess_moved', (data) => {
      sound.playTokenMove();
      setSelectedSquare(null);
    });

    socket.on('chat_received', (msg) => {
      setChatHistory(prev => [...prev, msg]);
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    socket.on('game_settled', () => {
      sound.playWin();
      confetti({ particleCount: 100, spread: 70 });
    });

    return () => {
      socket.off('chess_moved');
      socket.off('chat_received');
      socket.off('game_settled');
    };
  }, [socket]);

  const handleSquareClick = (r, c) => {
    if (!isMyTurn) return;

    const piece = board[r]?.[c];

    // If already selected a square
    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        // Deselect
        setSelectedSquare(null);
        return;
      }

      // Check if clicking another piece of own color
      const isWhitePiece = piece && piece === piece.toUpperCase();
      const isOwnPiece = piece && ((myPlayer.color === 'white' && isWhitePiece) || (myPlayer.color === 'black' && !isWhitePiece));
      if (isOwnPiece) {
        setSelectedSquare({ r, c });
        sound.playClick();
        return;
      }

      // Execute Move
      sound.playClick();
      socket.emit('chess_move', {
        roomId: match.id,
        userId: currentUser.id,
        from: selectedSquare,
        to: { r, c }
      });
      setSelectedSquare(null);
    } else {
      // Selecting source piece
      if (!piece) return;
      const isWhitePiece = piece === piece.toUpperCase();
      const isOwnPiece = (myPlayer.color === 'white' && isWhitePiece) || (myPlayer.color === 'black' && !isWhitePiece);
      if (isOwnPiece) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  const handleResign = () => {
    if (confirm("Are you sure you want to resign this Chess match?")) {
      socket.emit('chess_resign', {
        roomId: match.id,
        userId: currentUser.id
      });
    }
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
        {/* Top Header */}
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
          <button
            onClick={handleResign}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/30"
          >
            <Flag className="w-3.5 h-3.5" /> Resign
          </button>
        </div>

        {/* Status Bar */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border ${currentTurn === 'white' ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-600'}`} />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{currentTurn.toUpperCase()}'s Turn</span>
                {isMyTurn && <span className="text-amber-400 text-xs font-normal">(You)</span>}
              </div>
              <span className="text-[11px] text-slate-400">
                You are playing as <strong className="text-amber-400">{myPlayer?.color?.toUpperCase()}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 font-bold">
            <Clock className="w-3.5 h-3.5" /> {timeLeft}s
          </div>
        </div>

        {/* 8x8 Chessboard */}
        <div className="relative aspect-square w-full max-w-[460px] bg-amber-950/40 p-2 rounded-2xl border-4 border-amber-900/60 shadow-2xl">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden border border-amber-800/60">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isLight = (r + c) % 2 === 0;
                const isSelected = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center text-3xl sm:text-4xl select-none transition cursor-pointer ${
                      isLight ? 'bg-amber-100 hover:bg-amber-200' : 'bg-amber-800 hover:bg-amber-700'
                    } ${isSelected ? 'ring-4 ring-cyan-400 z-10 scale-105' : ''}`}
                  >
                    {piece && (
                      <span className={`drop-shadow-md ${piece === piece.toUpperCase() ? 'text-slate-100' : 'text-slate-950'}`}>
                        {PIECE_SYMBOLS[piece]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Chat & Moves */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-80 shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
            <span className="text-xs font-bold text-slate-300">Live Match Chat & Commentary</span>
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
                <span className="font-bold text-[10px] text-amber-400 block">{chat.sender}</span>
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
            <button type="submit" className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
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
            <h2 className="text-2xl font-black text-white mb-1">
              {winner.userId === currentUser?.id ? 'CHECKMATE! VICTORY!' : 'MATCH CONCLUDED'}
            </h2>
            <p className="text-slate-400 text-sm mb-4">Winner: <strong className="text-amber-400">{winner.username}</strong></p>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 text-left text-xs space-y-1">
              <div className="flex justify-between"><span>Total Pool:</span><span className="font-bold text-white">{match.stake * 2} BDT</span></div>
              <div className="flex justify-between"><span>Commission (5%):</span><span className="font-bold text-rose-400">-{(match.stake * 2 * 0.05).toFixed(2)} BDT</span></div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                <span>Winner Payout:</span><span>+{(match.stake * 2 * 0.95).toFixed(2)} BDT</span>
              </div>
            </div>
            <button onClick={onLeave} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black">
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
