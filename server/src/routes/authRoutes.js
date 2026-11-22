const express = require('express');
const router = express.Router();
const authService = require('../auth');
const db = require('../db');

router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, referredBy } = req.body;
    const result = await authService.register({ username, email, phone, password, referredBy });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const emailOrUsername = req.body.emailOrUsername || req.body.login || req.body.email || req.body.username;
    const { password } = req.body;
    const result = await authService.login({ emailOrUsername, password });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authService.authMiddleware, (req, res) => {
  const user = db.findUserById(req.user.id);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.put('/profile', authService.authMiddleware, (req, res) => {
  try {
    const { phone, avatar } = req.body;
    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = db.updateUser(req.user.id, updates);
    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
