import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Sparkles, MessageSquare, Headphones, ChevronDown } from 'lucide-react';
import { sound } from '../utils/sound';

export default function FloatingAiChat({ currentUser, onOpenAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'আসসালামু আলাইকুম! আমি লুডুস্টার প্রো-এর স্মার্ট এআই সাপোর্ট অ্যাসিস্ট্যান্ট। আপনাকে কীভাবে সাহায্য করতে পারি?',
      time: 'এখন'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Intelligent Bengali AI Knowledge Base
  const generateAiReply = (userQuery) => {
    const q = userQuery.toLowerCase();

    if (q.includes('রিচার্জ') || q.includes('ডিপোজিট') || q.includes('টাকা পাঠাব') || q.includes('ব্যালেন্স')) {
      return 'টাকা রিচার্জ করতে ওয়ালেটে গিয়ে "রিচার্জ" বাটনে ক্লিক করুন। বিকাশ, নগদ বা রকেটে দেওয়া নম্বরে সেন্ড মানি করে Transaction ID (TrxID) সাবমিট করলেই ৫ মিনিটের মধ্যে ব্যালেন্স যোগ হবে।';
    }
    if (q.includes('উত্তোলন') || q.includes('উইথড্র') || q.includes('টাকা তুলব') || q.includes('ক্যাশআউট')) {
      return 'টাকা তুলতে ওয়ালেট থেকে "উত্তোলন" বাটনে ক্লিক করুন। আপনার বিকাশ বা নগদ নম্বর ও টাকার পরিমাণ লিখে সাবমিট করুন। অ্যাডমিন অনুমোদনের পর সাথে সাথে আপনার নম্বরে টাকা পৌঁছে যাবে।';
    }
    if (q.includes('বোনাস') || q.includes('৫০') || q.includes('ফ্রি')) {
      return 'নতুন একাউন্ট খুললেই সরাসরি ৫০ ৳ ফ্রি ওয়েলকাম ব্যালেন্স পাওয়া যায়! এই ৫০ ৳ দিয়ে আপনি সরাসরি লুডু, দাবা বা ক্যারাম ম্যাচ খেলে জিতে আসল টাকা ইনকাম করতে পারবেন।';
    }
    if (q.includes('লুডু') || q.includes('খেলব') || q.includes('ম্যাচ') || q.includes('ক্যারাম') || q.includes('দাবা')) {
      return 'যেকোনো খেলা শুরু করতে হোম স্ক্রিন থেকে লুডু, দাবা বা ক্যারাম সিলেক্ট করুন। এরপর ৫০ ৳ থেকে শুরু করে আপনার পছন্দের স্টেক বেছে নিয়ে "দ্রুত খেলুন" বাটনে চাপলেই ম্যাচ শুরু হবে!';
    }
    if (q.includes('বন্ধু') || q.includes('রুম') || q.includes('কোড')) {
      return 'বন্ধুদের সাথে খেলতে গেম লবি থেকে "বন্ধুদের জন্য রুম তৈরি করুন" বাটনে চাপ দিয়ে রুম কোডটি বন্ধুকে শেয়ার করুন। বন্ধু কোড সাবমিট করলেই আপনারা একসাথে ম্যাচ খেলতে পারবেন।';
    }
    if (q.includes('অভিযোগ') || q.includes('সমস্যা') || q.includes('হেল্প') || q.includes('সাহায্য')) {
      return 'যেকোনো ব্যক্তিগত সমস্যা বা অভিযোগ জানাতে আপনার প্রোফাইল ট্যাবে যান এবং "২৪/৭ কাস্টমার সাপোর্ট ও হেল্প" এ ক্লিক করে সরাসরি সাপোর্ট টিকিট সাবমিট করুন। আমাদের টিম দ্রুত সমাধান করবে।';
    }
    if (q.includes('হ্যালো') || q.includes('হাই') || q.includes('hey') || q.includes('hello')) {
      return 'হ্যালো! আপনাকে কীভাবে সহায়তা করতে পারি? রিচার্জ, উত্তোলন, ৫০ ৳ বোনাস বা গেম সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।';
    }

    return 'ধন্যবাদ আপনার মেসেজের জন্য! আমাদের ২৪/৭ সাপোর্ট টিম ও এআই সিস্টেম সক্রিয় রয়েছে। আপনি রিচার্জ, উত্তোলন, ৫০ ৳ ওয়েলকাম বোনাস বা গেমের নিয়মাবলী সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।';
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    sound.playClick();
    const userMsg = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.trim();
    setInputText('');
    setIsTyping(true);

    // AI thinking delay
    setTimeout(() => {
      const replyText = generateAiReply(query);
      const aiMsg = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      sound.playTick();
    }, 900);
  };

  const quickQuestions = [
    'টাকা রিচার্জ করব কিভাবে?',
    '৫০ ৳ বোনাস দিয়ে কি খেলা যাবে?',
    'উত্তোলন করার নিয়ম কি?',
    'বন্ধুদের সাথে কিভাবে খেলব?'
  ];

  return (
    <>
      {/* 🎧 Floating Support Agent Avatar Button (Matching 3rd Image) */}
      {!isOpen && (
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          title="২৪/৭ লাইভ সাপোর্ট ও হেল্প"
          className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 group cursor-pointer transition-transform transform hover:scale-110 active:scale-95"
        >
          <div className="relative w-14 h-14 rounded-full bg-[#0b1c3d] p-1 border-2 border-cyan-400 shadow-[0_8px_20px_rgba(6,182,212,0.5)] flex items-center justify-center overflow-visible">
            {/* Customer Support Avatar Character with Headset */}
            <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
              {/* Headset arc */}
              <path d="M 24 50 A 26 26 0 0 1 76 50" fill="none" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" />
              {/* Headset earpieces */}
              <rect x="18" y="42" width="8" height="18" rx="4" fill="#0284c7" />
              <rect x="74" y="42" width="8" height="18" rx="4" fill="#0284c7" />
              {/* Face */}
              <circle cx="50" cy="50" r="23" fill="#ffedd5" />
              {/* Hair */}
              <path d="M 27 50 C 27 34, 73 34, 73 50 Z" fill="#b45309" />
              {/* Eyes */}
              <circle cx="43" cy="48" r="3.2" fill="#0f172a" />
              <circle cx="57" cy="48" r="3.2" fill="#0f172a" />
              {/* Smile */}
              <path d="M 43 57 Q 50 63, 57 57" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
              {/* Shirt Collar */}
              <path d="M 33 72 L 50 66 L 67 72 L 67 90 L 33 90 Z" fill="#2563eb" />
              <polygon points="50,68 45,80 55,80" fill="#f59e0b" />
              {/* Microphone boom */}
              <path d="M 22 55 Q 35 70, 42 66" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
              <circle cx="43" cy="65" r="3.5" fill="#ef4444" />
            </svg>

            {/* Pulsating Green Online Indicator (Bottom-Right) */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#070b14]" />
            </span>
          </div>
        </button>
      )}

      {/* 💬 Slide-in AI Support Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-88 sm:max-w-sm h-[520px] max-h-[90vh] bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-[#0b1c3d] border border-cyan-400 flex items-center justify-center shadow-md">
                <Headphones className="w-5 h-5 text-cyan-400" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
              </div>
              <div>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  ২৪/৭ লাইভ এআই সাপোর্ট
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                    সক্রিয়
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block">তাৎক্ষণিক উত্তর ও সহায়তা</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-slate-950/90">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex items-start gap-2 ${isAi ? '' : 'flex-row-reverse'}`}>
                  {isAi && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[82%] p-3 rounded-2xl ${
                    isAi
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    <span className={`text-[9px] block text-right mt-1 font-mono ${isAi ? 'text-slate-500' : 'text-slate-900/70'}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="text-[11px] animate-pulse">সাপোর্ট অ্যাসিস্ট্যান্ট লিখছে...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick FAQ Suggestion Pills */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-850 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(q);
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-bold transition shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-1.5">
            <input
              type="text"
              placeholder="আপনার প্রশ্ন লিখুন..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 cursor-pointer shadow-md'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
