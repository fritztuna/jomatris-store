const express = require('express');
const { getProductById } = require('../products');
const db = require('../db');
const dpo = require('../payments/dpo');
const stripe = require('../payments/stripe');
const manual = require('../payments/manual');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_DELIVERY_THRESHOLD = 800;
const STANDARD_DELIVERY_FEE = 60;
const VALID_METHODS = ['dpo', 'stripe', 'eft', 'cod', 'whatsapp'];

// --------------------------------------------------------------------------
// Rebuild and validate the order entirely from server-side data. This is the
// most important security fix in this whole backend: the original site kept
// price/qty/id in the browser's JS and trusted whatever came back, which
// means anyone with devtools open could have changed a price before "adding
// to cart". Nothing here is taken from the client except *which* product and
// *how many* — the price always comes from products.js.
// --------------------------------------------------------------------------
function buildValidatedOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Cart is empty.');
  }
  return items.map((raw) => {
    const product = getProductById(raw.id);
    if (!product) throw new HttpError(400, `Unknown product: ${raw.id}`);
    if (product.soldOut) throw new HttpError(400, `${product.name} is sold out.`);

    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new HttpError(400, `Invalid quantity for ${product.name}.`);
    }
    if (product.sizes.length > 0) {
      if (!raw.size || !product.sizes.includes(raw.size)) {
        throw new HttpError(400, `Invalid size for ${product.name}.`);
      }
    }
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageBack,
      size: product.sizes.length > 0 ? raw.size : null,
      qty,
    };
  });
}

function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') throw new HttpError(400, 'Missing customer details.');
  const { firstName, lastName, email, phone, address, deliveryMethod } = customer;
  if (!firstName || !lastName) throw new HttpError(400, 'Full name is required.');
  if (!email || !EMAIL_RE.test(email)) throw new HttpError(400, 'A valid email is required.');
  if (!phone || phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'A valid phone number is required.');
  if (deliveryMethod === 'delivery' && (!address || address.trim().length < 5)) {
    throw new HttpError(400, 'Delivery address is required for home delivery.');
  }
  return {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    address: address ? String(address).trim() : null,
    deliveryMethod: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
  };
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

router.post('/', async (req, res) => {
  try {
    const { customer: rawCustomer, items: rawItems, paymentMethod } = req.body || {};

    if (!VALID_METHODS.includes(paymentMethod)) {
      throw new HttpError(400, 'Invalid payment method.');
    }

    const customer = validateCustomer(rawCustomer);
    const items = buildValidatedOrderItems(rawItems);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const deliveryFee =
      customer.deliveryMethod === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : STANDARD_DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    const order = db.createOrder({
      customer,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
    });

    const origin = `${req.protocol}://${req.get('host')}`;

    if (paymentMethod === 'dpo') {
      const session = await dpo.createPaymentSession({
        order,
        redirectUrl: `${origin}/api/payments/dpo/callback?order=${order.id}`,
        backUrl: `${origin}/checkout.html?cancelled=1`,
      });
      db.updateOrder(order.id, { paymentProviderRef: session.transactionToken });
      return res.json({ order, redirectUrl: session.paymentUrl, demo: session.demo });
    }

    if (paymentMethod === 'stripe') {
      const session = await stripe.createPaymentSession({
        order,
        successUrl: `${origin}/order-confirmation.html`,
        cancelUrl: `${origin}/checkout.html?cancelled=1`,
      });
      db.updateOrder(order.id, { paymentProviderRef: session.sessionId });
      return res.json({ order, redirectUrl: session.paymentUrl, demo: session.demo });
    }

    if (paymentMethod === 'eft') {
      return res.json({ order, bankDetails: manual.getBankDetails() });
    }

    if (paymentMethod === 'cod') {
      return res.json({ order });
    }

    if (paymentMethod === 'whatsapp') {
      const whatsappNumber = process.env.WHATSAPP_NUMBER || '264814149332';
      const lines = items.map((i) => `- ${i.name}${i.size ? ` (${i.size})` : ''} x${i.qty} — N$${(i.price * i.qty).toFixed(2)}`);
      const message =
        `New order ${order.reference}\n` +
        `${customer.firstName} ${customer.lastName} | ${customer.phone}\n\n` +
        lines.join('\n') +
        `\n\nSubtotal: N$${subtotal.toFixed(2)}\nDelivery: N$${deliveryFee.toFixed(2)}\nTotal: N$${total.toFixed(2)}` +
        (customer.deliveryMethod === 'delivery' ? `\n\nDeliver to: ${customer.address}` : '\n\nPickup order');
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      return res.json({ order, redirectUrl: whatsappUrl });
    }

    throw new HttpError(400, 'Unhandled payment method.');
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err); // eslint-disable-line no-console
    res.status(status).json({ error: err.message || 'Something went wrong.' });
  }
});

router.get('/orders/:id', (req, res) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

// Order tracking for the "Track Order" nav link — deliberately requires
// BOTH the order reference and the email it was placed under, not just the
// reference alone, so a guessed/leaked reference number can't be used to
// pull up a stranger's name, address, and order contents.
router.post('/track', (req, res) => {
  const { reference, email } = req.body || {};
  if (!reference || !email) {
    return res.status(400).json({ error: 'Enter your order reference and the email used at checkout.' });
  }
  const order = db.getOrderByReference(String(reference).trim().toUpperCase());
  if (!order || order.customer.email.toLowerCase() !== String(email).trim().toLowerCase()) {
    return res.status(404).json({ error: "We couldn't find an order matching that reference and email." });
  }
  res.json({ order });
});

module.exports = router;
