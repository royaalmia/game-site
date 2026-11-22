const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'ludu_secret_super_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, isAdmin: !!user.isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or deleted.' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended by administration.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  });
}

function generateReferralCode(username) {
  const clean = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${rand}`;
}

async function register({ username, email, phone, password, referredBy }) {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required.');
  }

  const existingEmail = db.findUserByEmail(email);
  if (existingEmail) {
    throw new Error('An account with this email already exists.');
  }

  if (phone) {
    const existingPhone = db.findUserByPhone(phone);
    if (existingPhone) {
      throw new Error('An account with this phone number already exists.');
    }
  }

  let referrer = null;
  if (referredBy) {
    referrer = db.findUserByReferralCode(referredBy);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    id: uuidv4(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    passwordHash,
    balance: 50.0, // Welcome bonus of 50 BDT so user can immediately test games!
    escrowBalance: 0.0,
    totalWon: 0.0,
    totalLost: 0.0,
    matchesPlayed: 0,
    matchesWon: 0,
    referralCode: generateReferralCode(username),
    referredBy: referrer ? referrer.id : null,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    isAdmin: false,
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);

  // If there's a referrer, give bonus or track referral
  if (referrer) {
    db.createTransaction({
      id: uuidv4(),
      userId: referrer.id,
      type: 'referral_bonus',
      amount: 10.0,
      fee: 0,
      status: 'completed',
      note: `Referral bonus for inviting ${newUser.username}`,
      createdAt: new Date().toISOString()
    });
    db.updateUser(referrer.id, { balance: (referrer.balance || 0) + 10.0 });
  }

  // Welcome transaction record
  db.createTransaction({
    id: uuidv4(),
    userId: newUser.id,
    type: 'bonus',
    amount: 50.0,
    fee: 0,
    status: 'completed',
    note: 'Welcome Sign Up Bonus',
    createdAt: new Date().toISOString()
  });

  const { passwordHash: _, ...safeUser } = newUser;
  const token = generateToken(newUser);
  return { user: safeUser, token };
}

async function login({ emailOrUsername, password }) {
  if (!emailOrUsername || !password) {
    throw new Error('Email/Username and password are required.');
  }

  const users = db.getUsers();
  const user = users.find(
    u => u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
         u.username.toLowerCase() === emailOrUsername.toLowerCase()
  );

  if (!user) {
    throw new Error('Invalid email/username or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email/username or password.');
  }

  if (user.isBanned) {
    throw new Error('Your account has been suspended by administration.');
  }

  const { passwordHash: _, ...safeUser } = user;
  const token = generateToken(user);
  return { user: safeUser, token };
}

// Seed default Admin if not exists
async function seedAdmin() {
  const users = db.getUsers();
  const adminExists = users.some(u => u.isAdmin);
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123456', salt);
    const adminUser = {
      id: 'admin-master-id',
      username: 'SuperAdmin',
      email: 'admin@ludu.com',
      phone: '01700000000',
      passwordHash,
      balance: 100000.0,
      escrowBalance: 0.0,
      totalWon: 0.0,
      totalLost: 0.0,
      matchesPlayed: 0,
      matchesWon: 0,
      referralCode: 'ADMINVIP',
      referredBy: null,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminVIP',
      isAdmin: true,
      isBanned: false,
      createdAt: new Date().toISOString()
    };
    db.createUser(adminUser);
    console.log('Seeded default Admin: admin@ludu.com / admin123456');
  }
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  register,
  login,
  seedAdmin,
  generateToken
};
