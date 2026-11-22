const express = require('express');
const router = express.Router();
const { adminMiddleware, generateToken } = require('../auth');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const wallet = require('../wallet');
const db = require('../db');

router.use(adminMiddleware);

// Admin Dashboard KPI Stats
router.get('/stats', (req, res) => {
  const users = db.getUsers();
  const transactions = db.getTransactions();
  const matches = db.getMatches();

  // Commission earned by platform (5%)
  const commissionTrxs = transactions.filter(t => t.type === 'platform_commission');
  const totalCommissionEarned = commissionTrxs.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Total volume wagered
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalVolumeWagered = completedMatches.reduce((sum, m) => sum + (m.stake * (m.players ? m.players.length : 2)), 0);

  // Pending deposits & withdrawals
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.isBanned).length,
    totalCommissionEarned: parseFloat(totalCommissionEarned.toFixed(2)),
    totalVolumeWagered: parseFloat(totalVolumeWagered.toFixed(2)),
    totalMatchesPlayed: completedMatches.length,
    activeMatchesCount: matches.filter(m => m.status === 'in_progress').length,
    pendingDepositsCount: pendingDeposits.length,
    pendingWithdrawalsCount: pendingWithdrawals.length,
    settings: db.getSettings()
  };

  res.json({ stats });
});

// Get users list
router.get('/users', (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  res.json({ users });
});

