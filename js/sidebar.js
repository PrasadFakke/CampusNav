(function () {
  const page = document.body.getAttribute('data-page') || '';
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    navigate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    nearest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    emergency: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    favourites: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
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
      return `<a href="${l.href}" class="nav-item${active}${admin}">${icons[l.id] || ''}${l.label}</a>`;
    })
    .join('');
  const html = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-icon">
          <svg viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#g)"/>
            <path d="M14 30 L24 12 L34 30" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="24" cy="34" r="3" fill="white"/>
            <defs><linearGradient id="g" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
          </svg>
        </div>
        <span>CampusNav</span>
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
})();