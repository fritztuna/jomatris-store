// ============================================================================
// User account store. Same simple JSON-file pattern as db.js (orders) — no
// separate database needed for this scale. Passwords are never stored in
// plain text: only a bcrypt hash ever touches disk (see auth.js).
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

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
function writeAll(users) {
  writeChain = writeChain.then(() => fs.promises.writeFile(DB_FILE, JSON.stringify(users, null, 2), 'utf8'));
  return writeChain;
}

function createUser({ name, email, passwordHash }) {
  const users = readAll();
  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    wishlist: [],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeAll(users);
  return user;
}

function getUserByEmail(email) {
  return readAll().find((u) => u.email === String(email || '').toLowerCase()) || null;
}

function getUserById(id) {
  return readAll().find((u) => u.id === id) || null;
}

function updateUser(id, patch) {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch, updatedAt: new Date().toISOString() };
  writeAll(users);
  return users[idx];
}

// Never send the password hash to the client, even by accident.
function toPublic(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, wishlistCount: user.wishlist.length };
}

module.exports = { createUser, getUserByEmail, getUserById, updateUser, toPublic };
