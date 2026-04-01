// ===== SHARED APP.JS =====
const API = '';

// ===== AUTH =====
function getUser() {
  const u = sessionStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function requireAuth() {
  const user = getUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  // Check session expiry (8h)
  const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0');
  if (Date.now() - loginTime > 8 * 60 * 60 * 1000) {
    logout(); return null;
  }
  return user;
}

function logout() {
  sessionStorage.clear();
  window.location.href = '/login.html';
}

function hasRole(...roles) {
  const u = getUser();
  return u && roles.includes(u.role);
}

// ===== API HELPERS =====
async function apiGet(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, data) {
  const r = await fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

async function apiPut(path, data) {
  const r = await fetch(API + path, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

async function apiDelete(path) {
  const r = await fetch(API + path, { method: 'DELETE' });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

// ===== TOASTS =====
function toast(message, type = 'success', messageAr = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <i class="fa-solid ${icons[type]} toast-icon"></i>
    <div>
      <div class="toast-text-fr">${message}</div>
      ${messageAr ? `<div class="toast-text-ar">${messageAr}</div>` : ''}
    </div>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ===== CONFIRM MODAL =====
function confirmModal(title, titleAr, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <div>
          <h3><i class="fa-solid fa-triangle-exclamation"></i> ${title}</h3>
          <div class="modal-header-ar">${titleAr}</div>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:#444;line-height:1.6">${message}</p>
        <p style="font-size:11px;color:#888;text-align:right;direction:rtl;margin-top:6px">هل أنت متأكد؟</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="confirm-cancel">Annuler / إلغاء</button>
        <button class="btn btn-danger" id="confirm-ok"><i class="fa-solid fa-trash"></i> Confirmer / تأكيد</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ===== STATUS BADGE =====
function statusBadge(qty, seuil) {
  if (qty === 0) return '<span class="badge badge-rupture"><i class="fa-solid fa-circle-xmark"></i> Rupture / نفاد</span>';
  if (qty <= seuil) return '<span class="badge badge-faible"><i class="fa-solid fa-triangle-exclamation"></i> Stock Faible / منخفض</span>';
  return '<span class="badge badge-disponible"><i class="fa-solid fa-circle-check"></i> Disponible / متوفر</span>';
}

// ===== FORMAT QTY =====
function fmtQty(qty, unite) {
  const n = parseFloat(qty);
  const str = Number.isInteger(n) ? n.toString() : n.toFixed(3).replace(/\.?0+$/, '');
  return `<span class="qty-with-unit">${str}</span> <span class="qty-unit">${unite}</span>`;
}

// ===== FORMAT DATE =====
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-MA') + ' ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
}

// ===== OFFICIAL HEADER HTML =====
function officialHeaderBand() {
  return `<div class="official-header-band">
    <div class="official-header-inner">
      <div class="official-fr">
        ROYAUME DU MAROC<br>
        MINISTÈRE DE L'INTÉRIEUR<br>
        WILAYA RABAT-SALÉ-KÉNITRA<br>
        COMMUNE DE RABAT — ARROND. AGDAL-RYAD<br>
        SERVICE VOIRIE &amp; ÉCLAIRAGE PUBLIC
      </div>
      <div class="official-ar">
        المملكة المغربية<br>
        وزارة الداخلية<br>
        جهة الرباط سلا القنيطرة<br>
        جماعة الرباط — مقاطعة أكدال الرياض<br>
        مصلحة الطرق والإنارة العمومية
      </div>
    </div>
  </div>`;
}

// ===== TOP NAVBAR HTML =====
function topNavbar(pageTitle, pageTitleAr) {
  const user = getUser();
  const roleBadge = { admin: 'badge-admin', responsable: 'badge-responsable', agent: 'badge-agent' }[user.role] || 'badge-agent';
  return `<div class="top-navbar">
    <div>
      <div class="navbar-title">${pageTitle} <span>${pageTitleAr}</span></div>
    </div>
    <div class="navbar-user">
      <span style="font-size:12px;color:rgba(255,255,255,0.7)">${user.nom}</span>
      <span class="badge ${roleBadge}">${user.role}</span>
      <button class="btn-logout" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Déconnexion</button>
    </div>
  </div>`;
}

// ===== SIDEBAR HTML =====
function buildSidebar(activePage) {
  const user = getUser();
  const isAdmin = user.role === 'admin';
  const isResponsable = ['admin', 'responsable'].includes(user.role);

  const nav = [
    { href: 'dashboard.html', icon: 'fa-gauge', fr: 'Tableau de bord', ar: 'لوحة القيادة', key: 'dashboard' },
    { href: 'stock.html', icon: 'fa-boxes-stacking', fr: 'Gestion du Stock', ar: 'إدارة المخزون', key: 'stock' },
  ];
  // Mouvements : admin et responsable uniquement
  if (isResponsable) {
    nav.push({ href: 'mouvements.html', icon: 'fa-right-left', fr: 'Mouvements', ar: 'الحركات', key: 'mouvements' });
  }
  nav.push({ href: 'reservations.html', icon: 'fa-bookmark', fr: 'Réservations', ar: 'الحجوزات', key: 'reservations' });
  if (isResponsable) {
    nav.push({ href: 'historique.html', icon: 'fa-clock-rotate-left', fr: 'Historique', ar: 'السجل التاريخي', key: 'historique' });
    nav.push({ href: 'alertes.html', icon: 'fa-bell', fr: 'Alertes', ar: 'التنبيهات', key: 'alertes' });
    nav.push({ href: 'rapports.html', icon: 'fa-chart-bar', fr: 'Rapports', ar: 'التقارير', key: 'rapports' });
  } else {
    nav.push({ href: 'alertes.html', icon: 'fa-bell', fr: 'Alertes', ar: 'التنبيهات', key: 'alertes' });
  }

  const items = nav.map(n => `
    <a href="${n.href}" class="nav-item ${activePage === n.key ? 'active' : ''}" id="nav-${n.key}">
      <i class="fa-solid ${n.icon}"></i>
      <div class="nav-item-text">
        <span class="nav-item-fr">${n.fr}</span>
        <span class="nav-item-ar">${n.ar}</span>
      </div>
      ${n.key === 'reservations' ? '<span id="sidebar-resa-badge" style="display:none;background:var(--red-morocco);color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:auto">0</span>' : ''}
    </a>`).join('');

  return `<div class="sidebar">
    <div class="sidebar-logo">
      ${moroccanStar(52)}
      <div class="org-name">
        AGDAL-RYAD<br>
        <span class="org-name-ar">أكدال الرياض</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">NAVIGATION</div>
      ${items}
    </nav>
    <div class="sidebar-footer">
      Système de Gestion du Stock<br>
      نظام إدارة المخزون — 2025
    </div>
  </div>`;
}

// ===== MOROCCAN STAR SVG =====
function moroccanStar(size = 60) {
  return `<img src="logo.png" width="${size}" height="${size}" style="object-fit:contain;border-radius:50%">`;
}

// ===== PDF HEADER =====
function pdfAddHeader(doc, type, num) {
  const pageW = doc.internal.pageSize.width;
  doc.setFillColor(0, 66, 37);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(201, 168, 76);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const fr = ['ROYAUME DU MAROC', 'MINISTERE DE L\'INTERIEUR', 'WILAYA RABAT-SALE-KENITRA', 'COMMUNE DE RABAT — ARROND. AGDAL-RYAD', 'SERVICE VOIRIE & ECLAIRAGE PUBLIC'];
  fr.forEach((l, i) => doc.text(l, 14, 8 + i * 6));
  doc.setFontSize(7);
  const ar = ['المملكة المغربية', 'وزارة الداخلية', 'جهة الرباط سلا القنيطرة', 'جماعة الرباط — مقاطعة أكدال الرياض', 'مصلحة الطرق والإنارة العمومية'];
  ar.forEach((l, i) => doc.text(l, pageW - 14, 8 + i * 6, { align: 'right' }));
  // Gold divider
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.5);
  doc.line(0, 42, pageW, 42);
  // Type title
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 42, pageW, 10, 'F');
  doc.setTextColor(0, 66, 37);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (type) doc.text(`${type} N° ${num || '___'}`, pageW / 2, 49, { align: 'center' });
  doc.setTextColor(30, 30, 30);
  return 58;
}

// ===== INIT PAGE =====
function initPage(activePage, pageTitle, pageTitleAr, allowedRoles) {
  const user = requireAuth();
  if (!user) return null;

  // Role restriction
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = '/dashboard.html';
    return null;
  }

  document.body.innerHTML = `
    <div id="toast-container"></div>
    ${buildSidebar(activePage)}
    <div class="main-content">
      ${topNavbar(pageTitle, pageTitleAr)}
      ${officialHeaderBand()}
      <div class="page-content" id="page-content"></div>
    </div>`;

  // Ajouter bouton hamburger pour mobile
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger-btn';
  hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
  document.body.appendChild(hamburger);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const sidebar = document.querySelector('.sidebar');

  hamburger.onclick = () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    hamburger.innerHTML = sidebar.classList.contains('mobile-open')
      ? '<i class="fa-solid fa-times"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  };

  overlay.onclick = () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
  };

  // Fermer sidebar quand on clique un lien nav sur mobile
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });
  });

  // Load reservations badge (respo/admin only)
  if (['admin','responsable'].includes(user.role)) {
    updateResaBadge();
    setInterval(updateResaBadge, 30000);
  }

  return user;
}

async function updateResaBadge() {
  try {
    const resas = await apiGet('/api/reservations?statut=en_attente');
    const badge = document.getElementById('sidebar-resa-badge');
    if (!badge) return;
    if (resas.length > 0) {
      badge.textContent = resas.length;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) { /* silently fail */ }
}
