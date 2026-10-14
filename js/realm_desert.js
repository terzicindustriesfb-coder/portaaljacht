'use strict';
/* Portaaljacht – wereld 5: de Zandpiramide met De Zandfarao (drijfzand, zandhoos, scarabeeën, gouden straal) */

// Alles in een eigen functie, zodat namen niet botsen met de andere werelden
(() => {
const DF = 10;                            // bovenste blok van de arenavloer
const DS = 80, DH = 48;                   // wereldgrootte
const AC = { x: 40.5, z: 52.5 }, AR = 16; // arena: midden en straal
const PC = { x: 40, z: 16 }, PH = 15;     // piramide: middelste blok en halve breedte onderaan
const all6 = (t) => ({ top: t, bottom: t, side: t });

/* ---------- Eigen blokken ---------- */
defineTile('DESERT_SMOOTH', (h) => (x, y) => {
  if (y === 0) return h.vary([234, 222, 176], 3);
  if (y === 15) return h.vary([198, 182, 132], 3);
  return h.vary(h.R() < 0.1 ? [228, 214, 164] : [221, 207, 157], 3);
});
defineTile('DESERT_SMOOTH_TOP', (h) => () => h.vary(h.R() < 0.12 ? [229, 217, 169] : [222, 208, 158], 3));
defineTile('DESERT_CHISELED', (h) => (x, y) => {
  if (y <= 1 || y >= 14) return h.vary(y === 0 || y === 15 ? [190, 170, 118] : [228, 214, 162], 4);
  // een ankh in het midden
  const ex = (x - 7.5) / 2.6, ey = (y - 5.2) / 2.3, e = ex * ex + ey * ey;
  const ankh = (y <= 7 && e > 0.42 && e < 1.3) || (y === 8 && x >= 4 && x <= 11) || (y >= 8 && y <= 12 && (x === 7 || x === 8));
  if (ankh) return h.vary([166, 130, 78], 4);
  return h.vary([214, 198, 146], 5);
});
defineTile('DESERT_LAPIS', (h) => (x, y) => {
  if (x % 8 === 0 || y % 8 === 0) return h.vary([228, 184, 66], 8);
  if ((x + y) % 7 === 3 && h.R() < 0.5) return h.vary([86, 126, 214], 6);
  return h.vary([34, 62, 152], 8);
});
defineTile('DESERT_QUICKSAND', (h) => (x, y) => {
  const dx = x - 7.5, dy = y - 7.5;
  const s = Math.sin(Math.hypot(dx, dy) * 1.15 + Math.atan2(dy, dx) * 2);
  return h.vary(s > 0.35 ? [192, 150, 86] : s > -0.35 ? [164, 122, 66] : [128, 92, 50], 6);
});
defineTile('DESERT_CRACKED', (h) => {
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push([h.R() * 16, h.R() * 16]);
  return (x, y) => {
    const v = h.voronoi(pts, x, y, 16);
    if (v.edge < 0.75) return h.R() < 0.3 ? [255, 214, 84] : h.vary([92, 68, 38], 6);
    if (v.edge < 1.3) return h.vary([176, 150, 102], 5);
    return y % 5 === 4 ? h.vary([196, 180, 128], 5) : h.vary([214, 198, 146], 5);
  };
});
defineTile('DESERT_GATE', (h) => (x, y) => {
  if (x === 0 || x === 15 || y === 0 || y === 15) return h.vary([120, 92, 56], 4);
  // oog van Horus in goud en blauw
  const eyeO = Math.abs((x - 7.5) / 4.6) ** 2 + Math.abs((y - 6.5) / 2.2) ** 2;
  if (eyeO < 0.35) return [40, 70, 170];
  if (eyeO < 1) return h.vary([238, 196, 70], 6);
  if ((y === 9 || y === 10) && x >= 6 && x <= 7) return [238, 196, 70];
  if (y >= 10 && y <= 12 && x === 5 + (y - 10)) return [238, 196, 70];
  return x === 1 || y === 1 ? h.vary([186, 156, 104], 4) : h.vary([160, 128, 80], 5);
});

const QS = defineBlock('DESERT_QUICKSAND', { name: 'Drijfzand', tiles: all6(T.DESERT_QUICKSAND), solid: false, hard: 0.5, sound: 'sand', slow: 0.35, hurt: 1, hurtCause: 'quicksand' });
const SMOOTH = defineBlock('DESERT_SMOOTH', { name: 'Gladde zandsteen', tiles: { top: T.DESERT_SMOOTH_TOP, bottom: T.DESERT_SMOOTH_TOP, side: T.DESERT_SMOOTH }, hard: 0.8 });
const CHISEL = defineBlock('DESERT_CHISELED', { name: 'Bewerkte zandsteen', tiles: { top: T.DESERT_SMOOTH_TOP, bottom: T.DESERT_SMOOTH_TOP, side: T.DESERT_CHISELED }, hard: 0.8 });
const LAPIS = defineBlock('DESERT_LAPIS', { name: 'Lapis-tegel', tiles: all6(T.DESERT_LAPIS), hard: 1.0 });
const CRACKED = defineBlock('DESERT_CRACKED', { name: 'Gebarsten zandsteen', tiles: all6(T.DESERT_CRACKED), hard: 0.45 });
const GATE = defineBlock('DESERT_GATE', { name: 'Piramidepoort', tiles: all6(T.DESERT_GATE), hard: Infinity });
const GOLDCAP = defineBlock('DESERT_GOLDCAP', { name: 'Gouden piramidepunt', tiles: all6(T.GOLD), hard: 1.8, glow: true });
const PIT_OK = {};
PIT_OK[B.SAND] = 1; PIT_OK[B.SANDSTONE] = 1; PIT_OK[SMOOTH] = 1;

/* ---------- De wereld: arena voor een reusachtige piramide ---------- */
function genDesert(seed) {
  const S = DS, H = DH, F = DF;
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand);
  const set = (x, y, z, id) => w.setRaw(x, y, z, id);
  const dArena = (x, z) => Math.hypot(x + 0.5 - AC.x, z + 0.5 - AC.z);
  const onPath = (x, z) => x >= 37 && x <= 43 && z >= 30 && z <= 38;

  // Duinen, vlak rond de arena en de piramide
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dA = dArena(x, z);
      const pyrD = Math.max(Math.abs(x - PC.x), Math.abs(z - PC.z)) - (PH + 1);
      const fadeD = Math.min(dA - (AR + 2), pyrD, onPath(x, z) ? 0 : 99);
      let dune = (n1.fbm(x / 13, z / 13, 3) + 0.3) * 9;
      const edge = Math.min(x, z, S - 1 - x, S - 1 - z);
      if (edge < 8) dune += (8 - edge) * 1.1;
      const h = clamp(F + Math.round(clamp(fadeD / 7, 0, 1) * dune), F - 2, H - 14);
      for (let y = 0; y <= h; y++) set(x, y, z, y === 0 ? B.BEDROCK : y < h - 3 ? B.SANDSTONE : B.SAND);
    }
  }

  // Arenavloer: gouden zon in het midden, lapisring, paden van gladde zandsteen
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - AC.x, dz = z + 0.5 - AC.z, d = Math.hypot(dx, dz);
      if (d > AR + 0.5) continue;
      let id = rand() < 0.07 ? B.SANDSTONE : B.SAND;
      if (d < 1.6) id = B.GOLD;
      else if (d < 2.9) id = LAPIS;
      else if (d < 3.8) id = SMOOTH;
      else if (d > 9 && d < 10.1) id = SMOOTH;
      else if (Math.abs(dx) < 1.1 || Math.abs(dz) < 1.1) id = SMOOTH;
      else if (d > 14.6) id = B.SANDSTONE;
      set(x, F, z, id);
    }
  }

  // Lage muur met zuilen rond de arena, open naar de piramide
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      const dx = x + 0.5 - AC.x, dz = z + 0.5 - AC.z, d = Math.hypot(dx, dz);
      if (d <= AR + 0.5 || d > AR + 1.7) continue;
      if (dz < 0 && Math.abs(dx) < 3) continue;
      for (let y = 1; y <= F; y++) if (!SOLID[w.get(x, y, z)]) set(x, y, z, B.SANDSTONE);
      set(x, F + 1, z, B.SANDSTONE);
      set(x, F + 2, z, (x * 7 + z * 3) % 5 === 0 ? CHISEL : SMOOTH);
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) * Math.PI / 6;
    const px = Math.floor(AC.x + Math.cos(a) * (AR + 1.1)), pz = Math.floor(AC.z + Math.sin(a) * (AR + 1.1));
    if (pz < AC.z && Math.abs(px + 0.5 - AC.x) < 6) continue;
    for (let y = F + 1; y <= F + 5; y++) set(px, y, pz, y === F + 3 ? CHISEL : B.SANDSTONE);
    set(px, F + 6, pz, GOLDCAP);
    set(px, F + 7, pz, B.TORCH);
  }

  // Vier obelisken als dekking tegen de gouden straal
  for (const [ox, oz] of [[31, 44], [48, 44], [31, 59], [48, 59]]) {
    for (let y = F + 1; y <= F + 6; y++) {
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) set(ox + dx, y, oz + dz, y === F + 3 ? CHISEL : y === F + 6 ? SMOOTH : B.SANDSTONE);
    }
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) set(ox + dx, F + 7, oz + dz, GOLDCAP);
  }

  // De piramide: treden van twee hoog, gouden punt
  for (let k = 0; k <= PH; k++) {
    const half = PH - k, y0 = F + 1 + 2 * k;
    const gold = half <= 2;
    for (let z = PC.z - half; z <= PC.z + half; z++) {
      for (let x = PC.x - half; x <= PC.x + half; x++) {
        const rim = Math.abs(x - PC.x) === half || Math.abs(z - PC.z) === half;
        set(x, y0, z, gold ? GOLDCAP : B.SANDSTONE);
        set(x, y0 + 1, z, gold ? GOLDCAP : (rim && k % 3 === 0 && (x + z) % 3 === 0 ? CHISEL : SMOOTH));
      }
    }
  }

  // Poortgebouw aan de voorkant
  for (let x = 36; x <= 44; x++) {
    for (let z = 30; z <= 33; z++) {
      for (let y = F + 1; y <= F + 7; y++) {
        const col = x <= 37 || x >= 43;
        let id = col ? SMOOTH : B.SANDSTONE;
        if (col && (y === F + 2 || y === F + 5)) id = CHISEL;
        if (y === F + 6) id = LAPIS;
        if (y === F + 7) id = CHISEL;
        set(x, y, z, id);
      }
    }
  }
  for (let x = 38; x <= 42; x++) set(x, F + 5, 33, B.GOLD);
  set(40, F + 8, 32, GOLDCAP);
  // gang naar binnen (de poort gaat pas open als de farao verslagen is)
  for (let z = 21; z <= 33; z++) {
    for (let x = 38; x <= 42; x++) {
      for (let y = F; y <= F + 5; y++) {
        const inner = x >= 39 && x <= 41 && y >= F + 1 && y <= F + 4;
        if (inner) set(x, y, z, B.AIR);
        else if (z <= 30) set(x, y, z, y === F ? SMOOTH : y === F + 4 && z % 4 === 1 ? B.GLOWSTONE : y === F + 4 ? LAPIS : y === F + 5 ? B.SANDSTONE : SMOOTH);
      }
    }
  }
  const gate = [];
  for (let y = F + 4; y >= F + 1; y--) for (let x = 39; x <= 41; x++) { set(x, y, 33, GATE); gate.push([x, y, 33]); }
  // fakkels en wachters naast de poort
  for (const sx of [35, 45]) {
    for (let y = F + 1; y <= F + 4; y++) set(sx, y, 34, y === F + 3 ? CHISEL : B.SANDSTONE);
    set(sx, F + 5, 34, GOLDCAP);
    set(sx, F + 6, 34, B.TORCH);
  }

  // Grafkamer in de piramide
  for (let z = 11; z <= 21; z++) {
    for (let x = 35; x <= 45; x++) {
      for (let y = F; y <= F + 6; y++) {
        const wall = x === 35 || x === 45 || z === 11 || z === 21;
        let id;
        if (y === F) id = x === 36 || x === 44 || z === 12 || z === 20 ? LAPIS : SMOOTH;
        else if (y === F + 6) id = (x === 37 || x === 43) && (z === 13 || z === 19) ? B.GLOWSTONE : B.SANDSTONE;
        else if (wall) id = y === F + 5 ? LAPIS : y === F + 2 && (x + z) % 2 === 0 ? CHISEL : SMOOTH;
        else id = B.AIR;
        set(x, y, z, id);
      }
    }
  }
  for (let x = 39; x <= 41; x++) for (let y = F + 1; y <= F + 4; y++) set(x, y, 21, B.AIR);
  for (const [cx, cz] of [[36, 12], [44, 12], [36, 20], [44, 20]]) {
    for (let y = F + 1; y <= F + 5; y++) set(cx, y, cz, y === F + 3 ? B.GOLD : CHISEL);
  }
  // sarcofaag
  for (let z = 15; z <= 17; z++) { set(40, F + 1, z, LAPIS); set(40, F + 2, z, z === 17 ? GOLDCAP : B.GOLD); }
  for (const [tx, tz] of [[38, 13], [42, 13], [38, 19], [42, 19]]) set(tx, F + 1, tz, B.TORCH);

  // Verborgen schatkamer achter een gebarsten muur met een gouden rand
  const sides = [
    { ox: 40, oz: 11, dx: 0, dz: -1, ax: 1, az: 0 },   // achterwand
    { ox: 35, oz: 16, dx: -1, dz: 0, ax: 0, az: 1 },   // linkerwand
    { ox: 45, oz: 16, dx: 1, dz: 0, ax: 0, az: 1 },    // rechterwand
  ];
  const sd = sides[Math.floor(rand() * sides.length)];
  const at = (u, v) => [sd.ox + sd.ax * u + sd.dx * v, sd.oz + sd.az * u + sd.dz * v];
  for (let v = 1; v <= 4; v++) {
    for (let u = -2; u <= 2; u++) {
      const [x, z] = at(u, v);
      for (let y = F; y <= F + 3; y++) {
        const edge = v === 4 || Math.abs(u) === 2 || y === F || y === F + 3;
        set(x, y, z, edge ? (y === F ? SMOOTH : LAPIS) : B.AIR);
      }
    }
  }
  for (let u = -2; u <= 2; u++) {
    const [x, z] = at(u, 0);
    for (let y = F + 1; y <= F + 3; y++) set(x, y, z, Math.abs(u) === 2 || y === F + 3 ? B.GOLD : CRACKED);
  }
  { const [x, z] = at(0, 2); set(x, F + 3, z, B.GLOWSTONE); }
  for (const u of [-1, 1]) { const [x, z] = at(u, 3); set(x, F + 1, z, B.GOLD); }
  const [tx, tz] = at(0, 2);
  set(tx, F + 1, tz, B.CHEST);
  const [cx0, cz0] = at(0, 0);

  // Dode struiken in de arena, cactussen en ruïnes in de duinen
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, r = 11.5 + rand() * 3;
    const x = Math.floor(AC.x + Math.cos(a) * r), z = Math.floor(AC.z + Math.sin(a) * r);
    if (w.get(x, F + 1, z) === B.AIR && (w.get(x, F, z) === B.SAND || w.get(x, F, z) === B.SANDSTONE)) set(x, F + 1, z, B.DEAD_BUSH);
  }
  for (let i = 0; i < 600; i++) {
    const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
    if (dArena(x, z) < AR + 3.5 || Math.max(Math.abs(x - PC.x), Math.abs(z - PC.z)) < PH + 3 || onPath(x, z)) continue;
    let y = H - 1;
    while (y > 0 && w.get(x, y, z) === B.AIR) y--;
    if (w.get(x, y, z) !== B.SAND || w.get(x, y + 1, z) !== B.AIR) continue;
    const r = rand();
    if (r < 0.1) {
      const hh = 2 + Math.floor(rand() * 2);
      let free = true;
      for (const [ddx, ddz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.get(x + ddx, y + 1, z + ddz) !== B.AIR) free = false;
      if (free) for (let k = 1; k <= hh; k++) set(x, y + k, z, B.CACTUS);
    } else if (r < 0.2) set(x, y + 1, z, B.DEAD_BUSH);
    else if (r < 0.215) {
      // omgevallen zuil
      const hh = 1 + Math.floor(rand() * 4);
      for (let k = 1; k <= hh; k++) set(x, y + k, z, k === 2 ? CHISEL : B.SANDSTONE);
      if (rand() < 0.4) set(x + 1, y + 1, z, SMOOTH);
    }
  }

  // Aankomstportaal aan de zuidkant, kijkend naar de piramide
  const pz = 65;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      set(40 + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) set(40 + dx, F, pz + dz, dx === -2 || dx === 3 ? LAPIS : CHISEL);
  w.portalAxis = 'x';

  w.computeTops();
  return {
    world: w,
    spawn: { x: 41, y: F + 1, z: pz - 2.5 },
    spawnYaw: 0,
    bossSpawn: { x: 40.5, y: F + 1, z: 47.5 },
    portal: { x: 41, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: AC.x, z: AC.z }, arenaRadius: AR, floorY: F + 1,
    treasure: { x: tx, y: F + 1, z: tz },
    crack: { x: cx0 + 0.5 - sd.dx * 0.55, y: F + 2, z: cz0 + 0.5 - sd.dz * 0.55 },
    gate, pits: [], stormK: 0,
  };
}

