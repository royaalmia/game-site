import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import HomeDashboard from './components/HomeDashboard';
import GameLobby from './components/GameLobby';
import PlayerProfileExpanded from './components/PlayerProfileExpanded';
import SuperAdminApp from './components/SuperAdminApp';
import AdminGatewayLogin from './components/AdminGatewayLogin';
import PracticeModeView from './components/games/PracticeModeView';
import LudoGameView from './components/games/LudoGameView';
import ChessGameView from './components/games/ChessGameView';
import CarromGameView from './components/games/CarromGameView';
import WalletModal from './components/WalletModal';
import AuthModal from './components/AuthModal';
import FriendsModal from './components/FriendsModal';
import LeaderboardModal from './components/LeaderboardModal';
import TournamentsModal from './components/TournamentsModal';
import DisputesModal from './components/DisputesModal';
import InvitePopupModal from './components/InvitePopupModal';
import LobbyChatDrawer from './components/LobbyChatDrawer';
import confetti from 'canvas-confetti';
import { sound } from './utils/sound';
import { apiFetch, getSocket, setAuthToken } from './utils/api';
import { translations } from './utils/i18n';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('ludu_lang') || 'bn');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ludu_user') || 'null');
    } catch {
      return null;
    }
  });

  // Dedicated Secret /admin Route Detection (domain/admin)
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    const p = window.location.pathname.toLowerCase();
    return p === '/admin' || p.startsWith('/admin/') || window.location.hash.toLowerCase() === '#admin';
  });

  // Mobile Bottom Navigation Tab: 'home' | 'games' | 'friends' | 'rank' | 'profile'
  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState('main'); // 'main' | 'game' | 'practice'
  const [selectedGameForLobby, setSelectedGameForLobby] = useState('ludo');

  const [currentMatch, setCurrentMatch] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  // Modals & Cashier Config
  const [walletModalConfig, setWalletModalConfig] = useState({
    isOpen: false,
    tab: 'deposit',
    amount: ''
  });
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [welcomeBonusUser, setWelcomeBonusUser] = useState(null);
  const [tournamentsModalOpen, setTournamentsModalOpen] = useState(false);
  const [disputesModalOpen, setDisputesModalOpen] = useState(false);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({
      isOpen: true,
      mode: typeof mode === 'string' ? mode : 'login'
    });
  };

  // Incoming Match Challenge
  const [incomingInvite, setIncomingInvite] = useState(null);

  // Sync route on browser navigation (Back / Forward button)
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      setIsAdminRoute(p === '/admin' || p.startsWith('/admin/') || window.location.hash.toLowerCase() === '#admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    localStorage.setItem('ludu_lang', next);
  };

  const handleOpenWallet = (options = {}) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setWalletModalConfig({
      isOpen: true,
      tab: options.tab || 'deposit',
      amount: options.amount ? String(options.amount) : ''
    });
  };

  const handleTabChange = (tabId) => {
    if (['games', 'friends', 'profile'].includes(tabId) && !currentUser) {
      handleOpenAuth('login');
      return;
    }
    setActiveTab(tabId);
  };

  const refreshUser = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      setCurrentUser(res.user);
      localStorage.setItem('ludu_user', JSON.stringify(res.user));
    } catch (err) {
      console.warn('Could not refresh session:', err.message);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await apiFetch('/api/friends/list');
      setFriends(res.friends || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await apiFetch('/api/tournaments');
      setTournaments(res.tournaments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const s = getSocket(currentUser?.id);
    setSocket(s);

    if (currentUser?.id) {
      refreshUser();
      fetchFriends();
    }
    fetchTournaments();
  }, [currentUser?.id]);

  // Global socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('online_users_update', ({ onlineCount, onlineUserIds }) => {
      setOnlineCount(onlineCount || 1);
      setOnlineUserIds(onlineUserIds || []);
    });

    socket.on('match_invite_received', (invite) => {
      setIncomingInvite(invite);
    });

    socket.on('match_reconnected', ({ roomId, match, state }) => {
      setCurrentMatch(match);
      setGameState(state);
      setView('game');
    });

    socket.on('match_started', ({ roomId, match, state }) => {
      setCurrentMatch(match);
      setGameState(state);
      setView('game');
      setIncomingInvite(null);
    });

    socket.on('game_settled', () => {
      refreshUser();
    });

    return () => {
      socket.off('online_users_update');
      socket.off('match_invite_received');
      socket.off('match_reconnected');
      socket.off('match_started');
      socket.off('game_settled');
    };
  }, [socket]);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('ludu_user');
    setCurrentUser(null);
    setActiveTab('home');
    setView('main');
    setCurrentMatch(null);
    setGameState(null);
  };

  const handleMatchStarted = (match, state) => {
    setCurrentMatch(match);
    setGameState(state);
    setView('game');
  };

  const handleLeaveGame = () => {
    setView('main');
    setActiveTab('home');
    setCurrentMatch(null);
    setGameState(null);
    refreshUser();
  };

  const handleAcceptInvite = (invite) => {
    socket.emit('accept_match_invite', {
      fromUserId: invite.fromUser.id,
      toUserId: currentUser.id,
      gameType: invite.gameType,
      mode: invite.mode,
      stake: invite.stake
    });
    setIncomingInvite(null);
  };

  const handleDeclineInvite = (invite) => {
    socket.emit('decline_match_invite', {
      fromUserId: invite.fromUser.id,
      toUserId: currentUser.id
    });
    setIncomingInvite(null);
  };

  const handleInviteFriendToMatch = (friend) => {
    if (!currentUser) return handleOpenAuth('login');
    socket.emit('invite_friend_to_match', {
      fromUserId: currentUser.id,
      toUserId: friend.id,
      gameType: 'ludo',
      mode: '1v1',
      stake: 50
    });
    alert(`Challenge sent to ${friend.username} for 50 ৳! Waiting for them to accept...`);
  };

  const handleJoinByCodeFromHome = (code) => {
    if (!currentUser) return handleOpenAuth('login');
    setSelectedGameForLobby('ludo');
    setActiveTab('games');
    if (socket) {
      socket.emit('join_room_by_code', {
        userId: currentUser.id,
        roomCode: code
      });
    }
  };

  // ========================================================
  // 🔒 Dedicated Secret /admin System (domain/admin)
  // ========================================================
  if (isAdminRoute) {
    if (currentUser && currentUser.isAdmin) {
      return (
        <SuperAdminApp
          onBack={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
        />
      );
    } else {
      return (
        <AdminGatewayLogin
          onAdminLoginSuccess={(adminUser) => {
            setCurrentUser(adminUser);
            refreshUser();
          }}
          onReturnToSite={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
        />
      );
    }
  }

  // ========================================================
  // 🎮 Main Public Gaming Portal (Zero Admin traces visible)
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">
      {/* Top Clean Navbar (No Admin Button) */}
      <Navbar
        currentUser={currentUser}
        onlineCount={onlineCount}
        onOpenAuth={handleOpenAuth}
        onOpenWallet={handleOpenWallet}
        onOpenProfile={() => {
          if (!currentUser) return handleOpenAuth('login');
          setView('main'); 
          setActiveTab('profile'); 
        }}
        onOpenFriends={() => { 
          if (!currentUser) return handleOpenAuth('login');
          setView('main'); 
          setActiveTab('friends'); 
        }}
        onOpenLeaderboard={() => { setView('main'); setActiveTab('rank'); }}
        onOpenTournaments={() => setTournamentsModalOpen(true)}
        onOpenDisputes={() => setDisputesModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pt-3">
        {/* 1. Live Match Screen */}
        {view === 'game' && currentMatch && (
          <>
            {currentMatch.gameType === 'ludo' && (
              <LudoGameView
                match={currentMatch}
                gameState={gameState}
                currentUser={currentUser}
                socket={socket}
                onLeave={handleLeaveGame}
              />
            )}
            {currentMatch.gameType === 'chess' && (
              <ChessGameView
                match={currentMatch}
                gameState={gameState}
                currentUser={currentUser}
                socket={socket}
                onLeave={handleLeaveGame}
              />
            )}
            {currentMatch.gameType === 'carrom' && (
              <CarromGameView
                match={currentMatch}
                gameState={gameState}
                currentUser={currentUser}
                socket={socket}
                onLeave={handleLeaveGame}
              />
            )}
          </>
        )}

        {/* 2. Practice Mode vs AI Bot */}
        {view === 'practice' && (
          <PracticeModeView
            currentUser={currentUser}
            onLeave={() => setView('main')}
          />
        )}

        {/* 3. Main Mobile Views (Driven by Bottom Navigation) */}
        {view === 'main' && (
          <>
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <HomeDashboard
                currentUser={currentUser}
                friends={friends}
                onlineUserIds={onlineUserIds}
                tournaments={tournaments}
                lang={lang}
                onSelectGame={(gameId) => {
                  if (!currentUser) {
                    handleOpenAuth('login');
                    return;
                  }
                  setSelectedGameForLobby(gameId);
                  setActiveTab('games');
                }}
                onOpenWallet={handleOpenWallet}
                onOpenAuth={handleOpenAuth}
                onOpenTournaments={() => setTournamentsModalOpen(true)}
                onSelectTab={handleTabChange}
                onInviteFriend={handleInviteFriendToMatch}
                onStartPractice={() => setView('practice')}
                onJoinRoomCode={handleJoinByCodeFromHome}
              />
            )}

            {/* TAB: GAMES (Matchmaking, 1v1, 2v2, Custom Rooms) */}
            {activeTab === 'games' && (
              <div className="pb-24">
                <GameLobby
                  currentUser={currentUser}
                  socket={socket}
                  initialGame={selectedGameForLobby}
                  onMatchStarted={handleMatchStarted}
                  onOpenWallet={handleOpenWallet}
                  onOpenAuth={handleOpenAuth}
                />
              </div>
            )}

            {/* TAB: FRIENDS */}
            {activeTab === 'friends' && currentUser && (
              <FriendsModal
                isOpen={true}
                onClose={() => setActiveTab('home')}
                currentUser={currentUser}
                onlineUserIds={onlineUserIds}
                socket={socket}
                onInviteFriend={handleInviteFriendToMatch}
              />
            )}

            {/* TAB: RANK (Leaderboard) */}
            {activeTab === 'rank' && (
              <LeaderboardModal
                isOpen={true}
                onClose={() => setActiveTab('home')}
              />
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && currentUser && (
              <PlayerProfileExpanded
                user={currentUser}
                lang={lang}
                onToggleLang={toggleLanguage}
                onBack={() => setActiveTab('home')}
                onLogout={handleLogout}
                onUserUpdate={refreshUser}
                onOpenDisputes={() => setDisputesModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Touch-Friendly Mobile Bottom Navigation (Visible in main view) */}
      {view === 'main' && (
        <MobileBottomNav
          currentTab={activeTab}
          onChangeTab={handleTabChange}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          lang={lang}
        />
      )}

      {/* Real-time Match Invite Challenge Popup Modal */}
      <InvitePopupModal
        invite={incomingInvite}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      {/* Global Live Lobby Banter Chat (visible in main lobby when logged in) */}
      {view === 'main' && activeTab === 'home' && currentUser && (
        <LobbyChatDrawer
          socket={socket}
          currentUser={currentUser}
          onlineCount={onlineCount}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Cashier & Wallet Modal */}
      <WalletModal
        isOpen={walletModalConfig.isOpen}
        onClose={() => setWalletModalConfig(prev => ({ ...prev, isOpen: false }))}
        user={currentUser}
        initialTab={walletModalConfig.tab}
        defaultAmount={walletModalConfig.amount}
        onBalanceUpdate={refreshUser}
      />

      {/* Login & Register Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        onAuthSuccess={(user, isNew) => {
          setCurrentUser(user);
          refreshUser();
          if (isNew) {
            setWelcomeBonusUser(user);
            sound.playWin();
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            } catch (e) {}
          }
        }}
      />

      {/* 50 BDT Free Welcome Reward Popup Modal */}
      {welcomeBonusUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-xl glow-gold text-3xl">
              🎁
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs mb-2">
              ওয়েলকাম বোনাস ক্রেডিট
            </span>
            <h3 className="text-xl font-black text-white leading-tight">
              অভিনন্দন {welcomeBonusUser.username}!
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              আপনি নতুন অ্যাকাউন্ট খোলার জন্য <span className="text-emerald-400 font-black text-base">৫০ ৳ ফ্রি ব্যালেন্স</span> পেয়েছেন!
            </p>
            <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              এই ব্যালেন্স দিয়ে এখনই লুডু, দাবা বা ক্যারামে ৫০ ৳ এন্ট্রি ফি দিয়ে ম্যাচ খেলা শুরু করতে পারবেন।
            </div>
            <button
              onClick={() => {
                setWelcomeBonusUser(null);
                setActiveTab('games');
              }}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-gold transition cursor-pointer"
            >
              এখনই গেম খেলুন (৫০ ৳ দিয়ে শুরু) ➔
            </button>
          </div>
        </div>
      )}

      {/* Tournaments Modal */}
      <TournamentsModal
        isOpen={tournamentsModalOpen}
        onClose={() => setTournamentsModalOpen(false)}
        currentUser={currentUser}
        onJoined={refreshUser}
      />

      {/* Disputes & Support Modal */}
      <DisputesModal
        isOpen={disputesModalOpen}
        onClose={() => setDisputesModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}