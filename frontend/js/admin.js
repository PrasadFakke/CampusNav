const user = window.CampusApp.requireAuth();
const gate = document.getElementById('gate');
const panel = document.getElementById('panel');

if (!user || user.role !== 'admin') {
  gate.innerHTML =
    '<div class="empty" style="color:#ef4444;font-weight:600;"><p>Admin access restricted.</p><p style="margin-top:8px;font-size:0.85rem;color:var(--muted);">Sign in with <strong>admin</strong> / <strong>Admin@123</strong> to manage campus pathways.</p></div>';
} else {
  gate.style.display = 'none';
  panel.style.display = 'block';
  let selected = new Set();
  let saved = new Set();
  let edgeFilter = '';

  function updateCounter() {
    const counter = document.getElementById('blockedCounter');
    if (counter) {
      counter.textContent = `${selected.size} Road${selected.size === 1 ? '' : 's'} Blocked`;
      if (selected.size > 0) {
        counter.style.background = '#fef2f2';
        counter.style.color = '#dc2626';
        counter.style.borderColor = '#fecaca';
      } else {
        counter.style.background = '#ecfdf5';
        counter.style.color = '#059669';
        counter.style.borderColor = '#a7f3d0';
      }
    }
  }

  function renderEdges() {
    const box = document.getElementById('edgeList');
    const all = window.allEdges();
    const filtered = all.filter((e) => {
      const uName = window.getLocationName(e.u).toLowerCase();
      const vName = window.getLocationName(e.v).toLowerCase();
      return !edgeFilter || uName.includes(edgeFilter) || vName.includes(edgeFilter);
    });

    if (!filtered.length) {
      box.innerHTML = '<div class="empty">No matching pathways found</div>';
      return;
    }

    box.innerHTML = filtered
      .map((e) => {
        const isChecked = selected.has(e.key);
        const checked = isChecked ? 'checked' : '';
        const label = `${window.getLocationName(e.u)} ↔ ${window.getLocationName(e.v)} (${e.w} units)`;
        return `<label class="edge-row ${isChecked ? 'blocked' : ''}">
          <input type="checkbox" data-key="${e.key}" ${checked}/>
          <span>${label}</span>
          ${isChecked ? '<span class="blocked-tag">BLOCKED</span>' : ''}
        </label>`;
      })
      .join('');

    box.querySelectorAll('input').forEach((input) => {
      input.onchange = () => {
        if (input.checked) selected.add(input.dataset.key);
        else selected.delete(input.dataset.key);
        input.parentElement.classList.toggle('blocked', input.checked);
        const tag = input.parentElement.querySelector('.blocked-tag');
        if (input.checked && !tag) {
          const span = document.createElement('span');
          span.className = 'blocked-tag';
          span.textContent = 'BLOCKED';
          input.parentElement.appendChild(span);
        } else if (!input.checked && tag) {
          tag.remove();
        }
        updateCounter();
      };
    });
    updateCounter();
  }

  const searchInput = document.getElementById('edgeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      edgeFilter = e.target.value.trim().toLowerCase();
      renderEdges();
    });
  }

  (async () => {
    try {
      const campus = await window.CampusApp.api('/api/campus/blocked');
      selected = new Set(campus.blockedEdges || []);
      saved = new Set(campus.blockedEdges || []);
      renderEdges();
    } catch (_) {}
  })();

  document.getElementById('saveBtn').onclick = async () => {
    try {
      const next = Array.from(selected);
      await window.CampusApp.api('/api/campus/blocked', {
        method: 'PUT',
        body: JSON.stringify({ blockedEdges: next })
      });

      const opened = [...saved].filter((k) => !selected.has(k));
      const closed = [...selected].filter((k) => !saved.has(k));
      saved = new Set(selected);

      const msg = document.getElementById('saveMsg');
      let statusText = 'Changes saved successfully.';
      if (opened.length && !closed.length && selected.size === 0) {
        statusText = 'Saved: All roads reopened for student navigation.';
      } else if (opened.length && !closed.length) {
        statusText = `Saved: ${opened.length} road(s) unblocked and back in service.`;
      } else if (closed.length && !opened.length) {
        statusText = `Saved: ${closed.length} road(s) closed. Navigation will automatically detour.`;
      } else if (closed.length || opened.length) {
        statusText = `Saved: ${closed.length} road(s) closed, ${opened.length} reopened.`;
      }
      msg.textContent = statusText;
      msg.style.color = '#10b981';
      window.CampusApp.toast(statusText, 'success');
    } catch (err) {
      const msg = document.getElementById('saveMsg');
      msg.textContent = err.message;
      msg.style.color = '#ef4444';
      window.CampusApp.toast(err.message, 'error');
    }
  };
}