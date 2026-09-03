// ============================================================================
// Server-side sessions. The browser only ever holds an opaque random token
// in an httpOnly cookie — it can't be read or forged by JavaScript, and it
// carries no information about who the user is on its own. This file is
// the only place that maps a token to an actual account.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sessions.json');
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');

let writeChain = Promise.resolve();
function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function writeAll(sessions) {
  writeChain = writeChain.then(() => fs.promises.writeFile(DB_FILE, JSON.stringify(sessions, null, 2), 'utf8'));
  return writeChain;
}

function createSession(userId) {
  const sessions = readAll().filter((s) => s.expiresAt > Date.now()); // sweep expired ones while we're here
  const token = crypto.randomBytes(32).toString('hex');
  sessions.push({ token, userId, createdAt: Date.now(), expiresAt: Date.now() + SESSION_LIFETIME_MS });
  writeAll(sessions);
  return token;
}

function getSession(token) {
  if (!token) return null;
  const session = readAll().find((s) => s.token === token);
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
}

function deleteSession(token) {
  writeAll(readAll().filter((s) => s.token !== token));
}

module.exports = { createSession, getSession, deleteSession, SESSION_LIFETIME_MS };
