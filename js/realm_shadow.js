'use strict';
/* Portaaljacht – wereld 3: de Schaduwwereld met De Schaduwkoning (teleport, schaduwballen, duisternis, leegtecirkels) */

const SHADOW_F = 18;                 // bovenste blok van de arenavloer
const SHADOW_TEX = {};
const SHADOW_CACHE = {};             // gedeelde geometrie en materialen (blijven tussen bezoeken bestaan)
const SHADOW_DECOR = { crystals: [] };
const SHADOW_V = [new THREE.Vector3(), new THREE.Vector3()]; // hulpvectoren, geen nieuwe objecten per frame
const SHADOW_EYE_DOM = { root: null, eyes: null, on: false, ph: -1 };
// deeltjeskleuren: paars, groen (fase 2), donker, roze (teleportplek)
const SHADOW_COL = { p: [0.72, 0.32, 1], g: [0.35, 1, 0.52], d: [0.06, 0.02, 0.1], pink: [1, 0.5, 1] };

/* ---------- Texturen ---------- */
function buildShadowTextures() {
  const R = mulberry32(1313);
  const v = (c, k) => { const d = (R() - 0.5) * 2 * k; return [c[0] + d, c[1] + d, c[2] + d]; };
  const rune = (x, y) => ((x === 7 || x === 8) && y % 4 === 1) || (y === 9 && x % 3 === 1);
  // gewaad: bijna zwart paars met plooien, gloeiende runen en een zoom
  SHADOW_TEX.robe = pixelTexture(16, 16, (x, y) => {
    if (y >= 14) return v([74, 58, 92], 6);
    if (rune(x, y)) return [150, 140, 160];
    if (x % 5 === 2) return v([14, 8, 22], 3);
    return v(R() < 0.3 ? [36, 22, 52] : [27, 16, 40], 4);
  });
  SHADOW_TEX.robeGlow = pixelTexture(16, 16, (x, y) => (rune(x, y) ? [210, 210, 210] : y >= 14 ? [150, 150, 150] : [20, 20, 20]));
  const skin = () => v(R() < 0.2 ? [32, 24, 42] : [46, 36, 58], 4);
  SHADOW_TEX.skin = pixelTexture(16, 16, skin);
  SHADOW_TEX.face = pixelTexture(16, 16, (x, y) => {
    const socket = (x >= 2 && x <= 6) || (x >= 9 && x <= 13);
    if (y >= 6 && y <= 8 && socket) return [8, 3, 12];
    if (y === 5 && socket) return [20, 12, 28];
    if (y === 12 && x >= 4 && x <= 11) return [10, 3, 14];
    if ((y === 11 && (x === 5 || x === 7 || x === 8 || x === 10)) || (y === 13 && (x === 6 || x === 9))) return [176, 156, 196];
    if (x >= 7 && x <= 8 && y >= 8 && y <= 10) return [30, 22, 40];
    return skin();
  });
  SHADOW_TEX.cape = pixelTexture(16, 16, (x, y) => {
    if (x === 0 || x === 15 || y === 15) return v([200, 160, 50], 8);
    if (x % 4 === 1) return v([46, 14, 66], 3);
    return v(R() < 0.25 ? [78, 28, 110] : [66, 22, 96], 4);
  });
  SHADOW_TEX.capeGlow = pixelTexture(16, 16, (x, y) => (x === 0 || x === 15 || y === 15 ? [255, 255, 255] : [0, 0, 0]));
  SHADOW_TEX.gold = pixelTexture(8, 8, (x, y) => {
    if (y === 7) return [120, 80, 10];
    const r = R();
    return r < 0.2 ? [255, 236, 120] : r < 0.6 ? [236, 190, 50] : [204, 150, 30];
  });
  SHADOW_TEX.gem = pixelTexture(4, 4, (x, y) => (x + y < 2 ? [255, 255, 255] : x + y < 5 ? [215, 215, 215] : [150, 150, 150]));
  SHADOW_TEX.hand = pixelTexture(8, 8, (x, y) => (y >= 6 && x % 2 === 0 ? [200, 190, 215] : v([40, 32, 52], 5)));
  SHADOW_TEX.stick = pixelTexture(4, 16, (x, y) => (y % 5 === 0 ? [150, 90, 220] : v([28, 18, 40], 4)));
}

/* ---------- Kleine hulpjes ---------- */
// Deeltjes: paarse (of groene) vonken met wat zwarte rook ertussen
function shadowSpark(x, y, z, ph2, spread, up) {
  const dark = Math.random() < 0.35;
  const c = dark ? SHADOW_COL.d : ph2 ? SHADOW_COL.g : SHADOW_COL.p;
  FX.glow.spawn(x + (Math.random() - 0.5) * spread, y, z + (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * 0.8, up + Math.random() * up, (Math.random() - 0.5) * 0.8, c[0], c[1], c[2], 0.5 + Math.random() * 0.5, -0.4, 1.2);
}

function shadowBurst(x, y, z, n, speed, ph2) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI, s = speed * (0.4 + Math.random() * 0.8);
    const dark = Math.random() < 0.4;
    const c = dark ? SHADOW_COL.d : ph2 ? SHADOW_COL.g : SHADOW_COL.p;
    FX.glow.spawn(x, y, z, Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 0.5, Math.sin(a) * Math.cos(e) * s,
      c[0], c[1], c[2], 0.4 + Math.random() * 0.6, dark ? -1 : 1.5, 2.2);
  }
}

// Eigen geluiden (alleen als het geluid aan staat)
function shadowSfx(name, at, vol) {
  if (!SND.ctx || SND.muted) return;
  let v = vol === undefined ? 1 : vol;
  if (at) {
    const d = Math.hypot(at.x - player.pos.x, at.y - player.pos.y, at.z - player.pos.z);
    v *= clamp(1 - d / 44, 0, 1);
    if (v < 0.02) return;
  }
  switch (name) {
    case 'vanish':
      SND.tone({ type: 'sine', f0: 900, f1: 180, dur: 0.45, vol: 0.12 * v });
      SND.noiseBurst({ dur: 0.5, vol: 0.22 * v, filter: 'bandpass', f0: 3200, f1: 300, q: 2 });
      break;
    case 'appear':
      SND.tone({ type: 'sine', f0: 200, f1: 1100, dur: 0.3, vol: 0.13 * v });
      SND.noiseBurst({ dur: 0.35, vol: 0.25 * v, filter: 'bandpass', f0: 300, f1: 3000, q: 2 });
      break;
    case 'mark':
      SND.tone({ type: 'triangle', f0: 520, f1: 780, dur: 0.8, vol: 0.07 * v, vib: 14, vibAmt: 30, a: 0.05 });
      break;
    case 'swipe':
      SND.noiseBurst({ dur: 0.3, vol: 0.34 * v, filter: 'bandpass', f0: 2600, f1: 500, q: 1.2 });
      SND.tone({ type: 'sawtooth', f0: 220, f1: 90, dur: 0.25, vol: 0.06 * v, lp: 1200 });
      break;
    case 'charge':
      SND.tone({ type: 'sawtooth', f0: 70, f1: 160, dur: 0.85, vol: 0.09 * v, lp: 700, vib: 7, vibAmt: 10, a: 0.1 });
      SND.tone({ type: 'sine', f0: 400, f1: 900, dur: 0.85, vol: 0.05 * v, a: 0.2 });
      break;
    case 'orb':
      SND.tone({ type: 'triangle', f0: 300, f1: 700, dur: 0.35, vol: 0.12 * v, vib: 20, vibAmt: 40 });
      SND.noiseBurst({ dur: 0.3, vol: 0.12 * v, filter: 'highpass', f0: 1800 });
      break;
    case 'void':
      SND.tone({ type: 'sine', f0: 180, f1: 40, dur: 0.6, vol: 0.3 * v });
      SND.noiseBurst({ dur: 0.5, vol: 0.2 * v, f0: 600, f1: 90 });
      break;
    case 'darkness':
      SND.tone({ type: 'sine', f0: 110, f1: 30, dur: 1.8, vol: 0.5 * v, a: 0.02 });
      SND.tone({ type: 'sawtooth', f0: 55, f1: 41, dur: 2.6, vol: 0.12 * v, lp: 380, vib: 4, vibAmt: 5, a: 0.2 });
      SND.noiseBurst({ dur: 2.2, vol: 0.12 * v, filter: 'bandpass', f0: 900, f1: 2400, q: 6, a: 0.4 });
      break;
    case 'eyes':
      SND.noiseBurst({ dur: 0.6, vol: 0.28 * v, filter: 'highpass', f0: 1800, f1: 5200, a: 0.05 });
      SND.tone({ type: 'square', f0: 180, f1: 620, dur: 0.55, vol: 0.06 * v, lp: 1800 });
      break;
    case 'dash':
      SND.noiseBurst({ dur: 0.6, vol: 0.4 * v, filter: 'bandpass', f0: 600, f1: 2800, q: 1.4 });
      break;
    case 'whisper':
      SND.noiseBurst({ dur: 1.6, vol: 0.07 * v, filter: 'bandpass', f0: 1400 + Math.random() * 800, f1: 700, q: 9, a: 0.5 });
      SND.tone({ type: 'sine', f0: 98 + Math.random() * 20, f1: 82, dur: 2.2, vol: 0.05 * v, a: 0.6 });
      break;
    case 'ring':
      for (let i = 0; i < 4; i++) SND.tone({ type: 'triangle', f0: 400 + i * 120, f1: 800 + i * 160, dur: 0.25, vol: 0.06 * v, t: i * 0.12 });
      break;
    case 'dizzy':
      for (let i = 0; i < 3; i++) SND.tone({ type: 'square', f0: 900 - i * 150, f1: 700 - i * 150, dur: 0.12, vol: 0.04 * v, t: i * 0.14 });
      break;
    default: break;
  }
}

