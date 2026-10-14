'use strict';
/* Portaaljacht – alles wat over het beeld heen ligt: hartjes, itembalk, kompas, teksten */

const HUD = {
  el: {},
  titleT: 0, actionT: 0, itemT: 0, lastHearts: -1, hurtV: 0, lastCompass: 99,
  compassCtx: null, dial: null,

  init() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      hud: $('hud'), hearts: $('hearts'), hotbar: $('hotbar'), item: $('item-name'), action: $('actionbar'),
      titles: $('titles'), tmain: $('title-main'), tsub: $('title-sub'), chat: $('chat'),
      obj: $('obj-text'), tip: $('obj-tip'), compassWrap: $('compass-wrap'), compass: $('compass'), compassDist: $('compass-dist'),
      boss: $('bossbar'), bossFill: $('boss-fill'), bossName: $('boss-name'),
      fxPortal: $('fx-portal'), fxHurt: $('fx-hurt'), fxFire: $('fx-fire'), fxWater: $('fx-water'),
      fxFrost: $('fx-frost'), fxDark: $('fx-dark'),
    };

    for (let i = 0; i < 10; i++) {
      const d = document.createElement('div');
      d.className = 'heart';
      this.el.hearts.appendChild(d);
    }

    HOTBAR.forEach((it, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      if (it.type === 'block') drawBlockIcon(c, it.id);
      slot.appendChild(c);
      const cnt = document.createElement('span');
      cnt.className = 'count';
      slot.appendChild(cnt);
      slot.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); game.selectSlot(i); }, { passive: false });
      slot.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); game.selectSlot(i); });
      this.el.hotbar.appendChild(slot);
    });

    // munten en diamanten rechtsboven, harnas boven de hartjes
    const wallet = document.createElement('div');
    wallet.id = 'wallet';
    wallet.innerHTML = '<span class="wal"><img alt="" id="wal-coin"><b id="wal-coins">0</b></span><span class="wal"><img alt="" id="wal-dia"><b id="wal-dias">0</b></span>';
    this.el.hud.appendChild(wallet);
    wallet.querySelector('#wal-coin').src = itemIconURL('coin');
    wallet.querySelector('#wal-dia').src = itemIconURL('diamond');
    this.el.coins = wallet.querySelector('#wal-coins');
    this.el.dias = wallet.querySelector('#wal-dias');
    const armor = document.createElement('div');
    armor.id = 'armorbar';
    this.el.hearts.parentNode.insertBefore(armor, this.el.hearts);
    this.el.armor = armor;
    for (let i = 0; i < 10; i++) { const d = document.createElement('div'); d.className = 'armor'; armor.appendChild(d); }
    this.armorFull = pixelCanvas(9, 9, (x, y) => {
      if (y === 0 && (x <= 2 || x >= 6)) return [30, 30, 30];
      if (y > 0 && y < 8 && x > 0 && x < 8 && !(y < 3 && x >= 3 && x <= 5)) return x < 3 ? [235, 235, 235] : [190, 190, 190];
      if (y <= 8 && (x === 0 || x === 8) && y > 0 && y < 4) return [30, 30, 30];
      if (y === 8 && x > 0 && x < 8) return [30, 30, 30];
      if ((x === 0 || x === 8) && y >= 4) return null;
      if (x === 1 && y >= 4 && y < 8) return [30, 30, 30];
      return null;
    }).toDataURL();
    this.lastArmor = -1;
    document.querySelectorAll('.dirt').forEach((el) => { el.style.backgroundImage = 'url(' + Tex.dirtURL + ')'; });
    document.querySelectorAll('.logo').forEach((logo) => {
      logo.style.backgroundImage = 'url(' + Tex.stoneURL + ')';
      logo.classList.add('stone');
    });

    // Kompas: wijzerplaat één keer tekenen
    this.compassCtx = this.el.compass.getContext('2d');
    this.dial = pixelCanvas(16, 16, (x, y) => {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > 7.6) return null;
      if (d > 6.3) return [58, 58, 58];
      if (d > 5.4) return (x + y) < 15 ? [168, 168, 168] : [110, 110, 110];
      return [214, 206, 182];
    });
  },

  show(on) { if (this.el.hud) this.el.hud.classList.toggle('hidden', !on); },

  setHearts(hp) {
    const h = Math.ceil(hp);
    if (h === this.lastHearts) return;
    this.lastHearts = h;
    const kids = this.el.hearts.children;
    for (let i = 0; i < 10; i++) {
      const v = h - i * 2;
      kids[i].style.backgroundImage = 'url(' + (v >= 2 ? Tex.heartFull : v === 1 ? Tex.heartHalf : Tex.heartEmpty) + ')';
    }
    this.el.hearts.classList.toggle('low', h <= 4);
  },

  // Iconen van zwaard, boog en appels hangen af van wat je hebt
  refreshHotbar() {
    const kids = this.el.hotbar.children;
    HOTBAR.forEach((it, i) => {
      const slot = kids[i];
      const c = slot.querySelector('canvas'), cnt = slot.querySelector('.count');
      let key = '';
      if (it.type === 'sword') key = PROG.sword;
      else if (it.type === 'bow') key = 'bow';
      else if (it.type === 'apple') key = 'apple';
      if (key && slot.dataset.icon !== key) { drawItemIcon(c, key); slot.dataset.icon = key; }
      slot.classList.toggle('locked', (it.type === 'bow' && !PROG.owned.bow) || (it.type === 'apple' && PROG.apples <= 0));
      cnt.textContent = it.type === 'apple' && PROG.apples > 1 ? String(PROG.apples) : '';
    });
    this.refreshWallet();
    this.setArmor(armorDefense());
  },

  refreshWallet() {
    if (!this.el.coins) return;
    this.el.coins.textContent = String(PROG.coins);
    this.el.dias.textContent = String(PROG.diamonds);
  },

  setArmor(def) {
    const pts = Math.min(20, Math.round(def / 0.75 * 20));
    if (pts === this.lastArmor) return;
    this.lastArmor = pts;
    const kids = this.el.armor.children;
    this.el.armor.style.visibility = pts > 0 ? 'visible' : 'hidden';
    for (let i = 0; i < 10; i++) {
      const v = pts - i * 2;
      kids[i].style.backgroundImage = 'url(' + this.armorFull + ')';
      kids[i].style.opacity = v >= 2 ? 1 : v === 1 ? 0.55 : 0.18;
    }
  },

  setSlot(i) {
    const kids = this.el.hotbar.children;
    for (let k = 0; k < kids.length; k++) kids[k].classList.toggle('sel', k === i);
    this.el.item.textContent = slotName(i);
    this.el.item.style.opacity = 1;
    this.itemT = 2;
  },

  title(main, sub, dur) {
    this.el.tmain.textContent = main || '';
    this.el.tsub.textContent = sub || '';
    this.el.titles.style.opacity = 1;
    this.titleT = dur || 3;
  },

  actionbar(text, dur) {
    if (this.el.action.textContent !== text) this.el.action.textContent = text;
    this.el.action.style.opacity = 1;
    this.actionT = dur || 2;
  },

  chat(text) {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.textContent = text;
    this.el.chat.appendChild(line);
    while (this.el.chat.children.length > 5) this.el.chat.removeChild(this.el.chat.firstChild);
    setTimeout(() => { line.style.opacity = 0; }, 8000);
    setTimeout(() => { if (line.parentNode) line.parentNode.removeChild(line); }, 8700);
  },

  clearChat() { this.el.chat.innerHTML = ''; },
  clearTitle() { this.el.titles.style.opacity = 0; this.titleT = 0; },

  objective(text, tip) {
    this.el.obj.textContent = text;
    this.el.tip.textContent = tip || '';
  },

  showCompass(on, label) {
    this.el.compassWrap.classList.toggle('hidden', !on);
    if (label) this.el.compassWrap.querySelector('#compass-label').textContent = label;
  },

  compassDist(d) {
    const m = Math.round(d);
    if (m === this.lastDist) return;
    this.lastDist = m;
    this.el.compassDist.textContent = m + ' m';
  },

  drawCompass(angle) {
    if (Math.abs(angleDiff(angle, this.lastCompass)) < 0.04) return;
    this.lastCompass = angle;
    const ctx = this.compassCtx;
    ctx.clearRect(0, 0, 16, 16);
    ctx.drawImage(this.dial, 0, 0);
    const sx = Math.sin(angle), sy = -Math.cos(angle);
    ctx.fillStyle = '#5a5a5a';
    for (let i = 0.5; i <= 3.5; i += 0.5) ctx.fillRect(Math.floor(7.5 - sx * i), Math.floor(7.5 - sy * i), 1, 1);
    ctx.fillStyle = '#e02020';
    for (let i = 0.5; i <= 5.2; i += 0.5) ctx.fillRect(Math.floor(7.5 + sx * i), Math.floor(7.5 + sy * i), 1, 1);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(7, 7, 2, 2);
  },

  bossbar(on, frac, enraged, name) {
    this.el.boss.classList.toggle('hidden', !on);
    if (!on) return;
    if (name && this.el.bossName.textContent !== name) this.el.bossName.textContent = name;
    this.el.bossFill.style.width = (clamp(frac, 0, 1) * 100).toFixed(1) + '%';
    this.el.boss.classList.toggle('enraged', !!enraged);
  },

  hurt() {
    this.hurtV = 1;
    this.el.hearts.classList.add('flash');
    setTimeout(() => this.el.hearts.classList.remove('flash'), 150);
  },

  setPortalFx(v) { this.el.fxPortal.style.opacity = v.toFixed(3); },

  update(dt) {
    if (this.titleT > 0) { this.titleT -= dt; if (this.titleT <= 0) this.el.titles.style.opacity = 0; }
    if (this.actionT > 0) { this.actionT -= dt; if (this.actionT <= 0) this.el.action.style.opacity = 0; }
    if (this.itemT > 0) { this.itemT -= dt; if (this.itemT <= 0) this.el.item.style.opacity = 0; }
    this.hurtV = Math.max(0, this.hurtV - dt * 2.2);
    this.el.fxHurt.style.opacity = this.hurtV.toFixed(3);
    const p = player;
    this.el.fxFire.style.opacity = (p.fire > 0 && !p.dead && game.state === 'playing') ? 1 : 0;
    const fluid = game.state === 'playing' ? p.eyeIn : null;
    this.el.fxWater.style.opacity = fluid ? 1 : 0;
    this.el.fxWater.classList.toggle('lava', fluid === 'lava');
    const live = game.state === 'playing' && !p.dead;
    this.el.fxFrost.style.opacity = live && p.slow > 0 ? Math.min(1, p.slow * 1.5).toFixed(2) : 0;
    this.el.fxDark.style.opacity = live && p.dark > 0 ? Math.min(1, p.dark * 1.2).toFixed(2) : 0;
    this.setHearts(p.health);
  },
};
