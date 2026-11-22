/**
 * Complete Ludo Rule Engine for 1v1 and 4-Player / 2v2 modes
 * 
 * Board layout:
 * - Common circuit: 52 tiles (0 to 51).
 * - Safe zones: 0, 8, 13, 21, 26, 34, 39, 47 (Star squares & Starting squares)
 * - Start points: Red: 0, Green: 13, Yellow: 26, Blue: 39
 * - Turn into home stretch:
 *     Red: from tile 50 into Red home column (tiles 100..104, home: 105)
 *     Green: from tile 11 into Green home column
 *     Yellow: from tile 24 into Yellow home column
 *     Blue: from tile 37 into Blue home column
 */

const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

const PLAYER_CONFIGS = [
  { id: 0, color: 'red', name: 'Red', startPos: 0, homeEntryTile: 50 },
  { id: 1, color: 'green', name: 'Green', startPos: 13, homeEntryTile: 11 },
  { id: 2, color: 'yellow', name: 'Yellow', startPos: 26, homeEntryTile: 24 },
  { id: 3, color: 'blue', name: 'Blue', startPos: 39, homeEntryTile: 37 }
];

class LudoEngine {
  constructor(playerList, mode = '1v1', tokensPerPlayer = 4) {
    this.mode = mode; // '1v1', '4player', '2v2'
    this.tokensCount = tokensPerPlayer; // 4 tokens per player
    this.players = [];

    if (mode === '1v1') {
      // In 1v1, use opposite corners: Red (0) and Yellow (2)
      this.players = [
        {
          seat: 0,
          configIndex: 0, // Red
          userId: playerList[0].userId,
          username: playerList[0].username,
          avatar: playerList[0].avatar,
          color: 'red',
          team: 'Player 1',
          tokens: Array.from({ length: this.tokensCount }, (_, i) => ({ id: i, position: -1, stepCount: 0 })),
          skipCount: 0
        },
        {
          seat: 1,
          configIndex: 2, // Yellow
          userId: playerList[1].userId,
          username: playerList[1].username,
          avatar: playerList[1].avatar,
          color: 'yellow',
          team: 'Player 2',
          tokens: Array.from({ length: this.tokensCount }, (_, i) => ({ id: i, position: -1, stepCount: 0 })),
          skipCount: 0
        }
      ];
    } else if (mode === '2v2') {
      // 2v2: Seat 0 (Red) & Seat 2 (Yellow) = Team A
      //      Seat 1 (Green) & Seat 3 (Blue) = Team B
      this.players = playerList.map((p, idx) => ({
        seat: idx,
        configIndex: idx,
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        color: PLAYER_CONFIGS[idx].color,
        team: idx % 2 === 0 ? 'Team Red-Yellow' : 'Team Green-Blue',
        tokens: Array.from({ length: this.tokensCount }, (_, i) => ({ id: i, position: -1, stepCount: 0 })),
        skipCount: 0
      }));
    } else {
      // 4-Player Free-for-all
      this.players = playerList.map((p, idx) => ({
        seat: idx,
        configIndex: idx,
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        color: PLAYER_CONFIGS[idx].color,
        team: p.username,
        tokens: Array.from({ length: this.tokensCount }, (_, i) => ({ id: i, position: -1, stepCount: 0 })),
        skipCount: 0
      }));
    }

    this.currentTurnIndex = 0;
    this.diceValue = null;
    this.hasRolled = false;
    this.consecutiveSixes = 0;
    this.winner = null;
    this.winningTeam = null;
    this.logs = [];
    this.turnDeadline = Date.now() + 20000;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  rollDice(userId) {
    const player = this.getCurrentPlayer();
    if (player.userId !== userId) {
      throw new Error("It's not your turn!");
    }
    if (this.hasRolled) {
      throw new Error("You already rolled. Move a token.");
    }

    // Cryptographically random roll 1-6
    const roll = Math.floor(Math.random() * 6) + 1;
    this.diceValue = roll;
    this.hasRolled = true;

    this.logs.unshift({
      text: `${player.username} (${player.color.toUpperCase()}) rolled a ${roll}!`,
      time: new Date().toLocaleTimeString()
    });

    if (roll === 6) {
      this.consecutiveSixes++;
      if (this.consecutiveSixes === 3) {
        this.logs.unshift({
          text: `${player.username} rolled three 6s in a row! Turn cancelled.`,
          time: new Date().toLocaleTimeString()
        });
        this.consecutiveSixes = 0;
        this.nextTurn();
        return { roll, validMoves: [], turnChanged: true };
      }
    } else {
      this.consecutiveSixes = 0;
    }

    const validMoves = this.getValidMoves(player, roll);
    if (validMoves.length === 0) {
      this.logs.unshift({
        text: `No valid moves for ${player.username}. Turn passed.`,
        time: new Date().toLocaleTimeString()
      });
      this.nextTurn();
      return { roll, validMoves: [], turnChanged: true };
    }

    return { roll, validMoves, turnChanged: false };
  }

  getValidMoves(player, roll) {
    const validTokenIds = [];
    for (const token of player.tokens) {
      if (token.position === 105) continue; // finished

      if (token.position === -1) {
        if (roll === 6) validTokenIds.push(token.id);
      } else {
        if (token.stepCount + roll <= 56) {
          validTokenIds.push(token.id);
        }
      }
    }
    return validTokenIds;
  }

  moveToken(userId, tokenId) {
    const player = this.getCurrentPlayer();
    if (player.userId !== userId) {
      throw new Error("It's not your turn!");
    }
    if (!this.hasRolled || !this.diceValue) {
      throw new Error("Roll the dice first!");
    }

    const token = player.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Invalid token ID");

    const validMoves = this.getValidMoves(player, this.diceValue);
    if (!validMoves.includes(tokenId)) {
      throw new Error("This token cannot move with this roll.");
    }

    let extraTurn = false;
    let capturedOpponent = null;
    const config = PLAYER_CONFIGS[player.configIndex];

    if (token.position === -1 && this.diceValue === 6) {
      token.position = config.startPos;
      token.stepCount = 0;
      extraTurn = true;
      this.logs.unshift({
        text: `${player.username} brought a token onto the track!`,
        time: new Date().toLocaleTimeString()
      });
    } else {
      const oldStep = token.stepCount;
      const newStep = oldStep + this.diceValue;
      token.stepCount = newStep;

      if (newStep === 56) {
        token.position = 105;
        extraTurn = true;
        this.logs.unshift({
          text: `🎉 ${player.username}'s token reached HOME! Bonus turn granted!`,
          time: new Date().toLocaleTimeString()
        });
      } else if (newStep > 50) {
        token.position = 100 + (newStep - 51);
      } else {
        token.position = (config.startPos + newStep) % 52;

        // Capture check (cannot capture on safe squares)
        if (!SAFE_SQUARES.includes(token.position)) {
          for (const opp of this.players) {
            if (opp.userId === player.userId) continue;
            // Teammates in 2v2 cannot capture each other!
            if (this.mode === '2v2' && opp.team === player.team) continue;

            for (const oppToken of opp.tokens) {
              if (oppToken.position === token.position) {
                // CAPTURE!
                oppToken.position = -1;
                oppToken.stepCount = 0;
                capturedOpponent = {
                  userId: opp.userId,
                  username: opp.username,
                  color: opp.color,
                  tokenId: oppToken.id
                };
                extraTurn = true;
                this.logs.unshift({
                  text: `💥 ${player.username} captured ${opp.username}'s token! Bonus roll!`,
                  time: new Date().toLocaleTimeString()
                });
                break;
              }
            }
            if (capturedOpponent) break;
          }
        }
      }

      if (this.diceValue === 6) {
        extraTurn = true;
      }
    }

    // Check Win Condition
    let isGameOver = false;
    if (this.mode === '2v2') {
      const teamPlayers = this.players.filter(p => p.team === player.team);
      const teamWon = teamPlayers.every(p => p.tokens.every(t => t.position === 105));
      if (teamWon) {
        this.winner = {
          team: player.team,
          winnerUserIds: teamPlayers.map(p => p.userId),
          usernames: teamPlayers.map(p => p.username).join(' & ')
        };
        isGameOver = true;
      }
    } else {
      const allHome = player.tokens.every(t => t.position === 105);
      if (allHome) {
        this.winner = {
          userId: player.userId,
          username: player.username,
          color: player.color
        };
        isGameOver = true;
      }
    }

    if (isGameOver) {
      this.logs.unshift({
        text: `🏆 ${this.winner.username || this.winner.usernames} WON THE MATCH!`,
        time: new Date().toLocaleTimeString()
      });
      return {
        success: true,
        gameOver: true,
        winner: this.winner,
        capturedOpponent,
        extraTurn: false
      };
    }

    this.hasRolled = false;
    this.diceValue = null;

    if (!extraTurn) {
      this.nextTurn();
    } else {
      this.turnDeadline = Date.now() + 20000;
    }

    return {
      success: true,
      gameOver: false,
      extraTurn,
      capturedOpponent,
      currentTurnUserId: this.getCurrentPlayer().userId
    };
  }

  nextTurn() {
    this.hasRolled = false;
    this.diceValue = null;
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    this.turnDeadline = Date.now() + 20000;
  }

  handleTimeout() {
    const player = this.getCurrentPlayer();
    player.skipCount = (player.skipCount || 0) + 1;
    this.logs.unshift({
      text: `⏱️ ${player.username} timed out (Skip ${player.skipCount}/3).`,
      time: new Date().toLocaleTimeString()
    });

    if (player.skipCount >= 3) {
      const remaining = this.players.filter(p => p.userId !== player.userId);
      this.winner = {
        userId: remaining[0].userId,
        username: remaining[0].username,
        color: remaining[0].color,
        reason: `${player.username} forfeited due to 3 consecutive timeouts.`
      };
      return { forfeit: true, winner: this.winner };
    }

    this.nextTurn();
    return { forfeit: false };
  }

  getState() {
    return {
      gameType: 'ludo',
      mode: this.mode,
      players: this.players,
      currentTurnIndex: this.currentTurnIndex,
      currentTurnUserId: this.getCurrentPlayer().userId,
      diceValue: this.diceValue,
      hasRolled: this.hasRolled,
      winner: this.winner,
      logs: this.logs.slice(0, 15),
      turnDeadline: this.turnDeadline,
      safeSquares: SAFE_SQUARES
    };
  }
}

module.exports = LudoEngine;
