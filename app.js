// Live feed URL pointing to your offers.json file on GitHub so already-installed apps sync updates when online
const LIVE_FEED_URL =
  "https://raw.githubusercontent.com/saningo6252-ship-it/BINGWA-DATA-SWIFT-./main/offers.json";

// WhatsApp invite link when visitors/users use the WhatsApp/download flow
const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/DB9snd9pSXf9vVrTN3vhTR?s=cl&p=a&iam=2";

// Admin PIN
const ADMIN_PIN = "2026";

const STORAGE_KEYS = {
  BUNDLES: "bsds_bundles_v1",
  ADS: "bsds_ads_v1",
  TILL: "bsds_till_v1",
  PROFILE: "bsds_profile_v1",
  HISTORY: "bsds_history_v1",
};

const DEFAULT_BUNDLES = [
  { id: "saf-d-1", network: "Safaricom", name: "10MB + 75 SMS", category: "Data", validity: "24Hrs", price: 8, active: true },
  { id: "saf-d-4", network: "Safaricom", name: "100MB", category: "Data", validity: "24Hrs", price: 20, active: true },
  { id: "saf-d-8", network: "Safaricom", name: "1GB", category: "Data", validity: "24Hrs", price: 99, active: true },
  { id: "saf-m-1", network: "Safaricom", name: "50 Mins", category: "Minutes", validity: "24Hrs", price: 20, active: true },
  { id: "saf-s-1", network: "Safaricom", name: "100 SMS", category: "SMS", validity: "24Hrs", price: 10, active: true },
  { id: "air-d-4", network: "Airtel", name: "1GB", category: "Data", validity: "24Hrs", price: 50, active: true },
  { id: "tel-d-4", network: "Telkom", name: "1GB", category: "Data", validity: "24Hrs", price: 50, active: true },
  { id: "fai-d-1", network: "Faiba", name: "1GB", category: "Data", validity: "24Hrs", price: 40, active: true },
];

const DEFAULT_ADS = [
  {
    id: "ad1",
    title: "Bingwa Data Swift — All Networks",
    subtitle: "Safaricom, Airtel, Telkom & Faiba deals • Zero-data browsing after install.",
    image: "",
  },
  {
    id: "ad2",
    title: "Instant M-Pesa Checkout",
    subtitle: "Offline USSD + online STK Push for you or any recipient.",
    image: "",
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Seed local storage on first install so browsing works with zero data
if (!localStorage.getItem(STORAGE_KEYS.BUNDLES)) {
  writeJson(STORAGE_KEYS.BUNDLES, DEFAULT_BUNDLES);
}
if (!localStorage.getItem(STORAGE_KEYS.ADS)) {
  writeJson(STORAGE_KEYS.ADS, DEFAULT_ADS);
}
if (!localStorage.getItem(STORAGE_KEYS.TILL)) {
  localStorage.setItem(STORAGE_KEYS.TILL, "522522");
}

let state = {
  bundles: readJson(STORAGE_KEYS.BUNDLES, DEFAULT_BUNDLES),
  ads: readJson(STORAGE_KEYS.ADS, DEFAULT_ADS),
  till: localStorage.getItem(STORAGE_KEYS.TILL) || "522522",
  profile: readJson(STORAGE_KEYS.PROFILE, { name: "Swift Customer", phone: "", avatar: "" }),
  history: readJson(STORAGE_KEYS.HISTORY, []),
  activeNetwork: "All",
  activeCategory: "All",
  searchQuery: "",
  adIndex: 0,
  selectedBundle: null,
  isAdmin: false,
  secretTaps: 0,
};

// DOM References
const downloadGate = document.getElementById("downloadGate");
const appShell = document.getElementById("appShell");
const connectionBadge = document.getElementById("connectionBadge");
const bundlesList = document.getElementById("bundlesList");
const historyList = document.getElementById("historyList");
const adBannerTitle = document.getElementById("adBannerTitle");
const adBannerSubtitle = document.getElementById("adBannerSubtitle");
const adBannerImage = document.getElementById("adBannerImage");
const adDots = document.getElementById("adDots");
const bottomNav = document.getElementById("bottomNav");

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionBadge.textContent = online ? "Online • Ready to Sync" : "Offline Cache Mode (0 Data)";
  connectionBadge.className = `conn-pill ${online ? "online" : "offline"}`;
}

// Download Landing Gate (?download=1 opens the Download App screen)
function initDownloadGate() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("download") === "1") {
    downloadGate.classList.remove("hidden");
    appShell.classList.add("hidden");
  }
}

