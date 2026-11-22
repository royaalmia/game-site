import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Users, UserPlus, Check, X, Swords, 
  Search, ShieldCheck, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function FriendsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onlineUserIds = [], 
  socket,
  onInviteFriend
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchFriendsAndRequests = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        apiFetch('/api/friends/list'),
        apiFetch('/api/friends/requests')
      ]);
      setFriends(fRes.friends || []);
      setRequests(rRes.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMsg('');
      setError('');
      fetchFriendsAndRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ targetUsername: searchUsername.trim() })
      });
      setMsg(res.message);
      setSearchUsername('');
      fetchFriendsAndRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await apiFetch('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ requestId, action })
      });
      fetchFriendsAndRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Friends & Social Arena</h2>
              <span className="text-xs text-slate-400">
                {friends.length} Friends • {friends.filter(f => onlineUserIds.includes(f.id)).length} Online
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold gap-1">
          <button
            onClick={() => { setActiveTab('list'); setError(''); setMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'list' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Friends ({friends.length})
          </button>
          <button
            onClick={() => { setActiveTab('add'); setError(''); setMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'add' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Add Friend
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setError(''); setMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition relative ${
              activeTab === 'requests' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Requests
            {requests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-4 animate-ping" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {msg && (
            <div className="mb-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
            </div>
          )}
          {error && (
            <div className="mb-3 p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  You don't have any friends added yet. Add friends using their username!
                </div>
              ) : (
                friends.map(friend => {
                  const isOnline = onlineUserIds.includes(friend.id);
                  return (
                    <div 
                      key={friend.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-750 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={friend.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=friend'} 
                            alt="av" 
                            className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900" 
                          />
                          <span 
                            title={isOnline ? 'Online' : 'Offline'}
                            className={`w-3 h-3 rounded-full absolute bottom-0 right-0 border-2 border-slate-950 ${
                              isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">{friend.username}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {friend.matchesWon || 0} Wins • {friend.matchesPlayed || 0} Played
                          </span>
                        </div>
                      </div>

                      {/* Instant Play/Invite Button */}
                      <button
                        onClick={() => onInviteFriend(friend)}
                        disabled={!isOnline}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isOnline 
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md glow-gold cursor-pointer' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Swords className="w-3.5 h-3.5" /> Invite
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ADD FRIEND */}
          {activeTab === 'add' && (
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Enter Friend's Exact Username
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakib75"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg glow-gold transition"
              >
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </form>
          )}

          {/* TAB 3: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-2">
              {requests.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No pending friend requests.
                </div>
              ) : (
                requests.map(req => (
                  <div 
                    key={req.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={req.fromAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=req'} 
                        alt="av" 
                        className="w-9 h-9 rounded-full border border-slate-700 bg-slate-900" 
                      />
                      <div>
                        <span className="font-bold text-xs text-white block">{req.fromUsername}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRespond(req.id, 'accepted')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'rejected')}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
