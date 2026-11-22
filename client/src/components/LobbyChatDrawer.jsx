import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Users, Sparkles, ChevronDown } from 'lucide-react';

export default function LobbyChatDrawer({ socket, currentUser, onlineCount, onOpenAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('lobby_chat_history', (history) => {
      setMessages(history || []);
    });

    socket.on('lobby_chat_message', (msg) => {
      setMessages(prev => [...prev.slice(-49), msg]);
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => {
      socket.off('lobby_chat_history');
      socket.off('lobby_chat_message');
    };
  }, [socket]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!currentUser) return onOpenAuth();
    if (!text.trim()) return;

    socket.emit('send_lobby_chat', {
      userId: currentUser.id,
      message: text.trim()
    });
    setText('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-2xl glow-gold flex items-center gap-2 text-xs transition-transform transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-950 border border-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Slide-in Drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-80 sm:max-w-xs h-[450px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Global Arena Chat
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {onlineCount} Online
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-[11px]">
                No messages yet. Say hello to fellow players! 👋
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2">
                  <img
                    src={msg.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=chat'}
                    alt="av"
                    className="w-6 h-6 rounded-full border border-slate-700 bg-slate-950 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 bg-slate-950/70 border border-slate-800/80 p-2 rounded-xl">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-[10px] ${msg.isAdmin ? 'text-purple-400' : 'text-amber-400'}`}>
                        {msg.username} {msg.isAdmin && '★ Admin'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-slate-200 text-xs break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder={currentUser ? "Type a message..." : "Log in to chat"}
              value={text}
              disabled={!currentUser}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!currentUser || !text.trim()}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
