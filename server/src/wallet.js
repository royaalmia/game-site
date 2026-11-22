const { v4: uuidv4 } = require('uuid');
const db = require('./db');

class WalletService {
  /**
   * Request a balance deposit (bKash, Nagad, Rocket, Bank)
   */
  async requestDeposit(userId, { method, senderNumber, amount, transactionId }) {
    amount = parseFloat(amount);
    if (!amount || amount <= 0) {
      throw new Error('Valid deposit amount is required.');
    }
    if (!method || !transactionId) {
      throw new Error('Payment method and Transaction ID are required.');
    }

    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found.');

    const settings = db.getSettings();
    // In live gaming mode, auto-approve real instant recharge or admin approval
    const isAutoApprove = settings.autoApproveDeposits !== false;

    const trx = {
      id: uuidv4(),
      userId,
      type: 'deposit',
      amount,
      fee: 0,
      status: isAutoApprove ? 'approved' : 'pending',
      paymentMethod: method,
      senderNumber: senderNumber || '',
      trxId: transactionId.trim().toUpperCase(),
      note: `Deposit via ${method} (${transactionId.trim().toUpperCase()})`,
      createdAt: new Date().toISOString(),
      ...(isAutoApprove ? { approvedAt: new Date().toISOString() } : {})
    };

    db.createTransaction(trx);

    if (isAutoApprove) {
      db.updateUser(userId, {
        balance: (user.balance || 0) + amount
      });
    }

    return trx;
  }

  /**
   * Admin approves a deposit request
   */
  async approveDeposit(transactionId) {
    const trx = db.getTransactions().find(t => t.id === transactionId);
    if (!trx) throw new Error('Transaction not found.');
    if (trx.type !== 'deposit' || trx.status !== 'pending') {
      throw new Error('Transaction cannot be approved in its current state.');
    }

    const user = db.findUserById(trx.userId);
    if (!user) throw new Error('User associated with this transaction does not exist.');

    // Update transaction
    db.updateTransaction(trx.id, { status: 'approved', approvedAt: new Date().toISOString() });

    // Credit user balance
    const updatedUser = db.updateUser(user.id, {
      balance: (user.balance || 0) + trx.amount
    });

    return { trx, user: updatedUser };
  }

  /**
   * Admin rejects a deposit request
   */
  async rejectDeposit(transactionId, reason = 'Invalid transaction proof') {
    const trx = db.getTransactions().find(t => t.id === transactionId);
    if (!trx) throw new Error('Transaction not found.');
    if (trx.type !== 'deposit' || trx.status !== 'pending') {
      throw new Error('Transaction cannot be rejected in its current state.');
    }

    db.updateTransaction(trx.id, {
      status: 'rejected',
      note: `${trx.note} | Rejected: ${reason}`,
      rejectedAt: new Date().toISOString()
    });

    return trx;
  }

  /**
   * User requests a withdrawal
   */
  async requestWithdrawal(userId, { method, accountNo, amount }) {
    amount = parseFloat(amount);
    if (!amount || amount <= 0) {
      throw new Error('Valid withdrawal amount is required.');
    }

    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found.');

    if (user.balance < amount) {
      throw new Error('Insufficient balance in wallet.');
    }

    // Deduct from available balance immediately and place in escrow/hold
    db.updateUser(user.id, {
      balance: user.balance - amount
    });

    const trx = {
      id: uuidv4(),
      userId,
      type: 'withdraw',
      amount,
      fee: 0,
      status: 'pending',
      paymentMethod: method,
      accountNo: accountNo.trim(),
      note: `Withdrawal to ${method} (${accountNo})`,
      createdAt: new Date().toISOString()
    };

    db.createTransaction(trx);
    return trx;
  }

  /**
   * Admin approves a withdrawal
   */
  async approveWithdrawal(transactionId) {
    const trx = db.getTransactions().find(t => t.id === transactionId);
    if (!trx) throw new Error('Transaction not found.');
    if (trx.type !== 'withdraw' || trx.status !== 'pending') {
      throw new Error('Withdrawal cannot be approved in its current state.');
    }

    db.updateTransaction(trx.id, { status: 'completed', completedAt: new Date().toISOString() });
    return trx;
  }

  /**
   * Admin rejects a withdrawal (refunds balance back to user)
   */
  async rejectWithdrawal(transactionId, reason = 'Invalid account or failed transfer') {
    const trx = db.getTransactions().find(t => t.id === transactionId);
    if (!trx) throw new Error('Transaction not found.');
    if (trx.type !== 'withdraw' || trx.status !== 'pending') {
      throw new Error('Withdrawal cannot be rejected in its current state.');
    }

    const user = db.findUserById(trx.userId);
    if (user) {
      db.updateUser(user.id, { balance: user.balance + trx.amount });
    }

    db.updateTransaction(trx.id, {
      status: 'rejected',
      note: `${trx.note} | Refunded: ${reason}`,
      rejectedAt: new Date().toISOString()
    });

    return trx;
  }

