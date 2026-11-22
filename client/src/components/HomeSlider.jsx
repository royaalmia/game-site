import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Gift, Users, ShieldCheck, Sparkles, 
  ChevronLeft, ChevronRight, ArrowRight, Zap, Coins, Rocket, Award
} from 'lucide-react';

const SLIDES = [
  {
    id: 'tournament',
    badge: 'মেগা টুর্নামেন্ট',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: '৫০,০০০ ৳ গ্র্যান্ড লুডু চ্যাম্পিয়নশিপ',
    subtitle: 'নিবন্ধন চলছে। এখনই টুর্নামেন্টে যুক্ত হয়ে মেগা প্রাইজমানি জয় করুন।',
    ctaText: 'টুর্নামেন্টে যোগ দিন',
    ctaAction: 'tournament',
    icon: Trophy,
    gradient: 'from-amber-600/90 via-orange-600/80 to-slate-950',
    accentColor: 'text-amber-400'
  },
  {
    id: 'deposit',
    badge: '১০০% ক্যাশব্যাক অফার',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'প্রথম রিচার্জে ১০০% ইনস্ট্যান্ট বোনাস',
    subtitle: 'বিকাশ ও নগদ দিয়ে যেকোনো রিচার্জে দ্বিগুণ ব্যালেন্স। ইনস্ট্যান্ট ক্রেডিট।',
    ctaText: 'টাকা রিচার্জ করুন',
    ctaAction: 'deposit',
    icon: Coins,
    gradient: 'from-emerald-600/90 via-teal-700/80 to-slate-950',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'refer',
    badge: 'রেফারাল রিওয়ার্ড',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    title: 'বন্ধুদের ইনভাইট করলেই ১০ ৳ বোনাস',
    subtitle: 'রেফারাল লিঙ্ক শেয়ার করুন। প্রতিটি সফল রেজিস্ট্রেশনে নিশ্চিত নগদ রিওয়ার্ড।',
    ctaText: 'বন্ধুদের ইনভাইট করুন',
    ctaAction: 'refer',
    icon: Users,
    gradient: 'from-indigo-600/90 via-purple-700/80 to-slate-950',
    accentColor: 'text-purple-300'
  },
  {
    id: 'escrow',
    badge: 'সুরক্ষিত এসক্রো সিস্টেম',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: '৫% প্ল্যাটফর্ম ফি — ৯৫% উইনিং পেআউট',
    subtitle: 'বিকাশ ও নগদে ৫-১৫ মিনিটে টাকা উত্তোলন করুন। শতভাগ ফেয়ার প্লে।',
    ctaText: 'ম্যাচ শুরু করুন',
    ctaAction: 'play',
    icon: ShieldCheck,
    gradient: 'from-rose-600/90 via-red-800/80 to-slate-950',
    accentColor: 'text-rose-400'
  }
];

export default function HomeSlider({
  onSelectAction,
  onOpenWallet,
  onOpenTournaments,
  onOpenAuth,
  currentUser
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentIdx(prev => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIdx(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

  const handleSlideClick = (slide) => {
    if (slide.ctaAction === 'deposit') {
      if (!currentUser) return onOpenAuth();
      onOpenWallet({ tab: 'deposit' });
    } else if (slide.ctaAction === 'tournament') {
      onOpenTournaments();
    } else if (slide.ctaAction === 'refer') {
      if (!currentUser) return onOpenAuth();
      if (onSelectAction) onSelectAction('profile');
    } else if (slide.ctaAction === 'play') {
      if (onSelectAction) onSelectAction('games');
    }
  };

  const activeSlide = SLIDES[currentIdx];
  const IconComponent = activeSlide.icon;

  return (
    <div 
      className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`p-5 sm:p-6 bg-gradient-to-br ${activeSlide.gradient} transition-all duration-500 min-h-[175px] flex flex-col justify-between relative`}>
        {/* Background Large SVG Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none transition-transform duration-700 transform scale-125 text-white">
          <IconComponent className="w-24 h-24" />
        </div>

        {/* Top Tag & Slide Counter */}
        <div className="flex items-center justify-between relative z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${activeSlide.badgeColor} shadow-sm backdrop-blur-md`}>
            <Sparkles className="w-3.5 h-3.5" />
            {activeSlide.badge}
          </span>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
            {currentIdx + 1}/{SLIDES.length}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 my-2 space-y-1 max-w-[85%] sm:max-w-md">
          <h2 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
            {activeSlide.title}
          </h2>
          <p className="text-xs text-slate-200 leading-snug line-clamp-2 opacity-95">
            {activeSlide.subtitle}
          </p>
        </div>

        {/* Action Button & Dots */}
        <div className="relative z-10 pt-1 flex items-center justify-between">
          <button
            onClick={() => handleSlideClick(activeSlide)}
            className="px-4 py-2 bg-slate-950/90 hover:bg-slate-950 text-white font-black text-xs rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer"
          >
            <span>{activeSlide.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIdx === idx 
                    ? 'w-5 h-2 bg-amber-400 shadow-sm' 
                    : 'w-2 h-2 bg-slate-400/50 hover:bg-slate-300'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Left / Right Arrow Controls */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          title="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          title="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}