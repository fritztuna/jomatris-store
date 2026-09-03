// ============================================================================
// Minimal file-backed order store.
//
// This is intentionally simple (a JSON file, one write at a time via a
// queue) so the project runs anywhere with zero extra infrastructure. It's
// fine for a small/early-stage store. When order volume grows, swap this
// module for a real database (Postgres, SQLite via better-sqlite3, etc.) —
// every other file only calls the functions exported here, so that's a
// one-file change.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');

// Very small write queue so concurrent requests can't corrupt the file.
let writeChain = Promise.resolve();
function readAll() {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function writeAll(orders) {
  writeChain = writeChain.then(
    () => fs.promises.writeFile(DB_FILE, JSON.stringify(orders, null, 2), 'utf8')
  );
  return writeChain;
}

function createOrder({ customer, items, subtotal, deliveryFee, total, paymentMethod }) {
  const orders = readAll();
  const order = {
    id: crypto.randomUUID(),
    reference: 'JMTS-' + Date.now().toString(36).toUpperCase(),
    customer,
    items,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    paymentStatus: 'pending', // pending -> paid | failed | cancelled
    paymentProviderRef: null,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  writeAll(orders);
  return order;
}

function getOrder(id) {
  return readAll().find((o) => o.id === id) || null;
}

function getOrderByReference(reference) {
  return readAll().find((o) => o.reference === reference) || null;
}

function getOrderByProviderRef(ref) {
  return readAll().find((o) => o.paymentProviderRef === ref) || null;
}

function updateOrder(id, patch) {
  const orders = readAll();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch, updatedAt: new Date().toISOString() };
  writeAll(orders);
  return orders[idx];
}

module.exports = { createOrder, getOrder, getOrderByReference, getOrderByProviderRef, updateOrder };
