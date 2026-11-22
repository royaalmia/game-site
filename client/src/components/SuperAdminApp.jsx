import React, { useState, useEffect } from 'react';
import { apiFetch, setAuthToken } from '../utils/api';
import { 
  ShieldCheck, DollarSign, Users, Swords, Settings, 
  CheckCircle2, XCircle, ArrowLeft, RefreshCw, AlertTriangle, 
  Search, Check, X, HelpCircle, Trophy, Globe, Eye, Lock,
  Plus, Trash2, LogIn, UserPlus
} from 'lucide-react';

const ADMIN_ROLES = [
  'Super Admin',
  'Game Manager',
  'Moderator',
  'Finance Manager',
  'Support Agent'
];

export default function SuperAdminApp({ onBack }) {
  const [currentRole, setCurrentRole] = useState('Super Admin');
  const [activeTab, setActiveTab] = useState('overview');
  // 'overview' | 'deposits' | 'withdrawals' | 'complaints' | 'tournaments' | 'users' | 'fraud' | 'settings' | 'audit'

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
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudReport, setFraudReport] = useState(null);

  // Add User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBalance, setNewBalance] = useState('100');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, wRes, uRes, setRes, mRes, cRes, tRes, aRes, fRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/deposits'),
        apiFetch('/api/admin/withdrawals'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/settings'),
        apiFetch('/api/admin/matches'),
        apiFetch('/api/complaints/all').catch(() => ({ complaints: [] })),
        apiFetch('/api/tournaments').catch(() => ({ tournaments: [] })),
        apiFetch('/api/admin/audit-logs').catch(() => ({ auditLogs: [] })),
        apiFetch('/api/admin/fraud-report').catch(() => ({ fraudReport: null }))
      ]);
      setStats(sRes.stats);
      setDeposits(dRes.deposits || []);
      setWithdrawals(wRes.withdrawals || []);
      setUsers(uRes.users || []);
      setSettings(setRes.settings || {});
      setMatches(mRes.matches || []);
      setComplaints(cRes.complaints || []);
      setTournaments(tRes.tournaments || []);
      setAuditLogs(aRes.auditLogs || []);
      setFraudReport(fRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const addAuditLog = (action, target) => {
    setAuditLogs(prev => [
      { id: Date.now().toString(), action, target, admin: currentRole, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    try {
      await apiFetch('/api/admin/users/create', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          phone: newPhone,
          password: newPassword,
          balance: parseFloat(newBalance) || 0,
          isAdmin: newIsAdmin
        })
      });
      setMsg(`ইউজার ${newUsername} সফলভাবে তৈরি করা হয়েছে!`);
      setShowCreateUserModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewBalance('100');
      setNewIsAdmin(false);
      fetchAllData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${u.username}" অ্যাকাউন্টটি স্থায়ীভাবে ডিলিট করতে চান?`)) {
      return;
    }
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      setMsg(`ইউজার ${u.username} মুছে ফেলা হয়েছে।`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImpersonateUser = async (u) => {
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/impersonate`, { method: 'POST' });
      if (res.token) {
        setAuthToken(res.token);
        localStorage.setItem('ludu_user', JSON.stringify(res.user));
        // Redirect directly to main gaming site
        window.history.pushState({}, '', '/');
        window.location.reload();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveDeposit = async (id, d) => {
    try {
      await apiFetch(`/api/admin/deposits/${id}/approve`, { method: 'POST' });
      setMsg('Deposit approved & balance credited!');
      addAuditLog('Deposit Approved', `${d.username} (+${d.amount} ৳)`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectDeposit = async (id, d) => {
    const reason = prompt("Enter rejection reason:", "Invalid TrxID");
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setMsg('Deposit rejected.');
      addAuditLog('Deposit Rejected', `${d.username} (${reason})`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveWithdrawal = async (id, w) => {
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
      setMsg('Withdrawal payout completed!');
      addAuditLog('Withdrawal Approved', `${w.username} (-${w.amount} ৳)`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectWithdrawal = async (id, w) => {
    const reason = prompt("Enter rejection reason (will refund player):", "Account Invalid");
    if (!reason) return;
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setMsg('Withdrawal rejected & refunded.');
      addAuditLog('Withdrawal Rejected', `${w.username} (${reason})`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveComplaint = async (id, action) => {
    try {
      await apiFetch(`/api/complaints/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action, resolutionNote: `Admin ${action}` })
      });
      setMsg(`Dispute marked as ${action}.`);
      addAuditLog('Dispute Resolved', `#${id.slice(0, 6)} (${action})`);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBan = async (u) => {
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/ban`, { method: 'PUT' });
      setMsg(`User ${u.username} is now ${res.isBanned ? 'banned' : 'unbanned'}.`);
      addAuditLog(res.isBanned ? 'User Banned' : 'User Unbanned', u.username);
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    try {
      await apiFetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount: adjustAmount, note: adjustNote })
      });
      setMsg(`Balance updated for ${balanceModalUser.username}!`);
      addAuditLog('Balance Adjusted', `${balanceModalUser.username} (${adjustAmount} ৳)`);
      setBalanceModalUser(null);
      setAdjustAmount('');
      setAdjustNote('');
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
      setMsg('Platform settings saved successfully.');
      addAuditLog('Settings Updated', 'Commission & Rules');
      fetchAllData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.phone?.includes(searchUser)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Bar with Exit to Main Site button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-purple-500/30 p-4 sm:p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="মূল সাইটে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">মূল গেমিং সাইটে ফিরুন</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Super Admin Console
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Escrow Commission & Multi-Role Operations
            </p>
          </div>
        </div>

        {/* Role Selector & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-none"
          >
            {ADMIN_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <button
            onClick={fetchAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold border-b border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: DollarSign },
          { id: 'deposits', label: `Deposits (${stats?.pendingDepositsCount || 0})`, icon: DollarSign },
          { id: 'withdrawals', label: `Withdrawals (${stats?.pendingWithdrawalsCount || 0})`, icon: DollarSign },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'matches', label: 'Live Matches', icon: Swords },
          { id: 'complaints', label: `Disputes (${complaints.filter(c => c.status === 'pending').length})`, icon: HelpCircle },
          { id: 'tournaments', label: `Tournaments (${tournaments.length})`, icon: Trophy },
          { id: 'fraud', label: 'Fraud Detection', icon: ShieldCheck },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                isSel ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
              <span className="text-xs font-bold text-slate-400 block mb-1">5% Platform Profit</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {stats.totalCommissionEarned.toFixed(2)} ৳
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Wager Volume</span>
              <span className="text-2xl font-black text-white font-mono">
                {stats.totalVolumeWagered.toFixed(2)} ৳
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
              <span className="text-xs font-bold text-slate-400 block mb-1">Registered Players</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{stats.totalUsers}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
              <span className="text-xs font-bold text-slate-400 block mb-1">Completed Matches</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{stats.totalMatchesPlayed}</span>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Live Administrative Audit Trail</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">No recent audit logs recorded.</div>
              ) : (
                auditLogs.map(l => (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-300">{l.action}</span>
                      <span className="text-slate-400 ml-2">{l.target}</span>
                      {l.details && <span className="text-slate-500 block text-[10px]">{l.details}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {l.admin} • {new Date(l.timestamp || l.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE: DEPOSITS */}
      {activeTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4">Player Balance Deposits</h2>
          {deposits.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No deposit records found.</div>
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
                      <td className="py-3 px-3 font-mono">{d.senderNumber || 'N/A'}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{d.trxId}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">+{d.amount} ৳</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.status === 'completed' || d.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {d.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveDeposit(d.id, d)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(d.id, d)}
                              className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
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

      {/* MODULE: WITHDRAWALS */}
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
                          w.status === 'completed' || w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {w.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id, w)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Payout
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id, w)}
                              className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
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

      {/* MODULE: DISPUTES & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Player Disputes & Tickets</h2>
          {complaints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No pending disputes reported.</div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{c.username}</span>
                      <span className="text-slate-400 ml-2">Ticket #{c.id.slice(0, 6)}</span>
                      <span className="text-amber-400 font-bold ml-2">({c.issueType})</span>
                    </div>
                    {c.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveComplaint(c.id, 'refunded')}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Resolve & Refund
                        </button>
                        <button
                          onClick={() => handleResolveComplaint(c.id, 'rejected')}
                          className="px-3 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="p-2.5 bg-slate-900/60 rounded-xl text-slate-300">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODULE: USERS (With Add User, Delete User & Impersonate Login) */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Registered Players & Accounts</h2>
              <span className="text-[11px] text-slate-400">Total Users: {users.length}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search username, phone..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                নতুন ইউজার
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Email & Phone</th>
                  <th className="py-3 px-3">Balance</th>
                  <th className="py-3 px-3">Games</th>
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
                      {u.isAdmin && (
                        <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold">
                          Admin
                        </span>
                      )}
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
                          onClick={() => handleImpersonateUser(u)}
                          title="এই ইউজারে সরাসরি লগইন করুন"
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                        >
                          <LogIn className="w-3.5 h-3.5" /> লগইন
                        </button>
                        <button
                          onClick={() => setBalanceModalUser(u)}
                          title="ব্যালেন্স পরিবর্তন"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                            u.isBanned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="ইউজার ডিলিট করুন"
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODULE: SETTINGS & CMS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl max-w-2xl">
          <h2 className="text-sm font-bold text-white mb-4">Platform Settings & Cashier Numbers</h2>
          {settings && (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Platform Commission Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">e.g. 0.05 = 5% Platform Fee</span>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Turn Time Limit (Seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={settings.turnTimeLimit}
                    onChange={(e) => setSettings({ ...settings, turnTimeLimit: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Announcement Banner (Bangla/English)</label>
                <input
                  type="text"
                  value={settings.announcement || ''}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg transition cursor-pointer"
              >
                Save All Settings
              </button>
            </form>
          )}
        </div>
      )}

      {/* MODULE: FRAUD DETECTION */}
      {activeTab === 'fraud' && fraudReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Automated Anti-Cheat & Multi-Account Scan</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              fraudReport.status === 'CLEAN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {fraudReport.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="font-bold text-white block mb-2">High Win-Streak Anomalies</span>
              {(!fraudReport.highStreakAlerts || fraudReport.highStreakAlerts.length === 0) ? (
                <div className="text-slate-500">No abnormal win rates detected.</div>
              ) : (
                fraudReport.highStreakAlerts.map((a, idx) => (
                  <div key={idx} className="p-2 rounded bg-rose-500/10 text-rose-300 font-mono mb-1">
                    {a.username}: {a.won}/{a.played} matches won
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="font-bold text-white block mb-2">Duplicate Mobile Numbers</span>
              {(!fraudReport.duplicatePhoneAlerts || fraudReport.duplicatePhoneAlerts.length === 0) ? (
                <div className="text-slate-500">No multi-account phone duplicates found.</div>
              ) : (
                fraudReport.duplicatePhoneAlerts.map((d, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-500/10 text-amber-300 font-mono mb-1">
                    {d.phone} shared by {d.users.join(', ')}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Adjust Balance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Player: <strong className="text-white">{balanceModalUser.username}</strong>
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
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" /> নতুন ইউজার তৈরি করুন
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ইউজারনেম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: player10"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ইমেইল:</label>
                <input
                  type="email"
                  required
                  placeholder="player@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">মোবাইল নম্বর (বিকাশ/নগদ):</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">পাসওয়ার্ড:</label>
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">প্রারম্ভিক ব্যালেন্স (৳):</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdminCheckbox"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isAdminCheckbox" className="text-slate-300 cursor-pointer">
                  অ্যাডমিন পারমিশন দিন (Is Admin)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg transition cursor-pointer"
                >
                  {createUserLoading ? 'তৈরি হচ্ছে...' : 'ইউজার তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}