document.getElementById("downloadAppBtn").addEventListener("click", () => {
  window.location.href = WHATSAPP_GROUP_URL;
});

document.getElementById("openWebAppBtn").addEventListener("click", () => {
  downloadGate.classList.add("hidden");
  appShell.classList.remove("hidden");
});

document.getElementById("shareLinkBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(WHATSAPP_GROUP_URL);
    alert(`WhatsApp link copied:\n${WHATSAPP_GROUP_URL}`);
  } catch {
    prompt("Copy your WhatsApp link:", WHATSAPP_GROUP_URL);
  }
});

// Ad Banner Carousel (Zero-data from local cache)
function renderAdCarousel() {
  if (!state.ads.length) return;
  if (state.adIndex >= state.ads.length) state.adIndex = 0;

  const ad = state.ads[state.adIndex];
  adBannerTitle.textContent = ad.title;
  adBannerSubtitle.textContent = ad.subtitle;

  if (ad.image) {
    adBannerImage.src = ad.image;
    adBannerImage.classList.remove("hidden");
  } else {
    adBannerImage.classList.add("hidden");
  }

  adDots.innerHTML = "";
  state.ads.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `ad-dot ${idx === state.adIndex ? "active" : ""}`;
    dot.ariaLabel = `Slide ${idx + 1}`;
    dot.addEventListener("click", () => {
      state.adIndex = idx;
      renderAdCarousel();
    });
    adDots.appendChild(dot);
  });
}

setInterval(() => {
  if (state.ads.length > 1) {
    state.adIndex = (state.adIndex + 1) % state.ads.length;
    renderAdCarousel();
  }
}, 4500);

// Bundles Storefront (Zero-data from local state/cache)
function renderBundles() {
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = state.bundles.filter((b) => {
    if (b.active === false) return false;
    const net = b.network || "Safaricom";
    const matchesNet = state.activeNetwork === "All" || net === state.activeNetwork;
    const matchesCat = state.activeCategory === "All" || b.category === state.activeCategory;
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      net.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.validity.toLowerCase().includes(q);
    return matchesNet && matchesCat && matchesSearch;
  });

  if (!filtered.length) {
    bundlesList.innerHTML = `<div class="bundle-card"><span class="muted-note">No matching offers found.</span></div>`;
    return;
  }

  bundlesList.innerHTML = "";
  filtered.forEach((bundle) => {
    const netLabel = bundle.network ? `${bundle.network} • ` : "";
    const card = document.createElement("div");
    card.className = "bundle-card";
    card.innerHTML = `
      <div>
        <div class="bundle-title">${netLabel}${bundle.name}</div>
        <div class="muted-note">${bundle.category} • Available: ${bundle.validity}</div>
      </div>
      <div style="text-align:right;">
        <div class="bundle-price">KES ${bundle.price}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:6px;" type="button">Buy Now</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => openPurchaseModal(bundle));
    bundlesList.appendChild(card);
  });
}

document.getElementById("bundleSearchInput").addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  renderBundles();
});

document.querySelectorAll(".net-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".net-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeNetwork = btn.dataset.network;
    renderBundles();
  });
});

document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeCategory = btn.dataset.category;
    renderBundles();
  });
});

// Purchase Modal (Offline USSD + Online STK)
const purchaseModal = document.getElementById("purchaseModal");
const modalBundleTitle = document.getElementById("modalBundleTitle");
const modalBundleMeta = document.getElementById("modalBundleMeta");
const recipientPhoneInput = document.getElementById("recipientPhoneInput");
const paymentModeSelect = document.getElementById("paymentModeSelect");
const purchaseFeedback = document.getElementById("purchaseFeedback");

function openPurchaseModal(bundle) {
  state.selectedBundle = bundle;
  const netText = bundle.network ? `${bundle.network} — ` : "";
  modalBundleTitle.textContent = `${netText}${bundle.name}`;
  modalBundleMeta.textContent = `${bundle.category} • Price: KES ${bundle.price} • Available: ${bundle.validity}`;
  recipientPhoneInput.value = state.profile.phone || "";
  purchaseFeedback.textContent = "";
  purchaseModal.classList.remove("hidden");
}

document.getElementById("closePurchaseModal").addEventListener("click", () => {
  purchaseModal.classList.add("hidden");
});

document.getElementById("purchaseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!state.selectedBundle) return;

  const recipient = recipientPhoneInput.value.trim();
  const modePref = paymentModeSelect.value;
  const useOfflineUssd =
    modePref === "ussd" || (modePref === "auto" && !navigator.onLine);

  const record = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    bundleName: `${state.selectedBundle.network ? `${state.selectedBundle.network} ` : ""}${state.selectedBundle.name}`,
    amount: state.selectedBundle.price,
    recipient,
    method: useOfflineUssd ? "Offline USSD" : "M-Pesa STK",
    status: "Initiated",
    date: new Date().toLocaleString(),
  };

  state.history.unshift(record);
  writeJson(STORAGE_KEYS.HISTORY, state.history);
  renderHistory();
  renderAdminOrders();

  if (useOfflineUssd) {
    const ussdCode = `*334*1*${state.till}*${state.selectedBundle.price}#`;
    purchaseFeedback.textContent = `Offline USSD ready (Till ${state.till}, KES ${state.selectedBundle.price}). Saved to History.`;
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
  } else {
    purchaseFeedback.textContent = `STK prompt prepared for ${recipient} (KES ${state.selectedBundle.price}). Saved to History.`;
  }
});

