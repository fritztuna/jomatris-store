// ============================================================================
// Shared auth + wishlist client, loaded on every page.
//
// Talks to the backend's session-cookie auth (backend/src/routes/auth.js) —
// there is no client-side "logged in" flag to fake; every page asks the
// server who's actually logged in via /api/auth/me, and the wishlist only
// ever changes through the protected /api/wishlist endpoints.
//
// Usage on any page:
//   JomatrisAuth.ready.then(() => { ... })   // wait for the initial auth check
//   JomatrisAuth.user                         // null, or {id,name,email,wishlistCount}
//   JomatrisAuth.isSaved(productId)
//   JomatrisAuth.toggleWishlist(productId)    // returns a promise, throws if not logged in
//   JomatrisAuth.renderNavSlots()             // (re)paints the top-bar + hamburger auth areas
// ============================================================================

window.JomatrisAuth = (() => {
  let user = null;
  let wishlistIds = [];

  async function fetchMe() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) { user = null; wishlistIds = []; return; }
      const data = await res.json();
      user = data.user;
    } catch {
      user = null;
    }
  }

  async function fetchWishlist() {
    if (!user) { wishlistIds = []; return; }
    try {
      const res = await fetch('/api/wishlist', { credentials: 'include' });
      if (!res.ok) { wishlistIds = []; return; }
      const data = await res.json();
      wishlistIds = data.productIds || [];
    } catch {
      wishlistIds = [];
    }
  }

  const ready = (async () => {
    await fetchMe();
    await fetchWishlist();
    renderNavSlots();
  })();

  function isSaved(productId) {
    return wishlistIds.includes(productId);
  }

  async function toggleWishlist(productId) {
    if (!user) {
      throw new Error('NOT_LOGGED_IN');
    }
    const saved = isSaved(productId);
    const res = await fetch(`/api/wishlist${saved ? '/' + encodeURIComponent(productId) : ''}`, {
      method: saved ? 'DELETE' : 'POST',
      credentials: 'include',
      headers: saved ? {} : { 'Content-Type': 'application/json' },
      body: saved ? undefined : JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error('WISHLIST_FAILED');
    const data = await res.json();
    wishlistIds = data.productIds || [];
    if (user) user.wishlistCount = wishlistIds.length;
    renderNavSlots();
    return !saved; // returns the new saved state
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    user = null;
    wishlistIds = [];
    renderNavSlots();
    window.location.href = 'index.html';
  }

  // Paints whichever of these elements exist on the current page — every
  // page includes the ids it has, so this is safe to call anywhere.
  function renderNavSlots() {
    const topSlot = document.getElementById('topBarAuthSlot');
    const mobileSlot = document.getElementById('mobileAuthSlot');

    const topHTML = user
      ? `<a href="saved.html">Saved (${user.wishlistCount})</a><span class="tb-dot">·</span><a href="#" id="logoutLinkTop">Log Out</a>`
      : `<a href="login.html">Log In</a>`;
    const mobileHTML = user
      ? `<a href="saved.html">Saved (${user.wishlistCount})</a><a href="#" id="logoutLinkMobile">Log Out</a>`
      : `<a href="login.html">Log In / Sign Up</a>`;

    if (topSlot) {
      topSlot.innerHTML = topHTML;
      const btn = document.getElementById('logoutLinkTop');
      if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    }
    if (mobileSlot) {
      mobileSlot.innerHTML = mobileHTML;
      const btn = document.getElementById('logoutLinkMobile');
      if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    }
  }

  async function refresh() {
    await fetchMe();
    await fetchWishlist();
    renderNavSlots();
  }

  return {
    ready,
    get user() { return user; },
    isSaved,
    toggleWishlist,
    logout,
    renderNavSlots,
    refresh,
  };
})();