  /**
   * Lock player's stake into Escrow for a Match
   */
  async lockStake(userId, stake, matchId) {
    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found.');
    if (user.balance < stake) {
      throw new Error(`Insufficient balance! Match stake is ${stake} BDT, your balance is ${user.balance.toFixed(2)} BDT.`);
    }

    db.updateUser(user.id, {
      balance: user.balance - stake,
      escrowBalance: (user.escrowBalance || 0) + stake
    });

    db.createTransaction({
      id: uuidv4(),
      userId,
      type: 'match_entry',
      amount: -stake,
      fee: 0,
      status: 'completed',
      matchId,
      note: `Entry fee locked for Match #${matchId.slice(0, 8)}`,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Release Escrow and Distribute Payout to Winner with 5% Commission
   */
  async settleMatchPayout(matchId, winnerUserId, winningTeamUsers = null) {
    const match = db.findMatchById(matchId);
    if (!match) throw new Error('Match not found.');
    if (match.status === 'completed') {
      return match; // already settled
    }

    const settings = db.getSettings();
    const commissionRate = settings.commissionRate || 0.05; // 5% default

    const totalPool = match.stake * match.players.length;
    const commissionAmount = parseFloat((totalPool * commissionRate).toFixed(2));
    const winnerPayout = parseFloat((totalPool - commissionAmount).toFixed(2));

    // Release escrow for all participating players
    for (const player of match.players) {
      const u = db.findUserById(player.userId);
      if (u) {
        const newEscrow = Math.max(0, (u.escrowBalance || 0) - match.stake);
        const matchesPlayed = (u.matchesPlayed || 0) + 1;
        db.updateUser(u.id, { escrowBalance: newEscrow, matchesPlayed });
      }
    }

    // Payout winner(s)
    const winners = winningTeamUsers || (winnerUserId ? [winnerUserId] : []);
    if (winners.length > 0) {
      const perWinnerPayout = parseFloat((winnerPayout / winners.length).toFixed(2));
      for (const wId of winners) {
        const winner = db.findUserById(wId);
        if (winner) {
          const newBal = (winner.balance || 0) + perWinnerPayout;
          const totalWon = (winner.totalWon || 0) + (perWinnerPayout - match.stake);
          const matchesWon = (winner.matchesWon || 0) + 1;
          db.updateUser(winner.id, {
            balance: newBal,
            totalWon,
            matchesWon
          });

          db.createTransaction({
            id: uuidv4(),
            userId: winner.id,
            type: 'match_win',
            amount: perWinnerPayout,
            fee: commissionAmount / winners.length,
            status: 'completed',
            matchId,
            note: `Winner Payout for Match #${matchId.slice(0, 8)} (${(commissionRate * 100).toFixed(0)}% fee deducted)`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Record Platform Commission
    db.createTransaction({
      id: uuidv4(),
      userId: 'platform',
      type: 'platform_commission',
      amount: commissionAmount,
      fee: 0,
      status: 'completed',
      matchId,
      note: `Platform 5% Commission on Match #${matchId.slice(0, 8)}`,
      createdAt: new Date().toISOString()
    });

    // Update Match record
    const updatedMatch = db.updateMatch(matchId, {
      status: 'completed',
      winnerUserId: winnerUserId || null,
      winnerPayout,
      commissionAmount,
      endedAt: new Date().toISOString()
    });

    return updatedMatch;
  }

  /**
   * Cancel match and refund all players' escrowed stakes
   */
  async refundMatch(matchId, reason = 'Match cancelled') {
    const match = db.findMatchById(matchId);
    if (!match) throw new Error('Match not found.');
    if (match.status === 'completed' || match.status === 'cancelled') {
      return match;
    }

    for (const player of match.players) {
      const u = db.findUserById(player.userId);
      if (u) {
        const newEscrow = Math.max(0, (u.escrowBalance || 0) - match.stake);
        const newBal = (u.balance || 0) + match.stake;
        db.updateUser(u.id, { balance: newBal, escrowBalance: newEscrow });

        db.createTransaction({
          id: uuidv4(),
          userId: u.id,
          type: 'match_refund',
          amount: match.stake,
          fee: 0,
          status: 'completed',
          matchId,
          note: `Refund for Match #${matchId.slice(0, 8)}: ${reason}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    return db.updateMatch(matchId, {
      status: 'cancelled',
      note: reason,
      endedAt: new Date().toISOString()
    });
  }
}

module.exports = new WalletService();