/* ---------- Schaduwballen ---------- */
function shadowOrbMesh(green) {
  const key = green ? 'orbG' : 'orbP';
  if (!SHADOW_CACHE[key]) {
    if (!SHADOW_CACHE.orbGeo) { SHADOW_CACHE.orbGeo = new THREE.BoxGeometry(0.46, 0.46, 0.46); SHADOW_CACHE.orbGeo.userShared = true; }
    const tex = pixelTexture(8, 8, (x, y) => {
      const e = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
      if (e > 3) return [24, 6, 34];
      if (e > 2) return green ? [30, 140, 70] : [110, 30, 170];
      if (e > 1) return green ? [120, 255, 150] : [210, 110, 255];
      return [255, 240, 255];
    });
    SHADOW_CACHE[key] = new THREE.MeshBasicMaterial({ map: tex });
  }
  return new THREE.Mesh(SHADOW_CACHE.orbGeo, SHADOW_CACHE[key]);
}

// Langzame zoekende schaduwbal: kapot te slaan met het zwaard
function makeShadowOrb(origin, vel, dmg, homing, green) {
  const c = green ? SHADOW_COL.g : SHADOW_COL.p;
  return new Projectile({
    pos: origin, vel, owner: 'boss', type: 'orb', dmg, life: 5.5, radius: 0.32, destroyable: true, homing, knock: 4,
    mesh: shadowOrbMesh(green),
    trail: (pr) => {
      if (Math.random() < 0.55) {
        const d = Math.random() < 0.4 ? SHADOW_COL.d : c;
        FX.glow.spawn(pr.pos.x + (Math.random() - 0.5) * 0.3, pr.pos.y + (Math.random() - 0.5) * 0.3, pr.pos.z + (Math.random() - 0.5) * 0.3,
          0, 0.25, 0, d[0], d[1], d[2], 0.45, -0.3, 1);
      }
    },
    explodeFx: (pr) => shadowBurst(pr.pos.x, pr.pos.y, pr.pos.z, 18, 4, green),
  });
}

/* ---------- Ogen die in het donker gloeien (boven de donkere laag van het scherm) ---------- */
function shadowEyeDom() {
  const S = SHADOW_EYE_DOM;
  if (S.root || typeof document === 'undefined') return S;
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:4;display:none;overflow:hidden';
  S.eyes = [];
  for (let i = 0; i < 2; i++) {
    const e = document.createElement('div');
    e.style.cssText = 'position:absolute;left:0;top:0;width:8px;height:4px';
    root.appendChild(e);
    S.eyes.push(e);
  }
  document.body.appendChild(root);
  S.root = root;
  return S;
}

function updateShadowEyes(boss) {
  const S = shadowEyeDom();
  if (!S.root) return;
  const show = !!boss && boss.kind === 'boss' && boss.alive() && boss.model && boss.model.eyes && boss.mesh.visible && !boss.eyesOff &&
    player.dark > 0.05 && !player.dead && game.worldKind === 'realm';
  if (!show) {
    if (S.on) { S.root.style.display = 'none'; S.on = false; }
    return;
  }
  if (!S.on) { S.root.style.display = 'block'; S.on = true; }
  const ph = boss.enraged ? 1 : 0;
  if (S.ph !== ph) {
    S.ph = ph;
    for (const e of S.eyes) e.style.background = ph ? '#e2ffd0' : '#f6d2ff';
  }
  const cam = game.camera, W = window.innerWidth, Hh = window.innerHeight;
  const ppu = Hh / (2 * Math.tan(cam.fov * Math.PI / 360));
  const flare = boss.anim ? boss.anim.eyes : 1;
  S.root.style.opacity = Math.min(1, player.dark * 1.2).toFixed(2);
  const glow = ph ? '60,255,110' : '180,70,255';
  for (let i = 0; i < 2; i++) {
    const v = SHADOW_V[0];
    boss.model.eyes[i].getWorldPosition(v);
    const d = v.distanceTo(cam.position);
    v.project(cam);
    const e = S.eyes[i];
    if (v.z > 1 || d < 0.3) { e.style.display = 'none'; continue; }
    e.style.display = 'block';
    const w = Math.max(4, 0.19 * flare * ppu / d), h = Math.max(2, 0.085 * flare * ppu / d);
    const x = (v.x + 1) / 2 * W - w / 2, y = (1 - v.y) / 2 * Hh - h / 2;
    e.style.width = w.toFixed(1) + 'px';
    e.style.height = h.toFixed(1) + 'px';
    e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    e.style.boxShadow = '0 0 ' + (w * 0.6).toFixed(0) + 'px ' + (w * 0.25).toFixed(0) + 'px rgba(' + glow + ',0.9)';
  }
}

/* ---------- De Schaduwkoning ---------- */
class ShadowKing extends BossBase {
  constructor(world, info) {
    super(world, info, {
      name: 'De Schaduwkoning', ref: 'de Schaduwkoning', hp: 340, hw: 0.7, h: 4.0,
      deathTiles: [T.PURPUR, T.CRYSTAL, T.OBSIDIAN, T.SCULK], wakeRange: 12.5,
    });
    this.anim = { rX: -0.45, rZ: 0, lX: -0.5, lZ: -0.5, scep: 0, twist: 0, lean: 0.2, head: 0.5, legL: 0, legR: 0, cape: 0.05, lift: 0, eyes: 0.35 };
    this.dissolve = 0; this.parked = false; this.eyesOff = false; this.bodyHidden = false;
    this.lastAttack = ''; this.darkCD = 9; this.ringCD = 0; this.pendingRing = false;
    this.chain = 0; this.fromTp = false; this.stuckT = 0; this.voidWave = 0; this.aimLocked = false;
    this.hints = {};
    this.tpDest = new THREE.Vector3(); this.tpFrom = new THREE.Vector3();
    this.dashDir = new THREE.Vector3(); this.dashLen = 0;
    this.ring = null; this.ringReg = false; this.ringA = 0; this.ringNext = 0;
    this.orbsLeft = 0; this.orbNext = 0;
    this.hitLog = []; this.blinkCD = 0; this.blinkPending = false; this.blinking = false;
  }

  buildModel() {
    if (!SHADOW_TEX.robe) buildShadowTextures();
    const lam = (map, emap, emissive) => {
      const o = { map };
      if (emap) o.emissiveMap = emap;
      const m = new THREE.MeshLambertMaterial(o);
      m.emissive.setHex(emissive);
      m.userEmissive = m.emissive.clone();
      return m;
    };
    const robe = lam(SHADOW_TEX.robe, SHADOW_TEX.robeGlow, 0xa040ff);
    const skin = lam(SHADOW_TEX.skin, null, 0x0a0410);
    const face = lam(SHADOW_TEX.face, null, 0x0a0410);
    const cape = lam(SHADOW_TEX.cape, SHADOW_TEX.capeGlow, 0x000000);
    const gold = lam(SHADOW_TEX.gold, null, 0x1a1000);
    const hand = lam(SHADOW_TEX.hand, null, 0x08040c);
    const stick = lam(SHADOW_TEX.stick, null, 0x000000);
    const gem = new THREE.MeshBasicMaterial({ map: SHADOW_TEX.gem, color: 0xd070ff });
    const eye = new THREE.MeshBasicMaterial({ color: 0xf6d2ff });
    const eyeGlow = new THREE.MeshBasicMaterial({ color: 0xa030ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });

    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const body = []; // alle lichaamsdelen (onzichtbaar in het donker, alleen de ogen blijven)
    const add = (parent, mesh) => { parent.add(mesh); body.push(mesh); return mesh; };

    const legs = [];
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(sx * 0.2, 1.0, 0);
      add(g, bossBox(0.26, 1.0, 0.26, robe, -0.5));
      add(g, bossBox(0.3, 0.14, 0.42, hand, -0.93, 0, 0.06));
      inner.add(g);
      legs.push(g);
    }
    const skirt = new THREE.Group();
    skirt.position.y = 1.72;
    inner.add(skirt);
    add(skirt, bossBox(0.92, 1.36, 0.6, robe, -0.68));

    const torso = new THREE.Group();
    torso.position.y = 1.7;
    inner.add(torso);
    add(torso, bossBox(0.84, 1.15, 0.48, robe, 0.575));
    for (const sx of [-1, 1]) {
      const pa = add(torso, bossBox(0.4, 0.26, 0.56, gold, 0, sx * 0.52, 0));
      pa.position.y = 1.08;
    }
    const collar = add(torso, bossBox(0.86, 0.5, 0.08, cape, 0.25));
    collar.position.set(0, 1.1, -0.24);
    collar.rotation.x = -0.3;