// History View
function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = `<div class="history-card"><span class="muted-note">No purchases yet.</span></div>`;
    return;
  }

  historyList.innerHTML = state.history
    .map(
      (item) => `
      <div class="history-card">
        <div style="display:flex;justify-content:space-between;font-weight:700;">
          <span>${item.bundleName} — KES ${item.amount}</span>
          <span>${item.id}</span>
        </div>
        <div class="muted-note" style="margin-top:4px;">
          To: ${item.recipient} • ${item.method} • ${item.status}
        </div>
        <div class="muted-note" style="font-size:0.78rem;margin-top:2px;">${item.date}</div>
      </div>
    `
    )
    .join("");
}

// Profile & Device Gallery Upload
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileAvatarFallback = document.getElementById("profileAvatarFallback");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileDisplayPhone = document.getElementById("profileDisplayPhone");
const profileNameInput = document.getElementById("profileNameInput");
const profilePhoneInput = document.getElementById("profilePhoneInput");
const profileSaveMsg = document.getElementById("profileSaveMsg");

function renderProfile() {
  const name = state.profile.name || "Swift Customer";
  profileDisplayName.textContent = name;
  profileDisplayPhone.textContent = state.profile.phone || "No phone set yet";
  profileNameInput.value = state.profile.name || "";
  profilePhoneInput.value = state.profile.phone || "";
  profileAvatarFallback.textContent = name.charAt(0).toUpperCase() || "U";

  if (state.profile.avatar) {
    profileAvatarImg.src = state.profile.avatar;
    profileAvatarImg.classList.remove("hidden");
    profileAvatarFallback.classList.add("hidden");
  } else {
    profileAvatarImg.classList.add("hidden");
    profileAvatarFallback.classList.remove("hidden");
  }
}

document.getElementById("galleryPhotoInput").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.profile.avatar = String(reader.result);
    writeJson(STORAGE_KEYS.PROFILE, state.profile);
    renderProfile();
    profileSaveMsg.textContent = "Profile picture updated from gallery.";
  };
  reader.readAsDataURL(file);
});

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.profile.name = profileNameInput.value.trim() || "Swift Customer";
  state.profile.phone = profilePhoneInput.value.trim();
  writeJson(STORAGE_KEYS.PROFILE, state.profile);
  renderProfile();
  profileSaveMsg.textContent = "Profile saved locally.";
});

// Navigation (Admin tab is never shown to regular users)
function switchView(targetId) {
  if (targetId === "viewAdmin" && !state.isAdmin) return;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(targetId)?.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === targetId);
  });
}

