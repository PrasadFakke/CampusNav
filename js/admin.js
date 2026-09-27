
const user = window.CampusApp.requireAuth();
const gate = document.getElementById('gate');
const panel = document.getElementById('panel');

if (!user || user.role !== 'admin') {
  gate.innerHTML =
    '<p>Admin only. Login as <strong>admin</strong> / <strong>Admin@123</strong> (auto-created on first server start).</p>';
} else {
  gate.style.display = 'none';
  panel.style.display = 'block';
  let selected = new Set();
  let saved = new Set();

  function renderEdges() {
    const box = document.getElementById('edgeList');
    box.innerHTML = window
      .allEdges()
      .map((e) => {
        const checked = selected.has(e.key) ? 'checked' : '';
        const label = `${window.getLocationName(e.u)} ↔ ${window.getLocationName(e.v)}  (${e.w})`;
        return `<label class="edge-row ${selected.has(e.key) ? 'blocked' : ''}">
          <input type="checkbox" data-key="${e.key}" ${checked}/>
          <span>${label}</span>
          ${selected.has(e.key) ? '<span class="blocked-tag">BLOCKED</span>' : ''}
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
      };
    });
  }

  (async () => {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    selected = new Set(campus.blockedEdges || []);
    saved = new Set(campus.blockedEdges || []);
    renderEdges();
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
      if (opened.length && !closed.length && selected.size === 0) {
        msg.textContent = 'Saved. Roads reopened — students can use this path again.';
      } else if (opened.length && !closed.length) {
        msg.textContent = 'Saved. Unblocked road is open again — students can use this path.';
      } else if (closed.length && !opened.length) {
        msg.textContent = 'Saved. Students will now find an alternative route on Find Route.';
      } else if (opened.length && closed.length) {
        msg.textContent = 'Saved. Closed roads use alternatives; reopened roads students can use again.';
      } else if (selected.size) {
        msg.textContent = 'Saved. Students still use alternatives for the blocked roads.';
      } else {
        msg.textContent = 'Saved. No roads blocked — students can use all paths.';
      }
    } catch (err) {
      document.getElementById('saveMsg').textContent = err.message;
    }
  };
}