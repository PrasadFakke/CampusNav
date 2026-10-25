// ========== CampusVoice: voice commands + spoken directions ==========
// Uses the browser's built-in Web Speech API (no keys, no extra packages):
//   - SpeechRecognition      -> listens to "take me to Room 105"
//   - speechSynthesis        -> reads the route out loud
// Works in Chrome / Edge / Safari on https:// or http://localhost. (Firefox has no SpeechRecognition.)
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  // ---------- text helpers ----------
  const DIGITS = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  const DW = Object.keys(DIGITS).join('|');

  function normalize(str) {
    let t = String(str || '').toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    // "one hundred (and) five" -> 105
    t = t.replace(new RegExp('\\b(one|two|three|four|five|six|seven|eight|nine) hundred(?: and)?(?: (' + DW + '))?\\b', 'g'),
      (_, h, u) => String(DIGITS[h]) + '0' + (u ? DIGITS[u] : '0'));
    // runs of spoken digits: "zero zero eight" -> 008, "staircase one" -> staircase 1
    t = t.replace(new RegExp('\\b(?:' + DW + ')(?: (?:' + DW + '))*\\b', 'g'),
      (run) => run.split(' ').map((w) => DIGITS[w]).join(''));
    return t.replace(/\s+/g, ' ').trim();
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 9;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'at', 'in', 'on', 'room', 'please', 'me', 'my', 'is', 'where']);

  // candidates: [{ id, aliases: ['library', ...] }]  ->  best-matching candidates (several if tied)
  function findBestScored(text, candidates) {
    const t = normalize(text);
    if (!t) return { items: [], score: 0 };
    const padded = ' ' + t + ' ';
    const tokens = t.split(' ');
    let best = 0, out = [];
    candidates.forEach((c) => {
      let score = 0;
      (c.aliases || []).forEach((alias) => {
        const a = normalize(alias);
        if (!a) return;
        let s = 0;
        if (padded.includes(' ' + a + ' ')) s = 100 + a.length;
        else {
          const at = a.split(' ').filter((w) => !STOP.has(w));
          if (at.length) {
            const hit = at.filter((w) => tokens.includes(w) || (w.length >= 5 && tokens.some((x) => x.length >= 4 && lev(x, w) <= 1))).length;
            if (hit === at.length) s = 60 + a.length * 0.5;
            else if (at.length > 1 && hit / at.length >= 0.6) s = 30 * (hit / at.length);
          }
        }
        if (s > score) score = s;
      });
      if (score > best + 1e-9) { best = score; out = [c]; }
      else if (score && Math.abs(score - best) < 1e-9) out.push(c);
    });
    return best >= 25 ? { items: out, score: best } : { items: [], score: 0 };
  }
  function findBest(text, candidates) { return findBestScored(text, candidates).items; }

  // ---------- parsing a spoken sentence ----------
  // returns { from: 'text'|null, to: 'text'|null, mode: 'stairs'|'lift'|null, clear: bool }
  function parseCommand(raw) {
    let t = normalize(raw);
    const res = { from: null, to: null, mode: null, clear: false, raw: t };
    if (/^(clear|reset|start over|cancel)\b/.test(t)) { res.clear = true; return res; }

    const m = t.match(/\b(?:by|via|using|use|through|with|take the|taking the)\s+(?:the\s+)?(stairs|stairway|staircase|steps|lift|elevator)\b(?!\s*\d)/);
    if (m) {
      res.mode = /lift|elevator/.test(m[1]) ? 'lift' : 'stairs';
      t = (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
    }
    t = t.replace(/\b(please|can you|could you|i want to|i wanna|i would like to|i need to|lets|let us|show me the way|guide me|help me)\b/g, ' ').replace(/\s+/g, ' ').trim();

    let a = t.match(/\bfrom (.+?) (?:to|towards) (.+)$/);
    if (a) { res.from = a[1]; res.to = a[2]; return res; }
    a = t.match(/\b(?:take me|go|going|walk|navigate|route|directions?|way|path|head|reach|find|show|get|bring me|lead me)\b.*?\b(?:to|towards|for)\s+(.+)$/);
    if (a) { res.to = a[1]; return res; }
    a = t.match(/^(?:where is|where s|locate|find)\s+(.+)$/);
    if (a) { res.to = a[1]; return res; }
    a = t.match(/^(.+?) to (.+)$/); // "entrance to room 105"
    if (a) { res.from = a[1]; res.to = a[2]; return res; }
    a = t.match(/^(?:to|towards)\s+(.+)$/);
    res.to = a ? a[1] : t;
    return res;
  }

  // ---------- speech out ----------
  let voice = null;
  function pickVoice() {
    if (!synth) return null;
    const vs = synth.getVoices();
    return vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (synth) synth.onvoiceschanged = () => { voice = pickVoice(); };

  function speak(text) {
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    voice = voice || pickVoice();
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-IN';
    u.rate = 0.95;
    synth.speak(u);
  }
  function stopSpeaking() { if (synth) synth.cancel(); }

  // ---------- mic button wiring ----------
  // opts: { mic, heard, toggle?, repeat?, handle(alternatives[]) -> { say?, show?, ok? } }
  function attach(opts) {
    const mic = opts.mic, heard = opts.heard;
    let rec = null, listening = false, lastSay = '';

    function note(msg, err) { if (heard) { heard.textContent = msg; heard.classList.toggle('err', !!err); } }
    function setListening(on) { listening = on; mic.classList.toggle('listening', on); mic.title = on ? 'Stop listening' : 'Speak a command'; }

    function respond(r) {
      r = r || {};
      if (r.show) note(r.show, r.ok === false);
      if (r.say) {
        lastSay = r.say;
        if (opts.repeat) opts.repeat.style.display = '';
        if (!opts.toggle || opts.toggle.checked) speak(r.say);
      }
      if (r.go) setTimeout(() => { window.location.href = r.go; }, 600);
    }
    // run a (typed or spoken) command through the handler
    function run(alts) {
      note('“' + alts[0] + '”');
      return Promise.resolve()
        .then(() => opts.handle(alts))
        .then(respond)
        .catch((e) => { console.error(e); note('Something went wrong handling that.', true); });
    }

    if (!SR) {
      mic.disabled = true;
      note('Voice input needs Chrome, Edge or Safari — you can still type a command.', true);
      return { supported: false, respond, run };
    }

    mic.addEventListener('click', () => {
      if (listening && rec) { rec.stop(); return; }
      stopSpeaking();
      rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.maxAlternatives = 4;
      rec.continuous = false;
      let finalAlts = null;

      rec.onstart = () => { setListening(true); note('Listening… speak now'); };
      rec.onresult = (ev) => {
        const res = ev.results[ev.results.length - 1];
        if (!res.isFinal) { note('“' + res[0].transcript + '”…'); return; }
        finalAlts = Array.from(res).map((x) => x.transcript);
      };
      rec.onerror = (ev) => {
        const msgs = {
          'not-allowed': 'Microphone blocked. Allow mic access in the browser address bar and try again.',
          'service-not-allowed': 'Microphone blocked. Allow mic access in the browser address bar and try again.',
          'no-speech': "I didn't hear anything. Tap the mic and try again.",
          'audio-capture': 'No microphone found.',
          'network': 'Speech service unreachable (needs internet).'
        };
        if (ev.error !== 'aborted') note(msgs[ev.error] || 'Voice error: ' + ev.error, true);
      };
      rec.onend = () => {
        setListening(false);
        if (finalAlts && finalAlts.length) run(finalAlts);
      };
      try { rec.start(); } catch (e) { setListening(false); }
    });

    if (opts.repeat) opts.repeat.addEventListener('click', () => speak(lastSay));
    if (opts.toggle) opts.toggle.addEventListener('change', () => { if (!opts.toggle.checked) stopSpeaking(); });
    return { supported: true, respond, run };
  }

  // ---------- shared place vocab (campus + indoor) ----------
  const OUTDOOR_EXTRA = {
    entrance: ['entrance', 'main entrance', 'main gate', 'gate', 'exit'],
    spit: ['spit', 's p i t', 'sp it', 'sardar patel institute of technology', 'engineering college'],
    spce: ['spce', 's p c e', 'sp ce', 'sardar patel college of engineering'],
    workshop: ['workshop', 'spce workshop', 'work shop'],
    library: ['library', 'main library', 'books'],
    'lib-ext': ['library extension', 'lib extension', 'new library'],
    'bhavans-college': ['bhavans college', 'college', 'bhavans'],
    cultural: ['cultural centre', 'cultural center', 'auditorium', 'bhavans cultural centre'],
    spjimr: ['spjimr', 's p j i m r', 'jamnalal bajaj', 'management institute'],
    'spjimr-hostel': ['spjimr hostel', 'mba hostel'],
    hostel: ['hostel', 'boys hostel', 'main hostel'],
    wadia: ['wadia', 'highschool', 'high school', 'school', 'a h wadia'],
    'sports-complex': ['sports complex', 'gym', 'sports'],
    playground: ['playground', 'ground', 'field', 'football ground'],
    lake: ['lake'],
    canteen: ['canteen', 'cafeteria', 'mess', 'food court', 'food'],
    medical: ['medical centre', 'medical center', 'medical', 'hospital', 'doctor', 'dispensary', 'first aid'],
    security: ['security office', 'security', 'guard', 'police']
  };
  const INDOOR_EXTRA = {
    'entrance / exit': ['entrance', 'exit', 'main entrance', 'main gate', 'gate'],
    'alams xerox': ['xerox', 'photocopy', 'photocopier', 'print shop', 'alams'],
    'tpo cabin': ['tpo', 't p o', 'placement cell', 'placement'],
    'exam cell': ['exam cell', 'exam section', 'examination cell'],
    'professors cabin': ['professors cabin', 'professor cabin', 'prof cabin', 'professors'],
    'techsop': ['techsop', 'tech shop', 'tech sop', 'techshop'],
    'sitting area': ['sitting area', 'seating area', 'sitting'],
    'control systems lab': ['control systems lab', 'control system lab', 'control lab'],
    'library': ['library', 'books', 'reading room'],
    'office': ['office', 'admin office', 'administration']
  };

  function outdoorCandidates(includeLake) {
    return (window.CAMPUS_LOCATIONS || []).filter((l) => includeLake || l.id !== 'lake').map((l) => ({
      id: l.id,
      aliases: [l.name, window.getShortLabel ? window.getShortLabel(l.id) : '', ...(OUTDOOR_EXTRA[l.id] || [])].filter(Boolean)
    }));
  }

  function indoorAliases(n) {
    const name = n.name.toLowerCase();
    const set = new Set([name, (n.label || '').toLowerCase()]);
    set.add(name.replace('staircase', 'stairs'));
    set.add(name.replace('stairs', 'staircase'));
    if (name === 'staircase') { set.add('stairs'); set.add('stairway'); }
    if (name === 'lift') set.add('elevator');
    const rm = name.match(/^room (\d+)$/);
    if (rm) { set.add(rm[1]); set.add('class ' + rm[1]); set.add('classroom ' + rm[1]); }
    (INDOOR_EXTRA[name] || []).forEach((x) => set.add(x));
    set.delete('');
    return [...set];
  }
  function indoorCandidates(plan) {
    return Object.values(plan.byId).filter((n) => !n.hidden).map((n) => ({ id: n.gid, floor: n.floorId, aliases: indoorAliases(n) }));
  }

  // "first floor" / "2nd floor" / "ground floor" -> { text without it, floorId }
  function pullFloor(seg, plan) {
    let floorId = null;
    let t = ' ' + normalize(seg) + ' ';
    [[/ (ground|zeroth|0th) floor /, 0], [/ (first|1st|1) floor /, 1], [/ (second|2nd|2) floor /, 2], [/ (third|3rd|3) floor /, 3]].forEach(([re, i]) => {
      if (floorId == null && re.test(t) && plan.floors[i]) { floorId = plan.floors[i].id; t = t.replace(re, ' '); }
    });
    return { text: t.trim(), floorId };
  }

  window.CampusVoice = { supported: !!SR, speakSupported: !!synth, normalize, findBest, findBestScored, parseCommand, speak, stopSpeaking, attach, outdoorCandidates, indoorCandidates, pullFloor };
})();