/* ---------- Texturen van de farao, scarabeeën en zandhozen ---------- */
const DTEX = {};
function buildDesertTextures() {
  const R = mulberry32(5150);
  const v = (c, s) => { const k = (R() - 0.5) * 2 * s; return [c[0] + k, c[1] + k, c[2] + k]; };
  const wrap = (x, y) => {
    const b = (y + Math.floor(x / 6)) % 4;   // licht schuine windsels
    if (b === 0) return v([146, 128, 98], 5);
    if (b === 1) return v([238, 228, 200], 5);
    return R() < 0.06 ? v([180, 160, 120], 6) : v([214, 202, 170], 6);
  };
  DTEX.bandage = pixelTexture(16, 16, wrap);
  const eye = (x, y) => (y === 6 || y === 7) && ((x >= 4 && x <= 5) || (x >= 10 && x <= 11));
  const socket = (x, y) => y >= 5 && y <= 8 && ((x >= 3 && x <= 6) || (x >= 9 && x <= 12));
  DTEX.face = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return [130, 255, 238];
    if (socket(x, y)) return [34, 26, 20];
    if (y === 11 && x >= 6 && x <= 9) return [58, 42, 30];
    return wrap(x, y);
  });
  DTEX.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [90, 255, 230] : [0, 0, 0]));
  DTEX.nemes = pixelTexture(16, 16, (x, y) => (y % 4 < 2 ? v([240, 194, 62], 8) : v([34, 62, 170], 8)));
  DTEX.gold = pixelTexture(8, 8, (x, y) => (x === y || x + 1 === y ? [255, 246, 176] : v([234, 184, 54], 10)));
  const collarCols = [[240, 194, 62], [58, 200, 186], [240, 194, 62], [34, 62, 170], [206, 66, 50]];
  DTEX.collar = pixelTexture(16, 16, (x, y) => {
    if (y >= 15 && x % 3 === 1) return [255, 232, 124];
    return v(collarCols[Math.floor(y / 3) % collarCols.length], 6);
  });
  DTEX.kilt = pixelTexture(16, 16, (x, y) => (y >= 13 ? v([236, 188, 60], 8) : x % 3 === 0 ? v([198, 188, 166], 4) : v([240, 234, 218], 4)));
  DTEX.scarab = pixelTexture(8, 8, (x, y) => (x === 3 || x === 4 ? [232, 188, 60] : v(y < 2 ? [64, 156, 156] : [30, 92, 112], 12)));
  DTEX.scarabFace = pixelTexture(8, 4, (x, y) => (y === 1 && (x === 1 || x === 6) ? [130, 255, 232] : [24, 32, 40]));
  DTEX.scarabGlow = pixelTexture(8, 4, (x, y) => (y === 1 && (x === 1 || x === 6) ? [100, 255, 220] : [0, 0, 0]));
  DTEX.tornado = pixelTexture(16, 16, (x, y) => {
    const s = (x + y * 2 + Math.floor(R() * 2)) % 8;
    return s < 3 ? [236, 200, 140, 240] : s < 5 ? [190, 148, 92, 200] : [160, 120, 74, 130];
  });
  DTEX.sand = pixelTexture(8, 8, () => v([222, 182, 112], 18));
}