function renderBottomNav() {
  const existingAdminTab = bottomNav.querySelector('[data-target="viewAdmin"]');
  if (state.isAdmin && !existingAdminTab) {
    const adminBtn = document.createElement("button");
    adminBtn.className = "nav-btn";
    adminBtn.dataset.target = "viewAdmin";
    adminBtn.type = "button";
    adminBtn.textContent = "Admin";
    adminBtn.addEventListener("click", () => switchView("viewAdmin"));
    bottomNav.appendChild(adminBtn);
  } else if (!state.isAdmin && existingAdminTab) {
    existingAdminTab.remove();
  }
}

bottomNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (btn?.dataset.target) switchView(btn.dataset.target);
});

// Hidden Admin Access Gate (5 taps on footer hint opens PIN modal)
const adminAuthModal = document.getElementById("adminAuthModal");
const adminPinInput = document.getElementById("adminPinInput");
const adminAuthError = document.getElementById("adminAuthError");

document.getElementById("secretAdminTrigger").addEventListener("click", () => {
  state.secretTaps += 1;
  if (state.secretTaps >= 5) {
    state.secretTaps = 0;
    adminPinInput.value = "";
    adminAuthError.textContent = "";
    adminAuthModal.classList.remove("hidden");
  }
});

document.getElementById("closeAdminAuthModal").addEventListener("click", () => {
  adminAuthModal.classList.add("hidden");
});

document.getElementById("adminAuthForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (adminPinInput.value === ADMIN_PIN) {
    state.isAdmin = true;
    adminAuthModal.classList.add("hidden");
    renderBottomNav();
    renderAdminPanel();
    switchView("viewAdmin");
  } else {
    adminAuthError.textContent = "Invalid admin PIN.";
  }
});

document.getElementById("adminLogoutBtn").addEventListener("click", () => {
  state.isAdmin = false;
  renderBottomNav();
  switchView("viewHome");
});

// Admin Panel: Till, Ads Upload, Bundles & Orders
function renderAdminPanel() {
  document.getElementById("adminTillInput").value = state.till;
  renderAdminAds();
  renderAdminBundles();
  renderAdminOrders();
}

document.getElementById("saveTillBtn").addEventListener("click", () => {
  const val = document.getElementById("adminTillInput").value.trim();
  if (!val) return;
  state.till = val;
  localStorage.setItem(STORAGE_KEYS.TILL, state.till);
  document.getElementById("adminTillMsg").textContent = `Saved Till/Paybill: ${state.till}`;
});

document.getElementById("adminAdForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("adTitleInput").value.trim();
  const subtitle = document.getElementById("adSubtitleInput").value.trim();
  const file = document.getElementById("adImageFileInput").files?.[0];

  const saveAd = (imgDataUrl) => {
    state.ads.unshift({
      id: `ad-${Date.now()}`,
      title,
      subtitle,
      image: imgDataUrl || "",
    });
    writeJson(STORAGE_KEYS.ADS, state.ads);
    renderAdCarousel();
    renderAdminAds();
    e.target.reset();
    document.getElementById("adminAdMsg").textContent =
      "Banner published locally. Update offers.json on GitHub to push to other devices.";
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => saveAd(String(reader.result));
    reader.readAsDataURL(file);
  } else {
    saveAd("");
  }
});

function renderAdminAds() {
  const container = document.getElementById("adminAdsList");
  container.innerHTML = state.ads
    .map(
      (ad) => `
      <div class="admin-item-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <strong>${ad.title}</strong>
          <div class="muted-note">${ad.subtitle}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-del-ad="${ad.id}" type="button">Remove</button>
      </div>
    `
    )
    .join("");

  container.querySelectorAll("[data-del-ad]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ads = state.ads.filter((a) => a.id !== btn.dataset.delAd);
      writeJson(STORAGE_KEYS.ADS, state.ads);
      renderAdCarousel();
      renderAdminAds();
    });
  });
}

const bundleIdInput = document.getElementById("bundleIdInput");
const bundleNameInput = document.getElementById("bundleNameInput");
const bundleCategoryInput = document.getElementById("bundleCategoryInput");
const bundleValidityInput = document.getElementById("bundleValidityInput");
const bundlePriceInput = document.getElementById("bundlePriceInput");