// Create new user directly from Admin Panel
router.post('/users/create', async (req, res) => {
  try {
    const { username, email, phone, password, balance, isAdmin } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const initialBal = parseFloat(balance) || 0;

    const newUser = {
      id: uuidv4(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      balance: initialBal,
      escrowBalance: 0,
      totalWon: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      referralCode: username.toUpperCase().slice(0, 4) + Math.floor(1000 + Math.random() * 9000),
      referredBy: null,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      isAdmin: !!isAdmin,
      isBanned: false,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);

    if (initialBal > 0) {
      db.createTransaction({
        id: uuidv4(),
        userId: newUser.id,
        type: 'admin_adjustment',
        amount: initialBal,
        fee: 0,
        status: 'completed',
        note: 'Admin initial user funding',
        createdAt: new Date().toISOString()
      });
    }

    db.createAuditLog({
      action: 'User Created',
      target: newUser.username,
      admin: req.user.username,
      details: `Created with initial balance: ${initialBal} ৳`
    });

    const { passwordHash: _, ...safe } = newUser;
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user permanently
router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own active admin account.' });
    }

    const targetUser = db.findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const deleted = db.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User could not be deleted.' });
    }

    db.createAuditLog({
      action: 'User Deleted',
      target: targetUser.username,
      admin: req.user.username,
      details: `User ID: ${userId} (${targetUser.email}) permanently removed.`
    });

    res.json({ success: true, message: `User ${targetUser.username} deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin impersonate / direct login as user
router.post('/users/:id/impersonate', (req, res) => {
  try {
    const targetUser = db.findUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    const token = generateToken(targetUser);
    const { passwordHash: _, ...safe } = targetUser;

    db.createAuditLog({
      action: 'Admin Impersonation',
      target: targetUser.username,
      admin: req.user.username,
      details: `Admin logged into session of ${targetUser.username}`
    });

    res.json({ success: true, token, user: safe });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user balance directly (e.g. dispute resolution or manual bonus)
router.put('/users/:id/balance', (req, res) => {
  try {
    const { amount, note } = req.body;
    const user = db.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = db.updateUser(user.id, {
      balance: Math.max(0, (user.balance || 0) + parseFloat(amount))
    });

    db.createTransaction({
      id: require('uuid').v4(),
      userId: user.id,
      type: 'admin_adjustment',
      amount: parseFloat(amount),
      fee: 0,
      status: 'completed',
      note: note || 'Admin manual balance adjustment',
      createdAt: new Date().toISOString()
    });

    db.createAuditLog({
      action: 'Balance Adjusted',
      target: `${user.username} (${amount > 0 ? '+' : ''}${amount} ৳)`,
      admin: req.user.username,
      details: note || 'Manual balance adjustment'
    });

    const { passwordHash: _, ...safe } = updated;
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ban / Unban user
router.put('/users/:id/ban', (req, res) => {
  try {
    const user = db.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = db.updateUser(user.id, {
      isBanned: !user.isBanned
    });

    db.createAuditLog({
      action: updated.isBanned ? 'Player Banned' : 'Player Unbanned',
      target: user.username,
      admin: req.user.username,
      details: `User ID: ${user.id}`
    });

    res.json({ success: true, isBanned: updated.isBanned });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Deposits management
router.get('/deposits', (req, res) => {
  const deposits = db.getTransactions({ type: 'deposit' });
  const enriched = deposits.map(d => {
    const user = db.findUserById(d.userId);
    return { ...d, username: user ? user.username : 'Unknown' };
  });
  res.json({ deposits: enriched });
});

router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const result = await wallet.approveDeposit(req.params.id);
    db.createAuditLog({
      action: 'Deposit Approved',
      target: `${result.user?.username} (+${result.trx?.amount} ৳)`,
      admin: req.user.username,
      details: `TrxID: ${result.trx?.trxId}`
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await wallet.rejectDeposit(req.params.id, reason);
    db.createAuditLog({
      action: 'Deposit Rejected',
      target: `Deposit #${req.params.id.slice(0, 6)}`,
      admin: req.user.username,
      details: reason || 'Invalid proof'
    });
    res.json({ success: true, transaction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Withdrawals management
router.get('/withdrawals', (req, res) => {
  const withdrawals = db.getTransactions({ type: 'withdraw' });
  const enriched = withdrawals.map(w => {
    const user = db.findUserById(w.userId);
    return { ...w, username: user ? user.username : 'Unknown' };
  });
  res.json({ withdrawals: enriched });
});

router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    const result = await wallet.approveWithdrawal(req.params.id);
    db.createAuditLog({
      action: 'Withdrawal Approved',
      target: `Withdrawal #${req.params.id.slice(0, 6)} (-${result.amount} ৳)`,
      admin: req.user.username,
      details: `Account: ${result.accountNo}`
    });
    res.json({ success: true, transaction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await wallet.rejectWithdrawal(req.params.id, reason);
    db.createAuditLog({
      action: 'Withdrawal Rejected',
      target: `Withdrawal #${req.params.id.slice(0, 6)}`,
      admin: req.user.username,
      details: reason || 'Rejected & refunded'
    });
    res.json({ success: true, transaction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Platform Settings & Game Toggles
router.get('/settings', (req, res) => {
  res.json({ settings: db.getSettings() });
});

router.put('/settings', (req, res) => {
  try {
    const { commissionRate, minStake, maxStake, turnTimeLimit, gamesEnabled, announcement, paymentNumbers } = req.body;
    const updates = {};
    if (commissionRate !== undefined) updates.commissionRate = parseFloat(commissionRate);
    if (minStake !== undefined) updates.minStake = parseFloat(minStake);
    if (maxStake !== undefined) updates.maxStake = parseFloat(maxStake);
    if (turnTimeLimit !== undefined) updates.turnTimeLimit = parseInt(turnTimeLimit);
    if (gamesEnabled !== undefined) updates.gamesEnabled = gamesEnabled;
    if (announcement !== undefined) updates.announcement = announcement;
    if (paymentNumbers !== undefined) updates.paymentNumbers = paymentNumbers;

    const updated = db.updateSettings(updates);
    db.createAuditLog({
      action: 'Settings Updated',
      target: 'Platform Settings & Commission',
      admin: req.user.username,
      details: `Commission: ${(updated.commissionRate * 100).toFixed(0)}%`
    });

    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Real Audit Logs
router.get('/audit-logs', (req, res) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

// Real Fraud Report
router.get('/fraud-report', (req, res) => {
  const users = db.getUsers();
  const matches = db.getMatches({ status: 'completed' });
  const transactions = db.getTransactions();

  // Check for suspicious win streaks (> 8 consecutive wins)
  const highStreakUsers = users.filter(u => (u.matchesWon || 0) >= 8 && ((u.matchesWon / (u.matchesPlayed || 1)) > 0.85));

  // Check for duplicate phones
  const phoneMap = {};
  const duplicatePhones = [];
  users.forEach(u => {
    if (u.phone) {
      if (phoneMap[u.phone]) {
        duplicatePhones.push({ phone: u.phone, users: [phoneMap[u.phone], u.username] });
      } else {
        phoneMap[u.phone] = u.username;
      }
    }
  });

  res.json({
    highStreakAlerts: highStreakUsers.map(u => ({ username: u.username, won: u.matchesWon, played: u.matchesPlayed })),
    duplicatePhoneAlerts: duplicatePhones,
    status: highStreakUsers.length === 0 && duplicatePhones.length === 0 ? 'CLEAN' : 'FLAGGED'
  });
});

// Live & Past Matches
router.get('/matches', (req, res) => {
  const matches = db.getMatches();
  res.json({ matches });
});

module.exports = router;
