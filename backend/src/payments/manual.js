// ============================================================================
// Manual payment methods: bank transfer / EFT and cash-on-delivery.
//
// These matter for Namibia specifically — EFT and cash-on-delivery are still
// the most-used payment methods for online orders there, alongside mobile
// money. They also need zero third-party setup, so they work from day one
// and act as a fallback if a card gateway is ever down.
//
// Nothing here processes money automatically: the order is created with
// paymentStatus "pending", and you (the store owner) confirm the transfer
// arrived and mark the order paid from the admin endpoint. That's a
// deliberate, safe default for a manual flow — never auto-mark "paid"
// without a real signal.
// ============================================================================

function getBankDetails() {
  return {
    accountName: process.env.BANK_ACCOUNT_NAME || 'F & N / Jomatris (set BANK_ACCOUNT_NAME in .env)',
    bankName: process.env.BANK_NAME || 'Set BANK_NAME in .env',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'Set BANK_ACCOUNT_NUMBER in .env',
    branchCode: process.env.BANK_BRANCH_CODE || 'Set BANK_BRANCH_CODE in .env',
  };
}

module.exports = { getBankDetails };
