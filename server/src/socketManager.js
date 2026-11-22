const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const wallet = require('./wallet');
const LudoEngine = require('./games/LudoEngine');
const ChessEngine = require('./games/ChessEngine');
const CarromEngine = require('./games/CarromEngine');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { match, engine, timerInterval, sockets: Map(userId -> socketId) }
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
    this.matchQueue = []; // [{ userId, username, avatar, gameType, mode, stake, socketId }]
    this.lobbyChat = [];
  }

  getOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  broadcastOnlineStatus() {
    const onlineIds = this.getOnlineUserIds();
    this.io.emit('online_users_update', {
      onlineCount: onlineIds.length,
      onlineUserIds: onlineIds
    });
  }

  init() {
    this.io.on('connection', (socket) => {
      let currentUserId = null;

      socket.on('auth', ({ userId }) => {
        if (!userId) return;
        currentUserId = userId;
        this.userSockets.set(userId, socket.id);
        this.socketUsers.set(socket.id, userId);
        socket.userId = userId;

        this.broadcastOnlineStatus();

        // Send active lobby chat
        socket.emit('lobby_chat_history', this.lobbyChat.slice(-25));

        // Reconnect to active in-progress match if any
        for (const [roomId, room] of this.rooms.entries()) {
          const isPlayer = room.match.players.some(p => p.userId === userId);
          if (isPlayer && room.match.status === 'in_progress') {
            socket.join(roomId);
            room.sockets.set(userId, socket.id);
            socket.emit('match_reconnected', {
              roomId,
              match: room.match,
              state: room.engine.getState()
            });

            this.io.to(roomId).emit('player_status_change', {
              userId,
              status: 'reconnected',
              message: 'Player reconnected!'
            });
            break;
          }
        }
      });

      // --- Friend Direct Match Invitation ---
      socket.on('invite_friend_to_match', ({ fromUserId, toUserId, gameType, mode = '1v1', stake = 50 }) => {
        const fromUser = db.findUserById(fromUserId);
        const toUser = db.findUserById(toUserId);
        if (!fromUser || !toUser) return;

        if (fromUser.balance < stake) {
          return socket.emit('error', `You don't have enough balance (${fromUser.balance.toFixed(2)} ৳) for this stake.`);
        }

        const friendSocketId = this.userSockets.get(toUserId);
        if (!friendSocketId) {
          return socket.emit('error', `${toUser.username} is currently offline.`);
        }

        const inviteId = uuidv4();
        this.io.to(friendSocketId).emit('match_invite_received', {
          inviteId,
          fromUser: {
            id: fromUser.id,
            username: fromUser.username,
            avatar: fromUser.avatar
          },
          gameType,
          mode,
          stake,
          payout: (stake * 2 * 0.95).toFixed(2)
        });

        socket.emit('invite_sent_success', { toUsername: toUser.username });
      });

      // Accept Friend Invite
      socket.on('accept_match_invite', async ({ fromUserId, toUserId, gameType, mode, stake }) => {
        try {
          const u1 = db.findUserById(fromUserId);
          const u2 = db.findUserById(toUserId);
          if (!u1 || !u2) return socket.emit('error', 'User not found');

          if (u1.balance < stake || u2.balance < stake) {
            return socket.emit('error', 'One or both players have insufficient balance.');
          }

          const playerList = [
            { userId: u1.id, username: u1.username, avatar: u1.avatar },
            { userId: u2.id, username: u2.username, avatar: u2.avatar }
          ];

          await this.startMatch(gameType, mode, stake, playerList);
        } catch (err) {
          socket.emit('error', err.message);
        }
      });

      socket.on('decline_match_invite', ({ fromUserId, toUserId }) => {
        const fromSocket = this.userSockets.get(fromUserId);
        const toUser = db.findUserById(toUserId);
        if (fromSocket && toUser) {
          this.io.to(fromSocket).emit('invite_declined', { username: toUser.username });
        }
      });

      // --- Lobby Real-time Chat ---
      socket.on('send_lobby_chat', ({ userId, message }) => {
        const user = db.findUserById(userId);
        if (!user || !message?.trim()) return;

        const chatObj = {
          id: uuidv4(),
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          message: message.trim().slice(0, 200),
          isAdmin: !!user.isAdmin,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.lobbyChat.push(chatObj);
        if (this.lobbyChat.length > 50) this.lobbyChat.shift();

        this.io.emit('lobby_chat_message', chatObj);
      });

      // --- Matchmaking & Room Creation ---
      socket.on('join_queue', async ({ userId, gameType, mode = '1v1', stake = 50 }) => {
        try {
          stake = parseFloat(stake);
          const user = db.findUserById(userId);
          if (!user) return socket.emit('error', 'User not found');
          if (user.balance < stake) {
            return socket.emit('error', `Insufficient balance (${user.balance.toFixed(2)} BDT). Need ${stake} BDT.`);
          }

          this.matchQueue = this.matchQueue.filter(q => q.userId !== userId);

          const targetCount = (mode === '4player' || mode === '2v2') ? 4 : 2;
          const matches = this.matchQueue.filter(
            q => q.gameType === gameType && q.mode === mode && q.stake === stake && q.userId !== userId
          );

          if (matches.length >= targetCount - 1) {
            const matchedOpponents = matches.slice(0, targetCount - 1);
            const matchedIds = matchedOpponents.map(m => m.userId);
            this.matchQueue = this.matchQueue.filter(q => !matchedIds.includes(q.userId));

            const playerList = [
              { userId: user.id, username: user.username, avatar: user.avatar, socketId: socket.id },
              ...matchedOpponents
            ];

            await this.startMatch(gameType, mode, stake, playerList);
          } else {
            this.matchQueue.push({
              userId: user.id,
              username: user.username,
              avatar: user.avatar,
              gameType,
              mode,
              stake,
              socketId: socket.id
            });
            socket.emit('queue_waiting', { gameType, mode, stake });
          }
        } catch (err) {
          socket.emit('error', err.message);
        }
      });

      socket.on('leave_queue', ({ userId }) => {
        this.matchQueue = this.matchQueue.filter(q => q.userId !== userId);
        socket.emit('queue_left');
      });

      // Create Custom Room
      socket.on('create_room', async ({ userId, gameType, mode = '1v1', stake = 50, isPrivate = true }) => {
        try {
          stake = parseFloat(stake);
          const user = db.findUserById(userId);
          if (!user) return socket.emit('error', 'User not found');
          if (user.balance < stake) {
            return socket.emit('error', `Insufficient balance (${user.balance.toFixed(2)} BDT). Need ${stake} BDT.`);
          }

          const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const roomId = uuidv4();
          const targetPlayers = (mode === '4player' || mode === '2v2') ? 4 : 2;

          const match = {
            id: roomId,
            roomCode,
            gameType,
            mode,
            stake,
            isPrivate,
            hostUserId: userId,
            status: 'waiting',
            players: [{ userId: user.id, username: user.username, avatar: user.avatar, isHost: true }],
            targetPlayers,
            createdAt: new Date().toISOString()
          };

          db.createMatch(match);
          socket.join(roomId);

          this.rooms.set(roomId, {
            match,
            engine: null,
            sockets: new Map([[userId, socket.id]])
          });

          socket.emit('room_created', { roomId, roomCode, match });
        } catch (err) {
          socket.emit('error', err.message);
        }
      });

      // Join Room by Code
      socket.on('join_room_by_code', async ({ userId, roomCode }) => {
        try {
          const match = db.findMatchByRoomCode(roomCode);
          if (!match) return socket.emit('error', 'Room not found or already ended.');
          if (match.status !== 'waiting') return socket.emit('error', 'Match is already in progress.');

          const user = db.findUserById(userId);
          if (!user) return socket.emit('error', 'User not found');
          if (user.balance < match.stake) {
            return socket.emit('error', `Insufficient balance. Need ${match.stake} BDT.`);
          }

          if (match.players.some(p => p.userId === userId)) {
            socket.join(match.id);
            return socket.emit('room_joined', { roomId: match.id, match });
          }

          match.players.push({ userId: user.id, username: user.username, avatar: user.avatar });
          db.updateMatch(match.id, { players: match.players });

          socket.join(match.id);
          const room = this.rooms.get(match.id);
          if (room) {
            room.sockets.set(userId, socket.id);
          }

          this.io.to(match.id).emit('player_joined', { match });

          if (match.players.length === match.targetPlayers) {
            await this.startMatch(match.gameType, match.mode, match.stake, match.players, match.id);
          }
        } catch (err) {
          socket.emit('error', err.message);
        }
      });

      // --- In-Game Moves ---
      socket.on('ludo_roll_dice', ({ roomId, userId }) => {
        const room = this.rooms.get(roomId);
        if (!room || !room.engine) return;
        try {
          const res = room.engine.rollDice(userId);
          this.io.to(roomId).emit('ludo_dice_rolled', {
            roll: res.roll,
            validMoves: res.validMoves,
            state: room.engine.getState()
          });

          if (res.turnChanged) {
            this.resetTurnTimer(roomId);
          }
        } catch (err) {
          socket.emit('game_error', err.message);
        }
      });

      socket.on('ludo_move_token', async ({ roomId, userId, tokenId }) => {
        const room = this.rooms.get(roomId);
        if (!room || !room.engine) return;
        try {
          const res = room.engine.moveToken(userId, tokenId);
          this.io.to(roomId).emit('ludo_token_moved', {
            res,
            state: room.engine.getState()
          });

          if (res.gameOver) {
            if (res.winner.winnerUserIds) {
              // 2v2 Team Win
              await this.handleTeamGameOver(roomId, res.winner.winnerUserIds, res.winner.team);
            } else {
              await this.handleGameOver(roomId, res.winner.userId);
            }
          } else {
            this.resetTurnTimer(roomId);
          }
        } catch (err) {
          socket.emit('game_error', err.message);
        }
      });

      socket.on('chess_move', async ({ roomId, userId, from, to }) => {
        const room = this.rooms.get(roomId);
        if (!room || !room.engine) return;
        try {
          const res = room.engine.makeMove(userId, from, to);
          this.io.to(roomId).emit('chess_moved', {
            res,
            state: room.engine.getState()
          });

          if (res.gameOver) {
            await this.handleGameOver(roomId, res.winner.userId);
          } else {
            this.resetTurnTimer(roomId);
          }
        } catch (err) {
          socket.emit('game_error', err.message);
        }
      });

      socket.on('chess_resign', async ({ roomId, userId }) => {
        const room = this.rooms.get(roomId);
        if (!room || !room.engine) return;
        const res = room.engine.resign(userId);
        this.io.to(roomId).emit('game_over', {
          winner: res.winner,
          state: room.engine.getState()
        });
        await this.handleGameOver(roomId, res.winner.userId);
      });

      socket.on('carrom_strike', async ({ roomId, userId, strikerX, angle, power }) => {
        const room = this.rooms.get(roomId);
        if (!room || !room.engine) return;
        try {
          const res = room.engine.strike(userId, { strikerX, angle, power });
          this.io.to(roomId).emit('carrom_struck', {
            res,
            state: room.engine.getState()
          });

          if (res.gameOver) {
            await this.handleGameOver(roomId, res.winner.userId);
          } else {
            this.resetTurnTimer(roomId);
          }
        } catch (err) {
          socket.emit('game_error', err.message);
        }
      });

      socket.on('send_chat', ({ roomId, userId, text, emoji }) => {
        const user = db.findUserById(userId);
        if (!user) return;
        this.io.to(roomId).emit('chat_received', {
          sender: user.username,
          userId,
          text,
          emoji,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });

      socket.on('disconnect', () => {
        if (currentUserId) {
          this.userSockets.delete(currentUserId);
          this.socketUsers.delete(socket.id);
          this.matchQueue = this.matchQueue.filter(q => q.userId !== currentUserId);

          this.broadcastOnlineStatus();

          // Notify room of disconnect with 45s countdown
          for (const [roomId, room] of this.rooms.entries()) {
            if (room.match.status === 'in_progress' && room.match.players.some(p => p.userId === currentUserId)) {
              this.io.to(roomId).emit('player_status_change', {
                userId: currentUserId,
                status: 'disconnected',
                message: 'Player disconnected. Waiting 45 seconds to reconnect...'
              });
            }
          }
        }
      });
    });
  }

  async startMatch(gameType, mode, stake, playerList, existingRoomId = null) {
    const roomId = existingRoomId || uuidv4();
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Lock Escrow
    for (const p of playerList) {
      await wallet.lockStake(p.userId, stake, roomId);
    }

    let engine = null;
    if (gameType === 'ludo') {
      engine = new LudoEngine(playerList, mode, 4);
    } else if (gameType === 'chess') {
      engine = new ChessEngine(playerList);
    } else if (gameType === 'carrom') {
      engine = new CarromEngine(playerList);
    }

    const match = {
      id: roomId,
      roomCode,
      gameType,
      mode,
      stake,
      status: 'in_progress',
      players: playerList,
      targetPlayers: playerList.length,
      startedAt: new Date().toISOString()
    };

    if (existingRoomId) {
      db.updateMatch(existingRoomId, match);
    } else {
      db.createMatch(match);
    }

    const socketsMap = new Map();
    for (const p of playerList) {
      const sId = this.userSockets.get(p.userId);
      if (sId) {
        socketsMap.set(p.userId, sId);
        const sock = this.io.sockets.sockets.get(sId);
        if (sock) sock.join(roomId);
      }
    }

    this.rooms.set(roomId, {
      match,
      engine,
      sockets: socketsMap,
      timerInterval: null
    });

    this.io.to(roomId).emit('match_started', {
      roomId,
      match,
      state: engine.getState()
    });

    this.resetTurnTimer(roomId);
  }

  resetTurnTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.engine) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
    }

    room.timerInterval = setInterval(async () => {
      if (!room.engine || room.engine.winner) {
        clearInterval(room.timerInterval);
        return;
      }

      if (Date.now() >= room.engine.turnDeadline) {
        const timeoutRes = room.engine.handleTimeout();
        this.io.to(roomId).emit('turn_timeout', {
          timeoutRes,
          state: room.engine.getState()
        });

        if (timeoutRes.forfeit && timeoutRes.winner) {
          clearInterval(room.timerInterval);
          await this.handleGameOver(roomId, timeoutRes.winner.userId);
        }
      }
    }, 1000);
  }

  async handleGameOver(roomId, winnerUserId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);

    try {
      const settledMatch = await wallet.settleMatchPayout(roomId, winnerUserId);
      const winner = db.findUserById(winnerUserId);

      this.io.to(roomId).emit('game_settled', {
        match: settledMatch,
        winner: {
          id: winner.id,
          username: winner.username,
          avatar: winner.avatar,
          payout: settledMatch.winnerPayout
        },
        state: room.engine ? room.engine.getState() : null
      });

      room.match.status = 'completed';
    } catch (err) {
      console.error('Error settling game over:', err);
    }
  }

  async handleTeamGameOver(roomId, winningUserIds, teamName) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);

    try {
      const settledMatch = await wallet.settleMatchPayout(roomId, null, winningUserIds);
      this.io.to(roomId).emit('game_settled', {
        match: settledMatch,
        winner: {
          teamName,
          payout: settledMatch.winnerPayout
        },
        state: room.engine ? room.engine.getState() : null
      });

      room.match.status = 'completed';
    } catch (err) {
      console.error('Error settling team game over:', err);
    }
  }
}

module.exports = SocketManager;
