const Database = require('better-sqlite3');
const path = require('path');

// SQLite connection
const db = new Database(path.join(__dirname, '..', '..', 'mirlind.db'));

// Initialize database
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_to_next INTEGER DEFAULT 100,
      pillars TEXT DEFAULT '{}',
      skills TEXT DEFAULT '{}',
      activity_stats TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Body measurements tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      weight REAL,
      height REAL,
      biceps REAL,
      forearms REAL,
      chest REAL,
      waist REAL,
      hips REAL,
      thighs REAL,
      calves REAL,
      shoulders REAL,
      wrist REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workout tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      exercises TEXT NOT NULL,
      duration INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // German progress tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS german_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      anki_cards INTEGER DEFAULT 0,
      anki_time INTEGER DEFAULT 0,
      anki_streak INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      language_transfer BOOLEAN DEFAULT 0,
      language_transfer_lesson INTEGER DEFAULT 1,
      radio_hours REAL DEFAULT 0,
      tandem_minutes INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // Code progress tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      hours REAL DEFAULT 0,
      github_commits INTEGER DEFAULT 0,
      project TEXT,
      skills TEXT DEFAULT '[]',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // Finance tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily protocol tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_protocol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      wake05 BOOLEAN DEFAULT 0,
      german_study BOOLEAN DEFAULT 0,
      gym_workout BOOLEAN DEFAULT 0,
      coding_hours REAL DEFAULT 0,
      sleep22 BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  console.log('✅ Database initialized');
}

initDb();

module.exports = db;
