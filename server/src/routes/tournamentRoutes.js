const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../auth');
const db = require('../db');
const wallet = require('../wallet');
const { v4: uuidv4 } = require('uuid');

// Get all tournaments
router.get('/', (req, res) => {
  const tournaments = db.getTournaments();
  res.json({ tournaments });
});

// Join tournament
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const tournament = db.getTournaments().find(t => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.status !== 'upcoming') return res.status(400).json({ error: 'Tournament registration is closed' });

    if (tournament.participants.some(p => p.userId === req.user.id)) {
      return res.status(400).json({ error: 'You are already registered for this tournament' });
    }

    if (tournament.participants.length >= tournament.maxPlayers) {
      return res.status(400).json({ error: 'Tournament bracket is full' });
    }

    const user = db.findUserById(req.user.id);
    if (user.balance < tournament.entryFee) {
      return res.status(400).json({ error: `Insufficient balance. Entry fee is ${tournament.entryFee} BDT.` });
    }

    // Deduct entry fee
    db.updateUser(user.id, {
      balance: user.balance - tournament.entryFee
    });

    db.createTransaction({
      id: uuidv4(),
      userId: user.id,
      type: 'tournament_entry',
      amount: -tournament.entryFee,
      fee: 0,
      status: 'completed',
      note: `Entry fee for tournament: ${tournament.title}`,
      createdAt: new Date().toISOString()
    });

    tournament.participants.push({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      joinedAt: new Date().toISOString()
    });

    // Check if tournament is now full -> status becomes active
    if (tournament.participants.length === tournament.maxPlayers) {
      tournament.status = 'active';
    }

    db.updateTournament(tournament.id, {
      participants: tournament.participants,
      status: tournament.status
    });

    res.json({ success: true, tournament });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Create tournament
router.post('/create', adminMiddleware, (req, res) => {
  try {
    const { title, gameType, entryFee, prizePool, maxPlayers, startTime } = req.body;
    if (!title || !entryFee || !prizePool) {
      return res.status(400).json({ error: 'Missing required tournament parameters.' });
    }

    const tournament = {
      id: uuidv4(),
      title: title.trim(),
      gameType: gameType || 'ludo',
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      maxPlayers: Number(maxPlayers) || 8,
      participants: [],
      status: 'upcoming',
      startTime: startTime || new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    db.createTournament(tournament);
    res.json({ success: true, tournament });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
