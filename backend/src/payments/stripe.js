// ============================================================================
// Stripe Checkout — for international customers, once you have a Stripe
// account that can go with your business.
//
// Honest caveat up front: Stripe does not currently allow a business
// registered in Namibia to sign up directly and receive payouts. To use this
// for real, one of these needs to be true first:
//   - You incorporate/operate the business through an entity in a country
//     Stripe fully supports (common route: a US LLC via a formation service
//     like Stripe Atlas, Firstbase, etc.), or
//   - Stripe expands support to Namibia in the future, or
//   - You use a Stripe-powered reseller/PSP that already has Namibian
//     merchant support (worth checking periodically — this changes).
// None of that blocks shipping this code now: it's a normal Stripe Checkout
// integration, so the moment STRIPE_SECRET_KEY is set in .env it works,
// with zero other changes needed. Until then it runs in DEMO MODE like the
// DPO module, so you can test the full checkout flow today.
//
// Security note: like DPO, this uses Stripe's HOSTED Checkout page — card
// numbers are typed on Stripe's page, never sent to or stored on our
// server, so we stay out of PCI-DSS scope for card data.
// ============================================================================

function isConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function createPaymentSession({ order, successUrl, cancelUrl, currency = 'usd' }) {
  if (!isConfigured()) {
    return {
      demo: true,
      sessionId: 'DEMO-' + order.reference,
      paymentUrl: `${successUrl}?demo=true&order=${order.id}`,
    };
  }

  // Lazy-require so the app runs fine without the `stripe` package installed
  // until you actually configure Stripe.
  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: order.items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name + (item.size ? ` (${item.size})` : '') },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    })),
    customer_email: order.customer.email,
    client_reference_id: order.reference,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order=${order.id}`,
    cancel_url: cancelUrl,
  });

  return { demo: false, sessionId: session.id, paymentUrl: session.url };
}

async function verifyPayment(sessionId) {
  if (!isConfigured() || sessionId.startsWith('DEMO-')) {
    return { paid: true, demo: true, explanation: 'Demo mode — no real payment was taken.' };
  }
  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return { paid: session.payment_status === 'paid', demo: false, explanation: session.payment_status };
}

module.exports = { isConfigured, createPaymentSession, verifyPayment };
