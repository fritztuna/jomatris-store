const express = require('express');
const users = require('../users');
const { getProductById } = require('../products');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ productIds: req.user.wishlist });
});

router.post('/', requireAuth, (req, res) => {
  const { productId } = req.body || {};
  if (!productId || !getProductById(productId)) {
    return res.status(400).json({ error: 'Unknown product.' });
  }
  const wishlist = req.user.wishlist.includes(productId)
    ? req.user.wishlist
    : [...req.user.wishlist, productId];
  const updated = users.updateUser(req.user.id, { wishlist });
  res.json({ productIds: updated.wishlist });
});

router.delete('/:productId', requireAuth, (req, res) => {
  const wishlist = req.user.wishlist.filter((id) => id !== req.params.productId);
  const updated = users.updateUser(req.user.id, { wishlist });
  res.json({ productIds: updated.wishlist });
});

module.exports = router;
