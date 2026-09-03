const express = require('express');
const bcrypt = require('bcryptjs');
const users = require('../users');
const sessions = require('../sessions');
const { attachUser } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_NAME = 'session';

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // never readable by JS — the main defense against XSS stealing the session
    sameSite: 'lax', // blocks the cookie being sent on most cross-site requests — basic CSRF protection
    secure: process.env.NODE_ENV === 'production', // only require HTTPS transport once actually deployed
    maxAge: sessions.SESSION_LIFETIME_MS,
  });
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (users.getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = users.createUser({ name: String(name).trim(), email, passwordHash });
    const token = sessions.createSession(user.id);
    setSessionCookie(res, token);
    res.json({ user: users.toPublic(user) });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = users.getUserByEmail(email || '');
    // Same error for "no such user" and "wrong password" — being specific
    // here just tells an attacker which emails have accounts.
    const invalid = () => res.status(401).json({ error: 'Incorrect email or password.' });
    if (!user) return invalid();

    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) return invalid();

    const token = sessions.createSession(user.id);
    setSessionCookie(res, token);
    res.json({ user: users.toPublic(user) });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).json({ error: 'Something went wrong logging you in.' });
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies && req.cookies.session;
  if (token) sessions.deleteSession(token);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', attachUser, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in.' });
  res.json({ user: users.toPublic(req.user) });
});

module.exports = router;
