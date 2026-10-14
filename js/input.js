'use strict';
/* Portaaljacht – besturing: toetsenbord, muis en aanraakscherm */

const Input = {
  keys: Object.create(null),
  canvas: null,
  sens: 1,
  touchMode: false,
  // muis
  pointerLocked: false, lockFailed: false, everLocked: false,
  mouseDown: false, dragDist: 0,
  // aanraken
  joyId: null, joyOx: 0, joyOy: 0, moveX: 0, moveY: 0,
  lookId: null, lookLastX: 0, lookLastY: 0, lookMoved: 0, lookStart: 0, holdBreak: false,
  attackBtn: false, jumpBtn: false,
  // per frame
  lookDX: 0, lookDY: 0, primaryPressed: false, secondaryPressed: false,

  get primary() {
    return (this.mouseDown && (this.pointerLocked || this.dragDist < 8)) || this.attackBtn || this.holdBreak;
  },

  forward() {
    let f = 0;
    if (this.keys.KeyW || this.keys.ArrowUp || this.keys.KeyZ) f += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) f -= 1;
    return clamp(f + this.moveY, -1, 1);
  },
  strafe() {
    let s = 0;
    if (this.keys.KeyD || this.keys.ArrowRight) s += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft || this.keys.KeyQ) s -= 1;
    return clamp(s + this.moveX, -1, 1);
  },
  jump() { return !!(this.keys.Space || this.jumpBtn); },
  sprint() {
    return !!(this.keys.ShiftLeft || this.keys.ShiftRight ||
      (this.joyId !== null && this.moveY > 0.75 && Math.hypot(this.moveX, this.moveY) > 0.93));
  },

  endFrame() {
    this.primaryPressed = false;
    this.secondaryPressed = false;
    this.lookDX = 0; this.lookDY = 0;
    if (this.lookId !== null && !this.holdBreak && this.lookMoved < 14 && performance.now() - this.lookStart > 330) {
      this.holdBreak = true;
    }
  },

  releaseAll() {
    this.keys = Object.create(null);
    this.mouseDown = false; this.attackBtn = false; this.jumpBtn = false; this.holdBreak = false;
    this.endJoy(); this.lookId = null;
    document.querySelectorAll('.tbtn.down').forEach((el) => el.classList.remove('down'));
  },

  init(canvas) {
    this.canvas = canvas;
    this.sens = loadSetting('sens', 1);

    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT' && e.code !== 'Escape' && e.code !== 'KeyP') return;
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (game.state === 'playing') {
        if (/^Digit[1-9]$/.test(e.code)) game.selectSlot(Number(e.code.slice(5)) - 1);
        if ((e.code === 'Escape' || e.code === 'KeyP') && !this.pointerLocked) game.pause();
      } else if (game.state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP') && !e.repeat && (this.touchMode || this.lockFailed)) {
        // met de muis: klik op 'Verder spelen' (de browser staat de muisvergrendeling na Esc niet toe)
        game.resume();
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.releaseAll(); if (game.state === 'playing') game.pause(); });

    canvas.addEventListener('mousedown', (e) => {
      if (this.touchMode || game.state !== 'playing') return;
      e.preventDefault();
      if (!this.pointerLocked && !this.lockFailed) { this.requestLock(); return; }
      if (e.button === 0) { this.mouseDown = true; this.primaryPressed = true; this.dragDist = 0; }
      else if (e.button === 2) this.secondaryPressed = true;
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseDown = false; });
    window.addEventListener('mousemove', (e) => {
      if (game.state !== 'playing' || this.touchMode) return;
      if (this.pointerLocked) {
        this.lookDX += e.movementX * 0.0022 * this.sens;
        this.lookDY += e.movementY * 0.0022 * this.sens;
      } else if (this.lockFailed && this.mouseDown) {
        this.lookDX += e.movementX * 0.0045 * this.sens;
        this.lookDY += e.movementY * 0.0045 * this.sens;
        this.dragDist += Math.abs(e.movementX) + Math.abs(e.movementY);
      }
    });
    let wheelAcc = 0;
    window.addEventListener('wheel', (e) => {
      if (game.state !== 'playing') return;
      wheelAcc += e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      if (Math.abs(wheelAcc) < 50) return;
      const dir = Math.sign(wheelAcc);
      wheelAcc = 0;
      game.selectSlot((player.selected + dir + HOTBAR.length) % HOTBAR.length);
    }, { passive: true });
    // een echte muis op een aanraakapparaat: terug naar muisbesturing
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && this.touchMode && (e.movementX || e.movementY) && window.matchMedia && window.matchMedia('(any-pointer: fine)').matches) this.disableTouch();
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      this.pointerLocked = locked;
      if (locked) { this.everLocked = true; this.lockFailed = false; return; }
      this.mouseDown = false;
      if (game.state === 'playing' && !this.touchMode) game.pause();
    });
    document.addEventListener('pointerlockerror', () => this.onLockError());

    this.setupTouch();
    if (IS_TOUCH) this.enableTouch();
  },

  requestLock() {
    if (this.touchMode || !this.canvas.requestPointerLock) { this.lockFailed = true; return; }
    try {
      const p = this.canvas.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => this.onLockError());
    } catch (e) { this.onLockError(); }
  },

  onLockError() {
    if (!this.everLocked && !this.lockFailed) {
      this.lockFailed = true;
      HUD.chat('Tip: houd de muisknop ingedrukt en sleep om rond te kijken.');
      return;
    }
    // de browser weigerde (te snel na Esc): terug naar het pauzescherm, zodat je opnieuw kunt klikken
    if (game.state === 'playing' && !this.touchMode && !this.lockFailed) game.pause();
  },

  disableTouch() {
    if (!this.touchMode) return;
    this.touchMode = false;
    this.lockFailed = false;
    this.endJoy();
    document.body.classList.remove('touch');
    document.getElementById('touch').classList.add('hidden');
  },

  enableTouch() {
    if (this.touchMode) return;
    this.touchMode = true;
    document.body.classList.add('touch');
    if (game.state === 'playing') document.getElementById('touch').classList.remove('hidden');
  },

  setupTouch() {
    const base = document.getElementById('joy-base');
    const knob = document.getElementById('joy-knob');
    this.joyBase = base; this.joyKnob = knob;

    const onStart = (e) => {
      if (!this.touchMode) this.enableTouch();
      if (game.state !== 'playing') return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth * 0.42 && this.joyId === null) this.startJoy(t);
        else if (this.lookId === null) {
          this.lookId = t.identifier;
          this.lookLastX = t.clientX; this.lookLastY = t.clientY;
          this.lookMoved = 0; this.lookStart = performance.now(); this.holdBreak = false;
        }
      }
    };
    const onMove = (e) => {
      let used = false;
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyId) { this.moveJoy(t); used = true; }
        else if (t.identifier === this.lookId) {
          const dx = t.clientX - this.lookLastX, dy = t.clientY - this.lookLastY;
          this.lookLastX = t.clientX; this.lookLastY = t.clientY;
          this.lookDX += dx * 0.0065 * this.sens;
          this.lookDY += dy * 0.0065 * this.sens;
          this.lookMoved += Math.abs(dx) + Math.abs(dy);
          used = true;
        }
      }
      if (used || game.state === 'playing') e.preventDefault();
    };
    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyId) this.endJoy();
        else if (t.identifier === this.lookId) {
          if (!this.holdBreak && this.lookMoved < 12 && performance.now() - this.lookStart < 300) this.primaryPressed = true;
          this.lookId = null; this.holdBreak = false;
        }
      }
    };
    this.canvas.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: false });
    window.addEventListener('touchcancel', onEnd, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    const bindBtn = (id, down, up) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!this.touchMode) this.enableTouch();
        el.classList.add('down'); down();
      }, { passive: false });
      const end = (e) => { e.preventDefault(); el.classList.remove('down'); if (up) up(); };
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add('down'); down(); });
      el.addEventListener('mouseup', (e) => { el.classList.remove('down'); if (up) up(); e.stopPropagation(); });
      el.addEventListener('mouseleave', () => { if (el.classList.contains('down')) { el.classList.remove('down'); if (up) up(); } });
    };
    bindBtn('btn-jump', () => { this.jumpBtn = true; }, () => { this.jumpBtn = false; });
    bindBtn('btn-attack', () => { this.attackBtn = true; this.primaryPressed = true; }, () => { this.attackBtn = false; });
    bindBtn('btn-place', () => { this.secondaryPressed = true; });
    bindBtn('btn-pause', () => { if (game.state === 'playing') game.pause(); });
  },

  startJoy(t) {
    this.joyId = t.identifier;
    this.joyOx = t.clientX; this.joyOy = t.clientY;
    this.joyBase.style.left = (t.clientX - 62) + 'px';
    this.joyBase.style.top = (t.clientY - 62) + 'px';
    this.joyBase.style.bottom = 'auto';
    this.joyBase.classList.add('active');
    this.joyKnob.style.transform = '';
  },
  moveJoy(t) {
    let dx = t.clientX - this.joyOx, dy = t.clientY - this.joyOy;
    const R = 52, len = Math.hypot(dx, dy);
    if (len > R) { dx *= R / len; dy *= R / len; }
    this.moveX = dx / R;
    this.moveY = -dy / R;
    if (Math.hypot(this.moveX, this.moveY) < 0.12) { this.moveX = 0; this.moveY = 0; }
    this.joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  },
  endJoy() {
    this.joyId = null; this.moveX = 0; this.moveY = 0;
    if (!this.joyBase) return;
    this.joyBase.style.left = ''; this.joyBase.style.top = ''; this.joyBase.style.bottom = '';
    this.joyBase.classList.remove('active');
    this.joyKnob.style.transform = '';
  },
};