document.getElementById("adminBundleForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = bundleIdInput.value || `b-${Date.now()}`;
  const item = {
    id,
    network: state.activeNetwork === "All" ? "Safaricom" : state.activeNetwork,
    name: bundleNameInput.value.trim(),
    category: bundleCategoryInput.value,
    validity: bundleValidityInput.value.trim(),
    price: Number(bundlePriceInput.value),
    active: true,
  };

  const idx = state.bundles.findIndex((b) => b.id === id);
  if (idx >= 0) {
    state.bundles[idx] = item;
  } else {
    state.bundles.push(item);
  }

  writeJson(STORAGE_KEYS.BUNDLES, state.bundles);
  renderBundles();
  renderAdminBundles();
  e.target.reset();
  bundleIdInput.value = "";
  document.getElementById("adminBundleMsg").textContent = "Bundle offer saved.";
});

document.getElementById("resetBundleFormBtn").addEventListener("click", () => {
  bundleIdInput.value = "";
  document.getElementById("adminBundleForm").reset();
});

function renderAdminBundles() {
  const container = document.getElementById("adminBundlesList");
  container.innerHTML = state.bundles
    .map(
      (b) => `
      <div class="admin-item-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <strong>${b.network ? `${b.network} • ` : ""}${b.name}</strong> (${b.category}) — KES ${b.price}
          <div class="muted-note">${b.validity}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-soft btn-sm" data-edit-b="${b.id}" type="button">Edit</button>
          <button class="btn btn-danger btn-sm" data-del-b="${b.id}" type="button">Delete</button>
        </div>
      </div>
    `
    )
    .join("");

  container.querySelectorAll("[data-edit-b]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = state.bundles.find((b) => b.id === btn.dataset.editB);
      if (!target) return;
      bundleIdInput.value = target.id;
      bundleNameInput.value = target.name;
      bundleCategoryInput.value = target.category;
      bundleValidityInput.value = target.validity;
      bundlePriceInput.value = target.price;
    });
  });

  container.querySelectorAll("[data-del-b]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bundles = state.bundles.filter((b) => b.id !== btn.dataset.delB);
      writeJson(STORAGE_KEYS.BUNDLES, state.bundles);
      renderBundles();
      renderAdminBundles();
    });
  });
}

function renderAdminOrders() {
  const container = document.getElementById("adminOrdersList");
  if (!state.history.length) {
    container.innerHTML = `<div class="muted-note">No orders recorded yet.</div>`;
    return;
  }
  container.innerHTML = state.history
    .slice(0, 10)
    .map(
      (o) => `
      <div class="admin-item-row">
        <strong>${o.id}</strong> • ${o.bundleName} (KES ${o.amount}) → ${o.recipient}
        <div class="muted-note">${o.method} • ${o.date}</div>
      </div>
    `
    )
    .join("");
}

// Live Offer Sync for Already-Downloaded Apps (Only fetches when online)
async function syncOffersFromCloud(manual = false) {
  if (!navigator.onLine) {
    if (manual) alert("You are offline. Showing saved zero-data offers.");
    return;
  }

  try {
    const res = await fetch(`${LIVE_FEED_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();

    if (Array.isArray(data.bundles) && data.bundles.length) {
      state.bundles = data.bundles;
      writeJson(STORAGE_KEYS.BUNDLES, state.bundles);
      renderBundles();
      if (state.isAdmin) renderAdminBundles();
    }
    if (Array.isArray(data.ads) && data.ads.length) {
      state.ads = data.ads;
      writeJson(STORAGE_KEYS.ADS, state.ads);
      renderAdCarousel();
      if (state.isAdmin) renderAdminAds();
    }
    if (data.till) {
      state.till = String(data.till);
      localStorage.setItem(STORAGE_KEYS.TILL, state.till);
    }
    if (manual) alert("Offers & banners updated.");
  } catch {
    if (manual) alert("Could not reach live feed. Using saved offline offers.");
  }
}

document.getElementById("syncOffersBtn").addEventListener("click", () => syncOffersFromCloud(true));
window.addEventListener("online", () => {
  updateConnectionStatus();
  syncOffersFromCloud(false);
});
window.addEventListener("offline", updateConnectionStatus);

// Register Service Worker for PWA / Android Wrapper Caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Ignore registration error if unsupported in current context
    });
  });
}

// Boot
updateConnectionStatus();
initDownloadGate();
renderAdCarousel();
renderBundles();
renderHistory();
renderProfile();
renderBottomNav();
syncOffersFromCloud(false);
