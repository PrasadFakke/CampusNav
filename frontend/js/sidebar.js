(function () {
  const page = document.body.getAttribute('data-page') || '';
  const icons = {
    dashboard: '<span class="nav-icon-box icon-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>',
    map: '<span class="nav-icon-box icon-emerald"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></span>',
    navigate: '<span class="nav-icon-box icon-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></span>',
    nearest: '<span class="nav-icon-box icon-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>',
    emergency: '<span class="nav-icon-box icon-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>',
    favourites: '<span class="nav-icon-box icon-gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>',
    admin: '<span class="nav-icon-box icon-violet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>'
  };

  const links = [
    { href: '/dashboard.html', id: 'dashboard', label: 'Dashboard' },
    { href: '/map.html', id: 'map', label: 'Campus Map' },
    { href: '/navigate.html', id: 'navigate', label: 'Find Route' },
    { href: '/nearest.html', id: 'nearest', label: 'Nearest Facility' },
    { href: '/emergency.html', id: 'emergency', label: 'Emergency' },
    { href: '/favourites.html', id: 'favourites', label: 'Favourites' },
    { href: '/admin.html', id: 'admin', label: 'Admin', admin: true }
  ];

  const nav = links
    .map((l) => {
      const active = page === l.id ? ' active' : '';
      const admin = l.admin ? ' admin-only' : '';
      return `<a href="${l.href}" class="nav-item${active}${admin}" data-id="${l.id}">${icons[l.id] || ''}<span>${l.label}</span></a>`;
    })
    .join('');

  const brandSvg = `
    <svg viewBox="0 0 28 28" fill="none" style="width:26px;height:26px;" xmlns="http://www.w3.org/2000/svg">
      <!-- North pointer: crisp white and ice blue -->
      <polygon points="14,3 18,14 14,12" fill="#ffffff"/>
      <polygon points="14,3 10,14 14,12" fill="#e0e7ff"/>
      <!-- South pointer: vibrant coral and warm rose -->
      <polygon points="14,25 18,14 14,12" fill="#f43f5e"/>
      <polygon points="14,25 10,14 14,12" fill="#fb7185"/>
      <!-- Needle border -->
      <polygon points="14,3 18,14 14,25 10,14" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-linejoin="round"/>
      <!-- Center golden dial -->
      <circle cx="14" cy="13" r="3.2" fill="#f59e0b" stroke="#ffffff" stroke-width="1.4"/>
      <circle cx="14" cy="13" r="1.3" fill="#ffffff"/>
    </svg>`;

  const logoStyle = 'background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%) !important; width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); flex-shrink: 0;';

  const html = `
    <header class="mobile-header">
      <div class="mobile-brand">
        <div class="logo-icon" style="${logoStyle}">${brandSvg}</div>
        <span class="brand-title">Campus<span class="brand-accent">Nav</span></span>
      </div>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </header>
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-brand">
        <div class="logo-icon" style="${logoStyle}">${brandSvg}</div>
        <span class="brand-title">Campus<span class="brand-accent">Nav</span></span>
      </div>
      <nav class="sidebar-nav">${nav}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="avatar" id="avatar">?</div>
          <div>
            <div class="user-name" id="userName">—</div>
            <div class="user-role" id="userRole">Student</div>
          </div>
        </div>
        <button class="logout-btn" id="logoutBtn">Logout</button>
      </div>
    </aside>`;

  document.body.insertAdjacentHTML('afterbegin', html);

  const toggleBtn = document.getElementById('menuToggle');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (toggleBtn && sidebar && backdrop) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }

  // Ensure clicked tabs instantly bold and highlight
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
})();
