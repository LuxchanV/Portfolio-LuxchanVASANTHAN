/* ================== Helpers ================== */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

/* ================== Year ================== */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ================== Mobile nav toggle (amélioré) ================== */
const menuBtn = $("#menu-icon");
const navLinks = $("#nav-links");

function closeNav() {
  if (!navLinks || !menuBtn) return;
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function openNav() {
  if (!navLinks || !menuBtn) return;
  navLinks.classList.add("open");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("nav-open");
}

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const willOpen = !navLinks.classList.contains("open");
    if (willOpen) openNav();
    else closeNav();
  });

  document.addEventListener("click", (e) => {
    const isInside = navLinks.contains(e.target) || menuBtn.contains(e.target);
    if (!isInside) closeNav();
  });

  $$("#nav-links a").forEach((a) => {
    a.addEventListener("click", () => closeNav());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
}

/* ================== Mega menu ================== */
const megaItem = $("#mega-item");
const megaTrigger = $("#mega-trigger");

function closeMega() {
  if (!megaItem || !megaTrigger) return;
  megaItem.classList.remove("open");
  megaTrigger.setAttribute("aria-expanded", "false");
}

if (megaItem && megaTrigger) {
  megaTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = megaItem.classList.toggle("open");
    megaTrigger.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    const isInside = megaItem.contains(e.target);
    if (!isInside) closeMega();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMega();
  });
}

/* ================== Nav active section (index only) ================== */
(function initActiveNav() {
  const inPageLinks = $$("#nav-links a[href^='#']");
  if (!inPageLinks.length) return;

  const map = new Map();
  inPageLinks.forEach((a) => {
    const id = a.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (section) map.set(section, a);
  });
  if (!map.size) return;

  const setActive = (activeSection) => {
    inPageLinks.forEach((a) => a.classList.remove("active"));
    const link = map.get(activeSection);
    if (link) link.classList.add("active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target) setActive(visible.target);
    },
    { threshold: [0.35, 0.5, 0.65] }
  );

  map.forEach((_, section) => observer.observe(section));
})();

/* ================== Gallery filter + search ================== */
function initGalleryFilters() {
  const filterButtons = $$(".filter-btn");
  const cards = $$(".gallery-card");
  const searchInput = $("#gallery-search");
  if (!cards.length) return;

  let activeFilter = "all";
  let searchTerm = "";

  const applyFilters = () => {
    const term = searchTerm.trim().toLowerCase();
    cards.forEach((card) => {
      const cat = card.getAttribute("data-category") || "";
      const title = $("h3", card)?.textContent?.toLowerCase() || "";
      const desc = $("p", card)?.textContent?.toLowerCase() || "";

      const matchesFilter = activeFilter === "all" || cat === activeFilter;
      const matchesSearch = !term || (title + " " + desc).includes(term);

      card.style.display = matchesFilter && matchesSearch ? "" : "none";
    });
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value || "";
      applyFilters();
    });
  }
}
initGalleryFilters();

/* ================== Project Modal + Fullscreen viewer ================== */
const modal = $("#project-modal");
const modalMainImg = $("#modal-main-img");
const modalTitle = $("#modal-title");
const modalDesc = $("#modal-description");
const modalThumbs = $("#modal-thumbs");
const modalClose = $(".project-modal-close");
const modalVideoLink = $("#modal-video-link");
const modalDetails = $("#modal-details");
const modalTech = $("#modal-tech");
const modalPrev = $(".modal-prev");
const modalNext = $(".modal-next");
const modalZoom = $(".modal-zoom");

const viewer = $("#image-viewer");
const viewerImg = $("#viewer-img");
const viewerClose = $(".image-viewer-close");

let lastFocusedEl = null;
let modalSources = [];
let modalIndex = 0;

function setModalImage(index) {
  if (!modalMainImg || !modalSources.length) return;
  modalIndex = Math.max(0, Math.min(index, modalSources.length - 1));
  const s = modalSources[modalIndex];
  modalMainImg.src = s.src || "";
  modalMainImg.alt = s.alt || "";

  if (modalThumbs && modal) {
    $$(".modal-thumbs img", modal).forEach((x, i) => {
      x.classList.toggle("active", i === modalIndex);
    });
  }
}

