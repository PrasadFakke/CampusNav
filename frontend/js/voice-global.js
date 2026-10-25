// ========== CampusVoice global assistant (loaded on every signed-in page) ==========
// - Floating 🎤 button on every page (pages with their own inline mic card — Find Route & Indoor — reuse the same brain)
// - Understands: open a page, nearest facility, emergency, favourites, routes (outdoor + indoor), help, stop, logout
(function () {
  const V = window.CampusVoice;
  if (!V) return;
  const body = document.body;
  const page = body.getAttribute('data-page') || '';
  const here = window.location.pathname;

  // pull in the stylesheet so pages don't each need a <link>
  if (!document.querySelector('link[href$="/css/voice.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/css/voice.css';
    document.head.appendChild(l);
  }

  function ensure(src, test) {
    if (test()) return Promise.resolve();
    return new Promise((res) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = res;
      document.head.appendChild(s);
    });
  }
  async function loadData() {
    await ensure('/js/graph-data.js', () => window.CAMPUS_LOCATIONS);
    await ensure('/js/indoor-data.js', () => window.INDOOR_PLANS);
  }

  const user = () => (window.CampusApp && window.CampusApp.user && window.CampusApp.user()) || {};
  const actions = () => window.CampusPageActions || {};

  // ---------- vocab ----------
  const PAGES = [
    { url: '/dashboard.html', name: 'Dashboard', keys: ['dashboard', 'home', 'home page', 'main page'] },
    { url: '/map.html', name: 'Campus Map', keys: ['campus map', 'map', 'full map', 'interactive map'] },
    { url: '/navigate.html', name: 'Find Route', keys: ['find route', 'route finder', 'route planner', 'navigation', 'route', 'routes'] },
    { url: '/nearest.html', name: 'Nearest Facility', keys: ['nearest facility', 'nearest facilities', 'facility finder', 'nearest', 'facilities'] },
    { url: '/emergency.html', name: 'Emergency', keys: ['emergency', 'emergency page'] },
    { url: '/favourites.html', name: 'Favourites', keys: ['favourites', 'favorites', 'my favourites', 'my favorites', 'saved places', 'saved', 'bookmarks'] },
    { url: '/admin.html', name: 'Admin', keys: ['admin', 'admin panel', 'admin page'], admin: true },
    { url: '/indoor.html?building=spit', name: 'Indoor Map', keys: ['indoor map', 'indoor', 'floor plan', 'floor plans', 'indoor navigation', 'spit indoor map', 'spit floor plan', 'spit indoor', 'inside spit'] }
  ];
  const FACILITIES = [
    { id: 'Library', aliases: ['library', 'books', 'study place'] },
    { id: 'Canteen', aliases: ['canteen', 'cafeteria', 'food', 'eat', 'lunch', 'snacks', 'mess', 'tea', 'coffee'] },
    { id: 'Medical', aliases: ['medical', 'doctor', 'hospital', 'clinic', 'first aid', 'dispensary'] },
    { id: 'Washroom', aliases: ['washroom', 'toilet', 'restroom', 'bathroom', 'loo'] },
    { id: 'Parking', aliases: ['parking', 'park my car', 'park my bike'] },
    { id: 'Sports', aliases: ['sports', 'gym', 'playground', 'ground'] },
    { id: 'Hostel', aliases: ['hostel'] },
    { id: 'Emergency', aliases: ['emergency'] }
  ];
  const HELP_TEXT = 'You can say: take me to the library. From entrance to canteen. Take me to room 105. Nearest canteen. I need a doctor. Open dashboard. Add library to favourites. Or stop.';

  const norm = (a) => V.normalize(a);
  const stripVerbs = (t) => t.replace(/^(please )?(can you |could you )?(open|go to|goto|show me|show|take me to|take me|navigate to|switch to|visit|bring up|launch)( the| my)?\s*/, '').replace(/\s*\b(page|screen|section|tab)$/, '').trim();

  // ---------- intents that don't depend on where you are ----------
  async function pageIntent(alts) {
    for (const raw of alts) {
      const t = norm(raw);
      if (!t) continue;

      if (/^(stop|be quiet|quiet|silence|shut up|cancel speaking|stop talking)$/.test(t)) { V.stopSpeaking(); return { ok: true, show: 'Stopped.' }; }

      if (/\b(log ?out|sign ?out|logout)\b/.test(t)) {
        localStorage.clear();
        return { ok: true, show: 'Logging you out…', go: '/' };
      }

      if (/\b(what can (i|you)|how (do|can) i use|voice help|voice commands|commands|what can i say)\b/.test(t) || t === 'help me' || t === 'help') {
        return { ok: true, show: 'Try: “take me to the library”, “nearest canteen”, “I need a doctor”, “open dashboard”, “add library to favourites”.', say: HELP_TEXT };
      }

      // favourites: add / remove
      const fav = t.match(/\b(add|save|bookmark|remove|delete|unsave|unfavourite|unfavorite)\b(.*)/);
      if (fav && /\b(favourites?|favorites?|bookmarks?|saved)\b/.test(t)) {
        const removing = /^(remove|delete|unsave|unfavourite|unfavorite)$/.test(fav[1]);
        const place = fav[2].replace(/\b(to|from|in|into|my|the|as|a|favourites?|favorites?|bookmarks?|saved|list|places?)\b/g, ' ').replace(/\s+/g, ' ').trim();
        await loadData();
        const hit = V.findBest(place, V.outdoorCandidates(true))[0];
        if (!hit) return { ok: false, show: `Which place? Say “add library to favourites”.`, say: 'Which place should I add? Say, add library to favourites.' };
        const name = window.getLocationName ? window.getLocationName(hit.id) : hit.id;
        try {
          if (removing) await window.CampusApp.api('/api/favourites/' + hit.id, { method: 'DELETE' });
          else await window.CampusApp.api('/api/favourites', { method: 'POST', body: JSON.stringify({ locationId: hit.id }) });
          if (actions().refresh) actions().refresh();
          const msg = removing ? `Removed ${name} from your favourites.` : `Added ${name} to your favourites.`;
          return { ok: true, show: '✓ ' + msg, say: msg };
        } catch (e) {
          return { ok: false, show: 'Could not update favourites: ' + e.message, say: 'Sorry, I could not update your favourites.' };
        }
      }

      // nearest facility
      const wantsNearest = /\b(nearest|closest|nearby|near me|near here|around here)\b/.test(t) || /\bwhere can i (eat|get|find|park|study)\b/.test(t) || /\bi am (hungry|thirsty)\b/.test(t) || /\bi m (hungry|thirsty)\b/.test(t);
      if (wantsNearest) {
        let fac = V.findBest(t, FACILITIES)[0];
        if (!fac && /\b(hungry|thirsty)\b/.test(t)) fac = FACILITIES[1];
        if (!fac) return { ok: true, show: 'Opening Nearest Facility…', go: '/nearest.html' };
        if (actions().nearest) { const r = actions().nearest(fac.id); if (r) return r; }
        return { ok: true, show: `Finding nearest ${fac.id}…`, go: '/nearest.html?type=' + encodeURIComponent(fac.id) };
      }

      // emergencies
      if (/\b(emergency|ambulance|accident|medical help|need a doctor|need help|someone is (hurt|injured|unconscious)|i am (hurt|injured|bleeding)|call security|fire)\b/.test(t)) {
        const target = /\b(doctor|medical|ambulance|hurt|injured|bleeding|unconscious|accident|hospital)\b/.test(t) ? 'medical'
          : /\b(security|fire|police|guard)\b/.test(t) ? 'security' : null;
        if (target && actions().emergency) { const r = actions().emergency(target); if (r) return r; }
        return { ok: true, show: target ? 'Opening emergency route…' : 'Opening Emergency…', go: '/emergency.html' + (target ? '?run=' + target : '') };
      }

      // open a page
      const rest = stripVerbs(t);
      const pg = PAGES.find((p) => p.keys.includes(rest));
      if (pg && (rest !== t || /^(dashboard|home|map|emergency|favourites|favorites|admin|indoor|indoor map|campus map)$/.test(rest))) {
        if (pg.admin && user().role !== 'admin') return { ok: false, show: 'The Admin page is only for admins.', say: 'Sorry, the admin page is only for admins.' };
        if (here === pg.url.split('?')[0] && !pg.url.includes('?')) return { ok: true, show: `You're already on ${pg.name}.`, say: `You are already on ${pg.name}.` };
        return { ok: true, show: `Opening ${pg.name}…`, go: pg.url };
      }
    }
    return null;
  }

  // ---------- routes that live on another page ----------
  // from: 'indoor' | 'navigate' | null  (the page that already tried and failed)
  async function crossRoute(alts, from) {
    await loadData();
    const outC = V.outdoorCandidates();
    const plans = Object.entries(window.INDOOR_PLANS || {});
    const inC = plans.map(([id, plan]) => ({ id, plan, cands: V.indoorCandidates(plan) }));

    for (const a of alts) {
      const cmd = V.parseCommand(a);
      if (!cmd.to) continue;
      const od = V.findBestScored(cmd.to, outC);
      let idd = { score: 0 }, planId = null;
      inC.forEach((p) => {
        const r = V.findBestScored(V.pullFloor(cmd.to, p.plan).text, p.cands);
        if (r.score > idd.score) { idd = r; planId = p.id; }
      });
      const hint = /\b(floor|lab|lift|elevator|stairs|staircase|cabin|classroom|inside|indoor|room)\b/.test(norm(a));
      let target = null;
      if (from === 'indoor') target = od.score ? 'out' : null;
      else if (from === 'navigate') target = idd.score ? 'in' : null;
      else if (od.score && idd.score) target = (idd.score > od.score || hint) ? 'in' : 'out';
      else target = idd.score ? 'in' : od.score ? 'out' : null;

      if (target === 'out') return { ok: true, show: 'Opening Find Route…', go: '/navigate.html?voice=' + encodeURIComponent(a) };
      if (target === 'in') return { ok: true, show: 'Opening the indoor map…', go: '/indoor.html?building=' + encodeURIComponent(planId) + '&voice=' + encodeURIComponent(a) };
    }
    return null;
  }

  async function globalHandle(alts) {
    const pi = await pageIntent(alts);
    if (pi) return pi;
    const cr = await crossRoute(alts, null);
    if (cr) return cr;
    const msg = "Sorry, I didn't understand that. Try “take me to the library” or say “help”.";
    return { ok: false, show: msg, say: msg.replace(/[“”]/g, '') };
  }

  V.pageIntent = pageIntent;
  V.crossRoute = crossRoute;
  V.globalHandle = globalHandle;

  // ---------- floating assistant (skipped where an inline mic card already exists) ----------
  if (document.getElementById('micBtn')) return;

  const root = document.createElement('div');
  root.className = 'vg-root';
  root.innerHTML = `
    <div class="vg-panel" id="vgPanel" hidden>
      <div class="vg-head"><span class="vg-title">🎤 Voice assistant</span><button type="button" class="vg-x" id="vgClose" title="Close">✕</button></div>
      <div class="voice-heard" id="vgHeard">Tap the mic and say “take me to the library”.</div>
      <form class="vg-type" id="vgForm"><input id="vgInput" type="text" placeholder="…or type a command" autocomplete="off" /><button type="submit">Go</button></form>
      <div class="vg-chips" id="vgChips"></div>
      <div class="voice-opts"><label><input type="checkbox" id="vgSpeak" checked /> Read answers aloud</label><button type="button" id="vgRepeat" style="display:none;">🔊 Repeat</button></div>
    </div>
    <button type="button" class="vg-fab" id="vgMic" title="Voice assistant">🎤</button>`;
  document.body.appendChild(root);

  const panel = root.querySelector('#vgPanel');
  const ctl = V.attach({
    mic: root.querySelector('#vgMic'),
    heard: root.querySelector('#vgHeard'),
    toggle: root.querySelector('#vgSpeak'),
    repeat: root.querySelector('#vgRepeat'),
    handle: globalHandle
  });
  root.querySelector('#vgMic').addEventListener('click', () => { panel.hidden = false; });
  root.querySelector('#vgClose').addEventListener('click', () => { panel.hidden = true; V.stopSpeaking(); });
  root.querySelector('#vgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = root.querySelector('#vgInput');
    const v = inp.value.trim();
    if (v) { ctl.run([v]); inp.value = ''; }
  });
  const chips = root.querySelector('#vgChips');
  ['Take me to the library', 'Nearest canteen', 'I need a doctor', 'Take me to room 105', 'Open dashboard'].forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = c;
    b.addEventListener('click', () => ctl.run([c]));
    chips.appendChild(b);
  });
  if (!V.supported) { panel.hidden = false; }
})();
