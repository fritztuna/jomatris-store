// ============================================================================
// PRODUCT CATALOG — single source of truth.
//
// This used to be duplicated as a hardcoded array inside index.html, which is
// how two different tees ended up sharing id "1" (and "3", and "4"). That bug
// silently merged unrelated items in the cart and made "Quick View" open the
// wrong product. Keeping the catalog here means the frontend, the cart, and
// the order total calculation all agree on what a product actually costs —
// which also matters for security: prices are looked up from THIS file when
// an order is created, never trusted from the browser.
// ============================================================================

const PRODUCTS = [
  {
    id: 'jmts-cream-brown-tee', name: 'Cream-Brown JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_CREAM-BROWN_BACK.png',
    imageFront: 'images/clothing/JMTS_CREAM-BROWN_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jmts-brown-tee', name: 'Brown JMTS Tee', price: 399,
    imageBack: 'images/clothing/BROWN_JMTS_BACK.png',
    imageFront: 'images/clothing/BROWN_JMTS_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jmts-black-grey-tee', name: 'Black-Grey JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_BLACK-GREY_BACK.png',
    imageFront: 'images/clothing/JMTS_BLACK-GREY_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jmts-black-white-tee', name: 'Black-White JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_BLACK-WHITE_BACK.png',
    imageFront: 'images/clothing/JMTS_BLACK-WHITE_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jmts-grey-black-tee', name: 'Grey-Black JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_GREY-BLACK_BACK.png',
    imageFront: 'images/clothing/JMTS_GREY-BLACK_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jomatris-black-tee', name: 'Black Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_black_back.png',
    imageFront: 'images/clothing/jomatris_tee_black_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'XL'],
  },
  {
    id: 'jomatris-brown-tee', name: 'Brown Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_brown_back.png',
    imageFront: 'images/clothing/jomatris_tee_brown_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jomatris-cream-tee', name: 'Cream Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_cream_back.png',
    imageFront: 'images/clothing/jomatris_tee_cream_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jomatris-grey-tee', name: 'Grey Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_grey_back.png',
    imageFront: 'images/clothing/jomatris_tee_grey_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    // Was previously priced the same as a basic tee with sizes: [] (meaning
    // every size chip rendered disabled and it could never be bought at all).
    // Hoodies also cost more to produce than tees, so the price is bumped —
    // change back to 399 if that was intentional, but as shipped it looked
    // like a mistake.
    id: 'jomatris-black-hoodie', name: 'Black Jomatris Hoodie', price: 649,
    imageBack: 'images/clothing/jomatris_hoodie_black_back.png',
    imageFront: 'images/clothing/jomatris_hoodie_black_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
  },
];

function getAllProducts() {
  return PRODUCTS;
}

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

module.exports = { getAllProducts, getProductById };