function openViewer() {
  if (!viewer || !viewerImg || !modalSources.length) return;
  viewerImg.src = modalSources[modalIndex]?.src || "";
  viewerImg.alt = modalSources[modalIndex]?.alt || "";
  viewer.classList.add("show");
  viewer.setAttribute("aria-hidden", "false");
}

function closeViewer() {
  if (!viewer) return;
  viewer.classList.remove("show");
  viewer.setAttribute("aria-hidden", "true");
  if (viewerImg) viewerImg.src = "";
}

function openModalFromCard(card) {
  if (!modal) return;

  lastFocusedEl = document.activeElement;

  const title = $("h3", card)?.textContent || "";
  const summary = $("p", card)?.textContent || "";
  const detailsEl = $(".project-details", card);
  const techEl = $(".project-tech", card);
  const galleryImgs = $$(".project-gallery img", card);
  const thumbImg = $(".project-thumb img", card);
  const videoUrl = card.getAttribute("data-video-url");

  if (modalTitle) modalTitle.textContent = title;
  if (modalDesc) modalDesc.textContent = summary;

  if (modalDetails) {
    modalDetails.innerHTML = detailsEl ? detailsEl.innerHTML : "";
    modalDetails.style.display = detailsEl ? "" : "none";
  }

  if (modalTech) {
    modalTech.innerHTML = techEl ? techEl.innerHTML : "";
    modalTech.style.display = techEl ? "" : "none";
  }

  if (modalThumbs) modalThumbs.innerHTML = "";

  modalSources = galleryImgs.length
    ? galleryImgs.map((img) => ({
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || title,
      }))
    : thumbImg
    ? [{ src: thumbImg.getAttribute("src"), alt: thumbImg.getAttribute("alt") || title }]
    : [];

  if (modalThumbs) {
    modalSources.forEach((s, idx) => {
      const t = document.createElement("img");
      t.src = s.src;
      t.alt = s.alt;
      t.classList.toggle("active", idx === 0);
      t.addEventListener("click", () => setModalImage(idx));
      modalThumbs.appendChild(t);
    });
  }

  setModalImage(0);

  if (modalVideoLink) {
    if (videoUrl && videoUrl.trim()) {
      modalVideoLink.href = videoUrl;
      modalVideoLink.classList.add("show");
    } else {
      modalVideoLink.href = "#";
      modalVideoLink.classList.remove("show");
    }
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => modalClose?.focus(), 0);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  closeViewer();
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
}

/* Open triggers */
$$(".project-open").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".gallery-card");
    if (card) openModalFromCard(card);
  });
});

$$(".gallery-card .project-thumb").forEach((thumb) => {
  thumb.addEventListener("click", () => {
    const card = thumb.closest(".gallery-card");
    if (card) openModalFromCard(card);
  });

  thumb.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const card = thumb.closest(".gallery-card");
      if (card) openModalFromCard(card);
    }
  });
});

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modalPrev) modalPrev.addEventListener("click", () => setModalImage(modalIndex - 1));
if (modalNext) modalNext.addEventListener("click", () => setModalImage(modalIndex + 1));
if (modalMainImg) modalMainImg.addEventListener("click", openViewer);
if (modalZoom) modalZoom.addEventListener("click", openViewer);

if (modal) {
  modal.addEventListener("click", (e) => {
    const closeTarget = e.target?.getAttribute?.("data-close") === "true";
    if (closeTarget) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
    if (modal.classList.contains("show")) {
      if (e.key === "ArrowLeft") setModalImage(modalIndex - 1);
      if (e.key === "ArrowRight") setModalImage(modalIndex + 1);
    }
  });
}

/* Viewer events */
if (viewer) {
  viewer.addEventListener("click", (e) => {
    const closeTarget = e.target?.getAttribute?.("data-close") === "true";
    if (closeTarget) closeViewer();
  });
}
if (viewerClose) viewerClose.addEventListener("click", closeViewer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer?.classList.contains("show")) closeViewer();
});