    // armen: [0] = rechts (-x, met scepter), [1] = links
    const arms = [];
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(sx * 0.58, 1.02, 0);
      add(g, bossBox(0.22, 1.4, 0.22, robe, -0.7));
      add(g, bossBox(0.3, 0.32, 0.3, hand, -1.52));
      torso.add(g);
      arms.push(g);
    }
    const scepter = new THREE.Group();
    scepter.position.set(0, -1.52, 0.04);
    arms[0].add(scepter);
    add(scepter, bossBox(0.1, 2.3, 0.1, stick, 0.35));
    const gemTop = add(scepter, bossBox(0.28, 0.28, 0.28, gem, 0));
    gemTop.position.y = 1.62;
    gemTop.rotation.set(0.6, 0.7, 0);

    const head = new THREE.Group();
    head.position.set(0, 1.15, 0.02);
    torso.add(head);
    add(head, new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.72, 0.66).translate(0, 0.36, 0), [skin, skin, skin, skin, face, skin]));
    const crown = new THREE.Group();
    crown.position.y = 0.72;
    head.add(crown);
    add(crown, bossBox(0.76, 0.16, 0.76, gold, 0.08));
    const spikeGeo = new THREE.BoxGeometry(0.13, 0.26, 0.13).translate(0, 0.13, 0);
    for (const [x, z, s] of [[-0.31, -0.31, 1], [0.31, -0.31, 1], [-0.31, 0.31, 1], [0.31, 0.31, 1], [0, 0.31, 1.45]]) {
      const sp = add(crown, new THREE.Mesh(spikeGeo, gold));
      sp.position.set(x, 0.16, z);
      sp.scale.y = s;
    }
    const crownGem = add(crown, bossBox(0.13, 0.13, 0.06, gem));
    crownGem.position.set(0, 0.09, 0.39);

    const eyes = [];
    const eyeGeo = new THREE.BoxGeometry(0.19, 0.085, 0.03), glowGeo = new THREE.BoxGeometry(0.34, 0.19, 0.01);
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(eyeGeo, eye);
      e.position.set(sx * 0.15, 0.38, 0.345);
      head.add(e);
      eyes.push(e);
      const gl = new THREE.Mesh(glowGeo, eyeGlow);
      gl.position.set(0, 0, 0.012);
      e.add(gl);
    }

    const capeG = new THREE.Group();
    capeG.position.set(0, 1.08, -0.26);
    torso.add(capeG);
    add(capeG, bossBox(1.0, 2.55, 0.07, cape, -1.275, 0, -0.04));

    return {
      group, inner, legs, skirt, torso, arms, scepter, head, crown, capeG, eyes, body,
      robe, cape, gem, eye, eyeGlow,
      mats: [robe, skin, face, cape, gold, hand, stick],
    };
  }

  // Rood flitsen bij een klap: ook de eigen gloed wordt rood (het gewaad is erg donker)
  applyTint() {
    const on = this.flash > 0;
    for (const m of this.model.mats) {
      if (on) { m.color.setRGB(1, 0.45, 0.45); m.emissive.setRGB(0.75, 0.08, 0.08); }
      else { m.color.setRGB(1, 1, 1); m.emissive.copy(m.userEmissive); }
    }
  }

  setPhaseColors(ph2) {
    const M = this.model;
    M.robe.userEmissive.setHex(ph2 ? 0x30ff80 : 0xa040ff);
    M.cape.userEmissive.setHex(ph2 ? 0x20c060 : 0x000000);
    M.eye.color.setHex(ph2 ? 0xe2ffd0 : 0xf6d2ff);
    M.eyeGlow.color.setHex(ph2 ? 0x30ff60 : 0xa030ff);
    M.gem.color.setHex(ph2 ? 0x60ff90 : 0xd070ff);
  }

  setBodyVisible(v) {
    this.bodyHidden = !v;
    for (const m of this.model.body) m.visible = v;
  }

  inArena(x, z, margin) {
    const ac = this.info.arenaCenter;
    return Math.hypot(x - ac.x, z - ac.z) < this.info.arenaRadius - margin;
  }

  // Past de schurk hier (vrije ruimte en vaste vloer)?
  spotOK(x, z) {
    if (!this.inArena(x, z, 2)) return false;
    const F = this.info.floorY, hw = this.hw;
    if (boxSolid(this.world, x - hw, F + 0.01, z - hw, x + hw, F + this.h, z + hw)) return false;
    for (const ox of [-0.6, 0.6]) {
      for (const oz of [-0.6, 0.6]) if (!this.world.solidAt(Math.floor(x + ox * hw), F - 1, Math.floor(z + oz * hw))) return false;
    }
    return true;
  }

  // Plek achter (of naast) de speler voor de teleport-aanval
  findTpSpot(p) {
    for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, Math.PI]) {
      for (const r of [2.8, 3.4]) {
        const a = p.yaw + da;
        const x = p.pos.x + Math.sin(a) * r, z = p.pos.z + Math.cos(a) * r;
        if (this.spotOK(x, z)) { this.tpDest.set(x, this.info.floorY, z); return true; }
      }
    }
    return false;
  }

  // Plek vóór de speler, zodat je in het donker zijn ogen ziet
  findStalkSpot(p) {
    for (const r of [6.5, 5.5, 7.5]) {
      for (const da of [0, 0.5, -0.5, 1.0, -1.0]) {
        const a = p.yaw + Math.PI + da;
        const x = p.pos.x + Math.sin(a) * r, z = p.pos.z + Math.cos(a) * r;
        if (this.spotOK(x, z)) { this.tpDest.set(x, this.info.floorY, z); return true; }
      }
    }
    return false;
  }

  floorAt(x, z) {
    const F = this.info.floorY;
    return this.world.solidAt(Math.floor(x), F - 1, Math.floor(z)) && !this.world.solidAt(Math.floor(x), F, Math.floor(z));
  }

  hint(key, text) {
    if (this.hints[key]) return;
    this.hints[key] = 1;
    HUD.actionbar(text, 2.4);
  }

  onWake() {
    this.eyesOff = false;
    shadowSfx('whisper', null, 1.6);
    shadowBurst(this.pos.x, this.pos.y + 3.4, this.pos.z, 30, 4, false);
  }

  onEnrage() {
    this.setPhaseColors(true);
    this.pendingRing = true;
    this.ringCD = 0;
    shadowBurst(this.pos.x, this.pos.y + 2, this.pos.z, 70, 7, true);
  }

  enragedFx() {
    if (this.parked || this.bodyHidden) return;
    const a = Math.random() * Math.PI * 2, r = 0.45 + Math.random() * 0.4;
    const c = Math.random() < 0.6 ? SHADOW_COL.g : SHADOW_COL.d;
    FX.glow.spawn(this.pos.x + Math.cos(a) * r, this.pos.y + Math.random() * 2.6, this.pos.z + Math.sin(a) * r,
      0, 0.8 + Math.random(), 0, c[0], c[1], c[2], 0.8, -0.5, 1);
  }

  // Alles terugzetten (na respawn van de speler of bij doodgaan)
  resetShadow() {
    this.noSteer = false; this.flying = false; this.parked = false; this.eyesOff = false;
    this.dissolve = 0; this.chain = 0; this.fromTp = false; this.voidWave = 0; this.stuckT = 0;
    this.blinking = false; this.blinkPending = false; this.hitLog.length = 0;
    this.mesh.visible = true;
    this.setBodyVisible(true);
    this.clearRing();
  }

  onGoHome() { this.resetShadow(); }

  // Na een paar snelle klappen glipt hij weg in de schaduw (maakt hem lastig te pakken)
  hurt(amount, kind) {
    const ok = super.hurt(amount, kind);
    if (ok && kind === 'melee' && this.alive()) {
      const now = game.time;
      this.hitLog.push(now);
      while (this.hitLog.length && now - this.hitLog[0] > 3) this.hitLog.shift();
      if (this.hitLog.length >= 3 && this.blinkCD <= 0) { this.blinkPending = true; this.hitLog.length = 0; }
    }
    return ok;
  }

  startBlink(c) {
    this.blinkPending = false;
    if (!this.findBlinkSpot(c.p)) return;
    this.blinkCD = this.enraged ? 4 : 5;
    this.blinking = true;
    this.tpFrom.copy(this.pos);
    this.setState('tpOut');
    shadowSfx('vanish', this.pos);
    this.hint('blink', 'Hij glipt weg in de schaduw!');
  }

  findBlinkSpot(p) {
    for (let k = 0; k < 24; k++) {
      const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 3;
      const x = p.pos.x + Math.sin(a) * r, z = p.pos.z + Math.cos(a) * r;
      if (this.spotOK(x, z)) { this.tpDest.set(x, this.info.floorY, z); return true; }
    }
    return false;
  }

  die() {
    if (this.parked) { this.pos.copy(this.tpDest); this.mesh.position.copy(this.pos); }
    this.resetShadow();
    this.dissolve = 0;
    this.model.inner.scale.set(1, 1, 1);
    super.die();
  }

  // Kies de volgende aanval
  chooseAttack(c) {
    const ph2 = this.enraged, p = c.p;
    const high = p.pos.y > this.pos.y + 2.2;
    const pIn = this.inArena(p.pos.x, p.pos.z, 2.5);
    const close = c.dist < 3.6;
    const list = [];
    if (!high && close) list.push(['sweepWind', 4]);
    if (!high && pIn) list.push(['tp', (close ? 2 : 3) * (ph2 ? 1.5 : 1)]);
    if (high || !pIn || c.dist > 4.5) list.push(['orbWind', high || !pIn ? 6 : 3]);
    if (!high) list.push(['voidWind', close ? 2 : 2.5]);
    if (!high && pIn && this.darkCD <= 0) list.push(['darkWind', 3]);
    if (ph2 && this.ringCD <= 0) list.push(['ring', 3]);
    let opts = list.filter((o) => o[0] !== this.lastAttack || o[0] === 'sweepWind');
    if (!opts.length) opts = list;
    let sum = 0;
    for (const o of opts) sum += o[1];
    let r = Math.random() * sum, pick = opts[0][0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
    this.startAttack(pick, c);
  }

  startAttack(name, c) {
    this.lastAttack = name;
    this.fromTp = false;
    if (name === 'tp') this.startTeleport(c);
    else if (name === 'ring') this.startRing();
    else {
      this.setState(name);
      if (name === 'darkWind' || name === 'voidWind' || name === 'orbWind') shadowSfx('charge', this.pos);
    }
  }

  startTeleport(c) {
    if (!this.findTpSpot(c.p)) { this.setState(c.dist < 3.6 ? 'sweepWind' : 'orbWind'); return; }
    this.lastAttack = 'tp';
    this.blinking = false;
    this.tpFrom.copy(this.pos);
    this.setState('tpOut');
    const warn = 0.5 + (this.enraged ? 0.6 : 0.75);
    game.addHazard(new GroundHazard({ x: this.tpDest.x, y: this.info.floorY, z: this.tpDest.z, radius: 1.1, warn, linger: 0.2, color: 0xff66ff, onTrigger: () => {} }));
    shadowSfx('vanish', this.pos);
    shadowSfx('mark', this.tpDest);
    this.hint('tp', 'Pas op! Hij komt bij de roze cirkel!');
  }

  park() {
    this.parked = true; this.flying = true;
    this.mesh.visible = false;
    this.vel.set(0, 0, 0);
    this.pos.set(this.tpDest.x, this.info.floorY - 60, this.tpDest.z);
  }

  appear(c) {
    const d = this.tpDest;
    if (!this.spotOK(d.x, d.z)) d.copy(this.tpFrom);
    this.pos.set(d.x, this.info.floorY, d.z);
    this.vel.set(0, 0, 0);
    this.parked = false; this.flying = false;
    this.mesh.visible = true;
    this.yaw = Math.atan2(player.pos.x - d.x, player.pos.z - d.z);
    shadowBurst(d.x, d.y + 2, d.z, 40, 5, this.enraged);
    shadowSfx('appear', d);
    this.setState('tpIn');
  }

  // Een schaduwbal; om en om iets naar links of rechts, zodat ze van verschillende kanten komen
  shootOrb(i) {
    const p = player, ph2 = this.enraged;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const side = i % 2 ? 0.6 : -0.6;
    const o = new THREE.Vector3(this.pos.x + fx * 0.5 + rx * side, this.pos.y + 4.1, this.pos.z + fz * 0.5 + rz * side);
    const dir = new THREE.Vector3(p.pos.x - o.x, p.pos.y + 1.1 - o.y, p.pos.z - o.z).normalize();
    // eerst omhoog en opzij, daarna duiken ze op je af: zo heb je tijd om ze te zien
    dir.x += rx * side * 0.7; dir.z += rz * side * 0.7; dir.y += 0.9;
    dir.normalize().multiplyScalar(ph2 ? 5.0 : 4.0);
    game.addProjectile(makeShadowOrb(o, dir, this.dmg(ph2 ? 6 : 5), 1.2, ph2));
    shadowSfx('orb', this.pos);
    this.hint('orb', 'Sla de schaduwballen kapot!');
  }

  // Leegtecirkels: een onder de speler en een paar eromheen
  castVoid(n) {
    const p = player, F = this.info.floorY, ph2 = this.enraged;
    const spots = [];
    const tryAdd = (x, z) => {
      if (!this.floorAt(x, z) || !this.inArena(x, z, -1)) return false;
      for (const s of spots) if (Math.hypot(s[0] - x, s[1] - z) < 2.7) return false;
      spots.push([x, z]);
      return true;
    };
    tryAdd(p.pos.x, p.pos.z);
    for (let k = 0, made = 0; k < 40 && made < n; k++) {
      const a = Math.random() * Math.PI * 2, r = 2.6 + Math.random() * 4;
      if (tryAdd(p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r)) made++;
    }
    const king = this;
    for (const s of spots) {
      game.addHazard(new GroundHazard({
        x: s[0], y: F, z: s[1], radius: 1.6, warn: ph2 ? 1.0 : 1.2, linger: 1.4, color: 0x7a1fd0,
        dmg: this.dmg(6), type: 'shadow', tick: 0,
        onTrigger(h) {
          shadowSfx('void', h);
          for (let i = 0; i < 26; i++) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * h.radius;
            const c = Math.random() < 0.5 ? SHADOW_COL.d : SHADOW_COL.p;
            FX.glow.spawn(h.x + Math.cos(a) * r, h.y + 0.1, h.z + Math.sin(a) * r, 0, 3 + Math.random() * 4, 0, c[0], c[1], c[2], 0.6 + Math.random() * 0.4, 0, 1);
          }
          if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'shadow', 3, 5);
          h.tick = 0.6;
        },
        onLinger(h, dt) {
          if (Math.random() < dt * 14) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * h.radius;
            FX.glow.spawn(h.x + Math.cos(a) * r, h.y + 0.1, h.z + Math.sin(a) * r, 0, 1.5, 0, SHADOW_COL.d[0], SHADOW_COL.d[1], SHADOW_COL.d[2], 0.7, -0.5, 0.5);
          }
          h.tick -= dt;
          if (h.tick <= 0) {
            h.tick = 0.6;
            if (h.playerInside()) damagePlayer(king.dmg(2), { x: h.x, y: h.y, z: h.z }, 'shadow', 2, 2);
          }
        },
      }));
    }
    this.hint('void', 'Loop snel uit de paarse cirkels!');
  }

  startRing() {
    this.setState('ringWind');
    this.lastAttack = 'ring';
    this.ringCD = 16;
    this.clearRing();
    this.ring = [];
    this.ringReg = false;
    this.ringA = Math.random() * Math.PI * 2;
    for (let i = 0; i < 6; i++) {
      const pr = makeShadowOrb(this.pos, new THREE.Vector3(), this.dmg(5), 0, true);
      pr.life = 30;
      pr.launched = false;
      pr.mesh.scale.setScalar(0.2);
      game.realmGroup.add(pr.mesh);
      this.ring.push(pr);
    }
    shadowSfx('ring', this.pos);
    this.hint('ring', 'Een ring van ballen! Blijf op afstand!');
  }

  placeRing(dt, r, s) {
    if (!this.ring) return;
    this.ringA += dt * 2.2;
    const n = this.ring.length;
    for (let i = 0; i < n; i++) {
      const pr = this.ring[i];
      if (pr.dead || pr.launched) continue;
      const a = this.ringA + i * Math.PI * 2 / n;
      pr.pos.set(this.pos.x + Math.cos(a) * r, this.pos.y + 2.4 + Math.sin(game.time * 4 + i) * 0.15, this.pos.z + Math.sin(a) * r);
      pr.mesh.position.copy(pr.pos);
      pr.mesh.scale.setScalar(s);
    }
  }

  launchRingOrb() {
    if (!this.ring) return false;
    const p = player;
    for (const pr of this.ring) {
      if (pr.dead || pr.launched) continue;
      pr.launched = true;
      pr.vel.set(p.pos.x - pr.pos.x, p.pos.y + 1.1 - pr.pos.y, p.pos.z - pr.pos.z).normalize().multiplyScalar(5);
      pr.speed = 5; pr.homing = 0.8; pr.life = 5;
      shadowSfx('orb', pr.pos, 0.7);
      return true;
    }
    return false;
  }

  clearRing() {
    if (!this.ring) return;
    for (const pr of this.ring) {
      if (!this.ringReg) { pr.dead = true; if (pr.mesh.parent) pr.mesh.parent.remove(pr.mesh); }
    }
    this.ring = null;
    this.ringReg = false;
  }

  sweepFx() {
    const c = this.enraged ? SHADOW_COL.g : SHADOW_COL.p;
    for (let i = 0; i < 28; i++) {
      const a = this.yaw + (i / 27 - 0.5) * 2.7, r = 1.8 + Math.random() * 1.9;
      FX.glow.spawn(this.pos.x + Math.sin(a) * r, this.pos.y + 1.4 + Math.random() * 0.9, this.pos.z + Math.cos(a) * r,
        Math.sin(a) * 2.5, 0.3, Math.cos(a) * 2.5, c[0], c[1], c[2], 0.35, 0, 2);
    }
  }

  sweepHit() {
    const p = player;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    const ang = Math.abs(angleDiff(this.yaw, Math.atan2(dx, dz)));
    if (d < 3.7 && (ang < 1.3 || d < 1.3) && p.pos.y < this.pos.y + 3 && p.pos.y > this.pos.y - 1.5) {
      damagePlayer(this.dmg(7), this.pos, 'boss', 8, 5);
    }
  }

  endDash(wall) {
    this.noSteer = false;
    this.vel.x = 0; this.vel.z = 0;
    player.dark = Math.min(player.dark, 0.6);
    if (wall) {
      this.setState('stagger');
      game.shake = Math.max(game.shake, 0.6);
      SND.play('slam', { at: this.pos, range: 40, vol: 0.6 });
      shadowSfx('dizzy', this.pos);
      HUD.actionbar('Hij is duizelig! Sla nu!', 2);
    } else this.setState('recover', 1.0);
  }

  think(dt, c) {
    const ph2 = this.enraged, p = c.p;
    this.darkCD -= dt; this.ringCD -= dt; this.blinkCD -= dt;
    let speed = 0;
    if (this.blinkPending && !p.dead && (this.state === 'chase' || this.state === 'recover')) this.startBlink(c);
    switch (this.state) {
      case 'chase': {
        this.turnTo(c.targetYaw, dt, ph2 ? 4.2 : 3.2);
        if (c.dist > 2.6) speed = ph2 ? 2.9 : 2.3;
        // niet van het eiland af lopen
        if (!this.inArena(this.pos.x + Math.sin(this.yaw) * 1.5, this.pos.z + Math.cos(this.yaw) * 1.5, 2.2)) speed = 0;
        this.stuckT = this.hitWall && speed > 0 ? this.stuckT + dt : Math.max(0, this.stuckT - dt);
        this.attackCD -= dt;
        if (p.dead) break;
        if (this.pendingRing && this.t > 0.4) { this.pendingRing = false; this.startRing(); break; }
        // vast achter een pilaar? dan teleporteert hij naar je toe
        if (this.stuckT > 0.8 && this.inArena(p.pos.x, p.pos.z, 2.5)) { this.stuckT = 0; this.startTeleport(c); break; }
        if (this.attackCD <= 0) this.chooseAttack(c);
        break;
      }
      case 'sweepWind': {
        this.turnTo(c.targetYaw, dt, ph2 ? 3.2 : 2.4);
        const wind = this.fromTp ? (ph2 ? 0.65 : 0.8) : (ph2 ? 0.75 : 1.0);
        if (Math.random() < dt * 30) {
          const gx = this.pos.x - Math.cos(this.yaw) * 1.6, gz = this.pos.z + Math.sin(this.yaw) * 1.6;
          shadowSpark(gx, this.pos.y + 2.6, gz, ph2, 0.4, 0.3);
        }
        if (this.t > wind) { this.setState('sweep'); shadowSfx('swipe', this.pos); }
        break;
      }
      case 'sweep':
        if (!this.didHit && this.t > 0.06) { this.didHit = true; this.sweepFx(); this.sweepHit(); }
        if (this.t > 0.3) {
          // fase 2: soms meteen nog een keer teleporteren
          if (ph2 && this.fromTp && this.chain === 0 && Math.random() < 0.4 && this.inArena(p.pos.x, p.pos.z, 2.5)) {
            this.chain = 1;
            this.startTeleport(c);
          } else {
            this.chain = 0; this.fromTp = false;
            this.setState('recover', ph2 ? 0.65 : 0.95);
          }
        }
        break;
      case 'tpOut': {
        const outT = this.blinking ? 0.3 : 0.5;
        this.dissolve = clamp(this.t / outT, 0, 1);
        if (Math.random() < dt * 60) shadowSpark(this.pos.x, this.pos.y + Math.random() * 4, this.pos.z, ph2, 1.2, 0.8);
        if (this.t > outT) { this.park(); this.setState('tpWait'); }
        break;
      }
      case 'tpWait':
        if (Math.random() < dt * 50) {
          const k = SHADOW_COL.pink;
          FX.glow.spawn(this.tpDest.x + (Math.random() - 0.5) * 1.4, this.tpDest.y + Math.random() * 0.4, this.tpDest.z + (Math.random() - 0.5) * 1.4,
            0, 2 + Math.random() * 2.5, 0, k[0], k[1], k[2], 0.7, -0.5, 0.5);
        }
        if (Math.random() < dt * 20) shadowSpark(this.tpDest.x, this.tpDest.y + Math.random() * 3, this.tpDest.z, ph2, 0.8, 0.4);
        if (this.t > (this.blinking ? 0.4 : ph2 ? 0.6 : 0.75)) this.appear(c);
        break;
      case 'tpIn':
        this.dissolve = 1 - clamp(this.t / 0.25, 0, 1);
        this.turnTo(c.targetYaw, dt, 8);
        if (this.t > 0.25) {
          this.dissolve = 0;
          if (this.blinking) { this.blinking = false; this.setState('chase'); this.attackCD = 0.7; }
          else { this.fromTp = true; this.setState('sweepWind'); }
        }
        break;
      case 'orbWind': {
        this.turnTo(c.targetYaw, dt, 3);
        if (Math.random() < dt * 45) {
          const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random();
          const hx = this.pos.x + Math.sin(this.yaw) * 0.5, hz = this.pos.z + Math.cos(this.yaw) * 0.5;
          const col = ph2 ? SHADOW_COL.g : SHADOW_COL.p;
          FX.glow.spawn(hx + Math.cos(a) * r, this.pos.y + 3.9 + (Math.random() - 0.5), hz + Math.sin(a) * r,
            -Math.cos(a) * r * 2.4, 0, -Math.sin(a) * r * 2.4, col[0], col[1], col[2], 0.4, 0, 0);
        }
        if (this.t > (ph2 ? 0.65 : 0.85)) { this.orbsLeft = ph2 ? 4 : 3; this.orbNext = 0; this.setState('orbCast'); }
        break;
      }
      case 'orbCast':
        // een voor een, zodat je ze allemaal kapot kunt slaan
        this.turnTo(c.targetYaw, dt, 3);
        this.orbNext -= dt;
        if (this.orbsLeft > 0 && this.orbNext <= 0) {
          this.shootOrb(this.orbsLeft);
          this.orbsLeft--;
          this.orbNext = ph2 ? 0.45 : 0.6;
        }
        if (this.orbsLeft <= 0 && this.orbNext <= 0.3) this.setState('recover', ph2 ? 0.5 : 0.75);
        break;
      case 'voidWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (Math.random() < dt * 30) shadowSpark(this.pos.x, this.pos.y + 4.4, this.pos.z, ph2, 0.6, 0.6);
        if (this.t > (ph2 ? 0.65 : 0.8)) {
          this.setState('voidCast');
          this.castVoid(ph2 ? 4 : 3);
          this.voidWave = ph2 ? 1 : 0;
          game.shake = Math.max(game.shake, 0.35);
          SND.play('slam', { at: this.pos, range: 40, vol: 0.5 });
          shadowBurst(this.pos.x + Math.sin(this.yaw) * 1.2, this.pos.y + 0.2, this.pos.z + Math.cos(this.yaw) * 1.2, 30, 5, ph2);
        }
        break;
      case 'voidCast':
        if (this.voidWave > 0 && this.t > 0.8) { this.voidWave--; this.castVoid(2); }
        if (this.t > (ph2 ? 1.1 : 0.45)) this.setState('recover', 0.8);
        break;
      case 'darkWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (Math.random() < dt * 50) {
          const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 2;
          const k = SHADOW_COL.d;
          FX.glow.spawn(this.pos.x + Math.cos(a) * r, this.pos.y + 0.5 + Math.random() * 3.5, this.pos.z + Math.sin(a) * r,
            -Math.cos(a) * r * 1.4, 0.2, -Math.sin(a) * r * 1.4, k[0], k[1], k[2], 0.6, 0, 0);
        }
        if (this.t > (ph2 ? 0.75 : 0.9)) {
          player.dark = 3.4;
          this.darkCD = ph2 ? 11 : 15;
          shadowSfx('darkness');
          this.setBodyVisible(false);
          this.eyesOff = true;
          this.setState('darkStalk');
          this.hint('dark', 'Spring opzij als zijn ogen fel worden!');
        }
        break;
      case 'darkStalk':
        if (this.eyesOff && this.t > 0.35) {
          // in het donker sluipt hij naar een plek vóór je
          this.eyesOff = false;
          if (this.findStalkSpot(p)) {
            shadowBurst(this.pos.x, this.pos.y + 2, this.pos.z, 20, 3, ph2);
            this.pos.copy(this.tpDest);
            this.vel.set(0, 0, 0);
          }
          this.yaw = c.targetYaw;
        }
        if (!this.eyesOff) {
          this.turnTo(c.targetYaw, dt, 5);
          if (c.dist > 5.5 && this.inArena(this.pos.x + Math.sin(this.yaw), this.pos.z + Math.cos(this.yaw), 2.2)) speed = 1.6;
        }
        if (this.t > 0.35 + (ph2 ? 1.0 : 1.3)) {
          this.aimLocked = false;
          this.setState('darkAim');
          shadowSfx('eyes', this.pos);
        }
        break;
      case 'darkAim':
        if (this.t < 0.2) this.turnTo(c.targetYaw, dt, 8);
        else if (!this.aimLocked) { this.aimLocked = true; this.dashDir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
        if (this.t > (ph2 ? 0.6 : 0.75)) {
          if (!this.aimLocked) this.dashDir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
          this.noSteer = true;
          this.dashLen = 0;
          this.setBodyVisible(true);
          this.setState('dash');
          shadowSfx('dash', this.pos);
        }
        break;
      case 'dash': {
        const s = ph2 ? 15 : 13;
        this.vel.x = this.dashDir.x * s; this.vel.z = this.dashDir.z * s;
        this.dashLen += s * dt;
        for (let i = 0; i < 2; i++) shadowSpark(this.pos.x, this.pos.y + Math.random() * 3.5, this.pos.z, ph2, 0.8, 0.3);
        const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
        if (!this.didHit && Math.hypot(dx, dz) < this.hw + p.hw + 0.3 && p.pos.y < this.pos.y + this.h && p.pos.y + p.h > this.pos.y) {
          this.didHit = true;
          damagePlayer(this.dmg(8), this.pos, 'boss', 10, 6);
        }
        if (this.t > 0.05 && this.hitWall) this.endDash(true);
        else if (this.dashLen > 10 || this.t > 0.8 || !this.inArena(this.pos.x + this.dashDir.x * 1.2, this.pos.z + this.dashDir.z * 1.2, 1.5)) this.endDash(false);
        break;
      }
      case 'ringWind': {
        const k = clamp(this.t / 1.1, 0, 1);
        this.turnTo(c.targetYaw, dt, 2);
        this.placeRing(dt, 0.8 + 1.9 * k, 0.25 + 0.75 * k);
        if (this.t > 1.1) {
          if (this.ring) for (const pr of this.ring) if (!pr.dead) game.addProjectile(pr);
          this.ringReg = true;
          this.setState('ringHold');
        }
        break;
      }
      case 'ringHold':
        this.turnTo(c.targetYaw, dt, 2);
        this.placeRing(dt, 2.7, 1);
        if (this.t > 0.5) { this.setState('ringFire'); this.ringNext = 0; }
        break;
      case 'ringFire':
        this.turnTo(c.targetYaw, dt, 3);
        this.placeRing(dt, 2.7, 1);
        this.ringNext -= dt;
        if (this.ringNext <= 0) {
          if (this.launchRingOrb()) this.ringNext = 0.45;
          else { this.ring = null; this.ringReg = false; this.setState('recover', 0.9); }
        }
        break;
      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph2 ? 1.1 + Math.random() * 0.8 : 1.9 + Math.random() * 1.1;
        }
        break;
      case 'stagger':
        if (Math.random() < dt * 14) {
          const a = game.time * 6 + Math.random();
          FX.glow.spawn(this.pos.x + Math.cos(a) * 0.6, this.pos.y + 4.1, this.pos.z + Math.sin(a) * 0.6, 0, 0.3, 0, 1, 0.95, 0.5, 0.5, 0, 0);
        }
        if (this.t > 1.9) { this.setState('chase'); this.attackCD = 1.0; }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  animate(dt, speed) {
    const a = this.anim, m = this.model, st = this.state, t = this.t;
    this.walkPhase += dt * speed * 2.4;
    const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.55;
    let rX = sw * 0.5, rZ = -0.1, lX = -sw * 0.5, lZ = 0.1, scep = 0, twist = 0, lean = 0.1, head = 0.05;
    let legL = sw, legR = -sw, cape = 0.12 + Math.min(1, speed / 3) * 0.4, lift = 0, crouch = 0, eyes = 1, rate = 9;
    switch (st) {
      case 'sleep': case 'idle':
        rX = -0.45; rZ = 0.05; lX = -0.55; lZ = -0.5; lean = 0.18; head = 0.5; legL = 0; legR = 0; cape = 0.04; eyes = 0.35; rate = 4;
        lift = Math.sin(game.time * 1.3) * 0.03;
        if (Math.random() < dt * 3) shadowSpark(this.pos.x, this.pos.y + 2.8, this.pos.z, false, 1, 0.3);
        break;
      case 'roar': rX = -0.6; rZ = -1.2; lX = -0.6; lZ = 1.2; head = -0.45; lean = -0.12; cape = 0.8; eyes = 1.7; rate = 6; break;
      case 'sweepWind':
        rX = -0.15; rZ = -1.45; scep = Math.PI; twist = -0.95 * easeOut(clamp(t / 0.7, 0, 1)); lX = -0.4; lZ = 0.6; lean = -0.05; head = -0.1; eyes = 1.5; rate = 12;
        break;
      case 'sweep': rX = -0.15; rZ = -1.4; scep = Math.PI; twist = 1.0; lX = -0.2; lZ = 0.4; lean = 0.25; eyes = 1.4; rate = 32; break;
      case 'tpOut': rX = -1.35; rZ = 0.55; lX = -1.35; lZ = -0.55; head = 0.25; cape = 0.6; eyes = 1.4; rate = 10; break;
      case 'tpIn': rX = -0.5; rZ = -0.9; lX = -0.5; lZ = 0.9; cape = 0.9; eyes = 1.5; rate = 14; break;
      case 'orbWind': rX = -2.65; rZ = -0.2; lX = -2.65; lZ = 0.2; scep = Math.PI; head = -0.35; lean = -0.12; lift = 0.3; cape = 0.45; eyes = 1.4; rate = 8; break;
      case 'orbCast': rX = -1.55 - Math.max(0, this.orbNext) * 1.4; rZ = -0.15; lX = -1.55; lZ = 0.15; scep = Math.PI; lean = 0.15; lift = 0.15; eyes = 1.3; rate = 20; break;
      case 'voidWind': rX = -3.0; rZ = 0.3; lX = -3.0; lZ = -0.3; scep = Math.PI; head = -0.3; lean = -0.15; lift = 0.35; cape = 0.5; eyes = 1.4; rate = 8; break;
      case 'voidCast': rX = -0.55; rZ = 0.2; lX = -0.55; lZ = -0.2; scep = Math.PI; lean = 0.45; head = 0.2; crouch = 0.25; cape = 0.7; eyes = 1.4; rate = 25; break;
      case 'darkWind': rX = -1.1; rZ = -1.35; lX = -1.1; lZ = 1.35; head = -0.5; lean = -0.15; lift = 0.45; cape = 1.0; eyes = 1.6; rate = 7; break;
      case 'darkStalk': rX = 0.5; rZ = -0.3; lX = 0.5; lZ = 0.3; lean = 0.35; head = -0.1; eyes = 1.15; rate = 8; break;
      case 'darkAim': rX = 0.9; rZ = -0.35; lX = 0.9; lZ = 0.35; lean = 0.55; crouch = 0.35; head = -0.2; eyes = 2.1 + Math.sin(t * 40) * 0.15; rate = 12; break;
      case 'dash': rX = 1.3; rZ = -0.3; lX = 1.3; lZ = 0.3; lean = 0.75; head = -0.3; cape = 1.3; legL = 0.7; legR = -0.7; eyes = 1.7; rate = 20; break;
      case 'ringWind': case 'ringHold': case 'ringFire':
        rX = -0.3; rZ = -1.45; lX = -0.3; lZ = 1.45; head = -0.2; lift = 0.55 + Math.sin(game.time * 3) * 0.08; cape = 0.8; eyes = 1.5; rate = 7;
        break;
      case 'recover': rX = 0.1; rZ = -0.15; lX = 0.1; lZ = 0.15; lean = 0.32; head = 0.35; eyes = 0.8; rate = 6; break;
      case 'stagger':
        rX = 0.3; rZ = -0.6; lX = 0.2; lZ = 0.7; lean = 0.45 + Math.sin(t * 7) * 0.12; head = 0.55 + Math.sin(t * 5) * 0.2; crouch = 0.2; eyes = 0.55; rate = 8;
        break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    const kl = Math.min(1, k * 1.5);
    a.rX += (rX - a.rX) * k; a.rZ += (rZ - a.rZ) * k;
    a.lX += (lX - a.lX) * k; a.lZ += (lZ - a.lZ) * k;
    a.scep += (scep - a.scep) * k; a.twist += (twist - a.twist) * k;
    a.lean += (lean - a.lean) * k; a.head += (head - a.head) * k;
    a.legL += (legL - a.legL) * kl; a.legR += (legR - a.legR) * kl;
    a.cape += (cape - a.cape) * k; a.lift += (lift - crouch - a.lift) * k;
    a.eyes += (eyes - a.eyes) * Math.min(1, dt * 12);
    m.arms[0].rotation.x = a.rX; m.arms[0].rotation.z = a.rZ;
    m.arms[1].rotation.x = a.lX; m.arms[1].rotation.z = a.lZ;
    m.scepter.rotation.x = a.scep;
    m.torso.rotation.y = a.twist; m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head;
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.capeG.rotation.x = a.cape + Math.sin(game.time * 2.3) * 0.04 + Math.sin(game.time * 5.1) * 0.015;
    m.inner.position.y = a.lift;
    const d = this.dissolve;
    m.inner.scale.set(1 - 0.85 * d, 1 + 0.3 * d, 1 - 0.85 * d);
    m.crown.rotation.z = st === 'stagger' ? Math.sin(t * 9) * 0.25 : 0;
    const ey = st === 'sleep' ? 0.4 : 1;
    for (const e of m.eyes) e.scale.set(a.eyes, Math.max(0.35, a.eyes * ey), 1);
    m.eyeGlow.opacity = clamp(0.2 + a.eyes * 0.3, 0, 0.95);
  }

  // Doodgaan in paarse rook; de kroon valt eraf
  updateDying(dt) {
    const m = this.model, c = SHADOW_V[1].set(this.pos.x, this.pos.y + this.h * 0.55, this.pos.z), t = this.t;
    m.inner.position.set((Math.random() - 0.5) * 0.25, -t * 0.3, (Math.random() - 0.5) * 0.25);
    m.inner.rotation.x = -t * 0.12;
    m.arms[0].rotation.set(-0.8, 0, -1.4); m.arms[1].rotation.set(-0.8, 0, 1.4);
    m.head.rotation.x = -0.5;
    m.crown.position.y = 0.72 + Math.max(-1.5, 2.2 * t - 1.6 * t * t);
    m.crown.rotation.z = t * 2.5;
    const flick = Math.sin(t * 30) > 0 ? 1.8 : 0.4;
    for (const e of m.eyes) e.scale.set(flick, flick, 1);
    if (Math.random() < dt * 45) shadowSpark(c.x + (Math.random() - 0.5) * 2, c.y - 2 + Math.random() * 4, c.z + (Math.random() - 0.5) * 2, this.enraged, 1, 1.2);
    if (Math.random() < dt * 6) {
      shadowBurst(c.x + (Math.random() - 0.5) * 1.6, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 1.6, 24, 4, this.enraged);
      SND.play('explode', { vol: 0.35 });
    }
    this.flash = Math.sin(t * 30) > 0 ? 0.1 : 0;
    this.applyTint();
    if (t > 2.6) {
      shadowBurst(c.x, c.y, c.z, 140, 9, this.enraged);
      shadowBurst(c.x, c.y, c.z, 80, 6, !this.enraged);
      for (let i = 0; i < 60; i++) {
        const col = sampleTileColor(this.deathTiles[i % this.deathTiles.length]);
        FX.debris.spawn(c.x + (Math.random() - 0.5) * 1.6, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 12, col[0], col[1], col[2], 1.5 + Math.random(), 18, 0.5, true);
      }
      FX.xpOrbs(c.x, c.y, c.z);
      SND.play('explode', { vol: 1 });
      game.shake = 1.2;
      this.mesh.visible = false;
      this.state = 'dead';
      updateShadowEyes(null);
      game.onBossDefeated(this);
    }
  }
}

/* ---------- Wereld: zwevend endsteen-eiland in de leegte ---------- */
function genShadow(seed) {
  const S = 72, H = 40, C = 36, F = SHADOW_F, R0 = 17;
  const w = new World('realm', S, H, S);
  w.skyShade = false;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand), n3 = new Noise2D(rand);
  const id2 = (x, z) => z * S + x;
  const arena = new Uint8Array(S * S), rim = new Uint8Array(S * S);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
      if (d <= R0 + n1.noise(x / 7, z / 7) * 1.6) arena[id2(x, z)] = 1;
    }
  }
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      if (arena[id2(x, z)]) continue;
      let near = false;
      for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1; dx++) if (arena[id2(x + dx, z + dz)]) { near = true; break; }
      if (near) rim[id2(x, z)] = 1;
    }
  }
  const side = rand() < 0.5 ? 1 : -1;            // kant van het schateiland (oost of west)
  const onTreasureSide = (x) => side * (x + 0.5 - C) > 0;
  const lane = (z) => z === C - 1 || z === C;     // de twee rijen van de brug

  // Het eiland: endsteen, onderaan smal als een ijshoorntje, met gloeiende kristallen
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      if (!arena[id2(x, z)] && !rim[id2(x, z)]) continue;
      const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
      const k = clamp(1 - d / (R0 + 2.5), 0, 1);
      const depth = 2 + Math.floor(Math.pow(k, 0.55) * 11 + (n2.noise(x / 5, z / 5) + 0.5) * 3);
      for (let y = Math.max(1, F - depth); y <= F; y++) w.setRaw(x, y, z, B.END_STONE);
      if (rand() < 0.06) w.setRaw(x, Math.max(1, F - depth), z, B.CRYSTAL);
    }
  }

  // Vloer: paars pad van portaal naar troon, een ring, sculk-plekken en hier en daar een kristal
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      if (!arena[id2(x, z)]) continue;
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.hypot(dx, dz);
      let id = B.END_STONE;
      if (d < 2.4) id = B.OBSIDIAN;
      else if (d > 5.6 && d < 6.7) id = B.PURPUR;
      else if ((x === C || x === C + 1) && Math.abs(dz) < 15) id = B.PURPUR;
      else if (n3.noise(x / 6, z / 6) > 0.26) id = B.SCULK;
      else if (rand() < 0.012) id = B.CRYSTAL;
      w.setRaw(x, F, z, id);
    }
  }
  for (const [x, z] of [[C - 1, C - 1], [C, C - 1], [C - 1, C], [C, C]]) w.setRaw(x, F, z, B.CRYSTAL);

  // Lage muur rond het eiland met obsidiaan paaltjes en kristallampen; een paar kapotte stukken
  const gaps = [];
  for (const base of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) if (rand() < 0.5 && gaps.length < 2) gaps.push(base + (rand() - 0.5) * 0.4);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      if (!rim[id2(x, z)]) continue;
      if (onTreasureSide(x) && lane(z) && Math.abs(x + 0.5 - C) > 10) continue;   // opening voor de verborgen brug
      if ((z === C - 2 || z === C + 1) && onTreasureSide(x) && Math.abs(x + 0.5 - C) > 10) {
        w.setRaw(x, F + 1, z, B.OBSIDIAN);
        w.setRaw(x, F + 2, z, B.CRYSTAL);
        continue;
      }
      const a = Math.atan2(z + 0.5 - C, x + 0.5 - C);
      if (gaps.some((g) => Math.abs(angleDiff(a, g)) * (R0 + 1) < 1.3)) continue;
      if ((x * 7 + z * 13) % 9 === 0) {
        w.setRaw(x, F + 1, z, B.OBSIDIAN);
        w.setRaw(x, F + 2, z, B.OBSIDIAN);
        w.setRaw(x, F + 3, z, B.CRYSTAL);
      } else w.setRaw(x, F + 1, z, B.PURPUR);
    }
  }

  // Vier obsidiaanpilaren met een kristal erop (dekking tegen schaduwballen)
  const pillars = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2 + (rand() - 0.5) * 0.3;
    const px = Math.floor(C + Math.cos(a) * 10.5), pz = Math.floor(C + Math.sin(a) * 10.5);
    const h = 7 + Math.floor(rand() * 5);
    for (let y = F + 1; y <= F + h; y++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.abs(dx) + Math.abs(dz) === 2 && y > F + h - 2) continue;
          w.setRaw(px + dx, y, pz + dz, B.OBSIDIAN);
        }
      }
    }
    w.setRaw(px, F + h + 1, pz, B.CRYSTAL);
    pillars.push({ x: px + 0.5, z: pz + 0.5, top: F + h + 1 });
  }

  // De troon aan de noordkant
  const tz0 = C - 14;
  for (let z = tz0; z <= tz0 + 3; z++) for (let x = C - 2; x <= C + 3; x++) w.setRaw(x, F, z, B.PURPUR);
  for (let x = C - 1; x <= C + 2; x++) for (let y = F + 1; y <= F + 3; y++) w.setRaw(x, y, tz0, B.PURPUR);
  for (const x of [C - 1, C + 2]) {
    w.setRaw(x, F + 4, tz0, B.OBSIDIAN);
    w.setRaw(x, F + 5, tz0, B.CRYSTAL);
    for (let z = tz0 + 1; z <= tz0 + 2; z++) w.setRaw(x, F + 1, z, B.PURPUR);
  }
  w.setRaw(C, F + 4, tz0, B.PURPUR);
  w.setRaw(C + 1, F + 4, tz0, B.PURPUR);

  // Aankomstportaal aan de zuidkant, kijkend naar de troon
  const pz = C + 14;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
  w.portalAxis = 'x';
  const spawn = { x: C + 1, y: F + 1, z: pz - 2.5 };
  const bossSpawn = { x: C + 1, y: F + 1, z: tz0 + 2 };

  // Purpur ruïnes (bogen en muurtjes) als extra dekking
  const ruins = [];
  const free = (x, z) => arena[id2(x, z)] && w.get(x, F + 1, z) === B.AIR && w.get(x, F, z) !== B.OBSIDIAN &&
    Math.abs(x + 0.5 - (C + 1)) > 2.6 && !(onTreasureSide(x) && Math.abs(z + 0.5 - C) < 3.5) &&
    Math.hypot(x + 0.5 - spawn.x, z + 0.5 - spawn.z) > 5 && Math.hypot(x + 0.5 - bossSpawn.x, z + 0.5 - bossSpawn.z) > 5 &&
    !pillars.some((p) => Math.hypot(p.x - x - 0.5, p.z - z - 0.5) < 3.2);
  const want = 3 + (rand() < 0.5 ? 1 : 0);
  for (let tries = 0; tries < 300 && ruins.length < want; tries++) {
    const a = rand() * Math.PI * 2, r = 7.5 + rand() * 6;
    const rx = Math.floor(C + Math.cos(a) * r), rz = Math.floor(C + Math.sin(a) * r);
    if (ruins.some((o) => Math.hypot(o.x - rx, o.z - rz) < 6.5)) continue;
    const ax = rand() < 0.5 ? 1 : 0, az = 1 - ax;
    const arch = rand() < 0.5;
    const cells = [];
    for (let i = 0; i < 4; i++) cells.push([rx + i * ax, rz + i * az]);
    if (!arch) for (let j = 1; j <= 2; j++) cells.push([rx + j * az, rz + j * ax]);
    if (!cells.every(([x, z]) => free(x, z))) continue;
    if (arch) {
      for (const i of [0, 3]) for (let y = F + 1; y <= F + 3; y++) w.setRaw(rx + i * ax, y, rz + i * az, B.PURPUR);
      const broken = rand() < 0.5 ? 1 + Math.floor(rand() * 2) : -1;
      for (let i = 0; i < 4; i++) if (i !== broken) w.setRaw(rx + i * ax, F + 4, rz + i * az, B.PURPUR);
      w.setRaw(rx + (broken === 1 ? 2 : 1) * ax, F + 5, rz + (broken === 1 ? 2 : 1) * az, B.CRYSTAL);
    } else {
      for (const [x, z] of cells) {
        w.setRaw(x, F + 1, z, B.PURPUR);
        if (rand() < 0.7) w.setRaw(x, F + 2, z, B.PURPUR);
      }
      w.setRaw(rx, F + 3, rz, B.CRYSTAL);
    }
    ruins.push({ x: rx, z: rz });
  }

  // Kleine zwevende eilandjes in de verte
  for (const [ix, iz, iy, ir] of [[7, 8, F - 6, 3.2], [64, 9, F + 4, 2.6], [8, 64, F + 2, 2.8], [63, 63, F - 8, 3.5]]) {
    if (Math.abs(ix - (C + side * 29)) < 10 && Math.abs(iz - C) < 12) continue;
    for (let z = Math.floor(iz - ir - 1); z <= iz + ir + 1; z++) {
      for (let x = Math.floor(ix - ir - 1); x <= ix + ir + 1; x++) {
        const d = Math.hypot(x + 0.5 - ix, z + 0.5 - iz);
        if (d > ir + n2.noise(x / 3, z / 3) * 0.8) continue;
        const dep = 1 + Math.floor((1 - d / (ir + 1)) * 5);
        for (let y = iy - dep; y <= iy; y++) w.setRaw(x, y, z, B.END_STONE);
      }
    }
    for (let y = iy + 1; y <= iy + 3; y++) w.setRaw(ix, y, iz, B.OBSIDIAN);
    w.setRaw(ix, iy + 4, iz, B.CRYSTAL);
  }

  // Het schateiland met een purpur hutje; de kist zit erin achter een deur van sculk
  const tx = C + side * 29, tz = C, TY = F - 2;
  const tIsl = new Uint8Array(S * S);
  for (let z = tz - 7; z <= tz + 7; z++) {
    for (let x = tx - 7; x <= tx + 7; x++) {
      if (x < 0 || z < 0 || x >= S || z >= S) continue;
      const d = Math.hypot(x - tx, z - tz);
      if (d > 4.3 + n2.noise(x / 3 + 9, z / 3) * 0.5) continue;
      tIsl[id2(x, z)] = 1;
      const dep = 2 + Math.floor((1 - d / 5) * 5);
      for (let y = TY - dep; y <= TY; y++) w.setRaw(x, y, z, B.END_STONE);
      if (rand() < 0.15) w.setRaw(x, TY - dep, z, B.CRYSTAL);
    }
  }
  // de verborgen brug: eerst een trapje omlaag, dan een purpur pad met leuningen en kristallampjes
  const bridge = new Uint8Array(S * S);
  for (const lz of [C - 1, C]) {
    let n = 0;
    for (let x = C + side * 10; x >= 0 && x < S; x += side) {
      if (tIsl[id2(x, lz)]) break;
      if (arena[id2(x, lz)] || rim[id2(x, lz)]) continue;
      const top = n === 0 ? F - 1 : TY;
      w.setRaw(x, top, lz, B.PURPUR);
      bridge[id2(x, lz)] = top + 1;
      const rz = lz === C - 1 ? C - 2 : C + 1;
      if (!arena[id2(x, rz)] && !rim[id2(x, rz)] && !tIsl[id2(x, rz)]) {
        w.setRaw(x, top, rz, B.PURPUR);
        w.setRaw(x, top + 1, rz, n % 3 === 1 ? B.CRYSTAL : B.PURPUR);
        bridge[id2(x, rz)] = 1;
      }
      n++;
    }
  }
  // leuning rond het schateiland (niet op de brug)
  for (let z = tz - 8; z <= tz + 8; z++) {
    for (let x = tx - 8; x <= tx + 8; x++) {
      if (x < 1 || z < 1 || x >= S - 1 || z >= S - 1 || tIsl[id2(x, z)] || bridge[id2(x, z)]) continue;
      if (tIsl[id2(x + 1, z)] || tIsl[id2(x - 1, z)] || tIsl[id2(x, z + 1)] || tIsl[id2(x, z - 1)]) {
        if (lane(z) && Math.abs(x - tx) > 3 && side * (tx - x) > 0) continue;
        w.setRaw(x, TY, z, B.PURPUR);
        w.setRaw(x, TY + 1, z, B.PURPUR);
      }
    }
  }
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = tx + dx, z = tz + dz;
      w.setRaw(x, TY, z, B.PURPUR);
      const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
      for (let y = TY + 1; y <= TY + 3; y++) w.setRaw(x, y, z, corner ? B.OBSIDIAN : edge ? B.PURPUR : B.AIR);
      w.setRaw(x, TY + 4, z, (dx === 0 && dz === 0) ? B.CRYSTAL : B.PURPUR);
      if ((corner || (dx === 0 && dz === 0))) w.setRaw(x, TY + 5, z, B.CRYSTAL);
    }
  }
  w.setRaw(tx - side * 2, TY + 1, tz, B.SCULK);
  w.setRaw(tx - side * 2, TY + 2, tz, B.SCULK);
  w.setRaw(tx, TY + 1, tz, B.CHEST);
  const treasure = { x: tx, y: TY + 1, z: tz };
  // gloeiende drempel bij de opening in de muur
  for (let x = C + side * 12; x >= 0 && x < S; x += side) {
    if (!arena[id2(x, C)]) break;
    if (!arena[id2(x + side, C)]) { w.setRaw(x, F, C - 1, B.CRYSTAL); w.setRaw(x, F, C, B.CRYSTAL); }
  }

  w.computeTops();
  return {
    world: w, spawn, spawnYaw: 0, bossSpawn,
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 }, portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: R0, floorY: F + 1,
    treasure, treasureSide: side,
    crystals: pillars.map((p) => ({ x: p.x, y: p.top + 2.3, z: p.z })),
  };
}

