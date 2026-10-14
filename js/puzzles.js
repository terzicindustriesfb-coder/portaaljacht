'use strict';
/* Portaaljacht – puzzels om een schatkist te openen, en het schatscherm */

const Puzzle = {
  root: null, board: null, msg: null, titleEl: null, hintBtn: null, type: null, onSolved: null,
  timers: [], st: null, level: 0,

  init() {
    const root = document.createElement('div');
    root.id = 'screen-puzzle';
    root.className = 'screen hidden darken';
    root.innerHTML =
      '<div class="mcpanel puzzle-panel">' +
      '  <div class="mcpanel-title" id="puz-title">Schatkist</div>' +
      '  <div class="puz-msg" id="puz-msg"></div>' +
      '  <div class="puz-board" id="puz-board"></div>' +
      '  <div class="puz-buttons">' +
      '    <button class="mcbtn small" id="puz-hint" type="button">Hint</button>' +
      '    <button class="mcbtn small" id="puz-close" type="button">Later</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(root);
    this.root = root;
    this.board = root.querySelector('#puz-board');
    this.msg = root.querySelector('#puz-msg');
    this.titleEl = root.querySelector('#puz-title');
    this.hintBtn = root.querySelector('#puz-hint');
    this.hintBtn.addEventListener('click', (e) => { e.preventDefault(); this.hint(); });
    root.querySelector('#puz-close').addEventListener('click', (e) => { e.preventDefault(); SND.play('click'); this.close(); });
  },

  open(type, level, title, onSolved) {
    this.clearTimers();
    this.root.querySelector('#puz-close').disabled = false;
    this.type = type; this.level = level; this.onSolved = onSolved;
    this.titleEl.textContent = title;
    this.board.className = 'puz-board puz-' + type;
    this.board.style.gridTemplateColumns = '';
    this.board.innerHTML = '';
    this.root.classList.remove('hidden');
    ({ sequence: () => this.startSequence(), lights: () => this.startLights(), memory: () => this.startMemory(), slide: () => this.startSlide(), pairs: () => this.startPairs() })[type]();
  },

  close() {
    this.clearTimers();
    this.root.classList.add('hidden');
    this.st = null;
    game.closeUI();
  },

  solved() {
    this.clearTimers();
    // de kist gaat open: 'Later' mag de oplossing nu niet meer weggooien
    this.root.querySelector('#puz-close').disabled = true;
    this.setMsg('Opgelost! De kist gaat open...');
    SND.play('levelup');
    const cb = this.onSolved;
    this.later(() => {
      this.root.classList.add('hidden');
      this.st = null;
      if (cb) cb();
    }, 1100);
  },

  setMsg(t) { this.msg.textContent = t; },
  later(fn, ms) { this.timers.push(setTimeout(fn, ms)); },
  clearTimers() { for (const t of this.timers) clearTimeout(t); this.timers = []; },
  hint() { SND.play('click'); if (this.st && this.st.hint) this.st.hint(); },

  makeCell(cls, onTap) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'puz-cell ' + (cls || '');
    const fire = (e) => { e.preventDefault(); e.stopPropagation(); onTap(); };
    b.addEventListener('touchstart', fire, { passive: false });
    b.addEventListener('mousedown', fire);
    this.board.appendChild(b);
    return b;
  },

  /* ---- 1. Kleurenreeks nadoen (Nether) ---- */
  startSequence() {
    const colors = ['rood', 'geel', 'groen', 'blauw'];
    const tones = [330, 392, 494, 587];
    const rounds = this.level >= 8 ? 4 : 3;
    const pads = colors.map((c, i) => this.makeCell('pad pad-' + c, () => press(i)));
    const seq = [];
    for (let i = 0; i < 3 + Math.min(3, Math.floor(this.level / 3) + (this.level > 0 ? 1 : 0)); i++) seq.push(Math.floor(Math.random() * 4));
    const st = { seq, round: 0, pos: 0, input: false };
    this.st = st;
    const flash = (i, ms) => {
      pads[i].classList.add('lit');
      if (SND.ctx) SND.tone({ type: 'square', f0: tones[i], dur: ms / 1000, vol: 0.08 });
      this.later(() => pads[i].classList.remove('lit'), ms);
    };
    const show = () => {
      st.input = false; st.pos = 0;
      this.setMsg('Kijk goed... (ronde ' + (st.round + 1) + ' van ' + rounds + ')');
      const len = seq.length;
      for (let k = 0; k < len; k++) this.later(() => flash(seq[k], 380), 700 + k * 600);
      this.later(() => { st.input = true; this.setMsg('Jouw beurt! Tik de kleuren in dezelfde volgorde.'); }, 700 + len * 600);
    };
    const press = (i) => {
      if (!st.input) return;
      flash(i, 220);
      if (i !== seq[st.pos]) {
        st.input = false;
        SND.play('hurt', { vol: 0.5 });
        this.setMsg('Oeps! Kijk nog een keer...');
        this.later(show, 1100);
        return;
      }
      st.pos++;
      if (st.pos >= seq.length) {
        st.input = false;
        st.round++;
        if (st.round >= rounds) { this.solved(); return; }
        seq.push(Math.floor(Math.random() * 4));
        this.setMsg('Goed zo! Nog een keer, iets langer...');
        this.later(show, 1100);
      }
    };
    st.hint = () => { if (st.input || st.pos === 0) show(); };
    this.hintBtn.textContent = 'Nog eens zien';
    show();
  },

  /* ---- 2. Lampjes aanzetten (IJsrijk): elke tik wisselt het lampje en zijn buren ---- */
  startLights() {
    const N = this.level >= 6 ? 4 : 3;
    this.board.style.gridTemplateColumns = 'repeat(' + N + ', min(' + (N === 4 ? 70 : 88) + 'px, ' + (N === 4 ? 13 : 16) + 'vh))';
    const on = new Array(N * N).fill(true);
    const need = new Array(N * N).fill(false);
    const toggle = (i) => {
      const x = i % N, y = Math.floor(i / N);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) on[ny * N + nx] = !on[ny * N + nx];
      }
      need[i] = !need[i];
    };
    const presses = N === 4 ? 5 + Math.min(3, this.level - 6) : 3 + Math.min(2, this.level);
    const order = [...Array(N * N).keys()].sort(() => Math.random() - 0.5).slice(0, presses);
    for (const i of order) toggle(i);
    const start = { on: on.slice(), need: need.slice() };
    const cells = [];
    const st = { moves: 0 };
    this.st = st;
    const draw = () => {
      cells.forEach((c, i) => { c.classList.toggle('lit', on[i]); c.classList.remove('hinted'); });
    };
    for (let i = 0; i < N * N; i++) {
      cells.push(this.makeCell('lamp', () => {
        toggle(i); st.moves++;
        SND.play('click');
        draw();
        if (on.every(Boolean)) this.solved();
      }));
    }
    st.hint = () => {
      const i = need.findIndex(Boolean);
      if (i < 0) return;
      cells[i].classList.add('hinted');
      this.setMsg('Tik eens op het knipperende lampje.');
    };
    st.reset = () => { for (let i = 0; i < N * N; i++) { on[i] = start.on[i]; need[i] = start.need[i]; } draw(); };
    this.hintBtn.textContent = 'Hint';
    this.setMsg('Zet alle lampjes aan! Een tik wisselt het lampje en zijn buren.');
    draw();
  },

  /* ---- 3. Patroon onthouden (Schaduwwereld) ---- */
  startMemory() {
    const N = 4;
    const cells = [];
    const st = { round: 0, pattern: [], found: new Set(), lives: 3, input: false };
    this.st = st;
    const rounds = 2;
    const sizes = this.level >= 7 ? [6, 8] : [5, 6];
    for (let i = 0; i < N * N; i++) cells.push(this.makeCell('mem', () => tap(i)));
    const newPattern = () => {
      const idx = [...Array(N * N).keys()].sort(() => Math.random() - 0.5);
      st.pattern = idx.slice(0, sizes[st.round]);
    };
    const show = (ms) => {
      st.input = false;
      st.found.clear();
      st.lives = 3;
      cells.forEach((c) => c.classList.remove('good', 'bad', 'lit'));
      for (const i of st.pattern) cells[i].classList.add('lit');
      this.setMsg('Onthoud de lichtjes! (ronde ' + (st.round + 1) + ' van ' + rounds + ')');
      this.later(() => {
        cells.forEach((c) => c.classList.remove('lit'));
        st.input = true;
        this.setMsg('Tik de ' + st.pattern.length + ' lichtjes aan. Levens: ' + st.lives);
      }, ms);
    };
    const tap = (i) => {
      if (!st.input || st.found.has(i)) return;
      if (st.pattern.includes(i)) {
        st.found.add(i);
        cells[i].classList.add('good');
        SND.play('pop', { vol: 0.6 });
        if (st.found.size === st.pattern.length) {
          st.input = false;
          st.round++;
          if (st.round >= rounds) { this.solved(); return; }
          this.setMsg('Super! Nu een moeilijkere...');
          this.later(() => { newPattern(); show(2600); }, 1000);
        }
      } else {
        cells[i].classList.add('bad');
        this.later(() => cells[i].classList.remove('bad'), 400);
        st.lives--;
        SND.play('hurt', { vol: 0.4 });
        if (st.lives <= 0) {
          st.input = false;
          this.setMsg('Op! Kijk nog een keer goed...');
          this.later(() => show(2600), 1000);
        } else this.setMsg('Mis! Levens: ' + st.lives);
      }
    };
    st.hint = () => {
      if (!st.input) return;
      for (const i of st.pattern) if (!st.found.has(i)) cells[i].classList.add('lit');
      st.input = false;
      this.later(() => { cells.forEach((c) => c.classList.remove('lit')); st.input = true; }, 900);
    };
    this.hintBtn.textContent = 'Spiek even';
    newPattern();
    show(2800);
  },

  /* ---- 4. Schuifpuzzel (Hemelrijk) ---- */
  startSlide() {
    const N = 3;
    // het plaatje: een grote diamant op goud
    const img = pixelCanvas(48, 48, (x, y) => {
      const art = ITEM_ART.diamond();
      const c = art(Math.floor(x / 3), Math.floor(y / 3));
      if (c) return c;
      return ((x >> 3) + (y >> 3)) % 2 ? [214, 160, 40] : [240, 196, 70];
    });
    const url = img.toDataURL();
    let tiles = [...Array(N * N).keys()]; // tegel 8 = leeg
    const empty = () => tiles.indexOf(N * N - 1);
    const neighbors = (e) => {
      const x = e % N, y = Math.floor(e / N), out = [];
      if (x > 0) out.push(e - 1);
      if (x < N - 1) out.push(e + 1);
      if (y > 0) out.push(e - N);
      if (y < N - 1) out.push(e + N);
      return out;
    };
    const swap = (a, b) => { const t = tiles[a]; tiles[a] = tiles[b]; tiles[b] = t; };
    let prev = -1;
    const moves = 16 + Math.min(22, this.level * 3);
    for (let k = 0; k < moves; k++) {
      const e = empty();
      const opts = neighbors(e).filter((n) => n !== prev);
      const n = opts[Math.floor(Math.random() * opts.length)];
      swap(e, n); prev = e;
    }
    if (tiles.every((t, i) => t === i)) { const e = empty(); swap(e, neighbors(e)[0]); }
    const solvedNow = () => tiles.every((t, i) => t === i);
    const cells = [];
    const st = {};
    this.st = st;
    const draw = () => {
      cells.forEach((c, i) => {
        const t = tiles[i];
        c.classList.toggle('empty', t === N * N - 1);
        c.classList.remove('hinted');
        if (t === N * N - 1) { c.style.backgroundImage = ''; c.textContent = ''; return; }
        c.style.backgroundImage = 'url(' + url + ')';
        c.style.backgroundPosition = ((t % N) * 50) + '% ' + (Math.floor(t / N) * 50) + '%';
        c.textContent = String(t + 1);
      });
    };
    for (let i = 0; i < N * N; i++) {
      cells.push(this.makeCell('slide', () => {
        const e = empty();
        if (!neighbors(e).includes(i)) return;
        swap(e, i);
        SND.play('click');
        draw();
        if (solvedNow()) this.solved();
      }));
    }
    st.hint = () => {
      const m = slideHintMove(tiles, N);
      if (m >= 0) { cells[m].classList.add('hinted'); this.setMsg('Schuif het knipperende stukje.'); }
    };
    this.hintBtn.textContent = 'Hint';
    this.setMsg('Schuif de stukjes tot de diamant weer heel is (1 t/m 8 op volgorde).');
    draw();
  },

  /* ---- 5. Kaartjes zoeken: vind de paren (Zandpiramide, Paddenstoeleiland) ---- */
  startPairs() {
    const kinds = ['coin', 'diamond', 'apple', 'bow', 'sword_diamond', 'armor_iron', 'sword_fire', 'armor_diamond'];
    const nPairs = this.level >= 9 ? 8 : 6;
    const cols = nPairs === 8 ? 4 : 4;
    this.board.style.gridTemplateColumns = 'repeat(' + cols + ', min(72px, ' + (nPairs === 8 ? 13 : 15) + 'vh))';
    this.board.classList.toggle('many', nPairs === 8);
    const deck = [];
    for (let i = 0; i < nPairs; i++) deck.push(kinds[i], kinds[i]);
    deck.sort(() => Math.random() - 0.5);
    const st = { open: [], found: 0, busy: false, moves: 0 };
    this.st = st;
    const cells = deck.map((k, i) => this.makeCell('card', () => flip(i)));
    const show = (i, on) => {
      const c = cells[i];
      c.classList.toggle('up', on);
      c.style.backgroundImage = on ? 'url(' + itemIconURL(deck[i]) + ')' : '';
    };
    const flip = (i) => {
      if (st.busy || cells[i].classList.contains('up')) return;
      show(i, true);
      SND.play('click');
      st.open.push(i);
      if (st.open.length < 2) return;
      st.moves++;
      const [a, b] = st.open;
      st.open = [];
      if (deck[a] === deck[b]) {
        cells[a].classList.add('good'); cells[b].classList.add('good');
        SND.play('pop', { vol: 0.7 });
        st.found++;
        this.setMsg('Gevonden! Nog ' + (nPairs - st.found) + ' paren.');
        if (st.found >= nPairs) this.solved();
      } else {
        st.busy = true;
        this.later(() => { show(a, false); show(b, false); st.busy = false; }, 750);
      }
    };
    st.hint = () => {
      if (st.busy) return;
      st.busy = true;
      cells.forEach((c, i) => { if (!c.classList.contains('up')) { c.style.backgroundImage = 'url(' + itemIconURL(deck[i]) + ')'; c.classList.add('peek'); } });
      this.later(() => {
        cells.forEach((c) => { if (c.classList.contains('peek')) { c.classList.remove('peek'); c.style.backgroundImage = ''; } });
        st.busy = false;
      }, 900);
    };
    this.hintBtn.textContent = 'Spiek even';
    this.setMsg('Draai twee kaartjes om en zoek de paren!');
  },

  /* ---- Schat gevonden ---- */
  showLoot(title, coins, diamonds, onClose) {
    let el = document.getElementById('screen-loot');
    if (!el) {
      el = document.createElement('div');
      el.id = 'screen-loot';
      el.className = 'screen hidden darken';
      el.innerHTML =
        '<div class="mcpanel loot-panel">' +
        '  <div class="mcpanel-title" id="loot-title"></div>' +
        '  <div class="loot-row"><img alt="" id="loot-coin-img"><span id="loot-coins">0</span><span class="loot-label">munten</span></div>' +
        '  <div class="loot-row"><img alt="" id="loot-dia-img"><span id="loot-dias">0</span><span class="loot-label">diamanten</span></div>' +
        '  <button class="mcbtn" id="loot-ok" type="button">Super!</button>' +
        '</div>';
      document.body.appendChild(el);
      el.querySelector('#loot-coin-img').src = itemIconURL('coin');
      el.querySelector('#loot-dia-img').src = itemIconURL('diamond');
    }
    el.querySelector('#loot-title').textContent = title;
    const cEl = el.querySelector('#loot-coins'), dEl = el.querySelector('#loot-dias');
    cEl.textContent = '0'; dEl.textContent = '0';
    el.classList.remove('hidden');
    let t = 0;
    const steps = 24;
    const iv = setInterval(() => {
      t++;
      cEl.textContent = String(Math.round(coins * t / steps));
      dEl.textContent = String(Math.round(diamonds * t / steps));
      if (t % 3 === 0) SND.play('pop', { vol: 0.4 });
      if (t >= steps) clearInterval(iv);
    }, 45);
    const ok = el.querySelector('#loot-ok');
    ok.onclick = (e) => {
      e.preventDefault();
      clearInterval(iv);
      el.classList.add('hidden');
      SND.play('click');
      if (onClose) onClose();
    };
  },
};

