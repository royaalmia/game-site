const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../auth');
const db = require('../db');
const wallet = require('../wallet');
const { v4: uuidv4 } = require('uuid');

// User routes
router.get('/my', authMiddleware, (req, res) => {
  const complaints = db.getComplaints({ userId: req.user.id });
  res.json({ complaints });
});

router.post('/submit', authMiddleware, (req, res) => {
  try {
    const { matchId, subject, description, proofUrl } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }

    const complaint = {
      id: uuidv4(),
      userId: req.user.id,
      username: req.user.username,
      matchId: matchId || null,
      subject: subject.trim(),
      description: description.trim(),
      proofUrl: proofUrl || '',
      status: 'open', // 'open' | 'resolved' | 'rejected'
      adminReply: '',
      createdAt: new Date().toISOString()
    };

    db.createComplaint(complaint);
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin routes
router.get('/all', adminMiddleware, (req, res) => {
  const complaints = db.getComplaints();
  res.json({ complaints });
});

router.post('/:id/resolve', adminMiddleware, async (req, res) => {
  try {
    const { action, adminReply, refundAmount } = req.body; // action: 'resolved' | 'rejected'
    const complaint = db.getComplaints().find(c => c.id === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Ticket not found' });

    if (action === 'resolved' && refundAmount && Number(refundAmount) > 0) {
      const user = db.findUserById(complaint.userId);
      if (user) {
        db.updateUser(user.id, {
          balance: (user.balance || 0) + Number(refundAmount)
        });

        db.createTransaction({
          id: uuidv4(),
          userId: user.id,
          type: 'dispute_refund',
          amount: Number(refundAmount),
          fee: 0,
          status: 'completed',
          matchId: complaint.matchId,
          note: `Refund for Ticket #${complaint.id.slice(0, 6)}: ${adminReply || 'Dispute resolved in favor of player'}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    const updated = db.updateComplaint(complaint.id, {
      status: action,
      adminReply: adminReply || '',
      resolvedAt: new Date().toISOString()
    });

    res.json({ success: true, complaint: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
