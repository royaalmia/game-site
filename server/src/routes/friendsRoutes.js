const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);

// Get user friends list
router.get('/list', (req, res) => {
  const friends = db.getUserFriends(req.user.id);
  res.json({ friends });
});

// Get pending friend requests
router.get('/requests', (req, res) => {
  const pending = db.getFriendRequests(req.user.id);
  const enriched = pending.map(r => {
    const fromUser = db.findUserById(r.fromUserId);
    return {
      ...r,
      fromUsername: fromUser ? fromUser.username : 'Unknown',
      fromAvatar: fromUser ? fromUser.avatar : ''
    };
  });
  res.json({ requests: enriched });
});

// Send friend request by username
router.post('/request', (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });

    const targetUser = db.getUsers().find(
      u => u.username.toLowerCase() === targetUsername.trim().toLowerCase()
    );

    if (!targetUser) return res.status(404).json({ error: 'Player not found' });
    if (targetUser.id === req.user.id) return res.status(400).json({ error: 'You cannot add yourself' });

    // Check if already friends
    const friends = db.getUserFriends(req.user.id);
    if (friends.some(f => f.id === targetUser.id)) {
      return res.status(400).json({ error: 'You are already friends' });
    }

    // Check if pending request exists
    const existingReq = db.getFriendRequests(targetUser.id).find(r => r.fromUserId === req.user.id);
    if (existingReq) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    const newReq = {
      id: uuidv4(),
      fromUserId: req.user.id,
      toUserId: targetUser.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.createFriendRequest(newReq);
    res.json({ success: true, message: `Friend request sent to ${targetUser.username}!` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Accept or Reject friend request
router.post('/respond', (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accepted' | 'rejected'
    if (!requestId || !action) return res.status(400).json({ error: 'Missing parameters' });

    const updated = db.updateFriendRequest(requestId, action);
    res.json({ success: true, status: action });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
