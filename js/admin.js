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

  (async () => {
    const campus = await window.CampusApp.api('/api/campus/blocked');
    selected = new Set(campus.blockedEdges || []);
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
      };
    });
  })();

  document.getElementById('saveBtn').onclick = async () => {
    try {
      await window.CampusApp.api('/api/campus/blocked', {
        method: 'PUT',
        body: JSON.stringify({ blockedEdges: Array.from(selected) })
      });
      document.getElementById('saveMsg').textContent = 'Saved. Student Find Route now uses alternatives.';
    } catch (err) {
      document.getElementById('saveMsg').textContent = err.message;
    }
  };
}
