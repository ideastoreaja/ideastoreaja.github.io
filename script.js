/* ============================================================
   ideastore — script.js
   Load produk.json, render card, handle search/filter/theme.
   ============================================================ */

(function () {
  'use strict';

  // ==== CONFIG (fallback kalau produk.json gagal load) ====
  const FALLBACK_CONFIG = {
    toko: {
      nama: 'ideastore',
      wa: '6289523698893',
      waDisplay: '+62 895-2369-8893'
    },
    produk: []
  };

  // ==== STATE ====
  const state = {
    data: FALLBACK_CONFIG,
    filter: 'all',
    search: ''
  };

  // ==== DOM CACHE ====
  const el = {
    grid: document.getElementById('productGrid'),
    emptyState: document.getElementById('emptyState'),
    emptyMessage: document.getElementById('emptyMessage'),
    errorState: document.getElementById('errorState'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    statTotal: document.getElementById('statTotal'),
    statReady: document.getElementById('statReady'),
    statPromo: document.getElementById('statPromo'),
    year: document.getElementById('year'),
    footerWa: document.getElementById('footerWa'),
    floatingWa: document.getElementById('floatingWa'),
    footerShare: document.getElementById('footerShare')
  };

  // ==== UTILS ====

  // Format angka jadi "Rp 6.500.000"
  function formatRupiah(angka) {
    if (!angka && angka !== 0) return '';
    return 'Rp ' + Number(angka).toLocaleString('id-ID');
  }

  // Hitung persen diskon
  function hitungDiskon(harga, hargaCoret) {
    if (!hargaCoret || hargaCoret <= harga) return 0;
    return Math.round(((hargaCoret - harga) / hargaCoret) * 100);
  }

  // Escape HTML (biar aman dari XSS kalau data dari luar)
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Label status dalam bahasa Indonesia
  function labelStatus(status) {
    const map = {
      ready: 'Siap Pakai',
      promo: 'Promo',
      terjual: 'Terjual'
    };
    return map[status] || status;
  }

  // ==== RENDER PRODUK ====
  function renderProducts() {
    // Filter by status
    let produk = state.data.produk || [];

    if (state.filter !== 'all') {
      produk = produk.filter(p => p.status === state.filter);
    }

    // Filter by search
    if (state.search.trim()) {
      const q = state.search.toLowerCase().trim();
      produk = produk.filter(p =>
        (p.nama || '').toLowerCase().includes(q) ||
        (p.kategori || '').toLowerCase().includes(q) ||
        (p.deskripsiSingkat || '').toLowerCase().includes(q)
      );
    }

    // Empty state
    if (produk.length === 0) {
      el.grid.innerHTML = '';
      el.grid.hidden = true;
      el.emptyState.hidden = false;

      if (state.search.trim()) {
        el.emptyMessage.textContent = `Nggak ada produk yang cocok dengan "${state.search}".`;
      } else if (state.filter !== 'all') {
        el.emptyMessage.textContent = `Belum ada produk dengan status "${labelStatus(state.filter)}".`;
      } else {
        el.emptyMessage.textContent = 'Produk akan muncul di sini.';
      }
      return;
    }

    el.grid.hidden = false;
    el.emptyState.hidden = true;

    // Render cards
    el.grid.innerHTML = produk.map(p => renderCard(p)).join('');
  }

  // ==== RENDER 1 CARD ====
  function renderCard(p) {
    const isSold = p.status === 'terjual';
    const diskon = hitungDiskon(p.harga, p.hargaCoret);
    const url = p.url || `product/${p.id}.html`;
    const foto = p.fotoUtama || 'foto/placeholder.jpg';

    return `
      <a class="product-card${isSold ? ' sold' : ''}" href="${escapeHtml(url)}">
        <div class="card-image-wrap">
          <span class="status-badge ${escapeHtml(p.status)}">${escapeHtml(labelStatus(p.status))}</span>
          ${isSold ? '<div class="sold-overlay">TERJUAL</div>' : ''}
          <img class="card-image" src="${escapeHtml(foto)}" alt="${escapeHtml(p.nama)}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 font-size=%2230%22 text-anchor=%22middle%22%3E%F0%9F%93%B7%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(p.nama)}</div>
          <div class="card-price-row">
            <span class="card-price">${formatRupiah(p.harga)}</span>
            ${p.hargaCoret ? `<span class="card-price-old">${formatRupiah(p.hargaCoret)}</span>` : ''}
            ${diskon > 0 ? `<span class="card-discount">-${diskon}%</span>` : ''}
          </div>
          <div class="card-meta">
            <span>${escapeHtml(p.kategori || 'komputer')}</span>
            <span class="dot">•</span>
            <span>${escapeHtml(p.kondisi || 'Bekas')}</span>
          </div>
        </div>
      </a>
    `;
  }

  // ==== UPDATE STATS DI HERO ====
  function updateStats() {
    const semua = state.data.produk || [];
    const ready = semua.filter(p => p.status === 'ready').length;
    const promo = semua.filter(p => p.status === 'promo').length;

    if (el.statTotal) el.statTotal.textContent = semua.length;
    if (el.statReady) el.statReady.textContent = ready;
    if (el.statPromo) el.statPromo.textContent = promo;
  }

  // ==== UPDATE LINK WA & SHARE ====
  function updateContact() {
    const wa = state.data.toko?.wa || FALLBACK_CONFIG.toko.wa;
    const pesan = encodeURIComponent('Halo ideastore, saya mau tanya soal produk komputer.');
    const waUrl = `https://wa.me/${wa}?text=${pesan}`;

    if (el.footerWa) el.footerWa.href = waUrl;
    if (el.floatingWa) el.floatingWa.href = waUrl;

    // Share link (pakai Web Share API kalau ada, fallback ke copy)
    if (el.footerShare) {
      el.footerShare.hidden = false;
      el.footerShare.addEventListener('click', async (e) => {
        e.preventDefault();
        const shareData = {
          title: 'ideastore — Komputer & Laptop Bekas',
          text: 'Cek produk komputer & laptop bekas berkualitas di ideastore!',
          url: window.location.href
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            // User cancel, diem aja
          }
        } else {
          // Fallback: copy link
          try {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link berhasil dicopy!');
          } catch (err) {
            alert('Gagal copy link. Copy manual ya: ' + window.location.href);
          }
        }
      });
    }
  }

  // ==== UPDATE TAHUN FOOTER ====
  function updateYear() {
    if (el.year) el.year.textContent = new Date().getFullYear();
  }

  // ==== SEARCH HANDLER ====
  function handleSearch() {
    state.search = el.searchInput.value;
    el.searchClear.hidden = !state.search;
    renderProducts();
  }

  // ==== FILTER HANDLER ====
  function handleFilter(e) {
    const tab = e.currentTarget;
    el.filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filter = tab.dataset.filter;
    renderProducts();
  }

  // ==== THEME SWITCHER ====
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

  // ==== LOAD PRODUK.JSON ====
  async function loadData() {
    try {
      const res = await fetch('produk.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
    } catch (err) {
      console.error('Gagal load produk.json:', err);
      el.grid.hidden = true;
      el.errorState.hidden = false;
      return false;
    }
    return true;
  }

  // ==== INIT ====
  async function init() {
    initTheme();
    updateYear();

    const ok = await loadData();
    if (!ok) return;

    updateStats();
    updateContact();
    renderProducts();

    // Event listeners
    el.searchInput?.addEventListener('input', handleSearch);
    el.searchClear?.addEventListener('click', () => {
      el.searchInput.value = '';
      handleSearch();
      el.searchInput.focus();
    });
    el.filterTabs.forEach(tab => tab.addEventListener('click', handleFilter));
  }

  // ==== RUN ====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
