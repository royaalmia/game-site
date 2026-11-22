-- ========================================================
-- 🎲 LuduStar Pro — Cloudflare D1 SQLite Database Schema
-- ========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 50.0,
    escrow_balance REAL DEFAULT 0.0,
    total_won REAL DEFAULT 0.0,
    total_lost REAL DEFAULT 0.0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    avatar TEXT,
    is_admin INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- 2. Transactions (Recharge, Withdraw, Escrow, Welcome Bonus)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'deposit' | 'withdraw' | 'match_entry' | 'match_win' | 'welcome_bonus' | 'referral_bonus'
    amount REAL NOT NULL,
    fee REAL DEFAULT 0.0,
    method TEXT,        -- 'bkash' | 'nagad' | 'rocket'
    phone TEXT,
    trx_id TEXT,
    status TEXT DEFAULT 'completed', -- 'pending' | 'approved' | 'rejected' | 'completed'
    match_id TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 3. Matches (Ludo, Chess, Carrom)
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL, -- 'ludo' | 'chess' | 'carrom'
    mode TEXT NOT NULL,      -- '1v1' | '4p' | 'team'
    stake REAL NOT NULL,
    prize_pool REAL NOT NULL,
    commission_rate REAL DEFAULT 0.05,
    commission_amount REAL DEFAULT 0.0,
    status TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'completed' | 'abandoned'
    room_code TEXT,
    winner_user_id TEXT,
    winner_payout REAL,
    ended_at TEXT,
    created_at TEXT NOT NULL
);

-- 4. Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    game_type TEXT NOT NULL,
    entry_fee REAL NOT NULL,
    prize_pool REAL NOT NULL,
    max_players INTEGER DEFAULT 8,
    status TEXT DEFAULT 'upcoming', -- 'upcoming' | 'live' | 'completed'
    start_time TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 5. Player Complaints & Disputes
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    category TEXT NOT NULL, -- 'recharge' | 'withdraw' | 'match_dispute' | 'gameplay' | 'other'
    message TEXT NOT NULL,
    match_id TEXT,
    status TEXT DEFAULT 'open', -- 'open' | 'investigating' | 'resolved'
    resolution TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 6. Friendships & Social Connections
CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    status TEXT DEFAULT 'accepted',
    created_at TEXT NOT NULL
);

-- 7. Game Platform Configuration
CREATE TABLE IF NOT EXISTS game_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed initial master SuperAdmin
INSERT OR IGNORE INTO users (
    id, username, email, phone, password_hash, balance, is_admin, created_at
) VALUES (
    'admin-master-id',
    'SuperAdmin',
    'admin@ludu.com',
    '01700000000',
    '$2b$10$.kMtgNXbIqD5JREjcrc8NeWIneNcS2PYrG3kPV546M/kSRsjUjo8y',
    100000.0,
    1,
    '2026-11-23T00:00:00.000Z'
);
