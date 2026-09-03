# Jomatris — Website + Backend

## What changed from the original

**Bugs fixed (round 1):**
- Duplicate product IDs (two tees shared `id:'1'`, two shared `'3'`, two shared `'4'`) — this broke Quick View (opened the wrong product) and could merge unrelated items in the cart.
- Broken image: `jomatris_studio_graphic_1.png` → actual file is `jomatris_studio**s**_graphic_1.png`.
- Broken favicon on the cart page (wrong path).
- Broken social-share image (`og:image` pointed at a path that doesn't exist) + placeholder `og:url`. Added a Twitter card too.
- The hoodie had `sizes: []`, which meant every size button was disabled and it could never actually be bought.
- The "Proceed to Checkout" button did nothing at all — no click handler existed.

**Bugs fixed (round 2):**
- The product catalog now lives in exactly **one shared file for the frontend** (`frontend/products-data.js`), used by `index.html`, `cart.html`, and implicitly `checkout.html`. It's a copy of what's in `backend/src/products.js` — keep both in sync if you add/edit a product. This is also what fixes "wrong image in the cart": I ran the actual add-to-cart flow for every product through a real DOM and confirmed each one pairs with its correct image — the mismatches you saw were **stale cart entries saved in your browser before the duplicate-ID fix**, which the current code can't retroactively repair on its own.
- `cart.html` now **self-heals** on load: every saved cart item is checked against the current catalog and its name/price/image are refreshed if they don't match; anything whose product no longer exists is removed with a visible notice. A **Clear Cart** button was added as a manual reset option.
- Every product/cart image now has a fallback if it fails to load, instead of a broken-image icon.
- **Size selection**: previously, once you picked a size the only way to change it was picking a *different* size — there was no way to cancel back to "no size chosen". Fixed two ways: (1) clicking the already-selected size again toggles it off, (2) tapping anywhere outside all product cards (empty page space, nav, footer, hero) clears any selected-but-not-added size. Deliberately does **not** clear a selection when you pick a size on a *different* product — so choosing sizes for two items before adding them both to cart still works.
- **Dead links audit**: Terms & Conditions, Privacy Policy, FAQ, Support, Contact, Returns, and the footer's Size Guide link were all `href="#"` — real destinations now exist (`faq.html`, `terms.html`, `privacy.html`), and footer Size Guide opens the existing size guide modal instead of doing nothing. The social icons (Instagram/Twitter/Facebook) are still placeholder links — send over your actual handles and those can be wired up too.
- `terms.html` and `privacy.html` are clearly-marked **drafts**, not legal advice — replace the text or have a lawyer review before relying on them.

**New: a real backend, because the old cart had nowhere to go**
- Node/Express server that serves the frontend and an API.
- Product prices are calculated **server-side** from the catalog, not trusted from the browser — the old version would have let anyone with devtools open change a price before checkout.
- A real checkout page (`checkout.html`) collecting contact + delivery details, with **five payment options**:
  - **DPO Pay** (card, Namibia-based, accepts Visa/Mastercard from anywhere) — the realistic option for a Namibian business selling internationally, since Stripe currently doesn't support Namibian merchant accounts.
  - **Stripe Checkout** — wired in and ready for whenever you have an entity/account Stripe accepts, no code changes needed then.
  - **Bank transfer / EFT** — no setup required, works today.
  - **Cash on delivery / pickup** — no setup required.
  - **WhatsApp order** — sends a prefilled order summary to your WhatsApp.
- All card payment happens on the payment provider's own hosted page — card numbers never touch your server.
- Order confirmation page, with payment status verified server-side (never trusts a redirect by itself).

## Running it locally

```bash
cd backend
npm install
cp .env.example .env    # fill in what you have — anything left blank runs in demo mode
npm start
```

Open **http://localhost:3000** — the frontend and API are served from the same origin. The site also works if you just double-click `frontend/index.html` directly (no backend running) — browsing and the cart work fine that way; only the actual checkout/payment step needs the backend.

## Going live for real

1. **DPO Pay**: register at dpogroup.com, get your Company Token + Service Type, put them in `.env`.
2. **Stripe** (optional, international): only usable once you have a Stripe-eligible entity — see the comment at the top of `backend/src/payments/stripe.js` for why.
3. **Bank details**: fill in `BANK_ACCOUNT_NAME` / `BANK_NAME` / `BANK_ACCOUNT_NUMBER` / `BANK_BRANCH_CODE` in `.env` so the EFT option shows real details.
4. **WhatsApp number**: set `WHATSAPP_NUMBER`.
5. Deploy the `backend` folder to any Node host (Render, Railway, a VPS, etc.) — it serves the frontend too, so that's the whole deployment.
6. Put the site behind HTTPS (most hosts do this for you) — required for real card payments.
7. The order store (`backend/src/data/orders.json`) is a simple file for now — fine for getting started, but swap it for a real database once order volume grows. Everything else only talks to `db.js`, so that's a one-file change.
8. Fill in real content for `terms.html` and `privacy.html`, and add your real social links in the footer of `index.html`/`cart.html`.
9. If any customer reports a "wrong item in cart" issue again after you deploy this, it's worth asking them to use the new **Clear Cart** button once — that guarantees a clean slate, same as the automatic healing does.

## Round 3 — from an external review

**Implemented:**
- **Product detail pages** (`product.html?id=...`) — click any product image/title (or "View Full Details" in Quick View) to reach a full page: gallery with thumbnails, material/fit/care info, size guide, quantity picker, related products, and Product structured data (JSON-LD) for SEO.
- **Product data now includes material/fit/care/model fields** — currently placeholder text, edit `frontend/products-data.js` with your real fabric/fit details.
- Fixed the generic "Premium cotton streetwear. Built for everyday." copy in Quick View — it's now pulled from each product's real material/fit info instead.
- **Mobile pass**: Quick View modal no longer overflows short phone screens (scrolls internally instead), cart items on narrow phones (≤480px) reflow into a cleaner stacked layout instead of cramming into one row.
- **SEO basics**: `robots.txt`, `sitemap.xml` (domain is a placeholder — fill in once you have a real deployed URL), Product structured data on `product.html`.
- Softened the "24/7 Support" trust-bar claim to "WhatsApp Support" — unless you actually staff support around the clock, that claim reads as a promise you can't keep.
- Commented out `og:url`/canonical pointing at `jomatris.com` in `index.html` — don't turn those back on until you actually own/deploy to that domain.
- Fixed a stale "7+ Products" stat in the About section (now correctly 9+).
- Expanded the delivery/returns FAQ with the specifics that were missing, and flagged with a visible ⚠️ note exactly which parts still need your real details (delivery times by region, pickup address/hours) — no invented numbers.

**Not done — needs you, not code:**
- Real payment merchant accounts (DPO/Stripe) — nobody but you can register these.
- Professional photography — outside what I can produce.
- The actual "why JOMATRIS exists" brand story — the current About copy is reasonable but generic; only you can write the real one.
- Confirming "Nationwide Delivery" and "100% Local / Made NA" (already on the site, not added by me) are literally true for your operation before launch.

## Round 4 — colorway swap (Red → Cream, added Grey)

- Replaced the "Red Jomatris Tee" with "Cream Jomatris Tee" (id changed from `jomatris-red-tee` to `jomatris-cream-tee`) and added a new "Grey Jomatris Tee" (`jomatris-grey-tee`), both in `frontend/products-data.js` **and** `backend/src/products.js`.
- New images placed in `frontend/images/clothing/`: `jomatris_tee_cream_back.png`, `jomatris_tee_cream_front.png`, `jomatris_tee_grey_back.png`, `jomatris_tee_grey_front.png`. The old `jomatris_tee_red_*.png` files were removed since nothing references them anymore.
- Updated `sitemap.xml` and the About section's product count stat to match.
- **Found and fixed a real bug while verifying this**: the backend's fallback route was serving `index.html` with a 200 status for *any* unmatched path — including a deleted image — instead of a proper 404. That masked exactly this kind of "did I actually remove the old file everywhere" check. Fixed in `backend/server.js`: paths that look like a file (have an extension) now correctly 404 when missing.

### How to swap or add a product's image yourself next time

Two files always need to change together — miss one and the site and the checkout will disagree with each other:

1. **Drop the image files in `frontend/images/clothing/`.** Keep the naming pattern already in use — e.g. `jomatris_tee_<color>_back.png` / `_front.png`.
2. **Edit `frontend/products-data.js`** — find the product's block (search for its current name or id) and update `imageBack`/`imageFront` to the new filenames. If it's a genuinely new color rather than a swap, copy an existing block, give it a unique `id` (short, lowercase, hyphenated — e.g. `jomatris-grey-tee`), and set its `name`, `price`, and `sizes`.
3. **Make the identical change in `backend/src/products.js`.** This file only needs `id`, `name`, `price`, `imageBack`, `imageFront`, `badge`, `soldOut`, `sizes` — it doesn't carry `material`/`fit`/`care`, those are frontend-only.
4. **If you removed a color entirely** (not just replacing an image), also check `frontend/sitemap.xml` for a `product.html?id=...` line using the old id, and delete the now-unused image files from `frontend/images/clothing/` so they don't linger.
5. **Restart the backend** (`npm start` in `backend/`) and refresh the page — no other step needed.

A quick way to sanity-check you got both files in sync: search the whole project for the old id/filename (e.g. `grep -r "jomatris-red-tee" .` from the project root) — if anything still matches, that's a spot you missed.

## Round 5 — real accounts, wishlist, and a proper nav split

**Navigation redesign:**
- The hamburger is now **mobile-only** (hidden above 768px via CSS) — on desktop, the **top bar** is the nav, centered as a single row instead of pinned to the corners.
- The top bar now carries FAQ, Support, Track Order, Terms & Conditions, Privacy Policy, and an account slot (Log In, or "Saved (N)" + Log Out once logged in).
- The mobile hamburger menu absorbs everything the top bar has, since the top bar disappears entirely on mobile — nothing is reachable-on-desktop-only anymore.
- Applied consistently to `index.html`, `cart.html`, and `product.html`. `checkout.html` and the smaller utility pages (`faq.html`, `terms.html`, `privacy.html`, `order-confirmation.html`) intentionally keep their lean "back to shop" navbar — stripping distractions from checkout is a deliberate, common ecommerce pattern, not an oversight.
- Found and fixed a real bug while doing this: `cart.html` had its own separate copy of the old dead `href="#"` top-bar links that an earlier round only fixed on `index.html`. Now fixed there too.
- Also fixed a genuine contrast bug in Quick View: the description text and close button were dark grey on a near-black background — effectively invisible. Now legible.

**Real user accounts (this needed actual login, not just a UI toggle):**
- `backend/src/users.js` / `sessions.js` — JSON-file-backed accounts and sessions, same pattern as orders. Passwords are hashed with bcrypt and never stored in plain text.
- Session tokens live in an httpOnly, sameSite=lax cookie — never readable by page JavaScript, which is the main defense against a script stealing a session.
- `backend/src/routes/auth.js` — signup / login / logout / me, all rate-limited against brute-force attempts.
- `frontend/login.html` — combined login/signup page; `frontend/auth-nav.js` — shared client that every page loads to ask the server who's logged in and paint the top-bar/hamburger auth slot accordingly.

**Wishlist (save button):**
- Only works when logged in — `backend/src/routes/wishlist.js` requires a valid session for every request, so it's enforced server-side, not just hidden in the UI.
- Save button (heart icon) added to **Quick View** and to the **product detail page**. Clicking it while logged out shows "Log in to save items" instead of silently failing.
- `frontend/saved.html` — the "Saved (N)" link in both the top bar and hamburger opens this page, listing everything saved with a way to remove items.

**Bonus, from researching what belongs in ecommerce nav bars:** added a **Track Order** page (`frontend/track-order.html`) — looks up an order by reference *and* the email it was placed under (not reference alone, so a leaked/guessed reference number can't pull up a stranger's order).

## Still worth adding later
- Email confirmation on order placement.
- Admin view to mark EFT/COD orders as paid and see order history.
- Real inventory/stock counts instead of hand-maintained sizes.
- A newsletter signup that actually saves emails somewhere (currently cosmetic).
- Real social media links.