const STORM_COL = window.THREE ? new THREE.Color(0xd6a466) : null;
const TMP = window.THREE ? { a: new THREE.Vector3(), b: new THREE.Vector3() } : {};

/* ---------- Zandhoos: jaagt langzaam op de speler, trekt en gooit je omhoog ---------- */
const TORN = {};
class SandTornado {
  constructor(boss, x, z, life, speed) {
    this.boss = boss; this.x = x; this.z = z; this.y = boss.info.floorY;
    this.life = life; this.speed = speed;
    this.t = 0; this.dead = false; this.hitCD = 0.4; this.sndT = 0; this.hits = 0;
    this.heading = Math.atan2(player.pos.x - x, player.pos.z - z);
    if (!TORN.geo) {
      TORN.geo = new THREE.BoxGeometry(1, 1, 1);
      TORN.geo.userShared = true;
      TORN.mat = new THREE.MeshBasicMaterial({ map: DTEX.tornado, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide });
    }
    this.mesh = new THREE.Group();
    this.rings = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(TORN.geo, TORN.mat);
      const s = 0.5 + i * 0.42;
      m.scale.set(s, 0.78, s);
      m.position.y = 0.4 + i * 0.74;
      this.mesh.add(m);
      this.rings.push(m);
    }
    this.mesh.position.set(x, this.y, z);
    this.mesh.scale.setScalar(0.05);
    this.mesh.renderOrder = 5;
  }

  update(dt) {
    this.t += dt; this.hitCD -= dt; this.sndT -= dt;
    if (this.t >= this.life) { this.dead = true; return; }
    const p = player;
    const k = Math.min(Math.min(1, this.t / 0.5), clamp((this.life - this.t) / 0.6, 0, 1));
    // achter de speler aan, maar hij draait traag: opzij rennen werkt
    let want = Math.atan2(p.pos.x - this.x, p.pos.z - this.z);
    if (Math.hypot(this.x - AC.x, this.z - AC.z) > AR - 2) want = Math.atan2(AC.x - this.x, AC.z - this.z);
    this.heading += clamp(angleDiff(this.heading, want), -1.5 * dt, 1.5 * dt);
    const sp = this.speed * Math.min(1, this.t / 0.8);
    this.x += Math.sin(this.heading) * sp * dt;
    this.z += Math.cos(this.heading) * sp * dt;
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.scale.setScalar(Math.max(0.05, k));
    for (let i = 0; i < 6; i++) {
      const r = this.rings[i];
      r.rotation.y = this.t * (6 + i * 1.3);
      r.position.x = Math.sin(this.t * 3 + i * 0.9) * 0.1 * i;
      r.position.z = Math.cos(this.t * 2.6 + i) * 0.1 * i;
    }
    // wervelend zand
    for (let n = 0; n < 3; n++) {
      const a = Math.random() * Math.PI * 2, hh = Math.random() * 4.3 * k, rr = (0.35 + hh * 0.42) * k;
      const c = 0.75 + Math.random() * 0.2;
      FX.debris.spawn(this.x + Math.cos(a) * rr, this.y + hh, this.z + Math.sin(a) * rr,
        -Math.sin(a) * 4.5, 1.2 + Math.random(), Math.cos(a) * 4.5, c, c * 0.8, c * 0.52, 0.5, 0, 0.5);
    }
    if (this.sndT <= 0) { this.sndT = 1.3; SND.play('wind', { at: { x: this.x, y: this.y, z: this.z }, range: 26, vol: 0.5 }); }
    if (p.dead || k < 0.5) return;
    const dx = this.x - p.pos.x, dz = this.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
    const dy = p.pos.y - this.y;
    if (dy < -1.6 || dy > 4.2) return;
    // zuigt je een beetje naar zich toe
    if (d < 5.5) {
      const f = 5 * (1 - d / 5.5) * dt;
      p.kbx += dx / d * f; p.kbz += dz / d * f;
    }
    if (d < 1.15 + p.hw && this.hitCD <= 0) {
      // na twee keer raken waait hij uit
      this.hitCD = 1.5;
      if (++this.hits >= 2) this.life = Math.min(this.life, this.t + 0.8);
      damagePlayer(this.boss.dmg(9), { x: this.x, y: this.y, z: this.z }, 'tornado', 7, 9.5);
      for (let i = 0; i < 14; i++) FX.debris.spawn(p.pos.x, p.pos.y + 0.5, p.pos.z, (Math.random() - 0.5) * 5, 2 + Math.random() * 4, (Math.random() - 0.5) * 5, 0.86, 0.7, 0.45, 0.8, 12, 0.5, true);
    }
  }

  dispose() {}
}

