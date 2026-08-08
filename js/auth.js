// ===== Tab switching =====
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm')
      .classList.add('active');
    hideMessage();
  });
});

// ===== Password visibility toggle =====
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
      ? `<svg class="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
         </svg>`
      : `<svg class="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>
         </svg>`;
  });
});

// ===== Message helpers =====
const messageEl = document.getElementById('message');

function showMessage(text, type = 'error') {
  messageEl.textContent = text;
  messageEl.className = `message show ${type}`;
}

function hideMessage() {
  messageEl.className = 'message';
}

// ===== Button loading state =====
function setLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  btn.disabled = loading;
  text.style.opacity = loading ? '0.7' : '1';
  spinner.classList.toggle('hidden', !loading);
}

// ===== Login =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (username.length < 3) {
    showMessage('Username must be at least 3 characters');
    return;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters');
    return;
  }

  setLoading(btn, true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || 'Login failed');
      setLoading(btn, false);
      return;
    }

    // Save token & user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showMessage('Login successful! Redirecting…', 'success');

    // Redirect to dashboard / map page (change this path later)
    setTimeout(() => {
      window.location.href = '/dashboard.html';   // create this later for campus map
    }, 900);

  } catch (err) {
    showMessage('Cannot connect to server. Is the backend running?');
    setLoading(btn, false);
  }
});

// ===== Register =====
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerBtn');

  if (username.length < 3) {
    showMessage('Username must be at least 3 characters');
    return;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters');
    return;
  }

  setLoading(btn, true);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || 'Registration failed');
      setLoading(btn, false);
      return;
    }

    showMessage('Account created! You can now sign in.', 'success');
    setLoading(btn, false);

    // Switch to login tab
    setTimeout(() => {
      document.querySelector('.tab[data-tab="login"]').click();
      document.getElementById('loginUsername').value = username;
    }, 1200);

  } catch (err) {
    showMessage('Cannot connect to server. Is the backend running?');
    setLoading(btn, false);
  }
});
