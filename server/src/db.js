const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'database.json');

const defaultData = {
  users: [],
  transactions: [],
  matches: [],
  friend_requests: [],
  friendships: [],
  notifications: [],
  complaints: [],
  tournaments: [],
  audit_logs: [],
  system_logs: [],
  game_settings: {
    commissionRate: 0.05, // 5%
    minStake: 20,
    maxStake: 10000,
    turnTimeLimit: 20,
    maintenanceMode: false,
    announcement: '🔥 স্বাগতম লুডু স্টার প্রো-তে! বন্ধুদের ইনভাইট করলেই পাচ্ছেন ১০৳ বোনাস!',
    supportPhone: '01700-000000',
    paymentNumbers: {
      bKash: '01711-000000 (Personal Send Money)',
      Nagad: '01811-000000 (Personal Send Money)',
      Rocket: '01911-000000 (Personal Send Money)'
    },
    gamesEnabled: {
      ludo: true,
      chess: true,
      carrom: true
    }
  }
};

class Database {
  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  ensureDataDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  load() {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...defaultData, ...parsed };
    } catch (err) {
      console.error('Error reading database, creating fresh one:', err);
      return { ...defaultData };
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error writing database:', err);
    }
  }

  // --- Users ---
  getUsers() {
    this.data = this.load();
    return this.data.users;
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByPhone(phone) {
    return this.data.users.find(u => u.phone === phone);
  }

  findUserByReferralCode(code) {
    return this.data.users.find(u => u.referralCode && u.referralCode.toUpperCase() === code.toUpperCase());
  }

  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  deleteUser(id) {
    this.data = this.load();
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const deleted = this.data.users.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  // --- Transactions ---
  getTransactions(filter = {}) {
    this.data = this.load();
    let list = this.data.transactions;
    if (filter.userId) {
      list = list.filter(t => t.userId === filter.userId);
    }
    if (filter.type) {
      list = list.filter(t => t.type === filter.type);
    }
    if (filter.status) {
      list = list.filter(t => t.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createTransaction(trx) {
    this.data.transactions.push(trx);
    this.save();
    return trx;
  }

  updateTransaction(id, updates) {
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.transactions[idx];
    }
    return null;
  }

  // --- Matches ---
  getMatches(filter = {}) {
    this.data = this.load();
    let list = this.data.matches;
    if (filter.userId) {
      list = list.filter(m => m.players && m.players.some(p => p.userId === filter.userId));
    }
    if (filter.gameType) {
      list = list.filter(m => m.gameType === filter.gameType);
    }
    if (filter.status) {
      list = list.filter(m => m.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt));
  }

  findMatchById(id) {
    return this.data.matches.find(m => m.id === id);
  }

  findMatchByRoomCode(code) {
    return this.data.matches.find(m => m.roomCode === code && m.status !== 'completed' && m.status !== 'cancelled');
  }

  createMatch(match) {
    this.data.matches.push(match);
    this.save();
    return match;
  }

  updateMatch(id, updates) {
    const idx = this.data.matches.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.matches[idx] = { ...this.data.matches[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.matches[idx];
    }
    return null;
  }

  // --- Friends System ---
  getFriendRequests(userId) {
    return this.data.friend_requests.filter(r => r.toUserId === userId && r.status === 'pending');
  }

  createFriendRequest(req) {
    this.data.friend_requests.push(req);
    this.save();
    return req;
  }

  updateFriendRequest(id, status) {
    const req = this.data.friend_requests.find(r => r.id === id);
    if (req) {
      req.status = status;
      req.updatedAt = new Date().toISOString();
      if (status === 'accepted') {
        this.data.friendships.push({
          id: `${req.fromUserId}_${req.toUserId}`,
          user1: req.fromUserId,
          user2: req.toUserId,
          createdAt: new Date().toISOString()
        });
      }
      this.save();
    }
    return req;
  }

  getUserFriends(userId) {
    const friendships = this.data.friendships.filter(f => f.user1 === userId || f.user2 === userId);
    const friendIds = friendships.map(f => f.user1 === userId ? f.user2 : f.user1);
    return this.data.users
      .filter(u => friendIds.includes(u.id))
      .map(u => {
        const { passwordHash: _, ...safe } = u;
        return safe;
      });
  }

  // --- Notifications ---
  getNotifications(userId) {
    return (this.data.notifications || [])
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
  }

  createNotification(notif) {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.push(notif);
    this.save();
    return notif;
  }

  markNotificationsRead(userId) {
    if (!this.data.notifications) return;
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.save();
  }

  // --- Complaints / Disputes ---
  getComplaints(filter = {}) {
    this.data = this.load();
    let list = this.data.complaints || [];
    if (filter.userId) list = list.filter(c => c.userId === filter.userId);
    if (filter.status) list = list.filter(c => c.status === filter.status);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createComplaint(complaint) {
    this.data = this.load();
    if (!this.data.complaints) this.data.complaints = [];
    this.data.complaints.push(complaint);
    this.save();
    return complaint;
  }

  updateComplaint(id, updates) {
    this.data = this.load();
    if (!this.data.complaints) return null;
    const idx = this.data.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.complaints[idx] = { ...this.data.complaints[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.complaints[idx];
    }
    return null;
  }

  // --- Tournaments ---
  getTournaments() {
    this.data = this.load();
    return this.data.tournaments || [];
  }

  createTournament(t) {
    if (!this.data.tournaments) this.data.tournaments = [];
    this.data.tournaments.push(t);
    this.save();
    return t;
  }

  updateTournament(id, updates) {
    if (!this.data.tournaments) return null;
    const idx = this.data.tournaments.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tournaments[idx] = { ...this.data.tournaments[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.tournaments[idx];
    }
    return null;
  }

  // --- Audit Logs ---
  getAuditLogs() {
    this.data = this.load();
    return (this.data.audit_logs || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
  }

  createAuditLog({ action, target, admin, details }) {
    this.data = this.load();
    if (!this.data.audit_logs) this.data.audit_logs = [];
    const log = {
      id: require('uuid').v4(),
      action,
      target,
      admin: admin || 'Admin',
      details: details || '',
      createdAt: new Date().toISOString()
    };
    this.data.audit_logs.push(log);
    this.save();
    return log;
  }

  // --- Settings ---
  getSettings() {
    return this.data.game_settings;
  }

  updateSettings(updates) {
    this.data.game_settings = { ...this.data.game_settings, ...updates };
    this.save();
    return this.data.game_settings;
  }
}

const db = new Database();
module.exports = db;
