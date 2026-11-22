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

      {/* Mini Board */}
      <div className="aspect-square w-full bg-slate-950 p-3 rounded-3xl border-4 border-slate-800 shadow-2xl relative">
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-0.5 bg-slate-800/40 rounded-2xl overflow-hidden relative">
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => {
              let bg = 'bg-slate-900/90';
              if (r < 6 && c < 6) bg = 'bg-red-950/60 border border-red-900/30';
              if (r > 8 && c > 8) bg = 'bg-yellow-950/60 border border-yellow-900/30';
              if (r === 7 && c >= 1 && c <= 5) bg = 'bg-red-600/80';
              if (r === 7 && c >= 9 && c <= 13) bg = 'bg-yellow-500/80';
              if (r >= 6 && r <= 8 && c >= 6 && c <= 8) bg = 'bg-gradient-to-br from-red-600 to-yellow-500';

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
                  {redToken && (
                    <button
                      onClick={() => handlePlayerMove(redToken.id)}
                      className="w-4/5 h-4/5 rounded-full bg-red-500 border border-white text-white font-bold flex items-center justify-center shadow-md animate-pulse cursor-pointer"
                    >
                      {redToken.id + 1}
                    </button>
                  )}
                  {botToken && (
                    <div className="w-4/5 h-4/5 rounded-full bg-yellow-400 border border-slate-900 text-slate-950 font-bold flex items-center justify-center shadow-md">
                      🤖
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Dice Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayerRoll}
          disabled={turn !== 'player' || hasRolled || winner}
          className={`flex-1 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition ${
            turn === 'player' && !hasRolled && !winner
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 glow-gold scale-[1.02] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          🎲 {hasRolled ? 'Tap Highlighted Token to Move!' : 'ROLL DICE (Your Turn)'}
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