/* ---------- Sterrenhemel en zwevende kristallen ---------- */
function shadowStars() {
  if (SHADOW_CACHE.stars) return SHADOW_CACHE.stars;
  const R = mulberry32(4711);
  const n = 700, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(a) * s * 150; pos[i * 3 + 1] = u * 150; pos[i * 3 + 2] = Math.sin(a) * s * 150;
    const k = R(), b = 0.45 + R() * 0.55;
    const c = k < 0.7 ? [b, b, b] : k < 0.88 ? [b * 0.8, b * 0.5, b] : [b * 0.5, b, b * 0.7];
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.userShared = true;
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
  pts.frustumCulled = false;
  pts.renderOrder = -10;
  SHADOW_CACHE.stars = pts;
  return pts;
}

function shadowEnter(info) {
  const C = SHADOW_CACHE;
  if (!C.cageGeo) {
    C.cageGeo = new THREE.BoxGeometry(1, 1, 1); C.cageGeo.userShared = true;
    C.coreGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5); C.coreGeo.userShared = true;
    C.cageMat = new THREE.MeshBasicMaterial({
      map: pixelTexture(16, 16, (x, y) => (x <= 1 || y <= 1 || x >= 14 || y >= 14 ? [236, 214, 255] : (x === y || x === 15 - y) ? [190, 150, 240] : null)),
      alphaTest: 0.5, side: THREE.DoubleSide,
    });
    C.coreMat = new THREE.MeshBasicMaterial({
      map: pixelTexture(8, 8, (x, y) => { const d = Math.abs(x - 3.5) + Math.abs(y - 3.5); return d < 2 ? [255, 226, 255] : d < 4 ? [234, 120, 255] : [150, 50, 210]; }),
    });
  }
  SHADOW_DECOR.crystals = [];
  for (const s of info.crystals || []) {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(C.cageGeo, C.cageMat), inner = new THREE.Mesh(C.coreGeo, C.coreMat);
    g.add(outer, inner);
    g.position.set(s.x, s.y, s.z);
    game.realmGroup.add(g);
    SHADOW_DECOR.crystals.push({ group: g, outer, inner, y: s.y, ph: Math.random() * 6 });
  }
  const stars = shadowStars();
  stars.position.set(info.arenaCenter.x, info.floorY, info.arenaCenter.z);
  game.realmGroup.add(stars);
  updateShadowEyes(null);
  // shaders vooraf klaarzetten, zodat de eerste aanval op een telefoon niet hapert
  try {
    const hz = new GroundHazard({ x: info.arenaCenter.x, y: -40, z: info.arenaCenter.z, radius: 1.1, color: 0xff66ff });
    const warm = [shadowOrbMesh(false), shadowOrbMesh(true), hz.mesh];
    for (const m of warm) { m.position.y = -40; game.realmGroup.add(m); }
    game.renderer.compile(game.scene, game.camera);
    for (const m of warm) game.realmGroup.remove(m);
    hz.dispose();
  } catch (e) { /* niet erg: dan gebeurt het later */ }
}

