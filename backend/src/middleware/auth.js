const sessions = require('../sessions');
const users = require('../users');

// Attaches req.user if a valid session cookie is present, but never blocks
// the request either way — use this on routes that behave differently for
// logged-in vs anonymous visitors without requiring login (there are none
// of those yet, but it's here for that shape of route).
function attachUser(req, res, next) {
  const session = sessions.getSession(req.cookies && req.cookies.session);
  req.user = session ? users.getUserById(session.userId) : null;
  next();
}

// Blocks the request with 401 unless a valid session is present. Use this
// on routes that must never run for a logged-out visitor (the wishlist).
function requireAuth(req, res, next) {
  const session = sessions.getSession(req.cookies && req.cookies.session);
  const user = session ? users.getUserById(session.userId) : null;
  if (!user) return res.status(401).json({ error: 'Please log in to do that.' });
  req.user = user;
  next();
}

module.exports = { attachUser, requireAuth };
