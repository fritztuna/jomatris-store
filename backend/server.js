require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const productsRoute = require('./src/routes/products');
const checkoutRoute = require('./src/routes/checkout');
const paymentsRoute = require('./src/routes/payments');
const authRoute = require('./src/routes/auth');
const wishlistRoute = require('./src/routes/wishlist');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(
  helmet({
    // Allow the fonts/icons/images the frontend already depends on.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true, // required for the session cookie to be sent/received cross-origin during local dev
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Generic API rate limit — keeps someone from hammering the checkout/order
// endpoints (card testing / abuse is the realistic threat here, not the
// browse traffic).
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
// Tighter limit specifically on order creation.
app.use(
  '/api/checkout',
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
  })
);
// Tighter limit on login/signup — the realistic threat here is someone
// trying to guess a password or spin up many fake accounts, not a genuine
// user needing 20 login attempts in 10 minutes.
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/products', productsRoute);
app.use('/api/checkout', checkoutRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/auth', authRoute);
app.use('/api/wishlist', wishlistRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the frontend (same origin as the API — avoids CORS entirely for the
// normal case of the site calling its own backend).
app.use(express.static(FRONTEND_DIR));

// This site is a set of real, separate HTML pages (index.html, cart.html,
// product.html, etc.) — not a single-page app — so every real page is
// already served directly by express.static above. This fallback exists
// only to send a friendly 404 page for genuinely unmatched routes. It
// deliberately does NOT rewrite every miss to index.html: a request for a
// path that looks like a file (has an extension, e.g. a missing image or a
// typo'd asset path) is left to fail as a real 404 instead of silently
// returning the homepage with a misleading 200 OK — that used to mask
// broken image paths instead of surfacing them.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (path.extname(req.path)) return next(); // looks like a file — let it 404 properly
  res.status(404).sendFile(path.join(FRONTEND_DIR, 'index.html'), (err) => {
    if (err) next();
  });
});

// ---------------------------------------------------------------------------
// Error handling — never leak stack traces to the client.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err); // eslint-disable-line no-console
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Jomatris backend running on http://localhost:${PORT}`); // eslint-disable-line no-console
});