function shadowAmbience(dt, info) {
  const p = player;
  // zwevende paarse stofjes
  game.ashT += dt * 12;
  while (game.ashT > 1) {
    game.ashT -= 1;
    const k = Math.random();
    FX.debris.spawn(p.pos.x + (Math.random() - 0.5) * 34, p.pos.y - 6 + Math.random() * 16, p.pos.z + (Math.random() - 0.5) * 34,
      (Math.random() - 0.5) * 0.3, 0.25 + Math.random() * 0.35, (Math.random() - 0.5) * 0.3,
      0.55 + k * 0.3, 0.2 + k * 0.2, 0.85 + k * 0.15, 3 + Math.random() * 3, 0, 0);
  }
  const t = game.time;
  for (const c of SHADOW_DECOR.crystals) {
    c.outer.rotation.set(t * 0.8 + c.ph, t * 1.1, t * 0.5);
    c.inner.rotation.set(-t * 1.4, t * 0.6 + c.ph, 0);
    c.group.position.y = c.y + Math.sin(t * 1.6 + c.ph) * 0.25;
    if (Math.random() < dt * 3) {
      const k = SHADOW_COL.pink;
      FX.glow.spawn(c.group.position.x, c.group.position.y, c.group.position.z, (Math.random() - 0.5) * 1.5, -0.5, (Math.random() - 0.5) * 1.5, k[0], k[1], k[2], 1.2, 1, 0.5);
    }
  }
  // af en toe gefluister uit de leegte
  game.popT -= dt;
  if (game.popT <= 0) {
    game.popT = 7 + Math.random() * 9;
    shadowSfx('whisper');
  }
  updateShadowEyes(game.boss);
}

registerRealm('shadow', {
  gen: genShadow,
  makeBoss: (world, info) => new ShadowKing(world, info),
  atmosphere: { background: 0x05030a, fog: 0x120a24, near: 18, far: 70, amb: 0xc4b0ff, ambI: 0.85, dir: 0xc8a8ff, dirI: 0.4, hand: 0xd8c8ff },
  intro: 'Daar staat de Schaduwkoning bij zijn troon... loop dichterbij als je durft!',
  tip: 'Tip: sla zijn schaduwballen kapot en loop uit de paarse cirkels!',
  treasureTip: 'Volg het kompas naar de gloeiende kristallen!',
  ambience: shadowAmbience,
  ambientSound: 0.55,
  fallLimit: 3,
  onEnter: shadowEnter,
});
