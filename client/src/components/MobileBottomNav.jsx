import React from 'react';
import { Home, Gamepad2, Users, Trophy, User } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function MobileBottomNav({ 
  currentTab, 
  onChangeTab, 
  currentUser,
  onOpenAuth,
  lang = 'bn' 
}) {
  const t = translations[lang] || translations.bn;

  const tabs = [
    { id: 'home', label: 'হোম', icon: Home, requiresAuth: false },
    { id: 'games', label: 'গেমস', icon: Gamepad2, requiresAuth: true },
    { id: 'friends', label: 'বন্ধুরা', icon: Users, requiresAuth: true },
    { id: 'rank', label: 'র‍্যাঙ্ক', icon: Trophy, requiresAuth: false },
    { id: 'profile', label: 'প্রোফাইল', icon: User, requiresAuth: true }
  ];

  const handleTabClick = (tab) => {
    if (tab.requiresAuth && !currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    onChangeTab(tab.id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 pb-safe flex items-center justify-around shadow-2xl">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-200 select-none cursor-pointer ${
              isActive 
                ? 'text-amber-400 scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition ${
              isActive ? 'bg-amber-500/15 shadow-sm' : ''
            }`}>
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-sm" />
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight font-sans ${
              isActive ? 'font-black text-amber-300' : 'font-medium'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}