/* ---------- Gouden straal (alleen het effect; de schade doet de LaneHazard) ---------- */
class BeamFx {
  constructor(from, to) {
    this.t = 0; this.dead = false;
    const len = Math.max(0.5, from.distanceTo(to));
    this.mat = new THREE.MeshBasicMaterial({ color: 0xffd860, transparent: true, opacity: 0.85, depthWrite: false });
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xfffff0 });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, len).translate(0, 0, len / 2), this.mat);
    this.mesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, len).translate(0, 0, len / 2), this.coreMat));
    this.mesh.position.copy(from);
    this.mesh.lookAt(to);
    this.mesh.renderOrder = 5;
  }
  update(dt) {
    this.t += dt;
    const k = Math.max(0.02, 1 - this.t / 0.45);
    this.mesh.scale.set(k, k, 1);
    this.mat.opacity = 0.85 * k;
    if (this.t >= 0.45) this.dead = true;
  }
  dispose() {
    this.mesh.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  }
}

/* ---------- Scarabee (handlanger) ---------- */
const SCARAB = {};
function scarabModel() {
  if (!SCARAB.body) {
    SCARAB.body = new THREE.BoxGeometry(0.62, 0.3, 0.78);
    SCARAB.head = new THREE.BoxGeometry(0.38, 0.22, 0.24);
    SCARAB.leg = new THREE.BoxGeometry(0.96, 0.07, 0.08);
    SCARAB.horn = new THREE.BoxGeometry(0.08, 0.08, 0.26).translate(0, 0, 0.13);
    for (const g of [SCARAB.body, SCARAB.head, SCARAB.leg, SCARAB.horn]) g.userShared = true;
  }
  const shell = new THREE.MeshLambertMaterial({ map: DTEX.scarab });
  const dark = new THREE.MeshLambertMaterial({ color: 0x25313c });
  const face = new THREE.MeshLambertMaterial({ map: DTEX.scarabFace, emissive: 0xffffff, emissiveMap: DTEX.scarabGlow });
  const gold = new THREE.MeshLambertMaterial({ map: DTEX.gold });
  const group = new THREE.Group();
  const body = new THREE.Mesh(SCARAB.body, [dark, dark, shell, dark, shell, dark]);
  body.position.y = 0.3;
  group.add(body);
  const head = new THREE.Mesh(SCARAB.head, [dark, dark, dark, dark, face, dark]);
  head.position.set(0, 0.26, 0.5);
  group.add(head);
  const horn = new THREE.Mesh(SCARAB.horn, gold);
  horn.position.set(0, 0.32, 0.6); horn.rotation.x = -0.5;
  group.add(horn);
  const legs = [];
  for (const z of [-0.22, 0, 0.22]) {
    const l = new THREE.Mesh(SCARAB.leg, dark);
    l.position.set(0, 0.13, z);
    group.add(l); legs.push(l);
  }
  return {
    group, mats: [shell, dark, face, gold],
    animate(m) {
      for (let i = 0; i < 3; i++) legs[i].rotation.y = Math.sin(m.walk * 1.6 + i * 2.1) * 0.4;
      body.position.y = 0.3 + Math.abs(Math.sin(m.walk * 3)) * 0.03;
    },
  };
}

/* ---------- Kwiksand: de vloer wordt een paar tellen drijfzand ---------- */
function makePit(info, x, z, r, dur) {
  const w = info.world, F = DF;
  let n = 0;
  for (let bz = Math.floor(z - r); bz <= Math.floor(z + r); bz++) {
    for (let bx = Math.floor(x - r); bx <= Math.floor(x + r); bx++) {
      if (Math.hypot(bx + 0.5 - x, bz + 0.5 - z) > r) continue;
      if (Math.hypot(bx + 0.5 - AC.x, bz + 0.5 - AC.z) > AR - 0.6) continue;
      const id = w.get(bx, F, bz);
      const above = w.get(bx, F + 1, bz);
      if (!PIT_OK[id] || (above !== B.AIR && above !== B.DEAD_BUSH)) continue;
      if (above === B.DEAD_BUSH) w.set(bx, F + 1, bz, B.AIR);
      w.set(bx, F, bz, QS);
      info.pits.push({ x: bx, z: bz, id, t: dur + Math.random() * 0.5 });
      if (n++ % 2 === 0) FX.blockBreak(bx, F, bz, B.SAND);
    }
  }
}

