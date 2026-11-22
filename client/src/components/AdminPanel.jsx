import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  ShieldCheck, DollarSign, Users, Swords, Settings, 
  CheckCircle2, XCircle, ArrowLeft, RefreshCw, AlertTriangle, 
  Search, Check, X, HelpCircle, Trophy, Globe, Bell 
} from 'lucide-react';

export default function AdminPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview' | 'deposits' | 'withdrawals' | 'users' | 'complaints' | 'tournaments' | 'settings' | 'matches'
  const [stats, setStats] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [msg, setMsg] = useState('');

  // New Tournament Form
  const [newTourneyTitle, setNewTourneyTitle] = useState('');
  const [newTourneyGame, setNewTourneyGame] = useState('ludo');
  const [newTourneyFee, setNewTourneyFee] = useState('100');
  const [newTourneyPrize, setNewTourneyPrize] = useState('760');
  const [newTourneyPlayers, setNewTourneyPlayers] = useState('8');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, wRes, uRes, setRes, mRes, cRes, tRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/deposits'),
        apiFetch('/api/admin/withdrawals'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/settings'),
        apiFetch('/api/admin/matches'),
        apiFetch('/api/complaints/all').catch(() => ({ complaints: [] })),
        apiFetch('/api/tournaments').catch(() => ({ tournaments: [] }))
      ]);
      setStats(sRes.stats);
      setDeposits(dRes.deposits || []);
      setWithdrawals(wRes.withdrawals || []);
      setUsers(uRes.users || []);
      setSettings(setRes.settings || {});
      setMatches(mRes.matches || []);
      setComplaints(cRes.complaints || []);
      setTournaments(tRes.tournaments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApproveDeposit = async (id) => {
    try {
      await apiFetch(`/api/admin/deposits/${id}/approve`, { method: 'POST' });
      setMsg('Deposit approved and credited to player wallet!');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectDeposit = async (id) => {
    const reason = prompt("Enter rejection reason:", "Invalid TrxID");
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setMsg('Deposit rejected.');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveWithdrawal = async (id) => {
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
      setMsg('Withdrawal payout completed!');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectWithdrawal = async (id) => {
    const reason = prompt("Enter rejection reason (will refund player):", "Account Invalid");
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setMsg('Withdrawal rejected and refunded to player balance.');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/ban`, { method: 'PUT' });
      setMsg(`User status updated: ${res.isBanned ? 'Suspended' : 'Active'}`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceModalUser || !adjustAmount) return;
    try {
      await apiFetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount: adjustAmount, note: adjustNote })
      });
      setMsg('Player balance adjusted.');
      setBalanceModalUser(null);
      setAdjustAmount('');
      setAdjustNote('');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveComplaint = async (id, action) => {
    const reply = prompt("Enter resolution notes for player:", action === 'resolved' ? "Refund issued after investigation" : "Claim investigated and closed");
    if (!reply) return;
    let refund = 0;
    if (action === 'resolved') {
      const refInput = prompt("Enter refund amount to credit player (0 if no refund):", "0");
      refund = Number(refInput) || 0;
    }

    try {
      await apiFetch(`/api/complaints/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          adminReply: reply,
          refundAmount: refund
        })
      });
      setMsg(`Dispute marked as ${action}!`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/tournaments/create', {
        method: 'POST',
        body: JSON.stringify({
          title: newTourneyTitle,
          gameType: newTourneyGame,
          entryFee: newTourneyFee,
          prizePool: newTourneyPrize,
          maxPlayers: newTourneyPlayers
        })
      });
      setMsg('Championship Tournament created successfully!');
      setNewTourneyTitle('');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setMsg('Platform settings updated successfully.');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.phone.includes(searchUser)
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" /> Super Admin Command Center
            </h1>
            <span className="text-xs text-slate-400">Complete multi-game financial, user & dispute management</span>
          </div>
        </div>

        <button
          onClick={fetchAllData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">5% Platform Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {(stats?.totalCommissionEarned || 0).toFixed(2)} ৳
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">From settled matches</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Wagered</span>
            <Swords className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {(stats?.totalVolumeWagered || 0).toFixed(0)} ৳
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">{stats?.totalMatchesPlayed || 0} matches finished</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Players</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{stats?.totalUsers || 0}</span>
          <span className="text-[10px] text-slate-500 block mt-1">{stats?.activeUsers || 0} active accounts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Pending Cashier</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-400">
              +{stats?.pendingDepositsCount || 0} Dep
            </span>
            <span className="text-sm font-bold text-rose-400">
              -{stats?.pendingWithdrawalsCount || 0} Wd
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">Awaiting verification</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'deposits', label: `Pending Deposits (${deposits.filter(d => d.status === 'pending').length})` },
          { id: 'withdrawals', label: `Pending Withdrawals (${withdrawals.filter(w => w.status === 'pending').length})` },
          { id: 'complaints', label: `Disputes & Tickets (${complaints.filter(c => c.status === 'open').length})` },
          { id: 'tournaments', label: `Tournaments (${tournaments.length})` },
          { id: 'users', label: `User Management (${users.length})` },
          { id: 'settings', label: 'Platform & Website Config' },
          { id: 'matches', label: 'Live Matches' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl whitespace-nowrap transition border ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: COMPLAINTS & DISPUTES */}
      {activeTab === 'complaints' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Player Match Disputes & Complaint Tickets</h2>
          {complaints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No dispute tickets open.</div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{c.subject}</strong>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Player: <strong className="text-amber-400">{c.username}</strong> • Match #{c.matchId || 'N/A'} • {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {c.status === 'open' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResolveComplaint(c.id, 'resolved')}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          Resolve & Refund
                        </button>
                        <button
                          onClick={() => handleResolveComplaint(c.id, 'rejected')}
                          className="px-3 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold rounded-lg text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="p-2.5 bg-slate-900/60 rounded-xl text-slate-300">{c.description}</p>
                  {c.proofUrl && (
                    <a href={c.proofUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline block text-[11px]">
                      View Attached Screenshot Proof ↗
                    </a>
                  )}
                  {c.adminReply && (
                    <div className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl">
                      <strong>Admin Resolution Note:</strong> {c.adminReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Tournament Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-3">Create New Championship</h2>
            <form onSubmit={handleCreateTournament} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friday Night Ludo Cup"
                  value={newTourneyTitle}
                  onChange={(e) => setNewTourneyTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Game</label>
                <select
                  value={newTourneyGame}
                  onChange={(e) => setNewTourneyGame(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="ludo">Ludo Pro</option>
                  <option value="chess">Daba (Chess)</option>
                  <option value="carrom">Carrom Clash</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Entry Fee (BDT)</label>
                  <input
                    type="number"
                    required
                    value={newTourneyFee}
                    onChange={(e) => setNewTourneyFee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Prize Pool (BDT)</label>
                  <input
                    type="number"
                    required
                    value={newTourneyPrize}
                    onChange={(e) => setNewTourneyPrize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Max Players (Bracket Size)</label>
                <select
                  value={newTourneyPlayers}
                  onChange={(e) => setNewTourneyPlayers(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="8">8 Players (Quarter-Finals)</option>
                  <option value="16">16 Players (Round of 16)</option>
                  <option value="32">32 Players (Grand Cup)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl"
              >
                Launch Tournament
              </button>
            </form>
          </div>

          {/* Tournament List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white mb-2">Active Tournament Brackets</h2>
            {tournaments.map(t => (
              <div key={t.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white text-sm block">{t.title}</strong>
                  <span className="text-slate-400">
                    Game: <span className="uppercase text-amber-400 font-bold">{t.gameType}</span> • Fee: {t.entryFee} ৳ • Prize: {t.prizePool} ৳
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">{t.participants?.length || 0} / {t.maxPlayers} Players</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DEPOSITS */}
      {activeTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4">Player Deposit Proofs & Requests</h2>
          {deposits.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No deposit requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Sender Phone</th>
                    <th className="py-3 px-3">TrxID</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deposits.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{d.username}</td>
                      <td className="py-3 px-3 text-amber-400 font-semibold">{d.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono">{d.senderNumber}</td>
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">{d.trxId}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">+{d.amount} ৳</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {d.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveDeposit(d.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(d.id)}
                              className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg font-bold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4">Player Withdrawal Requests</h2>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No withdrawal requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Account Number</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{w.username}</td>
                      <td className="py-3 px-3 text-amber-400 font-semibold">{w.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono">{w.accountNo}</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-400">-{w.amount} ৳</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {w.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Payout
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg font-bold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">Registered Players & Balances</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search username, phone..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Email & Phone</th>
                  <th className="py-3 px-3">Balance</th>
                  <th className="py-3 px-3">Games (Won/Total)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      <img src={u.avatar} alt="av" className="w-6 h-6 rounded-full" />
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {(u.balance || 0).toFixed(2)} ৳
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {u.matchesWon || 0} / {u.matchesPlayed || 0}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isBanned ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setBalanceModalUser(u)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold text-[11px]"
                        >
                          Adjust ৳
                        </button>
                        <button
                          onClick={() => handleToggleBan(u.id)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                            u.isBanned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS & WEBSITE CONFIG */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-white mb-2">Platform, Commission & Website Settings</h2>
          {settings && (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Announcement Banner (সব প্লেয়ারের স্ক্রিনে যা প্রদর্শিত হবে)
                </label>
                <input
                  type="text"
                  value={settings.announcement || ''}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Platform Commission (House Edge %)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                    className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <span className="text-amber-400 font-bold">
                    {(settings.commissionRate * 100).toFixed(0)}% Commission (Default: 5%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Minimum Stake (BDT)</label>
                  <input
                    type="number"
                    value={settings.minStake}
                    onChange={(e) => setSettings({ ...settings, minStake: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Maximum Stake (BDT)</label>
                  <input
                    type="number"
                    value={settings.maxStake}
                    onChange={(e) => setSettings({ ...settings, maxStake: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">bKash Send Money Number</label>
                <input
                  type="text"
                  value={settings.paymentNumbers?.bKash || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentNumbers: { ...settings.paymentNumbers, bKash: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nagad Send Money Number</label>
                <input
                  type="text"
                  value={settings.paymentNumbers?.Nagad || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentNumbers: { ...settings.paymentNumbers, Nagad: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition"
              >
                Save All Settings
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB: MATCHES */}
      {activeTab === 'matches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4">All Matches Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Game</th>
                  <th className="py-3 px-3">Stake</th>
                  <th className="py-3 px-3">Pool</th>
                  <th className="py-3 px-3">5% Fee</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {matches.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{m.roomCode}</td>
                    <td className="py-3 px-3 font-bold uppercase text-white">{m.gameType}</td>
                    <td className="py-3 px-3 font-mono">{m.stake} ৳</td>
                    <td className="py-3 px-3 font-mono">{m.stake * (m.players?.length || 2)} ৳</td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {m.commissionAmount ? `${m.commissionAmount} ৳` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        m.status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Adjust Balance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Player: <strong className="text-white">{balanceModalUser.username}</strong> (Current: {balanceModalUser.balance} ৳)
            </p>
            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (+ to credit, - to debit)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="+100 or -50"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="Dispute refund or promotional bonus"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
