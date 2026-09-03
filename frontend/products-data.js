// ============================================================================
// PRODUCT CATALOG — shared by every page (index.html, cart.html, checkout.html,
// product.html).
//
// This used to be copy-pasted separately inside index.html, with duplicate
// ids ('1', '3', '4' each reused by two different products). That's what
// caused "wrong item in the cart" bugs: two unrelated tees could end up
// filed under the same id, so adding one after the other silently merged
// them into a single cart line that only remembered one image/name.
//
// Now there is exactly one copy for the frontend. cart.html uses this same
// list to double-check (and repair) anything already saved in a visitor's
// browser from before this fix — see the "healCart" function in cart.html.
//
// The backend (backend/src/products.js) keeps its own copy, because the
// server must never trust the browser for prices — but it should always
// match this one. If you add/remove/reprice a product, update both files.
//
// material/fit/care/model are placeholder copy — swap in your real fabric,
// fit notes, and care instructions. They're not used for pricing, so the
// backend doesn't need them.
// ============================================================================

window.JOMATRIS_PRODUCTS = [
  {
    id: 'jmts-cream-brown-tee', name: 'Cream-Brown JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_CREAM-BROWN_BACK.png',
    imageFront: 'images/clothing/JMTS_CREAM-BROWN_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jmts-brown-tee', name: 'Brown JMTS Tee', price: 399,
    imageBack: 'images/clothing/BROWN_JMTS_BACK.png',
    imageFront: 'images/clothing/BROWN_JMTS_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jmts-black-grey-tee', name: 'Black-Grey JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_BLACK-GREY_BACK.png',
    imageFront: 'images/clothing/JMTS_BLACK-GREY_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jmts-black-white-tee', name: 'Black-White JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_BLACK-WHITE_BACK.png',
    imageFront: 'images/clothing/JMTS_BLACK-WHITE_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jmts-grey-black-tee', name: 'Grey-Black JMTS Tee', price: 399,
    imageBack: 'images/clothing/JMTS_GREY-BLACK_BACK.png',
    imageFront: 'images/clothing/JMTS_GREY-BLACK_FRONT.png',
    badge: 'NEW', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jomatris-black-tee', name: 'Black Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_black_back.png',
    imageFront: 'images/clothing/jomatris_tee_black_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jomatris-brown-tee', name: 'Brown Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_brown_back.png',
    imageFront: 'images/clothing/jomatris_tee_brown_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jomatris-cream-tee', name: 'Cream Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_cream_back.png',
    imageFront: 'images/clothing/jomatris_tee_cream_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jomatris-grey-tee', name: 'Grey Jomatris Tee', price: 399,
    imageBack: 'images/clothing/jomatris_tee_grey_back.png',
    imageFront: 'images/clothing/jomatris_tee_grey_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '100% heavyweight cotton (240gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
  {
    id: 'jomatris-black-hoodie', name: 'Black Jomatris Hoodie', price: 649,
    imageBack: 'images/clothing/jomatris_hoodie_black_back.png',
    imageFront: 'images/clothing/jomatris_hoodie_black_front.png',
    badge: '', soldOut: false, sizes: ['S', 'M', 'L', 'XL'],
    material: '80% cotton / 20% polyester fleece (320gsm)', fit: 'Relaxed, oversized fit',
    care: 'Machine wash cold, inside out. Do not tumble dry.', model: 'Model is 180cm, wearing size L',
  },
];