/* ---------- De Zandfarao ---------- */
class SandPharaoh extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Zandfarao', ref: 'de Zandfarao', hp: 520, hw: 0.95, h: 4.2, deathTiles: [T.SAND, T.GOLD, T.DESERT_LAPIS], wakeRange: 12.5 });
    this.anim = { lx: -1.25, lz: -0.62, rx: -1.25, rz: -0.62, legL: 0, legR: 0, lean: 0.06, head: 0.3, crouch: 0, tilt: 0, eye: 0.3 };
    this.bag = [];
    this.wind = 1;
    this.beamN = 0;
    this.aimYaw = 0;
    this.chargeT = 0;
  }

  buildModel() {
    if (!DTEX.bandage) buildDesertTextures();
    const bandage = new THREE.MeshLambertMaterial({ map: DTEX.bandage });
    const face = new THREE.MeshLambertMaterial({ map: DTEX.face, emissive: 0xffffff, emissiveMap: DTEX.faceGlow, emissiveIntensity: 0.3 });
    const nemes = new THREE.MeshLambertMaterial({ map: DTEX.nemes });
    const gold = new THREE.MeshLambertMaterial({ map: DTEX.gold, emissive: 0x3a2600 });
    const collar = new THREE.MeshLambertMaterial({ map: DTEX.collar });
    const kilt = new THREE.MeshLambertMaterial({ map: DTEX.kilt });
    const gem = new THREE.MeshBasicMaterial({ color: 0x5ff0dc });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    // benen en rok
    const legs = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.38, 1.3, 0);
      p.add(bossBox(0.58, 1.32, 0.6, bandage, -0.66));
      inner.add(p);
      legs.push(p);
    }
    inner.add(bossBox(1.5, 0.72, 0.9, kilt, 1.38));
    const torso = new THREE.Group();
    torso.position.y = 1.62;
    inner.add(torso);
    torso.add(bossBox(1.56, 0.2, 0.98, gold, 0.02));
    torso.add(bossBox(1.42, 1.36, 0.8, bandage, 0.7));
    torso.add(bossBox(1.62, 0.46, 0.92, collar, 1.18));
    // armen
    const arms = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.96, 1.28, 0);
      p.add(bossBox(0.42, 1.36, 0.42, bandage, -0.62));
      p.add(bossBox(0.5, 0.18, 0.5, gold, -1.0));
      torso.add(p);
      arms.push(p);
    }
    // gouden staf met een ankh en een turquoise steen
    const staff = new THREE.Group();
    staff.position.set(0, -1.22, 0.26);
    arms[1].add(staff);
    staff.add(bossBox(0.13, 3.9, 0.13, gold, 0.3));
    staff.add(bossBox(0.64, 0.12, 0.12, gold, 2.3));
    for (const sx of [-1, 1]) staff.add(bossBox(0.11, 0.48, 0.11, gold, 2.58, sx * 0.2));
    staff.add(bossBox(0.5, 0.11, 0.11, gold, 2.83));
    const gemMesh = bossBox(0.24, 0.24, 0.24, gem, 2.57);
    staff.add(gemMesh);
    // hoofd met gestreepte hoofddoek, cobra en baard
    const head = new THREE.Group();
    head.position.set(0, 1.38, 0.04);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.88, 0.84).translate(0, 0.44, 0), [bandage, bandage, bandage, bandage, face, bandage]));
    head.add(bossBox(1.06, 0.38, 1.0, nemes, 0.98, 0, -0.04));
    for (const sx of [-1, 1]) head.add(bossBox(0.24, 1.05, 0.3, nemes, 0.32, sx * 0.56, 0.16));
    head.add(bossBox(0.96, 1.0, 0.24, nemes, 0.38, 0, -0.5));
    head.add(bossBox(0.13, 0.3, 0.12, gold, 0.98, 0, 0.47));
    head.add(bossBox(0.2, 0.38, 0.18, nemes, -0.12, 0, 0.33));
    // losse windsels die in fase 2 wapperen
    const strips = [];
    for (const [px, py, pz, parent] of [[-0.3, 0.6, -0.42, torso], [0.35, 0.25, -0.42, torso], [0.12, -0.55, -0.23, arms[0]]]) {
      const s = new THREE.Group();
      s.position.set(px, py, pz);
      s.add(bossBox(0.2, 0.9, 0.04, bandage, -0.45));
      parent.add(s);
      strips.push(s);
    }
    return { group, inner, legs, torso, arms, head, staff, gemMesh, strips, gem, face, mats: [bandage, face, nemes, gold, collar, kilt] };
  }

  /* --- gedrag --- */
  onWake() { this.model.face.emissiveIntensity = 2.5; }
  onGoHome() { this.beamN = 0; this.noSteer = false; }

  onEnrage() {
    // zandstorm: hij roept de storm op en daarna komen er scarabeeën
    this.beamN = 0;
    this.setState('stormCall');
    SND.play('wind', { vol: 1 });
  }

  enragedFx() {
    const a = Math.random() * Math.PI * 2, r = 1.3 + Math.random() * 0.5;
    const c = 0.8 + Math.random() * 0.15;
    FX.debris.spawn(this.pos.x + Math.cos(a) * r, this.pos.y + Math.random() * 3.8, this.pos.z + Math.sin(a) * r,
      -Math.sin(a) * 3, 0.8, Math.cos(a) * 3, c, c * 0.8, c * 0.5, 0.7, -0.5, 0.3);
  }

  // Hij zakt nooit weg in zijn eigen drijfzand
  groundMove(dt, speed) {
    const fy = this.info.floorY;
    if (this.pos.y <= fy + 0.02 && this.vel.y <= 0) { this.pos.y = Math.max(this.pos.y, fy); this.vel.y = GRAVITY * dt; }
    super.groundMove(dt, speed);
    if (this.pos.y < fy && this.pos.y > fy - 1.5) { this.pos.y = fy; this.vel.y = 0; }
  }

  gemPos(v) {
    this.model.gemMesh.getWorldPosition(v);
    return v;
  }

  scarabCount() { return game.minions.filter((m) => !m.dead && m.name === 'Scarabee').length; }
  tornadoAlive() { return game.hazards.some((h) => !h.dead && h instanceof SandTornado); }

  think(dt, c) {
    const ph2 = this.enraged;
    let speed = 0;
    switch (this.state) {
      case 'chase':
        this.turnTo(c.targetYaw, dt, ph2 ? 3.6 : 2.8);
        if (c.dist > 3.2) speed = ph2 ? 2.75 : 2.15;
        this.attackCD -= dt;
        if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
        break;
      case 'slamWind':
        if (this.t > this.wind) this.setState('slam');
        break;
      case 'slam':
        if (this.t > 0.35) this.setState('recover', ph2 ? 0.5 : 0.85);
        break;
      case 'sandWind':
        this.turnTo(c.targetYaw, dt, 3);
        this.chargeFx(dt, 0.95, 0.75, 0.4);
        if (this.t > this.wind) { this.castQuicksand(c.p); this.setState('recover', ph2 ? 0.5 : 0.8); }
        break;
      case 'tornadoWind':
        this.chargeFx(dt, 0.95, 0.8, 0.5);
        if (this.t > this.wind) { this.spawnTornadoes(); this.setState('recover', 0.6); }
        break;
      case 'scarabWind':
        this.turnTo(c.targetYaw, dt, 2);
        if (this.t > this.wind * 0.75 && !this.didHit) {
          this.didHit = true;
          SND.play('slam', { at: this.pos, range: 40, vol: 0.7 });
          game.shake = Math.max(game.shake, 0.3);
          FX.ring(this.pos.x, this.pos.y, this.pos.z, 2.2, [0.9, 0.75, 0.45]);
        }
        if (this.t > this.wind) this.setState('recover', 0.6);
        break;
      case 'beamWind':
        this.turnTo(this.aimYaw, dt, 8);
        this.chargeFx(dt, 1, 0.85, 0.3);
        if (this.t > this.wind) {
          if (ph2 && this.beamN < 1 && !c.p.dead) { this.beamN++; this.wind = 0.8; this.startBeam(); }
          else { this.beamN = 0; this.setState('recover', 0.8); }
        }
        break;
      case 'orbWind':
        this.turnTo(c.targetYaw, dt, 4);
        this.chargeFx(dt, 0.95, 0.75, 0.4);
        if (this.t > this.wind) { this.throwOrb(); this.setState('recover', 0.6); }
        break;
      case 'stormCall':
        this.chargeFx(dt, 0.95, 0.75, 0.4);
        if (this.t > 1.3) this.startScarabs(true);
        break;
      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph2 ? 0.9 + Math.random() * 0.6 : 1.6 + Math.random() * 0.9;
        }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  pickAttack(c) {
    const ph2 = this.enraged;
    // staat de speler hoog (op de piramide of een toren)? dan een zandbal
    if (c.p.pos.y > this.info.floorY + 2.4) { this.wind = 0.75; this.setState('orbWind'); return; }
    if (c.dist < 4.3 && Math.random() < 0.7) { this.startSlam(); return; }
    if (!this.bag.length) {
      this.bag = ['sand', 'tornado', 'scarab', 'beam'];
      for (let i = this.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = this.bag[i]; this.bag[i] = this.bag[j]; this.bag[j] = t; }
    }
    let pick = null;
    for (let i = 0; i < this.bag.length; i++) {
      const k = this.bag[i];
      if (k === 'tornado' && this.tornadoAlive()) continue;
      if (k === 'scarab' && this.scarabCount() >= (ph2 ? 3 : 2)) continue;
      pick = k; this.bag.splice(i, 1); break;
    }
    if (!pick) pick = 'beam';
    if (pick === 'sand') { this.wind = ph2 ? 0.65 : 0.8; this.setState('sandWind'); SND.play('wind', { at: this.pos, range: 40, vol: 0.6 }); }
    else if (pick === 'tornado') this.startTornado();
    else if (pick === 'scarab') this.startScarabs(false);
    else { this.wind = ph2 ? 0.8 : 1.0; this.startBeam(); }
  }

  // Deeltjes die naar de steen van de staf toe vliegen
  chargeFx(dt, r, g, b) {
    this.chargeT += dt * 30;
    if (this.chargeT < 1) return;
    this.chargeT = 0;
    const gp = this.gemPos(TMP.a);
    for (let i = 0; i < 2; i++) {
      const ox = (Math.random() - 0.5) * 2.4, oy = (Math.random() - 0.5) * 2.4, oz = (Math.random() - 0.5) * 2.4;
      FX.glow.spawn(gp.x + ox, gp.y + oy, gp.z + oz, -ox * 2.6, -oy * 2.6, -oz * 2.6, r, g, b, 0.38, 0, 0);
    }
  }

  // 1. Stafslag vlakbij: gele cirkel voor hem, dan een schokgolf
  startSlam() {
    const ph2 = this.enraged;
    this.wind = ph2 ? 0.7 : 0.85;
    this.setState('slamWind');
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    game.addHazard(new GroundHazard({
      x: this.pos.x + fx * 1.7, y: this.info.floorY, z: this.pos.z + fz * 1.7, radius: 2.8, warn: this.wind + 0.05, linger: 0.3,
      color: 0xffc040, dmg: this.dmg(10), type: 'boss',
      onTrigger: (h) => {
        FX.ring(h.x, h.y, h.z, 2.8, [1, 0.85, 0.4]);
        FX.ring(h.x, h.y, h.z, 1.6, [0.9, 0.75, 0.45]);
        SND.play('slam', { at: h, range: 40 });
        game.shake = Math.max(game.shake, 0.6);
        if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'boss', 9, 6);
      },
    }));
  }

  // 2. Drijfzand: cirkels op en rond de speler worden drijfzand
  castQuicksand(p) {
    const ph2 = this.enraged, n = ph2 ? 5 : 3, fy = this.info.floorY;
    const spots = [{ x: p.pos.x + p.vel.x * 0.45, z: p.pos.z + p.vel.z * 0.45 }];
    for (let tries = 0; spots.length < n && tries < 40; tries++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 2.8;
      const s = { x: p.pos.x + Math.cos(a) * r, z: p.pos.z + Math.sin(a) * r };
      if (spots.some((o) => Math.hypot(o.x - s.x, o.z - s.z) < 3.2)) continue;
      spots.push(s);
    }
    const dur = ph2 ? 6 : 5;
    for (const s of spots) {
      const dx = s.x - AC.x, dz = s.z - AC.z, d = Math.hypot(dx, dz);
      if (d > AR - 2.2) { s.x = AC.x + dx / d * (AR - 2.2); s.z = AC.z + dz / d * (AR - 2.2); }
      game.addHazard(new GroundHazard({
        x: s.x, y: fy, z: s.z, radius: 1.7, warn: ph2 ? 1.0 : 1.2, linger: 0.4, color: 0xb0600c,
        dmg: this.dmg(6), type: 'quicksand',
        onTrigger: (h) => {
          makePit(this.info, h.x, h.z, 1.7, dur);
          SND.play('dig', { at: h, range: 30 });
          if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'quicksand', 1, 2);
        },
      }));
    }
    SND.play('whoosh', { at: this.pos, range: 40, vol: 0.7 });
  }

  // 3. Zandhoos: eerst een cirkel waar hij ontstaat
  startTornado() {
    const ph2 = this.enraged;
    this.wind = ph2 ? 0.85 : 1.0;
    this.setState('tornadoWind');
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    this.tSpots = ph2 ? [[fx * 1.5 + rx * 3.2, fz * 1.5 + rz * 3.2], [fx * 1.5 - rx * 3.2, fz * 1.5 - rz * 3.2]] : [[fx * 2.8, fz * 2.8]];
    this.tSpots = this.tSpots.map(([ox, oz]) => ({ x: this.pos.x + ox, z: this.pos.z + oz }));
    for (const s of this.tSpots) {
      game.addHazard(new GroundHazard({ x: s.x, y: this.info.floorY, z: s.z, radius: 1.3, warn: this.wind, linger: 0.2, color: 0xe0a040, onTrigger: () => {} }));
    }
    SND.play('wind', { at: this.pos, range: 40, vol: 0.9 });
  }

  spawnTornadoes() {
    const ph2 = this.enraged;
    for (const s of this.tSpots || []) {
      game.addHazard(new SandTornado(this, s.x, s.z, ph2 ? 6.5 : 6, ph2 ? 2.5 : 2.2));
    }
    SND.play('whoosh', { at: this.pos, range: 40 });
  }

  // 4. Scarabeeën: zand spuit op uit de grond, dan kruipen ze eruit
  startScarabs(storm) {
    const ph2 = this.enraged;
    this.wind = 0.9;
    this.setState('scarabWind');
    let n = storm ? 4 : 3;
    n = Math.min(n, (ph2 ? 5 : 3) - this.scarabCount());
    for (let i = 0; i < n; i++) {
      const a = this.yaw + (i - (n - 1) / 2) * 0.75, r = 2.6 + Math.random() * 0.6;
      let x = this.pos.x + Math.sin(a) * r, z = this.pos.z + Math.cos(a) * r;
      const dx = x - AC.x, dz = z - AC.z, d = Math.hypot(dx, dz);
      if (d > AR - 1.5) { x = AC.x + dx / d * (AR - 1.5); z = AC.z + dz / d * (AR - 1.5); }
      const fy = this.info.floorY;
      game.addHazard(new GroundHazard({
        x, y: fy, z, radius: 0.75, warn: this.wind, linger: 0.2, color: 0x2a9a90,
        onTrigger: (h) => {
          const m = new Minion(this.world, h.x, fy + 0.05, h.z, {
            name: 'Scarabee', hp: 10, speed: this.enraged ? 3.4 : 3.0, dmg: 3, hw: 0.32, h: 0.5, life: 15,
            color: [0.2, 0.55, 0.6], model: scarabModel,
          });
          game.addMinion(m);
          for (let k = 0; k < 10; k++) FX.debris.spawn(h.x, fy + 0.2, h.z, (Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3, 0.88, 0.72, 0.46, 0.7, 14, 0.5, true);
          SND.play('pop', { at: h, range: 30, vol: 0.6 });
        },
      }));
    }
    if (storm) HUD.actionbar('Een zandstorm! Pas op voor de scarabeeën!', 2.5);
  }

  // 5. Gouden straal: een baan naar de speler, dan schiet hij
  startBeam() {
    const p = player, fy = this.info.floorY;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    const ux = dx / d, uz = dz / d;
    this.aimYaw = Math.atan2(dx, dz);
    this.setState('beamWind');
    game.addHazard(new LaneHazard({
      x0: this.pos.x + ux * 1.0, z0: this.pos.z + uz * 1.0, x1: this.pos.x + ux * 24, z1: this.pos.z + uz * 24, y: fy,
      width: 2.0, warn: this.wind, linger: 0.35, color: 0xffc830, dmg: this.dmg(11), type: 'beam',
      onTrigger: (h) => this.fireBeam(h),
    }));
    SND.play('zap', { at: this.pos, range: 40, vol: 0.5 });
  }

  fireBeam(h) {
    if (!this.alive()) return;
    const w = this.world, fy = this.info.floorY;
    // de straal stopt bij een obelisk of muur
    let len = h.len;
    for (let s = 0.5; s < h.len; s += 0.35) {
      const x = Math.floor(h.x0 + h.dirX * s), z = Math.floor(h.z0 + h.dirZ * s);
      if (w.solidAt(x, Math.floor(fy + 0.6), z) && w.solidAt(x, Math.floor(fy + 1.4), z)) { len = s; break; }
    }
    const p = player;
    const t = (p.pos.x - h.x0) * h.dirX + (p.pos.z - h.z0) * h.dirZ;
    if (h.playerInside() && t < len + 0.4) damagePlayer(h.dmg, { x: p.pos.x - h.dirX, y: fy, z: p.pos.z - h.dirZ }, 'beam', 8, 5);
    const from = this.gemPos(TMP.a).clone();
    const to = TMP.b.set(h.x0 + h.dirX * len, fy + 0.7, h.z0 + h.dirZ * len);
    game.addHazard(new BeamFx(from, to));
    for (let s = 0; s < len; s += 0.6) {
      FX.glow.spawn(h.x0 + h.dirX * s + (Math.random() - 0.5) * 0.6, fy + 0.4 + Math.random() * 1.2, h.z0 + h.dirZ * s + (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 1.5, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5, 1, 0.85, 0.35, 0.5, 0, 0.5);
    }
    FX.explosion(to.x, to.y, to.z, 0.5);
    SND.play('zap', { at: this.pos, range: 50, vol: 1 });
    SND.play('explode', { at: to, range: 30, vol: 0.4 });
    game.shake = Math.max(game.shake, 0.25);
  }

  // Zandbal (alleen als de speler ergens hoog staat)
  throwOrb() {
    if (!DTEX.orbGeo) {
      DTEX.orbGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6); DTEX.orbGeo.userShared = true;
      DTEX.orbMat = new THREE.MeshLambertMaterial({ map: DTEX.sand, emissive: 0x402a10 });
    }
    const o = this.gemPos(TMP.a).clone();
    const p = player;
    const dir = new THREE.Vector3(p.pos.x - o.x, p.pos.y + 1 - o.y, p.pos.z - o.z).normalize();
    game.addProjectile(new Projectile({
      pos: o, vel: dir.multiplyScalar(10), owner: 'boss', type: 'sandball', dmg: this.dmg(8), destroyable: true, homing: 1.2,
      radius: 0.35, knock: 5, life: 5, mesh: new THREE.Mesh(DTEX.orbGeo, DTEX.orbMat),
      trail: (pr) => { if (Math.random() < 0.7) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, 0, 0, 0.88, 0.72, 0.46, 0.5, 4, 0); },
      explodeFx: (pr) => { for (let i = 0; i < 14; i++) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5, 0.88, 0.72, 0.46, 0.8, 14, 0.5, true); },
    }));
    SND.play('shoot', { at: o, range: 40, vol: 0.7 });
  }

  die() {
    super.die();
    const info = this.info;
    // drijfzand verdwijnt, de piramidepoort gaat open
    info.pits.forEach((q, i) => { q.t = Math.min(q.t, 0.4 + i * 0.02); });
    info.gateT = 3.2;
    info.gateI = 0;
  }

  animate(dt, speed) {
    const a = this.anim, ph2 = this.enraged;
    this.walkPhase += dt * speed * 2.1;
    const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.5;
    // standaard: mummiegang met de linkerarm vooruit
    let lx = -1.45 + sw * 0.12, lz = 0.06, rx = -0.25 - sw * 0.45, rz = 0.1, legL = sw, legR = -sw;
    let lean = 0.08, head = 0, crouch = 0, tilt = 0, eye = ph2 ? 1.9 : 1.1, rate = 9, spin = false;
    switch (this.state) {
      case 'sleep': case 'idle':
        lx = -1.25; lz = -0.62; rx = -1.25; rz = -0.62; legL = 0; legR = 0; lean = 0.06; eye = 0.3;
        head = 0.3 + (this.state === 'sleep' ? Math.sin(game.time * 1.1) * 0.04 : 0);
        break;
      case 'roar': lx = -0.6; lz = 1.15; rx = -2.7; rz = 0.35; head = -0.45; lean = -0.15; eye = 2.8; rate = 6; break;
      case 'slamWind': {
        const k = easeOut(clamp(this.t / this.wind, 0, 1));
        rx = -2.9 * k; lx = -2.6 * k; lz = 0.2; rz = 0.2; lean = -0.2 * k; crouch = -0.12 * k; head = -0.25; eye = 2.3; rate = 12;
        break;
      }
      case 'slam': rx = -0.75; lx = -0.75; rz = 0.1; lz = 0.1; lean = 0.45; crouch = 0.25; head = 0.1; eye = 2.3; rate = 24; break;
      case 'sandWind': rx = -2.95; rz = 0.15; lx = -1.0; lz = 0.95; head = -0.3; eye = 2.5; rate = 8; break;
      case 'tornadoWind': rx = -3.0; rz = -0.1; lx = -0.7; lz = 1.25; head = -0.35; eye = 2.5; spin = true; rate = 8; break;
      case 'scarabWind':
        if (this.t < this.wind * 0.75) { rx = -2.8; lx = -2.7; lz = 0.3; rz = 0.3; lean = -0.15; head = -0.3; rate = 9; }
        else { rx = -0.55; lx = -0.55; lean = 0.4; crouch = 0.2; rate = 22; }
        eye = 2.3;
        break;
      case 'beamWind': rx = -1.5; rz = 0.04; tilt = 1.9; lx = -0.4; lz = 0.7; lean = -0.04; head = -0.05; eye = 3; rate = 12; break;
      case 'orbWind': rx = -2.6; rz = 0.2; lx = -0.5; lz = 0.6; lean = -0.2; eye = 2.5; rate = 10; break;
      case 'stormCall': lx = -2.6; lz = 0.7; rx = -2.9; rz = -0.5; head = -0.55; lean = -0.2; eye = 3.2; spin = true; rate = 6; break;
      case 'recover': lx = -0.9; lz = 0.15; rx = -0.3; rz = 0.12; lean = 0.22; head = 0.2; rate = 6; break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.lx += (lx - a.lx) * k; a.lz += (lz - a.lz) * k;
    a.rx += (rx - a.rx) * k; a.rz += (rz - a.rz) * k;
    a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
    a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
    a.lean += (lean - a.lean) * k; a.head += (head - a.head) * k;
    a.crouch += (crouch - a.crouch) * k; a.tilt += (tilt - a.tilt) * k;
    a.eye += (eye - a.eye) * Math.min(1, dt * 6);
    const m = this.model;
    m.arms[0].rotation.x = a.lx; m.arms[0].rotation.z = -a.lz;
    m.arms[1].rotation.x = a.rx; m.arms[1].rotation.z = a.rz;
    // de staf blijft rechtop (of wijst vooruit bij de straal)
    m.staff.rotation.x = -a.rx + a.tilt;
    m.staff.rotation.y = spin ? m.staff.rotation.y + dt * 14 : m.staff.rotation.y * Math.max(0, 1 - dt * 8);
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head;
    m.inner.position.y = -a.crouch;
    m.face.emissiveIntensity = a.eye;
    const pulse = a.eye > 2 ? 0.75 + Math.sin(game.time * 20) * 0.25 : 1;
    m.gem.color.setRGB(ph2 ? 1 * pulse : 0.37 * pulse, ph2 ? 0.75 * pulse : 0.94 * pulse, ph2 ? 0.3 * pulse : 0.86 * pulse);
    for (let i = 0; i < m.strips.length; i++) {
      m.strips[i].visible = ph2 || i < 2;
      m.strips[i].rotation.x = ph2 ? -0.5 - Math.sin(game.time * 9 + i * 1.7) * 0.45 : 0.1 + Math.sin(game.time * 2 + i) * 0.05;
    }
  }
}

