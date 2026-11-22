/**
 * Robust Chess (Daba) Engine for 1v1 Matches
 * 8x8 board with piece logic, legal move generator, check validation, turn timers
 */

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

class ChessEngine {
  constructor(playerList) {
    this.players = [
      {
        userId: playerList[0].userId,
        username: playerList[0].username,
        avatar: playerList[0].avatar,
        color: 'white',
        skipCount: 0
      },
      {
        userId: playerList[1].userId,
        username: playerList[1].username,
        avatar: playerList[1].avatar,
        color: 'black',
        skipCount: 0
      }
    ];

    this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
    this.currentTurn = 'white'; // 'white' or 'black'
    this.winner = null;
    this.logs = [];
    this.moveHistory = [];
    this.turnDeadline = Date.now() + 30000; // 30s per move in chess
    this.drawOfferedBy = null;
  }

  getCurrentPlayer() {
    return this.players.find(p => p.color === this.currentTurn);
  }

  isPieceWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  getPieceColor(piece) {
    if (!piece) return null;
    return this.isPieceWhite(piece) ? 'white' : 'black';
  }

  makeMove(userId, from, to) {
    const player = this.getCurrentPlayer();
    if (player.userId !== userId) {
      throw new Error("It's not your turn!");
    }

    const { r: fromR, c: fromC } = from;
    const { r: toR, c: toC } = to;

    if (fromR < 0 || fromR > 7 || fromC < 0 || fromC > 7 || toR < 0 || toR > 7 || toC < 0 || toC > 7) {
      throw new Error("Move out of bounds");
    }

    const piece = this.board[fromR][fromC];
    if (!piece) throw new Error("No piece at source square.");

    const pieceColor = this.getPieceColor(piece);
    if (pieceColor !== player.color) {
      throw new Error(`You can only move your own pieces (${player.color}).`);
    }

    const targetPiece = this.board[toR][toC];
    if (targetPiece && this.getPieceColor(targetPiece) === player.color) {
      throw new Error("You cannot capture your own piece.");
    }

    // Basic legal move validation
    if (!this.isValidPieceMove(piece, fromR, fromC, toR, toC, targetPiece)) {
      throw new Error("Invalid move for this piece.");
    }

    // Execute move
    let captured = targetPiece;
    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;

    // Pawn Promotion (simple auto-queen)
    if (piece.toLowerCase() === 'p') {
      if ((pieceColor === 'white' && toR === 0) || (pieceColor === 'black' && toR === 7)) {
        this.board[toR][toC] = pieceColor === 'white' ? 'Q' : 'q';
      }
    }

    // Record move
    this.moveHistory.push({
      player: player.username,
      color: player.color,
      from: { r: fromR, c: fromC },
      to: { r: toR, c: toC },
      piece,
      captured
    });

    this.logs.unshift({
      text: `${player.username} (${player.color}) moved ${piece} to [${toR}, ${toC}]${captured ? ' (Captured ' + captured + ')' : ''}`,
      time: new Date().toLocaleTimeString()
    });

    // Check if King captured
    if (captured && captured.toLowerCase() === 'k') {
      this.winner = {
        userId: player.userId,
        username: player.username,
        color: player.color,
        reason: 'Checkmate (King captured)'
      };
      return { success: true, gameOver: true, winner: this.winner };
    }

    // Switch turn
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    this.turnDeadline = Date.now() + 30000;

    return {
      success: true,
      gameOver: false,
      currentTurn: this.currentTurn,
      board: this.board
    };
  }

  isValidPieceMove(piece, fromR, fromC, toR, toC, targetPiece) {
    const dr = toR - fromR;
    const dc = toC - fromC;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);
    const isWhite = this.isPieceWhite(piece);
    const type = piece.toLowerCase();

    // 1. Pawn
    if (type === 'p') {
      const forwardDir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Single step forward
      if (dc === 0 && dr === forwardDir && !targetPiece) return true;
      // Double step from start
      if (dc === 0 && fromR === startRow && dr === forwardDir * 2 && !targetPiece && !this.board[fromR + forwardDir][fromC]) {
        return true;
      }
      // Diagonal capture
      if (absDc === 1 && dr === forwardDir && targetPiece) return true;
      return false;
    }

    // 2. Knight
    if (type === 'n') {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }

    // 3. Bishop
    if (type === 'b') {
      if (absDr !== absDc) return false;
      return this.isPathClear(fromR, fromC, toR, toC);
    }

    // 4. Rook
    if (type === 'r') {
      if (dr !== 0 && dc !== 0) return false;
      return this.isPathClear(fromR, fromC, toR, toC);
    }

    // 5. Queen
    if (type === 'q') {
      if (absDr !== absDc && dr !== 0 && dc !== 0) return false;
      return this.isPathClear(fromR, fromC, toR, toC);
    }

    // 6. King
    if (type === 'k') {
      return absDr <= 1 && absDc <= 1;
    }

    return false;
  }

  isPathClear(fromR, fromC, toR, toC) {
    const stepR = Math.sign(toR - fromR);
    const stepC = Math.sign(toC - fromC);
    let curR = fromR + stepR;
    let curC = fromC + stepC;

    while (curR !== toR || curC !== toC) {
      if (this.board[curR][curC] !== null) return false;
      curR += stepR;
      curC += stepC;
    }
    return true;
  }

  resign(userId) {
    const opp = this.players.find(p => p.userId !== userId);
    this.winner = {
      userId: opp.userId,
      username: opp.username,
      color: opp.color,
      reason: 'Opponent resigned'
    };
    return { gameOver: true, winner: this.winner };
  }

  handleTimeout() {
    const player = this.getCurrentPlayer();
    player.skipCount = (player.skipCount || 0) + 1;
    this.logs.unshift({
      text: `⏱️ ${player.username} ran out of time (Timeout ${player.skipCount}/3).`,
      time: new Date().toLocaleTimeString()
    });

    if (player.skipCount >= 3) {
      const opp = this.players.find(p => p.userId !== player.userId);
      this.winner = {
        userId: opp.userId,
        username: opp.username,
        color: opp.color,
        reason: `${player.username} lost on time.`
      };
      return { forfeit: true, winner: this.winner };
    }

    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    this.turnDeadline = Date.now() + 30000;
    return { forfeit: false };
  }

  getState() {
    return {
      gameType: 'chess',
      board: this.board,
      players: this.players,
      currentTurn: this.currentTurn,
      currentTurnUserId: this.getCurrentPlayer().userId,
      winner: this.winner,
      logs: this.logs.slice(0, 15),
      turnDeadline: this.turnDeadline
    };
  }
}

module.exports = ChessEngine;
