const express = require('express');
const { getAllProducts } = require('../products');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllProducts());
});

module.exports = router;