/* ---------- Zonsondergang: eigen lucht met een lage oranje zon ---------- */
function addSunsetSky(info) {
  if (!DTEX.skyGeo) {
    const geo = new THREE.SphereGeometry(150, 24, 12);
    const pos = geo.attributes.position, cols = [];
    const stops = [[-1, 0xe8965e], [0, 0xf2a35c], [0.1, 0xee8a56], [0.3, 0xc0606a], [0.62, 0x5c4a88], [1, 0x2c2858]];
    const ca = new THREE.Color(), cb = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) / 150;
      let j = 0;
      while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
      const k = clamp((t - stops[j][0]) / (stops[j + 1][0] - stops[j][0]), 0, 1);
      ca.setHex(stops[j][1]).lerp(cb.setHex(stops[j + 1][1]), k);
      cols.push(ca.r, ca.g, ca.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.userShared = true;
    DTEX.skyGeo = geo;
    DTEX.sunGeo = new THREE.PlaneGeometry(34, 34);
    DTEX.sunGeo.userShared = true;
  }
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true });
  const dome = new THREE.Mesh(DTEX.skyGeo, mat);
  dome.renderOrder = -10;
  group.add(dome);
  const sunMat = new THREE.MeshBasicMaterial({ map: Tex.sun, color: 0xffb070, transparent: true, fog: false, depthWrite: false });
  const sun = new THREE.Mesh(DTEX.sunGeo, sunMat);
  sun.renderOrder = -9;
  sun.position.set(-0.6, 0.14, -0.78).normalize().multiplyScalar(135);
  sun.lookAt(0, 0, 0);
  group.add(sun);
  group.frustumCulled = false;
  game.realmGroup.add(group);
  info.sky = group; info.skyMat = mat; info.sunMat = sunMat;
}

