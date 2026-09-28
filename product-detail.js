/* ============================================================
   ideastore — product-detail.js
   Khusus halaman product/*.html
   - Lightbox zoom
   - Thumbnail switcher
   - Tombol WA & copy nomor
   - Share button
   - View counter
   ============================================================ */

(function () {
  'use strict';

  // ==== CONFIG ====
  const KONTAK = {
    wa: '6289523698893',
    waDisplay: '+62 895-2369-8893',
    produk: 'PC Workstation HP Z440'
  };

  const IMAGES = [
    '../foto/z440/depan.jpg',
    '../foto/z440/samping.jpg',
    '../foto/z440/dalam.jpg',
    '../foto/z440/monitor.jpg',
    '../foto/z440/aksesoris.jpg'
  ];

  let currentIndex = 0;

  // ==== DOM ====
  const el = {
    mainImage: document.getElementById('detailMainImage'),
    thumbs: document.querySelectorAll('#detailThumbs img'),
    lightbox: document.getElementById('lightbox'),
    lbImage: document.getElementById('lbImage'),
    lbCounter: document.getElementById('lbCounter'),
    lbClose: document.getElementById('lbClose'),
    lbPrev: document.getElementById('lbPrev'),
    lbNext: document.getElementById('lbNext'),
    wa: document.getElementById('detailWa'),
    copyWa: document.getElementById('detailCopyWa'),
    share: document.getElementById('detailShare'),
    floatingWa: document.getElementById('detailFloatingWa'),
    viewCount: document.getElementById('viewCount'),
    year: document.getElementById('year')
  };

  // ==== UTILS ====
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);
        background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:8px;
        font-size:13px;font-weight:600;opacity:0;pointer-events:none;
        transition:all 0.3s;z-index:9999;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2200);
  }

  // ==== LINK WA ====
  function buildWaLink(pesan) {
    const text = encodeURIComponent(pesan || `Halo ideastore, saya tertarik dengan ${KONTAK.produk}.`);
    return `https://wa.me/${KONTAK.wa}?text=${text}`;
  }

  function initContact() {
    const waUrl = buildWaLink();

    if (el.wa) el.wa.href = waUrl;
    if (el.floatingWa) el.floatingWa.href = waUrl;

    if (el.copyWa) {
      el.copyWa.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(KONTAK.waDisplay);
          showToast('✓ Nomor WA dicopy: ' + KONTAK.waDisplay);
        } catch (err) {
          showToast('Gagal copy. Nomor: ' + KONTAK.waDisplay);
        }
      });
    }

    if (el.share) {
      el.share.addEventListener('click', async () => {
        const shareData = {
          title: `${KONTAK.produk} — ideastore`,
          text: `Cek ${KONTAK.produk} di ideastore!`,
          url: window.location.href
        };
        if (navigator.share) {
          try { await navigator.share(shareData); } catch (e) {}
        } else {
          try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('✓ Link dicopy!');
          } catch (e) {
            showToast('Link: ' + window.location.href);
          }
        }
      });
    }
  }

  // ==== THUMBNAIL SWITCHER ====
  function initThumbs() {
    if (!el.thumbs || !el.mainImage) return;

    el.thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        el.mainImage.src = thumb.src;
        currentIndex = i;
        el.thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    // Klik gambar utama → buka lightbox
    const mainWrap = el.mainImage.parentElement;
    if (mainWrap) {
      mainWrap.addEventListener('click', () => openLightbox(currentIndex));
    }
  }

  // ==== LIGHTBOX ====
  function updateLightbox() {
    if (!el.lbImage || !el.lbCounter) return;
    el.lbImage.src = IMAGES[currentIndex];
    el.lbCounter.textContent = `${currentIndex + 1} / ${IMAGES.length}`;
  }

  function openLightbox(index) {
    if (!el.lightbox) return;
    currentIndex = index;
    updateLightbox();
    el.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!el.lightbox) return;
    el.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % IMAGES.length;
    updateLightbox();
    // Sync thumbnail aktif
    if (el.thumbs) {
      el.thumbs.forEach(t => t.classList.remove('active'));
      el.thumbs[currentIndex]?.classList.add('active');
    }
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + IMAGES.length) % IMAGES.length;
    updateLightbox();
    if (el.thumbs) {
      el.thumbs.forEach(t => t.classList.remove('active'));
      el.thumbs[currentIndex]?.classList.add('active');
    }
  }

  function initLightbox() {
    if (!el.lightbox) return;

    el.lbClose?.addEventListener('click', closeLightbox);
    el.lbNext?.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    el.lbPrev?.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    // Klik area gelap → tutup
    el.lightbox.addEventListener('click', (e) => {
      if (e.target === el.lightbox) closeLightbox();
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!el.lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });

    // Swipe (touch)
    let touchStartX = 0;
    let touchEndX = 0;

    el.lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    el.lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextImage();
        else prevImage();
      }
    }, { passive: true });
  }

  // ==== VIEW COUNTER ====
  function initViewCounter() {
    if (!el.viewCount) return;
    if (!sessionStorage.getItem('viewed-z440')) {
      const count = parseInt(localStorage.getItem('views-z440') || '0') + 1;
      localStorage.setItem('views-z440', count);
      sessionStorage.setItem('viewed-z440', '1');
    }
    el.viewCount.textContent = localStorage.getItem('views-z440') || '1';
  }

  // ==== YEAR ====
  function initYear() {
    if (el.year) el.year.textContent = new Date().getFullYear();
  }

  // ==== THEME (sync dengan katalog) ====
  function initTheme() {
    const saved = localStorage.getItem('ideastore-theme') || 'theme-blibli';
    document.body.className = saved;

    const dots = document.querySelectorAll('.theme-dot');
    dots.forEach(dot => {
      if (dot.dataset.theme === saved) dot.classList.add('active');
      else dot.classList.remove('active');

      dot.addEventListener('click', () => {
        const tema = dot.dataset.theme;
        document.body.className = tema;
        localStorage.setItem('ideastore-theme', tema);
        dots.forEach(d => d.classList.toggle('active', d.dataset.theme === tema));
      });
    });
  }

  // ==== INIT ====
  function init() {
    initTheme();
    initYear();
    initContact();
    initThumbs();
    initLightbox();
    initViewCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
