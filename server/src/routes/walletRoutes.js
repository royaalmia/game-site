const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth');
const wallet = require('../wallet');
const db = require('../db');

router.get('/summary', authMiddleware, (req, res) => {
  const user = db.findUserById(req.user.id);
  const transactions = db.getTransactions({ userId: req.user.id });

  res.json({
    balance: user.balance || 0,
    escrowBalance: user.escrowBalance || 0,
    totalWon: user.totalWon || 0,
    matchesPlayed: user.matchesPlayed || 0,
    matchesWon: user.matchesWon || 0,
    recentTransactions: transactions.slice(0, 20)
  });
});

router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { method, senderNumber, amount, transactionId } = req.body;
    const trx = await wallet.requestDeposit(req.user.id, {
      method,
      senderNumber,
      amount,
      transactionId
    });
    res.json({ success: true, transaction: trx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { method, accountNo, amount } = req.body;
    const trx = await wallet.requestWithdrawal(req.user.id, {
      method,
      accountNo,
      amount
    });
    res.json({ success: true, transaction: trx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/transactions', authMiddleware, (req, res) => {
  const transactions = db.getTransactions({ userId: req.user.id });
  res.json({ transactions });
});

// Claim Real Daily Streak Bonus (+20 BDT)
router.post('/claim-daily', authMiddleware, (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const todayStr = new Date().toISOString().split('T')[0];
    if (user.lastDailyBonusDate === todayStr) {
      return res.status(400).json({ error: 'Daily bonus already claimed for today! Come back tomorrow.' });
    }

    const updated = db.updateUser(user.id, {
      balance: (user.balance || 0) + 20.0,
      lastDailyBonusDate: todayStr
    });

    db.createTransaction({
      id: require('uuid').v4(),
      userId: user.id,
      type: 'daily_bonus',
      amount: 20.0,
      fee: 0,
      status: 'completed',
      note: 'Daily Streak Login Bonus (+20 BDT)',
      createdAt: new Date().toISOString()
    });

    const { passwordHash: _, ...safe } = updated;
    res.json({ success: true, user: safe, amount: 20.0 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
