/**
 * Carrom Board Game Engine for 1v1 Matches
 * Board: 600x600 coordinate system with 4 corner pockets
 * Coins: 9 White (10 pts), 9 Black (10 pts), 1 Red Queen (25 pts)
 */

class CarromEngine {
  constructor(playerList) {
    this.players = [
      {
        userId: playerList[0].userId,
        username: playerList[0].username,
        avatar: playerList[0].avatar,
        side: 'white', // pockets white coins
        score: 0,
        pocketedCount: 0,
        skipCount: 0
      },
      {
        userId: playerList[1].userId,
        username: playerList[1].username,
        avatar: playerList[1].avatar,
        side: 'black', // pockets black coins
        score: 0,
        pocketedCount: 0,
        skipCount: 0
      }
    ];

    this.currentTurnIndex = 0;
    this.winner = null;
    this.logs = [];
    this.turnDeadline = Date.now() + 25000;
    this.queenCoverPending = false;
    this.queenCoverPlayer = null;

    // Coins on board
    this.coins = this.initCoins();
  }

  initCoins() {
    // Generate initial cluster in center (300, 300)
    const list = [];
    // Red Queen at exact center
    list.push({ id: 'queen', type: 'queen', x: 300, y: 300, radius: 14, pocketed: false });

    // Inner circle: 6 alternating white/black coins
    const r1 = 28;
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      list.push({
        id: `coin_${i}`,
        type: i % 2 === 0 ? 'white' : 'black',
        x: 300 + Math.cos(angle) * r1,
        y: 300 + Math.sin(angle) * r1,
        radius: 14,
        pocketed: false
      });
    }

    // Outer circle: 12 alternating coins
    const r2 = 56;
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 + 15) * Math.PI / 180;
      list.push({
        id: `coin_outer_${i}`,
        type: i % 2 === 0 ? 'black' : 'white',
        x: 300 + Math.cos(angle) * r2,
        y: 300 + Math.sin(angle) * r2,
        radius: 14,
        pocketed: false
      });
    }

    return list;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  /**
   * Strike action with angle (degrees) and power (1-100), strikerX position on baseline
   */
  strike(userId, { strikerX, angle, power }) {
    const player = this.getCurrentPlayer();
    if (player.userId !== userId) {
      throw new Error("It's not your turn!");
    }

    strikerX = Math.max(150, Math.min(450, strikerX || 300));
    power = Math.max(10, Math.min(100, power || 50));
    const rad = (angle * Math.PI) / 180;

    // Simulate carrom physics vector towards coins
    // Check which coin is nearest to trajectory
    const strikerY = player.side === 'white' ? 520 : 80;
    const dirX = Math.cos(rad);
    const dirY = player.side === 'white' ? -Math.sin(rad) : Math.sin(rad);

    let pocketedThisTurn = [];
    let extraTurn = false;

    // Find coins in line of sight / hit
    const unpocketed = this.coins.filter(c => !c.pocketed);
    for (const coin of unpocketed) {
      const dx = coin.x - strikerX;
      const dy = coin.y - strikerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Simple probabilistic pocket calculation based on aim and proximity to corner pockets
      // Corner pockets: (45, 45), (555, 45), (45, 555), (555, 555)
      const dot = (dx * dirX + dy * dirY) / (dist || 1);
      if (dot > 0.85 && Math.random() < (power / 120)) {
        // Coin gets pocketed!
        coin.pocketed = true;
        pocketedThisTurn.push(coin);
      }
    }

    if (pocketedThisTurn.length > 0) {
      for (const pCoin of pocketedThisTurn) {
        if (pCoin.type === player.side) {
          player.score += 10;
          player.pocketedCount += 1;
          extraTurn = true;
          this.logs.unshift({
            text: `🎯 ${player.username} pocketed a ${player.side.toUpperCase()} coin! (+10 pts)`,
            time: new Date().toLocaleTimeString()
          });
        } else if (pCoin.type === 'queen') {
          player.score += 25;
          extraTurn = true;
          this.logs.unshift({
            text: `👑 ${player.username} pocketed the QUEEN! (+25 pts)`,
            time: new Date().toLocaleTimeString()
          });
        } else {
          // Pocketed opponent coin
          const opp = this.players.find(p => p.userId !== player.userId);
          opp.score += 10;
          opp.pocketedCount += 1;
          this.logs.unshift({
            text: `⚠️ ${player.username} accidentally pocketed ${opp.username}'s coin!`,
            time: new Date().toLocaleTimeString()
          });
        }
      }
    } else {
      this.logs.unshift({
        text: `${player.username} struck at power ${power}% but pocketed no coins.`,
        time: new Date().toLocaleTimeString()
      });
    }

    // Check Win Condition (All player coins pocketed or score >= 50)
    const playerCoinsRemaining = this.coins.filter(c => !c.pocketed && c.type === player.side).length;
    if (playerCoinsRemaining === 0 || player.score >= 50) {
      this.winner = {
        userId: player.userId,
        username: player.username,
        side: player.side,
        score: player.score,
        reason: 'Clean board victory'
      };
      this.logs.unshift({
        text: `🏆 ${player.username} wins the Carrom Match with ${player.score} points!`,
        time: new Date().toLocaleTimeString()
      });
      return { success: true, gameOver: true, winner: this.winner, coins: this.coins };
    }

    if (!extraTurn) {
      this.nextTurn();
    } else {
      this.turnDeadline = Date.now() + 25000;
    }

    return {
      success: true,
      gameOver: false,
      extraTurn,
      pocketed: pocketedThisTurn,
      coins: this.coins,
      currentTurnUserId: this.getCurrentPlayer().userId
    };
  }

  nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.turnDeadline = Date.now() + 25000;
  }

  handleTimeout() {
    const player = this.getCurrentPlayer();
    player.skipCount = (player.skipCount || 0) + 1;
    this.logs.unshift({
      text: `⏱️ ${player.username} timed out (Timeout ${player.skipCount}/3).`,
      time: new Date().toLocaleTimeString()
    });

    if (player.skipCount >= 3) {
      const opp = this.players.find(p => p.userId !== player.userId);
      this.winner = {
        userId: opp.userId,
        username: opp.username,
        side: opp.side,
        reason: `${player.username} forfeited due to 3 consecutive timeouts.`
      };
      return { forfeit: true, winner: this.winner };
    }

    this.nextTurn();
    return { forfeit: false };
  }

  getState() {
    return {
      gameType: 'carrom',
      coins: this.coins,
      players: this.players,
      currentTurnIndex: this.currentTurnIndex,
      currentTurnUserId: this.getCurrentPlayer().userId,
      winner: this.winner,
      logs: this.logs.slice(0, 15),
      turnDeadline: this.turnDeadline
    };
  }
}

module.exports = CarromEngine;