function desertAmbience(dt, info) {
  const p = player, w = info.world, F = DF;
  if (info.sky) info.sky.position.copy(game.camera.position);

  // drijfzand wordt weer gewone vloer
  for (let i = info.pits.length - 1; i >= 0; i--) {
    const q = info.pits[i];
    q.t -= dt;
    if (q.t > 0) continue;
    info.pits.splice(i, 1);
    const cur = w.get(q.x, F, q.z);
    if (cur === QS || cur === B.AIR) {
      w.set(q.x, F, q.z, q.id);
      if (Math.random() < 0.3) FX.blockBreak(q.x, F, q.z, B.SAND);
    }
  }

  // de piramidepoort zakt weg als de farao verslagen is
  if (info.gateT !== undefined && info.gateI < info.gate.length) {
    info.gateT -= dt;
    while (info.gateT <= 0 && info.gateI < info.gate.length) {
      const [x, y, z] = info.gate[info.gateI++];
      info.gateT += 0.12;
      if (w.get(x, y, z) === GATE) {
        w.set(x, y, z, B.AIR);
        FX.blockBreak(x, y, z, GATE);
        if (info.gateI % 3 === 0) SND.play('break', { at: { x, y, z }, range: 60, vol: 0.8 });
      }
      if (info.gateI === info.gate.length) {
        HUD.actionbar('De poort van de piramide is open!', 3);
        SND.play('portal', { vol: 0.4 });
      }
    }
  }

  // gouden glinstering bij de gebarsten muur
  if (PROG.phase === 'treasure' && info.crack && Math.random() < dt * 10) {
    const c = info.crack;
    FX.glow.spawn(c.x + (Math.random() - 0.5) * 2.4, c.y + (Math.random() - 0.5) * 1.6, c.z + (Math.random() - 0.5) * 2.4, 0, 0.6, 0, 1, 0.85, 0.3, 0.9, 0, 0);
  }

  // zandstorm in fase 2: dikke mist, minder lucht
  const boss = game.boss;
  const storm = boss && boss.alive() && boss.enraged ? 1 : 0;
  info.stormK += (storm - info.stormK) * Math.min(1, dt * 0.9);
  const k = info.stormK;
  if (game.fogNormal) {
    if (info.fogRef !== game.fogNormal) {
      info.fogRef = game.fogNormal;
      info.fogBase = { near: game.fogNormal.near, far: game.fogNormal.far, color: game.fogNormal.color.clone() };
    }
    const b = info.fogBase;
    game.fogNormal.near = lerp(b.near, 4, k);
    game.fogNormal.far = lerp(b.far, 34, k);
    game.fogNormal.color.copy(b.color).lerp(STORM_COL, k);
    if (game.scene.background && game.scene.background.isColor) game.scene.background.copy(game.fogNormal.color);
  }
  if (info.skyMat) { info.skyMat.opacity = 1 - k * 0.85; info.sunMat.opacity = 1 - k * 0.95; }

  // stuifzand (veel meer tijdens de storm)
  game.ashT += dt * (6 + k * 80);
  while (game.ashT > 1) {
    game.ashT -= 1;
    const x = p.pos.x + (Math.random() - 0.5) * 24 - 6 * k, y = p.pos.y + Math.random() * 5, z = p.pos.z + (Math.random() - 0.5) * 24;
    const c = 0.82 + Math.random() * 0.12;
    FX.debris.spawn(x, y, z, 1.5 + k * 9 + Math.random(), -0.3 + Math.random() * 0.4, 0.4 + k * 2, c, c * 0.8, c * 0.55, 3.5, 0, 0);
  }
  if (k > 0.5 && !p.dead && game.state === 'playing' && Math.random() < dt * 0.4) SND.play('wind', { vol: 0.4 });
}

