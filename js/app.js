// Shared auth + API helper
window.CampusApp = {
  token() {
    return localStorage.getItem('token');
  },
  user() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  },
  requireAuth() {
    const token = this.token();
    const user = this.user();
    if (!token || !user) {
      window.location.href = '/';
      return null;
    }
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('avatar');
    const roleEl = document.getElementById('userRole');
    if (nameEl) nameEl.textContent = user.username;
    if (avatarEl) avatarEl.textContent = (user.username || '?').charAt(0).toUpperCase();
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Student';
    document.querySelectorAll('.admin-only').forEach((el) => {
      el.style.display = user.role === 'admin' ? '' : 'none';
    });
    const logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
      });
    }
    return user;
  },
  async api(path, opts = {}) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      opts.headers || {}
    );
    const token = this.token();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/';
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
};
