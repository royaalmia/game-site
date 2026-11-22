const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth');
const db = require('../db');

// Global Leaderboard
router.get('/leaderboard', (req, res) => {
  const users = db.getUsers()
    .filter(u => !u.isAdmin && !u.isBanned)
    .map(u => {
      const { passwordHash: _, ...safe } = u;
      const winRate = u.matchesPlayed > 0 
        ? parseFloat(((u.matchesWon || 0) / u.matchesPlayed * 100).toFixed(1))
        : 0;
      return {
        ...safe,
        winRate
      };
    })
    .sort((a, b) => (b.totalWon || 0) - (a.totalWon || 0))
    .slice(0, 30);

  res.json({ leaderboard: users });
});

// Active waiting rooms
router.get('/active-rooms', (req, res) => {
  const matches = db.getMatches({ status: 'waiting' });
  const publicRooms = matches.filter(m => !m.isPrivate);
  res.json({ rooms: publicRooms });
});

// User match history
router.get('/my-history', authMiddleware, (req, res) => {
  const matches = db.getMatches({ userId: req.user.id });
  const completed = matches.filter(m => m.status === 'completed');

  const stats = {
    total: matches.length,
    completed: completed.length,
    won: completed.filter(m => m.winnerUserId === req.user.id).length,
    lost: completed.filter(m => m.winnerUserId && m.winnerUserId !== req.user.id).length,
    byGame: {
      ludo: matches.filter(m => m.gameType === 'ludo').length,
      chess: matches.filter(m => m.gameType === 'chess').length,
      carrom: matches.filter(m => m.gameType === 'carrom').length
    }
  };

  res.json({ stats, matches });
});

// Match details & Replay logs
router.get('/:id', authMiddleware, (req, res) => {
  const match = db.findMatchById(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json({ match });
});

module.exports = router;