registerRealm('desert', {
  gen: genDesert,
  makeBoss: (world, info) => new SandPharaoh(world, info),
  atmosphere: { background: 0xe8965e, fog: 0xe8965e, near: 30, far: 104, amb: 0xffe0c0, ambI: 0.82, dir: 0xffb070, dirI: 0.62, hand: 0xffe6cc },
  intro: 'De zon gaat onder boven de grote piramide. Daar slaapt de Zandfarao...',
  tip: 'Tip: spring uit het drijfzand en ren weg van de zandhozen!',
  treasureTip: 'De piramide is open! Ga naar binnen en zoek de gebarsten muur met de gouden rand. Sla hem kapot!',
  ambientSound: 0.3,
  ambience: desertAmbience,
  ruin: [B.SANDSTONE, SMOOTH, B.GOLD, CHISEL],
  onEnter(info) {
    if (typeof DEATH_REASONS !== 'undefined') {
      Object.assign(DEATH_REASONS, {
        quicksand: 'Weggezakt in het drijfzand',
        tornado: 'Meegesleurd door een zandhoos',
        beam: 'Geraakt door de gouden straal',
        sandball: 'Geraakt door een zandbal',
      });
    }
    addSunsetSky(info);
  },
});

// Voor testen en ontwikkelen
window.DESERT = { gen: genDesert, Boss: SandPharaoh, Tornado: SandTornado };
})();