// Eerste zet van de kortste oplossing (A* met Manhattan-afstand); geeft de index van het te schuiven vakje
function slideHintMove(tiles, N) {
  const goal = [...Array(N * N).keys()].join(',');
  const start = tiles.join(',');
  if (start === goal) return -1;
  const h = (arr) => {
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i];
      if (t === N * N - 1) continue;
      s += Math.abs((t % N) - (i % N)) + Math.abs(Math.floor(t / N) - Math.floor(i / N));
    }
    return s;
  };
  // kleine binaire heap op f
  const heap = [];
  const push = (n) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p].f <= heap[i].f) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l].f < heap[m].f) m = l;
        if (r < heap.length && heap[r].f < heap[m].f) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  push({ arr: tiles.slice(), g: 0, f: h(tiles), first: -1 });
  const seen = new Map([[start, 0]]);
  let iter = 0;
  while (heap.length && iter++ < 80000) {
    const cur = pop();
    const key = cur.arr.join(',');
    if (key === goal) return cur.first;
    const e = cur.arr.indexOf(N * N - 1);
    const x = e % N, y = Math.floor(e / N);
    const nbs = [];
    if (x > 0) nbs.push(e - 1);
    if (x < N - 1) nbs.push(e + 1);
    if (y > 0) nbs.push(e - N);
    if (y < N - 1) nbs.push(e + N);
    for (const n of nbs) {
      const a = cur.arr.slice();
      a[e] = a[n]; a[n] = N * N - 1;
      const k = a.join(',');
      const g = cur.g + 1;
      if (seen.has(k) && seen.get(k) <= g) continue;
      seen.set(k, g);
      push({ arr: a, g, f: g + h(a), first: cur.first < 0 ? n : cur.first });
    }
  }
  return -1;
}
