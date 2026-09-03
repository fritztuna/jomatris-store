const express = require('express');
const db = require('../db');
const dpo = require('../payments/dpo');
const stripeGateway = require('../payments/stripe');

const router = express.Router();

// DPO redirects the customer's browser back here after they pay (or cancel)
// on DPO's hosted page. We NEVER trust that redirect by itself — someone
// could just type this URL in without paying — so we call DPO's verifyToken
// API server-to-server and only mark the order paid if DPO confirms it.
router.get('/dpo/callback', async (req, res) => {
  const orderId = req.query.order;
  const order = db.getOrder(orderId);
  if (!order || !order.paymentProviderRef) {
    return res.redirect('/order-confirmation.html?status=error');
  }
  try {
    const result = await dpo.verifyPayment(order.paymentProviderRef);
    db.updateOrder(order.id, { paymentStatus: result.paid ? 'paid' : 'failed' });
    return res.redirect(`/order-confirmation.html?order=${order.id}&status=${result.paid ? 'paid' : 'failed'}`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    return res.redirect(`/order-confirmation.html?order=${order.id}&status=error`);
  }
});

// Same idea for Stripe: verify the Checkout Session server-side before
// trusting it.
router.get('/stripe/callback', async (req, res) => {
  const orderId = req.query.order;
  const sessionId = req.query.session_id;
  const order = db.getOrder(orderId);
  if (!order) return res.redirect('/order-confirmation.html?status=error');
  try {
    const result = await stripeGateway.verifyPayment(sessionId || order.paymentProviderRef);
    db.updateOrder(order.id, { paymentStatus: result.paid ? 'paid' : 'failed' });
    return res.redirect(`/order-confirmation.html?order=${order.id}&status=${result.paid ? 'paid' : 'failed'}`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    return res.redirect(`/order-confirmation.html?order=${order.id}&status=error`);
  }
});

module.exports = router;
