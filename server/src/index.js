require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./db');
const { seedAdmin } = require('./auth');
const SocketManager = require('./socketManager');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const matchRoutes = require('./routes/matchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');

const app = express();
const server = http.createServer(app);

// Enable Trust Proxy for Cloudflare / Reverse Proxies
app.set('trust proxy', true);

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const socketManager = new SocketManager(io);
socketManager.init();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tournaments', tournamentRoutes);

// General status healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static build if exists (for production single-port deployment)
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Gaming Platform API Server is running. Client build in progress.');
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(`🚀 Multiplayer Gaming Server listening on port ${PORT}`);
  console.log(`🎮 Games: Ludo (1v1 & Team), Daba (Chess), Carrom`);
  console.log(`💰 5% House Commission Escrow Engine active`);
  console.log(`=================================================`);
  await seedAdmin();
});
