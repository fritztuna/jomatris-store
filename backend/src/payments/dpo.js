// ============================================================================
// DPO Group (Direct Pay Online / "DPO Pay") — card payment integration.
//
// Why DPO and not Stripe for the "local" option: Stripe does not currently
// let a business registered in Namibia open a merchant account and receive
// payouts. DPO Group is built for and operates across Africa, explicitly
// serves Namibia, and its hosted payment page accepts Visa/Mastercard from
// customers anywhere in the world — so it covers "sell to Namibia AND
// everyone else" in one integration. Stripe is wired in separately
// (see stripe.js) for whenever the business has an entity/account Stripe
// will accept, so both are available and the strongest one can be enabled
// per market.
//
// Flow (DPO's "API3G" token workflow):
//   1. We POST an XML createToken request with the amount/currency/urls.
//   2. DPO returns a TransactionToken.
//   3. We redirect the customer's browser to DPO's hosted payment page
//      (https://secure.3gdirectpay.com/payv2.php?ID=<token>) — card details
//      are typed on DPO's page, never on ours. This matters for security:
//      our server and our database never see a card number, so we are never
//      in PCI-DSS scope for card data.
//   4. DPO redirects back to redirectURL after payment; we call verifyToken
//      to confirm the real status server-side before marking the order paid
//      (never trust the redirect alone — a customer could just visit the
//      "success" URL without paying).
//
// SETUP REQUIRED before this works for real money:
//   - Register at https://dpogroup.com and obtain a Company Token.
//   - Set DPO_COMPANY_TOKEN and DPO_SERVICE_TYPE in your .env (see .env.example).
//   - Until those are set, this module runs in DEMO MODE: it fabricates a
//     token and a "would redirect here" URL instead of calling the real DPO
//     API, so the rest of the checkout flow is fully testable without a
//     merchant account.
// ============================================================================

const DPO_API_URL = 'https://secure.3gdirectpay.com/API/v6/';
const DPO_PAY_URL = 'https://secure.3gdirectpay.com/payv2.php';

function isConfigured() {
  return Boolean(process.env.DPO_COMPANY_TOKEN);
}

function buildCreateTokenXml({ order, redirectUrl, backUrl, currency }) {
  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const serviceType = process.env.DPO_SERVICE_TYPE || '0000'; // set by DPO when they approve your account
  const now = new Date();
  const serviceDate = now.toISOString().slice(0, 10).replace(/-/g, '/') + ' ' + now.toTimeString().slice(0, 5);

  return `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${order.total.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${currency}</PaymentCurrency>
    <CompanyRef>${order.reference}</CompanyRef>
    <RedirectURL>${redirectUrl}</RedirectURL>
    <BackURL>${backUrl}</BackURL>
    <customerEmail>${order.customer.email}</customerEmail>
    <customerFirstName>${order.customer.firstName}</customerFirstName>
    <customerLastName>${order.customer.lastName}</customerLastName>
    <customerPhone>${order.customer.phone}</customerPhone>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${serviceType}</ServiceType>
      <ServiceDescription>Jomatris order ${order.reference}</ServiceDescription>
      <ServiceDate>${serviceDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`;
}

function parseXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

async function createPaymentSession({ order, redirectUrl, backUrl, currency = 'NAD' }) {
  if (!isConfigured()) {
    // DEMO MODE — no real DPO account configured yet.
    const fakeToken = 'DEMO-' + order.reference;
    return {
      demo: true,
      transactionToken: fakeToken,
      paymentUrl: `${DPO_PAY_URL}?ID=${fakeToken}&demo=true`,
    };
  }

  const xmlBody = buildCreateTokenXml({ order, redirectUrl, backUrl, currency });
  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xmlBody,
  });
  const text = await res.text();
  const result = parseXmlTag(text, 'Result');
  const transactionToken = parseXmlTag(text, 'TransToken');

  if (result !== '000' || !transactionToken) {
    const explanation = parseXmlTag(text, 'ResultExplanation') || 'Unknown DPO error';
    throw new Error(`DPO createToken failed: ${explanation}`);
  }

  return {
    demo: false,
    transactionToken,
    paymentUrl: `${DPO_PAY_URL}?ID=${transactionToken}`,
  };
}

async function verifyPayment(transactionToken) {
  if (!isConfigured() || transactionToken.startsWith('DEMO-')) {
    // DEMO MODE — pretend it succeeded so the flow can be tested end to end.
    return { paid: true, demo: true, explanation: 'Demo mode — no real payment was taken.' };
  }

  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transactionToken}</TransactionToken>
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xmlBody,
  });
  const text = await res.text();
  const result = parseXmlTag(text, 'Result');
  const explanation = parseXmlTag(text, 'ResultExplanation') || '';

  return { paid: result === '000', demo: false, explanation };
}

module.exports = { isConfigured, createPaymentSession, verifyPayment };
