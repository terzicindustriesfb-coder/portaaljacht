'use strict';
/* Portaaljacht – wereld 14: De Leegte met De Leegtekoning (zwarte gaten, leegtestralen, poorten met handlangers, klonen en de grote nova) */
(() => {

/* ---------- Blokken ---------- */
defineTile('VOID_STONE', (h) => () => {
  const r = h.R();
  if (r < 0.05) return h.vary([96, 64, 140], 8);
  return h.vary(r < 0.35 ? [44, 38, 58] : r < 0.7 ? [52, 46, 68] : [60, 54, 78], 5);
});
defineTile('VOID_BRICKS', (h) => (x, y) => {
  const row = y >> 2, off = (row % 2) * 4;
  if (y % 4 === 3 || (x + off) % 8 === 7) return h.vary([30, 22, 44], 3);
  if (y % 4 === 0) return h.vary([74, 64, 96], 4);
  return h.vary([58, 50, 76], 5);
});
defineTile('VOID_CRYING', (h) => {
  const tears = new Set();
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(h.R() * 16), y0 = Math.floor(h.R() * 12), len = 2 + Math.floor(h.R() * 4);
    for (let k = 0; k < len; k++) tears.add(x + (y0 + k) * 16);
  }
  return (x, y) => {
    if (tears.has(x + y * 16)) return h.vary(h.R() < 0.4 ? [236, 150, 255] : [176, 76, 245], 10);
    const r = h.R();
    return h.vary(r < 0.2 ? [42, 22, 66] : r < 0.55 ? [28, 16, 44] : [20, 11, 32], 4);
  };
});
// rune op de vloer: een gloeiend teken
const RUNE_ART = [
  '................',
  '.##..........##.',
  '.#............#.',
  '......####......',
  '.....#....#.....',
  '....#..##..#....',
  '...#..#..#..#...',
  '...#.#....#.#...',
  '...#.#....#.#...',
  '...#..#..#..#...',
  '....#..##..#....',
  '.....#....#.....',
  '......####......',
  '.#............#.',
  '.##..........##.',
  '................',
];
defineTile('VOID_RUNE', (h) => (x, y) => (RUNE_ART[y][x] === '#' ? h.vary([200, 120, 255], 12) : h.vary(h.R() < 0.3 ? [40, 30, 60] : [32, 24, 48], 4)));
// het grote zegel boven de schatkamer (dof tijdens het gevecht, goud daarna)
const SEAL_ART = [
  '################',
  '#..............#',
  '#.####....####.#',
  '#.#..........#.#',
  '#.#...####...#.#',
  '#....#....#....#',
  '#...#..##..#...#',
  '#...#.#..#.#...#',
  '#...#.#..#.#...#',
  '#...#..##..#...#',
  '#....#....#....#',
  '#.#...####...#.#',
  '#.#..........#.#',
  '#.####....####.#',
  '#..............#',
  '################',
];
defineTile('VOID_SEAL_DIM', (h) => (x, y) => (SEAL_ART[y][x] === '#' ? h.vary([100, 60, 150], 8) : h.vary([26, 18, 40], 4)));
defineTile('VOID_SEAL_LIT', (h) => (x, y) => (SEAL_ART[y][x] === '#' ? h.vary(h.R() < 0.3 ? [255, 250, 210] : [255, 214, 90], 8) : h.vary([70, 40, 110], 6)));
defineTile('VOID_CRACKED', (h) => {
  const cells = [];
  for (let i = 0; i < 6; i++) cells.push([h.R() * 16, h.R() * 16]);
  return (x, y) => (h.voronoi(cells, x, y, 16).edge < 0.9 ? h.vary([230, 90, 255], 14) : h.vary([46, 38, 62], 5));
});
defineTile('VOID_VELVET', (h) => (x, y) => (x === 0 || y === 0 || x === 15 || y === 15 ? h.vary([70, 30, 110], 4) : h.vary((x + y) % 4 === 0 ? [130, 60, 190] : [112, 48, 168], 5)));
defineTile('VOID_LAMP', (h) => (x, y) => {
  const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
  if (d > 6.5) return h.vary([60, 30, 90], 5);
  return h.vary(d < 2.5 ? [255, 236, 255] : h.R() < 0.4 ? [230, 160, 255] : [190, 110, 250], 10);
});

defineBlock('VOID_STONE', { name: 'Leegtesteen', tiles: { top: T.VOID_STONE, bottom: T.VOID_STONE, side: T.VOID_STONE }, hard: 1.0 });
defineBlock('VOID_BRICKS', { name: 'Leegtestenen', tiles: { top: T.VOID_BRICKS, bottom: T.VOID_BRICKS, side: T.VOID_BRICKS }, hard: 1.2 });
defineBlock('VOID_CRYING', { name: 'Huilend obsidiaan', tiles: { top: T.VOID_CRYING, bottom: T.VOID_CRYING, side: T.VOID_CRYING }, hard: Infinity, glow: true });
defineBlock('VOID_RUNE', { name: 'Leegterune', tiles: { top: T.VOID_RUNE, bottom: T.VOID_STONE, side: T.VOID_STONE }, hard: 1.0, glow: true });
defineBlock('VOID_SEAL_LOCKED', { name: 'Verzegelde rune', tiles: { top: T.VOID_SEAL_DIM, bottom: T.VOID_STONE, side: T.VOID_STONE }, hard: Infinity });
defineBlock('VOID_SEAL', { name: 'Gouden rune', tiles: { top: T.VOID_SEAL_LIT, bottom: T.VOID_SEAL_LIT, side: T.VOID_SEAL_LIT }, hard: 0.45, glow: true, sound: 'glass' });
defineBlock('VOID_CRACKED', { name: 'Gebarsten leegtesteen', tiles: { top: T.VOID_CRACKED, bottom: T.VOID_CRACKED, side: T.VOID_CRACKED }, hard: 0.3, glow: true });
defineBlock('VOID_VELVET', { name: 'Paars fluweel', tiles: { top: T.VOID_VELVET, bottom: T.VOID_VELVET, side: T.VOID_VELVET }, hard: 0.5, soft: true, sound: 'snow' });
defineBlock('VOID_LAMP', { name: 'Leegtelamp', tiles: { top: T.VOID_LAMP, bottom: T.VOID_LAMP, side: T.VOID_LAMP }, hard: 0.3, glow: true, sound: 'glass' });

/* ---------- De wereld: een zwevend platform in de sterrenleegte ---------- */
const S = 72, H = 40, C = 36, F = 20;

function genVoid(seed) {
  const w = new World('realm', S, H, S);
  w.skyShade = false;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand);
  const ori = Math.floor(rand() * 4);
  // lokaal (portaal ligt op -z) -> wereld, als verschuiving vanaf het middenblok
  const rot = (lx, lz) => (ori === 0 ? [lx, lz] : ori === 1 ? [-lz, lx] : ori === 2 ? [-lx, -lz] : [lz, -lx]);
  const cx = C + 0.5, cz = C + 0.5;
  const pd = rot(0, -1);
  const portalAng = Math.atan2(pd[1], pd[0]);
  const edgeR = (a) => 17.4 + n1.noise(Math.cos(a) * 1.7 + 7.3, Math.sin(a) * 1.7 + 3.1) * 2.4;

  const rimA = [], rimB = [];
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x - C, dz = z - C;
      const d = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
      const R = edgeR(a);
      if (d > R) continue;
      const k = 1 - d / R;
      const bottom = F - Math.round(1 + Math.pow(k, 0.7) * 12 + n2.noise(x / 4.3, z / 4.3) * 2.5);
      for (let y = bottom; y < F; y++) w.setRaw(x, y, z, y < F - 2 && rand() < 0.07 ? B.VOID_CRYING : B.VOID_STONE);
      // vloer
      let top;
      const ad = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
      if (ad) top = B.VOID_SEAL_LOCKED;
      else if (d >= 4.4 && d < 5.4) top = B.VOID_RUNE;
      else if ((dx === 0 || dz === 0) && d >= 2 && d < 4.4) top = B.VOID_RUNE;          // runen wijzen naar het zegel
      else if (d < 8.6) top = B.VOID_BRICKS;
      else if (d >= 8.6 && d < 9.5 && Math.floor((a + Math.PI) / (Math.PI / 16)) % 2 === 0) top = B.VOID_RUNE;
      else { const r = rand(); top = r < 0.1 ? B.VOID_BRICKS : r < 0.13 ? B.VOID_CRYING : B.VOID_STONE; }
      w.setRaw(x, F, z, top);
      // druppels onder het platform
      if (rand() < 0.05) { const len = 1 + Math.floor(rand() * 4); for (let i = 1; i <= len; i++) w.setRaw(x, bottom - i, z, i === len && rand() < 0.4 ? B.VOID_LAMP : B.VOID_CRYING); }
      // rand die tijdens het gevecht afbrokkelt (nooit bij het portaal)
      const nearPortal = Math.abs(angleDiff(a, portalAng)) < 0.62;
      if (!nearPortal && d > 16.2) rimA.push({ x, z, bottom, d });
      else if (!nearPortal && d > 14.9) rimB.push({ x, z, bottom, d });
    }
  }

  // Ring van huilende obsidiaan pilaren met lampen
  const pillars = [];
  for (let i = 0; i < 8; i++) {
    const a = portalAng + (i + 0.5) * Math.PI / 4;
    const px = Math.round(cx + Math.cos(a) * 12.5 - 1), pz = Math.round(cz + Math.sin(a) * 12.5 - 1);
    const ph = 6 + Math.floor(rand() * 4);
    for (let y = F + 1; y <= F + ph; y++) {
      for (let ddz = 0; ddz < 2; ddz++) for (let ddx = 0; ddx < 2; ddx++) {
        const band = y === F + 1 || y === F + ph;
        w.setRaw(px + ddx, y, pz + ddz, band ? B.VOID_BRICKS : B.VOID_CRYING);
      }
    }
    w.setRaw(px, F + ph + 1, pz, B.VOID_LAMP); w.setRaw(px + 1, F + ph + 1, pz + 1, B.VOID_LAMP);
    w.setRaw(px + 1, F + ph + 1, pz, B.VOID_CRYING); w.setRaw(px, F + ph + 1, pz + 1, B.VOID_CRYING);
    w.setRaw(px, F + ph + 2, pz, B.VOID_LAMP);
    pillars.push({ x: px + 1, z: pz + 1, top: F + ph + 2 });
  }

  // Zwevende eilandjes in de verte (versiering)
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, r = 23 + rand() * 9;
    const ix = Math.round(cx + Math.cos(a) * r), iz = Math.round(cz + Math.sin(a) * r);
    const iy = F - 8 + Math.floor(rand() * 18), rr = 1.5 + rand() * 2.2;
    for (let ddz = -4; ddz <= 4; ddz++) for (let ddx = -4; ddx <= 4; ddx++) {
      const x = ix + ddx, z = iz + ddz;
      if (x < 1 || z < 1 || x > S - 2 || z > S - 2) continue;
      const dd = Math.hypot(ddx, ddz);
      if (dd > rr) continue;
      const depth = Math.round((rr - dd) * 1.6) + 1;
      for (let y = iy - depth; y <= iy; y++) w.setRaw(x, y, z, y === iy && rand() < 0.25 ? B.VOID_CRYING : B.VOID_STONE);
    }
    if (ix > 1 && iz > 1 && ix < S - 2 && iz < S - 2) { w.setRaw(ix, iy + 1, iz, B.VOID_CRYING); w.setRaw(ix, iy + 2, iz, B.VOID_LAMP); }
  }

  // De schatkamer onder het zegel, met een trap van fluweel terug naar boven
  for (let y = F - 5; y <= F - 1; y++) {
    for (let z = C - 4; z <= C + 4; z++) for (let x = C - 4; x <= C + 4; x++) {
      const edge = Math.abs(x - C) === 4 || Math.abs(z - C) === 4;
      w.setRaw(x, y, z, y === F - 5 ? (edge ? B.VOID_BRICKS : B.VOID_VELVET) : edge ? B.VOID_BRICKS : B.AIR);
    }
  }
  const stairs = [[C + 2, F - 4], [C + 1, F - 3], [C, F - 2], [C - 1, F - 1]];
  for (const [x, top] of stairs) for (let y = F - 4; y <= top; y++) w.setRaw(x, y, C, B.VOID_VELVET);
  for (const [x, z] of [[C + 4, C - 2], [C + 4, C + 2], [C - 4, C - 2], [C - 4, C + 2], [C - 2, C + 4], [C + 2, C + 4], [C - 2, C - 4], [C + 2, C - 4]]) w.setRaw(x, F - 2, z, B.VOID_LAMP);
  const tx = C - 2, ty = F - 4, tz = C + 2;
  w.setRaw(tx, ty, tz, B.CHEST);
  w.setRaw(tx - 1, ty, tz + 1, B.GOLD); w.setRaw(tx - 1, ty, tz, B.GOLD); w.setRaw(tx, ty, tz + 1, B.GOLD);
  w.setRaw(tx - 1, ty + 1, tz + 1, B.VOID_LAMP);
  const seal = [];
  for (let z = C - 1; z <= C + 1; z++) for (let x = C - 1; x <= C + 1; x++) seal.push([x, F, z]);

  // Aankomstportaal aan de rand
  const pBlocks = [];
  for (let lx = -2; lx <= 3; lx++) for (let lz = -16; lz <= -14; lz++) { const [ox, oz] = rot(lx, lz); w.setRaw(C + ox, F, C + oz, B.OBSIDIAN); }
  for (let lx = -1; lx <= 2; lx++) {
    const [ox, oz] = rot(lx, -15);
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = lx === -1 || lx === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + ox, y, C + oz, frame ? B.OBSIDIAN : B.PORTAL);
      if (!frame) pBlocks.push([C + ox, y, C + oz]);
    }
    w.setRaw(C + ox, F + 6, C + oz, lx === 0 || lx === 1 ? B.VOID_CRYING : B.AIR);
  }
  w.portalAxis = ori % 2 === 0 ? 'x' : 'z';
  let pcx = 0, pcz = 0;
  for (const b of pBlocks) { pcx += b[0] + 0.5; pcz += b[2] + 0.5; }
  pcx /= pBlocks.length; pcz /= pBlocks.length;

  w.computeTops();
  const sp = rot(0.5, -12.5);
  const spawn = { x: cx + sp[0], y: F + 1, z: cz + sp[1] };
  const bs = rot(0, 2.5);
  return {
    world: w,
    spawn,
    spawnYaw: Math.atan2(-(cx - spawn.x), -(cz - spawn.z)),
    bossSpawn: { x: cx + bs[0], y: F + 1, z: cz + bs[1] },
    portal: { x: pcx, y: F + 3.5, z: pcz },
    portalAxis: w.portalAxis,
    arenaCenter: { x: cx, z: cz }, arenaRadius: 16, floorY: F + 1,
    treasure: { x: tx, y: ty, z: tz },
    seal, rimA, rimB, pillars, portalAng,
  };
}

/* ---------- Texturen en gedeelde stukjes ---------- */
const VC = {};          // cache: texturen, materialen, geometrie
const VOID_FX = { crumble: [], crumbleT: 0, dustT: 0, tearT: 0, whisperT: 8, vortex: null };
const PHASE_HEX = [0, 0x9b4dff, 0x3fa8ff, 0xff2f6d];
const PHASE_RGB = [[1, 1, 1], [0.7, 0.4, 1], [0.35, 0.7, 1], [1, 0.3, 0.5]];
const STAR_TINT = [[1, 1, 1], [0.9, 0.85, 1], [0.75, 0.9, 1], [1, 0.8, 0.88]];

function sharedGeo(key, make) {
  if (!VC[key]) { VC[key] = make(); VC[key].userShared = true; }
  return VC[key];
}

function buildVoidTextures() {
  const R = mulberry32(1414);
  const stars = (base, dens) => {
    const px = [], glow = [];
    for (let i = 0; i < 256; i++) {
      const r = R();
      let c = r < 0.15 ? [base[0] + 14, base[1] + 8, base[2] + 22] : [base[0] + R() * 6, base[1] + R() * 6, base[2] + R() * 8];
      let g = [0, 0, 0];
      if (R() < dens) {
        const k = R();
        c = k < 0.6 ? [240, 240, 255] : k < 0.85 ? [196, 150, 255] : [150, 190, 255];
        g = c;
      }
      px.push(c); glow.push(g);
    }
    return { px, glow };
  };
  const body = stars([12, 10, 22], 0.07), robe = stars([16, 9, 28], 0.05);
  VC.body = pixelTexture(16, 16, (x, y) => body.px[y * 16 + x]);
  VC.bodyGlow = pixelTexture(16, 16, (x, y) => body.glow[y * 16 + x]);
  VC.robe = pixelTexture(16, 16, (x, y) => robe.px[y * 16 + x]);
  VC.robeGlow = pixelTexture(16, 16, (x, y) => robe.glow[y * 16 + x]);
  const eye = (x, y) => ((x >= 3 && x <= 5) || (x >= 10 && x <= 12)) && (y === 6 || y === 7);
  const brow = (x, y) => (y === 5 && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13))) || (y === 4 && (x === 2 || x === 13));
  const mouth = (x, y) => y === 11 && x >= 5 && x <= 10;
  VC.face = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [255, 255, 255] : brow(x, y) ? [0, 0, 0] : mouth(x, y) ? [150, 70, 220] : body.px[y * 16 + x]));
  VC.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [255, 255, 255] : mouth(x, y) ? [150, 70, 220] : body.glow[y * 16 + x]));
  VC.cloneFace = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [200, 120, 255] : brow(x, y) ? [0, 0, 0] : body.px[y * 16 + x]));
  const runeOn = (x, y) => y === 1 || y === 14 || (y > 3 && y < 12 && RUNE_ART[y][x] === '#' && x > 3 && x < 12);
  VC.trim = pixelTexture(16, 16, (x, y) => (runeOn(x, y) ? [130, 100, 180] : [30 + R() * 8, 24, 46]));
  VC.trimGlow = pixelTexture(16, 16, (x, y) => (runeOn(x, y) ? [255, 255, 255] : [0, 0, 0]));
  const gem = (x, y) => (x >= 3 && x <= 4 || x >= 11 && x <= 12) && (y >= 7 && y <= 8);
  VC.crown = pixelTexture(16, 16, (x, y) => (gem(x, y) ? [240, 220, 255] : y < 3 ? [110, 100, 130] : [44 + R() * 14, 38 + R() * 10, 58 + R() * 14]));
  VC.crownGlow = pixelTexture(16, 16, (x, y) => (gem(x, y) ? [255, 255, 255] : [0, 0, 0]));
  VC.glowTex = pixelTexture(8, 8, (x, y) => { const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5)); return d < 1.5 ? [255, 255, 255] : d < 2.5 ? [225, 225, 225] : [170, 170, 170]; });
  VC.halo = pixelTexture(32, 32, (x, y) => {
    const d = Math.hypot(x - 15.5, y - 15.5), a = Math.atan2(y - 15.5, x - 15.5);
    if (d > 12.5 && d < 15.2 && Math.floor((a + Math.PI) / (Math.PI / 8)) % 4 !== 3) return d > 14 || d < 13.5 ? [255, 255, 255, 255] : [200, 200, 200, 255];
    if (d > 9.5 && d < 10.6 && Math.floor((a + Math.PI) / (Math.PI / 12)) % 2 === 0) return [255, 255, 255, 255];
    return null;
  });
  VC.swirl = pixelTexture(32, 32, (x, y) => {
    const d = Math.hypot(x - 15.5, y - 15.5), a = Math.atan2(y - 15.5, x - 15.5);
    if (d > 15.5) return null;
    const s = Math.sin(a * 3 + d * 0.55);
    if (d < 4) return [0, 0, 0, 255];
    const k = 1 - d / 16;
    if (s > 0.35) return [150 + 100 * k, 60 + 80 * k, 255, Math.round(255 * Math.min(1, k * 2.2))];
    if (s > -0.2) return [40, 10, 80, Math.round(220 * k)];
    return null;
  });
  VC.vortex = pixelTexture(64, 64, (x, y) => {
    const d = Math.hypot(x - 31.5, y - 31.5), a = Math.atan2(y - 31.5, x - 31.5);
    if (d > 31.5) return null;
    const s = Math.sin(a * 4 + d * 0.28);
    const k = 1 - d / 32;
    if (d < 5) return [0, 0, 0, 255];
    if (s > 0.5) return [120 + 120 * k, 50 + 60 * k, 220, Math.round(230 * Math.min(1, k * 1.8))];
    if (s > 0) return [50, 20, 100, Math.round(200 * k)];
    return [10, 4, 22, Math.round(160 * k)];
  });
  VC.lava = pixelTexture(8, 8, (x, y) => (((x === 2 || x === 5) && y === 3) ? [255, 236, 120] : R() < 0.3 ? [255, 120, 20] : [70, 22, 12]));
  VC.lavaGlow = pixelTexture(8, 8, (x, y) => (((x === 2 || x === 5) && y === 3) ? [255, 236, 120] : [120, 30, 0]));
  VC.ice = pixelTexture(8, 8, () => { const r = R(); return r < 0.15 ? [255, 255, 255] : r < 0.6 ? [170, 220, 255] : [120, 190, 250]; });
  VC.shadow = pixelTexture(8, 8, (x, y) => (((x === 2 || x === 5) && (y === 3 || y === 4)) ? [255, 255, 255] : R() < 0.2 ? [70, 40, 110] : [28, 18, 44]));
  VC.shadowGlow = pixelTexture(8, 8, (x, y) => (((x === 2 || x === 5) && (y === 3 || y === 4)) ? [255, 255, 255] : [30, 0, 60]));
  VC.crying = pixelTexture(8, 8, () => (R() < 0.18 ? [200, 100, 255] : [24 + R() * 10, 14, 38]));
}

function voidMats() {
  if (VC.orbMat) return;
  if (!VC.body) buildVoidTextures();
  VC.orbMat = new THREE.MeshBasicMaterial({ map: VC.glowTex, color: 0xb066ff });
  VC.orbCoreMat = new THREE.MeshBasicMaterial({ color: 0x07020e });
  VC.holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  VC.swirlMat = new THREE.MeshBasicMaterial({ map: VC.swirl, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  VC.beamMat = new THREE.MeshBasicMaterial({ color: 0xb45cff, transparent: true, opacity: 0.75, depthWrite: false });
  VC.beamCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  VC.frameMat = new THREE.MeshBasicMaterial({ map: VC.crying });
  VC.safeMat = new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.22, depthWrite: false });
}

/* ---------- Geluidjes ---------- */
function vsnd(name, at, vol) {
  if (!SND.ctx || SND.muted) return;
  let v = vol === undefined ? 1 : vol;
  if (at) {
    const d = Math.hypot(at.x - player.pos.x, at.y - player.pos.y, at.z - player.pos.z);
    v *= clamp(1 - d / 44, 0, 1);
    if (v < 0.02) return;
  }
  try {
    switch (name) {
      case 'hole':
        SND.tone({ type: 'sine', f0: 160, f1: 38, dur: 0.9, vol: 0.32 * v });
        SND.noiseBurst({ dur: 0.8, vol: 0.18 * v, f0: 900, f1: 120 });
        break;
      case 'laser':
        SND.tone({ type: 'sawtooth', f0: 1200, f1: 180, dur: 0.45, vol: 0.12 * v, lp: 2400 });
        SND.noiseBurst({ dur: 0.4, vol: 0.2 * v, filter: 'highpass', f0: 1500, f1: 400 });
        break;
      case 'charge':
        SND.tone({ type: 'sine', f0: 110, f1: 880, dur: 1.4, vol: 0.14 * v, a: 0.3, vib: 9, vibAmt: 30 });
        break;
      case 'nova':
        SND.tone({ type: 'sine', f0: 90, f1: 28, dur: 1.6, vol: 0.5 * v });
        SND.noiseBurst({ dur: 1.4, vol: 0.45 * v, f0: 2600, f1: 90 });
        break;
      case 'whisper':
        SND.noiseBurst({ dur: 1.6, vol: 0.07 * v, filter: 'bandpass', f0: 700, f1: 1500, q: 4, a: 0.5 });
        SND.tone({ type: 'sine', f0: 220, f1: 207, dur: 1.8, vol: 0.03 * v, a: 0.6, vib: 5, vibAmt: 6 });
        break;
      case 'gate':
        SND.tone({ type: 'triangle', f0: 200, f1: 600, dur: 0.6, vol: 0.12 * v, vib: 14, vibAmt: 40 });
        break;
      case 'crumble':
        SND.noiseBurst({ dur: 0.7, vol: 0.3 * v, f0: 500, f1: 80 });
        break;
      default: break;
    }
  } catch (e) { /* geluid is niet belangrijk */ }
}

/* ---------- Hulpjes voor plekken ---------- */
function clampArena(info, x, z, maxR) {
  const ac = info.arenaCenter;
  const dx = x - ac.x, dz = z - ac.z, d = Math.hypot(dx, dz);
  if (d <= maxR) return { x, z };
  return { x: ac.x + dx / d * maxR, z: ac.z + dz / d * maxR };
}
function spotFree(world, info, x, z, hw, h) {
  const y0 = Math.floor(info.floorY);
  if (!world.solidAt(Math.floor(x), y0 - 1, Math.floor(z))) return false;
  for (const ox of [-hw, 0, hw]) for (const oz of [-hw, 0, hw]) for (let y = y0; y < y0 + h; y++) if (world.solidAt(Math.floor(x + ox), y, Math.floor(z + oz))) return false;
  return true;
}
function findSpot(world, info, x, z, hw, h, maxR) {
  let s = clampArena(info, x, z, maxR);
  if (spotFree(world, info, s.x, s.z, hw, h)) return s;
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 1 + i * 0.35;
    const t = clampArena(info, s.x + Math.cos(a) * r, s.z + Math.sin(a) * r, maxR);
    if (spotFree(world, info, t.x, t.z, hw, h)) return t;
  }
  return { x: info.arenaCenter.x, z: info.arenaCenter.z };
}

/* ---------- Handlangers: kleine versies van oude schurken ---------- */
function minionMats(list) { for (const m of list) m.userBase = m.color.clone(); return list; }

function lavaBlobModel() {
  const geo = sharedGeo('blobGeo', () => new THREE.BoxGeometry(0.8, 0.8, 0.8).translate(0, 0.4, 0));
  const mat = new THREE.MeshLambertMaterial({ map: VC.lava, emissive: 0xffffff, emissiveMap: VC.lavaGlow, emissiveIntensity: 0.9 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(geo, mat);
  group.add(body);
  return {
    group, mats: minionMats([mat]),
    animate(mn, dt) {
      const s = Math.sin(mn.walk * 1.4);
      body.scale.set(1 + s * 0.08, 1 - s * 0.12, 1 + s * 0.08);
      if (mn.onGround && Math.random() < dt * 1.2) mn.vel.y = 5.5;
      if (Math.random() < dt * 6) FX.flame(mn.pos.x, mn.pos.y + 0.8, mn.pos.z, 0.3);
    },
  };
}

function iceWispModel() {
  const core = sharedGeo('wispCore', () => new THREE.BoxGeometry(0.42, 0.42, 0.42).translate(0, 0.35, 0));
  const shell = sharedGeo('wispShell', () => new THREE.BoxGeometry(0.7, 0.7, 0.7).translate(0, 0.35, 0));
  const m1 = new THREE.MeshLambertMaterial({ map: VC.ice, emissive: 0x66ccff, emissiveIntensity: 0.8 });
  const m2 = new THREE.MeshLambertMaterial({ map: VC.ice, transparent: true, opacity: 0.45, emissive: 0x3388cc, emissiveIntensity: 0.5, depthWrite: false });
  const group = new THREE.Group();
  const a = new THREE.Mesh(core, m1), b = new THREE.Mesh(shell, m2);
  group.add(a, b);
  return {
    group, mats: minionMats([m1, m2]),
    animate(mn, dt) {
      b.rotation.set(game.time * 1.5, game.time * 2, 0);
      a.rotation.y = -game.time * 3;
      if (Math.random() < dt * 10) FX.glow.spawn(mn.pos.x + (Math.random() - 0.5) * 0.6, mn.pos.y + 0.3, mn.pos.z + (Math.random() - 0.5) * 0.6, 0, -0.6, 0, 0.75, 0.95, 1, 0.6, 1, 0);
    },
  };
}

function shadowOrbModel() {
  const core = sharedGeo('orbMinCore', () => new THREE.BoxGeometry(0.55, 0.55, 0.55).translate(0, 0.35, 0));
  const shell = sharedGeo('orbMinShell', () => new THREE.BoxGeometry(0.78, 0.78, 0.78).translate(0, 0.35, 0));
  const m1 = new THREE.MeshLambertMaterial({ map: VC.shadow, emissive: 0xffffff, emissiveMap: VC.shadowGlow, emissiveIntensity: 1 });
  const m2 = new THREE.MeshBasicMaterial({ color: 0x9a4dff, transparent: true, opacity: 0.3, depthWrite: false });
  const group = new THREE.Group();
  const a = new THREE.Mesh(core, m1), b = new THREE.Mesh(shell, m2);
  group.add(a, b);
  return {
    group, mats: minionMats([m1, m2]),
    animate(mn, dt) {
      b.rotation.set(0.6, game.time * 2.5, 0.6);
      if (Math.random() < dt * 8) FX.glow.spawn(mn.pos.x, mn.pos.y + 0.35, mn.pos.z, (Math.random() - 0.5) * 0.4, 0.3, (Math.random() - 0.5) * 0.4, 0.55, 0.25, 0.9, 0.7, 0, 0);
    },
  };
}

function makeVoidMinion(kind, world, x, y, z, boss) {
  if (kind === 'lava') {
    return new Minion(world, x, y, z, { name: 'Lavaklodder', hp: 45, speed: 3.0, dmg: boss.dmg(10), hw: 0.42, h: 0.85, life: 22, color: [1, 0.45, 0.1],
      model: lavaBlobModel, onHit: () => { player.fire = Math.max(player.fire, 2); } });
  }
  if (kind === 'ice') {
    return new Minion(world, x, y, z, { name: 'IJsgeestje', hp: 30, speed: 2.6, dmg: boss.dmg(9), hw: 0.35, h: 0.7, fly: true, life: 18, color: [0.6, 0.9, 1],
      model: iceWispModel, onHit: () => { player.slow = Math.max(player.slow, 1.5); } });
  }
  return new Minion(world, x, y, z, { name: 'Schaduwbolletje', hp: 30, speed: 3.0, dmg: boss.dmg(9), hw: 0.35, h: 0.7, fly: true, life: 18, color: [0.6, 0.3, 0.9],
    model: shadowOrbModel, onHit: () => { player.dark = Math.max(player.dark, 1.2); } });
}

/* Leegtebol: terug te slaan met het zwaard */
function voidOrb(origin, dir, speed, dmg, homing) {
  voidMats();
  const geo = sharedGeo('orbGeo', () => new THREE.BoxGeometry(0.62, 0.62, 0.62));
  const core = sharedGeo('orbCore', () => new THREE.BoxGeometry(0.36, 0.36, 0.36));
  const mesh = new THREE.Mesh(geo, VC.orbMat);
  mesh.add(new THREE.Mesh(core, VC.orbCoreMat));
  return new Projectile({
    pos: origin, vel: dir.clone().normalize().multiplyScalar(speed), owner: 'boss', type: 'voidorb', dmg, radius: 0.36,
    reflectable: true, reflectDmg: 25, homing: homing || 0, life: 5.5, knock: 4, mesh,
    trail: (pr) => { if (Math.random() < 0.7) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0.65, 0.3, 1, 0.45, 0, 1); },
    explodeFx: (pr) => {
      for (let i = 0; i < 18; i++) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 6, (Math.random() - 0.3) * 5, (Math.random() - 0.5) * 6, 0.7, 0.35, 1, 0.5, 3, 2);
    },
  });
}

/* Spiegelbeeld van de koning: valt om met 1 klap */
function cloneModel(boss) {
  const g1 = sharedGeo('cloneRobe', () => new THREE.BoxGeometry(1.8, 1.9, 1.3).translate(0, 1.15, 0));
  const g2 = sharedGeo('cloneTorso', () => new THREE.BoxGeometry(1.6, 1.4, 1.0).translate(0, 2.8, 0));
  const g3 = sharedGeo('cloneHead', () => new THREE.BoxGeometry(1.05, 1.05, 1.05).translate(0, 4.0, 0));
  const g4 = sharedGeo('cloneHalo', () => new THREE.PlaneGeometry(2.2, 2.2).translate(0, 4.0, -0.6));
  const body = new THREE.MeshLambertMaterial({ map: VC.body, color: 0xc0a0ff, emissive: 0x2a0a50, transparent: true, opacity: 0.72 });
  const face = new THREE.MeshLambertMaterial({ map: VC.cloneFace, color: 0xc0a0ff, emissive: 0xb060ff, emissiveMap: VC.faceGlow, emissiveIntensity: 0.8, transparent: true, opacity: 0.8 });
  const halo = new THREE.MeshBasicMaterial({ map: VC.halo, color: 0x9b4dff, transparent: true, alphaTest: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  inner.add(new THREE.Mesh(g1, body), new THREE.Mesh(g2, body), new THREE.Mesh(g3, [body, body, body, body, face, body]));
  const hm = new THREE.Mesh(g4, halo);
  inner.add(hm);
  return {
    group, mats: minionMats([body, face, halo]),
    animate(mn, dt) {
      inner.position.y = 0.25 + Math.sin(game.time * 2 + mn.pos.x) * 0.1;
      hm.rotation.z += dt;
      if (mn.shotT === undefined) mn.shotT = 1.6 + Math.random() * 1.6;
      mn.shotT -= dt;
      face.emissiveIntensity = mn.shotT < 0.8 ? 2.6 : 0.8;
      if (mn.shotT < 0.8 && Math.random() < dt * 20) FX.glow.spawn(mn.pos.x, mn.pos.y + 4.2, mn.pos.z, (Math.random() - 0.5), 1, (Math.random() - 0.5), 0.8, 0.5, 1, 0.4, 0, 0);
      if (mn.shotT <= 0) {
        mn.shotT = 3.6;
        if (!player.dead && boss.alive()) {
          const o = new THREE.Vector3(mn.pos.x, mn.pos.y + 3.6, mn.pos.z);
          const d = new THREE.Vector3(player.pos.x, player.pos.y + 1.1, player.pos.z).sub(o);
          game.addProjectile(voidOrb(o.addScaledVector(d.clone().normalize(), 0.9), d, 6.5, boss.dmg(12), 0.5));
          SND.play('shoot', { at: mn.pos, range: 30, vol: 0.5 });
        }
      }
    },
  };
}

/* Leegtepoort waar een handlanger uit stapt (gedraagt zich als een grondaanval: verdwijnt bij het einde van het gevecht) */
class VoidGate {
  constructor(x, y, z, spawn) {
    voidMats();
    this.x = x; this.y = y; this.z = z; this.spawn = spawn;
    this.t = 0; this.dead = false; this.spawned = false;
    const fb = sharedGeo('gateSide', () => new THREE.BoxGeometry(0.35, 2.9, 0.35));
    const ft = sharedGeo('gateTop', () => new THREE.BoxGeometry(2.0, 0.35, 0.35));
    const pl = sharedGeo('gatePlane', () => new THREE.PlaneGeometry(1.4, 2.3));
    this.mesh = new THREE.Group();
    const inner = new THREE.Group();
    inner.position.y = 1.45;
    this.mesh.add(inner);
    const l = new THREE.Mesh(fb, VC.frameMat), r = new THREE.Mesh(fb, VC.frameMat);
    l.position.x = -0.85; r.position.x = 0.85;
    const t = new THREE.Mesh(ft, VC.frameMat), b = new THREE.Mesh(ft, VC.frameMat);
    t.position.y = 1.3; b.position.y = -1.3;
    inner.add(l, r, t, b, new THREE.Mesh(pl, MAT.portal));
    this.inner = inner;
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z);
    inner.scale.setScalar(0.01);
    vsnd('gate', { x, y, z });
  }
  update(dt) {
    this.t += dt;
    const t = this.t;
    const s = t < 0.35 ? t / 0.35 : t > 2.2 ? Math.max(0.01, (2.6 - t) / 0.4) : 1;
    this.inner.scale.set(s, s, s);
    if (Math.random() < dt * 25) FX.glow.spawn(this.x + (Math.random() - 0.5) * 1.6, this.y + Math.random() * 2.8, this.z + (Math.random() - 0.5) * 1.6, 0, 0.6, 0, 0.6, 0.3, 1, 0.7, 0, 0);
    if (!this.spawned && t > 1.1) {
      this.spawned = true;
      this.spawn(this.x, this.y, this.z);
      for (let i = 0; i < 16; i++) FX.glow.spawn(this.x, this.y + 1.2, this.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 0.8, 0.5, 1, 0.6, 2, 1);
      SND.play('pop', { at: { x: this.x, y: this.y, z: this.z }, range: 30 });
    }
    if (t > 2.6) this.dead = true;
  }
  dispose() {}
}

/* ---------- De Leegtekoning ---------- */
class VoidKing extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Leegtekoning', ref: 'de Leegtekoning', hp: 1200, hw: 1.3, h: 5.6, deathTiles: [T.VOID_STONE, T.VOID_CRYING, T.VOID_LAMP],
      yaw: Math.atan2(info.spawn.x - info.bossSpawn.x, info.spawn.z - info.bossSpawn.z) });
    this.phase = 1;
    this.anim = { armA: 0.1, armB: 0.1, armZ: 0.15, head: 0.3, lean: 0.1, rise: 0, eye: 0.4 };
    this.lastAtk = '';
    this.stuckT = 0;
    this.novaCD = 6;
    this.hidden = false;
    this.fade = 1;
    this.minionIdx = Math.floor(Math.random() * 3);
    this.starCol = new THREE.Color(1, 1, 1);
    this.setPhaseLook(1);
  }

  buildModel() {
    voidMats();
    const body = new THREE.MeshLambertMaterial({ map: VC.body, emissive: 0xffffff, emissiveMap: VC.bodyGlow, emissiveIntensity: 1 });
    const robe = new THREE.MeshLambertMaterial({ map: VC.robe, emissive: 0xffffff, emissiveMap: VC.robeGlow, emissiveIntensity: 1 });
    const trim = new THREE.MeshLambertMaterial({ map: VC.trim, emissive: 0x9b4dff, emissiveMap: VC.trimGlow, emissiveIntensity: 1.3 });
    const face = new THREE.MeshLambertMaterial({ map: VC.face, emissive: 0xffffff, emissiveMap: VC.faceGlow, emissiveIntensity: 1 });
    const crown = new THREE.MeshLambertMaterial({ map: VC.crown, emissive: 0x9b4dff, emissiveMap: VC.crownGlow, emissiveIntensity: 1.4 });
    const glow = new THREE.MeshBasicMaterial({ map: VC.glowTex, color: 0x9b4dff });
    const halo = new THREE.MeshBasicMaterial({ map: VC.halo, color: 0xc89bff, transparent: true, alphaTest: 0.2, depthWrite: false, side: THREE.DoubleSide });
    const dark = new THREE.MeshBasicMaterial({ color: 0x050008 });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    // mantel
    inner.add(bossBox(2.3, 2.3, 1.7, robe, 1.15));
    inner.add(bossBox(2.7, 0.4, 2.1, trim, 0.2));
    const torso = new THREE.Group();
    torso.position.y = 2.25;
    inner.add(torso);
    torso.add(bossBox(2.0, 1.9, 1.25, body, 0.95));
    torso.add(bossBox(2.12, 0.32, 1.36, trim, 0.16));
    for (const sx of [-1, 1]) { const s = bossBox(0.95, 0.5, 1.3, crown, 0, sx * 1.15, 0); s.position.y = 1.85; torso.add(s); }
    const cape = bossBox(2.3, 3.9, 0.16, robe, -1.95, 0, 0);
    cape.position.set(0, 1.95, -0.72);
    torso.add(cape);
    // armen: A = linkerhand (toverbol), B = scepter
    const arms = [];
    for (const sx of [1, -1]) {
      const p = new THREE.Group();
      p.position.set(sx * 1.38, 1.65, 0);
      p.add(bossBox(0.7, 2.0, 0.7, robe, -0.9));
      p.add(bossBox(0.62, 0.55, 0.62, body, -2.12));
      torso.add(p);
      arms.push(p);
    }
    const castOrb = new THREE.Mesh(sharedGeo('castGeo', () => new THREE.BoxGeometry(0.5, 0.5, 0.5)), glow);
    castOrb.position.set(0, -2.5, 0.35);
    arms[0].add(castOrb);
    const scepter = new THREE.Group();
    scepter.position.set(0, -2.12, 0.1);
    arms[1].add(scepter);
    scepter.add(bossBox(0.2, 3.6, 0.2, crown, 0.5));
    scepter.add(bossBox(0.55, 0.55, 0.55, glow, 2.55));
    for (const sx of [-1, 1]) { const pr = bossBox(0.12, 0.6, 0.12, crown, 2.6, sx * 0.4, 0); pr.rotation.z = -sx * 0.25; scepter.add(pr); }
    // hoofd met kroon
    const head = new THREE.Group();
    head.position.set(0, 1.9, 0.05);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3).translate(0, 0.65, 0), [body, body, body, body, face, body]));
    head.add(bossBox(1.46, 0.32, 1.46, crown, 1.42));
    for (const [x, z, hh] of [[-0.6, 0.6, 0.5], [0.6, 0.6, 0.5], [-0.6, -0.6, 0.45], [0.6, -0.6, 0.45], [0, 0.62, 0.8]]) {
      const sp = bossBox(0.22, hh, 0.22, crown, hh / 2, x, z);
      sp.position.y = 1.55;
      head.add(sp);
    }
    const gem = bossBox(0.26, 0.26, 0.12, glow, 0, 0, 0.75);
    gem.position.y = 1.45;
    head.add(gem);
    const haloM = new THREE.Mesh(sharedGeo('haloGeo', () => new THREE.PlaneGeometry(3.0, 3.0)), halo);
    haloM.position.set(0, 0.75, -0.8);
    head.add(haloM);
    // zwevende ring rond het lijf (vanaf fase 2)
    const ring = new THREE.Mesh(sharedGeo('ringGeo', () => new THREE.PlaneGeometry(4.6, 4.6)), halo);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 2.6;
    ring.visible = false;
    inner.add(ring);
    // draaiende runeblokjes
    const orbits = [];
    const og = sharedGeo('orbitGeo', () => new THREE.BoxGeometry(0.34, 0.34, 0.34));
    for (let i = 0; i < 3; i++) { const o = new THREE.Mesh(og, glow); inner.add(o); orbits.push(o); }
    // de nova-bol boven zijn handen
    const sphere = new THREE.Group();
    sphere.position.y = 7.6;
    sphere.add(new THREE.Mesh(sharedGeo('sphCore', () => new THREE.BoxGeometry(1, 1, 1)), dark));
    const sphGlow = new THREE.Mesh(sharedGeo('sphGlow', () => new THREE.BoxGeometry(1.35, 1.35, 1.35)), new THREE.MeshBasicMaterial({ color: 0xb05cff, transparent: true, opacity: 0.45, depthWrite: false }));
    sphere.add(sphGlow);
    sphere.visible = false;
    inner.add(sphere);
    return { group, inner, torso, arms, head, halo: haloM, ring, orbits, castOrb, sphere, sphGlow,
      mats: [body, robe, trim, face, crown, glow, halo], body, robe, trim, face, crown, glow, haloMat: halo };
  }

  setPhaseLook(ph) {
    const m = this.model;
    const c = new THREE.Color(PHASE_HEX[ph]);
    m.trim.emissive.copy(c); m.crown.emissive.copy(c);
    m.glow.userBase = c.clone();
    m.haloMat.userBase = c.clone().lerp(new THREE.Color(1, 1, 1), 0.35);
    const st = STAR_TINT[ph];
    this.starCol.setRGB(st[0], st[1], st[2]);
    m.robe.emissive.copy(this.starCol);
    m.ring.visible = ph >= 2;
    m.sphGlow.material.color.copy(c);
  }

  applyTint() {
    super.applyTint();
    this.model.body.emissive.copy(this.flash > 0 ? FLASH_COL : this.starCol);
  }

  enragedFx() {
    if (this.hidden) return;
    const c = PHASE_RGB[this.phase];
    FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 2.6, this.pos.y + 0.4 + Math.random() * 5, this.pos.z + (Math.random() - 0.5) * 2.6,
      (Math.random() - 0.5) * 0.4, 0.9, (Math.random() - 0.5) * 0.4, c[0], c[1], c[2], 0.8, -0.2, 0.5);
  }

  /* drie fases: bij 66% en 33% leven verandert hij */
  hurt(amount, kind) {
    if (this.hidden && kind !== 'burn' && kind !== 'fireball') return false;
    const was = this.enraged;
    this.enraged = true;            // geen standaard 'woedend'-melding, wij hebben eigen fases
    const ok = super.hurt(amount, kind);
    this.enraged = was;
    if (ok && this.alive()) {
      const r = this.hp / this.maxHp;
      const want = r <= 0.33 ? 3 : r <= 0.66 ? 2 : 1;
      if (want > this.phase) { this.phase = want; this.enraged = true; this.startPhaseChange(); }
      HUD.bossbar(true, r, this.enraged, this.name);
    }
    return ok;
  }

  onReflectHit() {
    if (this.state === 'chase' || this.state === 'recover' || this.state === 'orbWind') this.setState('stagger');
  }

  onGoHome() {
    this.noSteer = false; this.flying = false; this.hidden = false; this.fade = 1; this.stuckT = 0;
    this.mesh.visible = true;
    this.tpHazard = null;
  }

  die() {
    if (this.hidden) this.appear(this.info.arenaCenter.x, this.info.arenaCenter.z, true);
    this.fade = 1;
    this.model.inner.scale.setScalar(1);
    this.model.sphere.visible = false;
    super.die();
  }

  // verdwijnen (teleport): onder de wereld wachten, onkwetsbaar
  vanish() {
    const c = this.center();
    for (let i = 0; i < 30; i++) FX.glow.spawn(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 4, c.z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 0.6, 0.3, 1, 0.7, 0, 1);
    this.hidden = true; this.flying = true;
    this.mesh.visible = false;
    this.vel.set(0, 0, 0);
    this.pos.y = this.info.floorY - 30;
    SND.play('teleport', { vol: 0.8 });
  }

  appear(x, z, quiet) {
    this.hidden = false; this.flying = false;
    this.pos.set(x, this.info.floorY, z);
    this.vel.set(0, 0, 0);
    this.mesh.visible = true;
    this.fade = quiet ? 1 : 0.2;
    this.yaw = Math.atan2(player.pos.x - x, player.pos.z - z);
    if (!quiet) {
      for (let i = 0; i < 30; i++) FX.glow.spawn(x + (Math.random() - 0.5) * 2.5, this.pos.y + Math.random() * 5, z + (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2, 0.7, 0.4, 1, 0.6, 0, 1);
      SND.play('teleport', { vol: 0.8 });
    }
  }

  startPhaseChange() {
    if (this.hidden) {
      const s = findSpot(this.world, this.info, this.info.arenaCenter.x, this.info.arenaCenter.z, 1.3, 6, 11);
      this.appear(s.x, s.z);
    }
    if (this.tpHazard) { this.tpHazard.dead = true; this.tpHazard = null; }
    this.noSteer = false;
    this.setState('phase');
    this.iframe = 0.5;
    const ph = this.phase;
    SND.play('roar', { vol: 1 });
    game.shake = Math.max(game.shake, 1.0);
    HUD.title(ph === 2 ? 'FASE 2' : 'LAATSTE FASE!', ph === 2 ? 'De Leegtekoning opent de poorten van de leegte!' : 'De Leegtekoning wordt razend! Pas op voor de nova!', 3);
    HUD.actionbar('De rand van het platform brokkelt af!', 2.5);
    startCrumble(ph === 2 ? this.info.rimA : this.info.rimB, this.world);
  }

  think(dt, c) {
    const ph = this.phase, info = this.info, ac = info.arenaCenter;
    if (this.novaCD > 0) this.novaCD -= dt;
    if (this.fade < 1) this.fade = Math.min(1, this.fade + dt * 4);
    if (this.hidden) this.iframe = Math.max(this.iframe, 0.3);
    let speed = 0;
    switch (this.state) {
      case 'chase': {
        if (this.hidden) { const s = findSpot(this.world, info, ac.x, ac.z, 1.3, 6, 11); this.appear(s.x, s.z); }
        const fromC = Math.hypot(this.pos.x - ac.x, this.pos.z - ac.z) || 1;
        const rx = (this.pos.x - ac.x) / fromC, rz = (this.pos.z - ac.z) / fromC;
        const outward = (c.dx * rx + c.dz * rz) / (c.dist || 1);
        let want = c.targetYaw;
        if (fromC > 12) want = Math.atan2(ac.x - this.pos.x, ac.z - this.pos.z);
        this.turnTo(want, dt, 3 + ph * 0.6);
        if (c.dist > 3.6 && !(fromC > 10.5 && outward > 0.2)) speed = [0, 2.1, 2.5, 2.9][ph];
        if (fromC > 12) speed = 2.5;
        if (this.hitWall && speed > 0) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt);
        this.attackCD -= dt;
        if (this.stuckT > 1.2) { this.stuckT = 0; this.startTeleport(); break; }
        if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
        break;
      }
      case 'slamWind':
        if (this.t >= this.windT) { this.setState('slam'); }
        break;
      case 'slam':
        if (this.t > 0.25) this.setState('recover', [0, 0.9, 0.75, 0.6][ph]);
        break;
      case 'holesWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t >= 0.6) { this.castHoles([0, 2, 3, 4][ph]); this.setState('recover', 0.8); }
        break;
      case 'laserWind':
        if (this.t >= this.windT) {
          if (ph >= 3 && !this.didHit) { this.didHit = true; this.t = 0; this.windT = 0.9; this.castLasers(true); this.state = 'laser2'; }
          else this.setState('recover', 0.7);
        }
        break;
      case 'laser2':
        if (this.t >= this.windT) this.setState('recover', 0.7);
        break;
      case 'orbWind':
        this.turnTo(c.targetYaw, dt, 4);
        if (this.t >= [0, 0.75, 0.65, 0.6][ph]) { this.shootOrbs([0, 3, 4, 5][ph]); this.setState('recover', 0.7); }
        break;
      case 'portalWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t >= 0.8) { this.openGates(ph === 2 ? 2 : 3); this.setState('recover', 0.6); }
        break;
      case 'tpOut':
        this.fade = Math.max(0.05, 1 - this.t / 0.45);
        if (this.t >= 0.45) this.teleportStrike();
        break;
      case 'tpWait':
        if (!this.tpHazard || this.tpHazard.fired || this.tpHazard.dead) {
          if (this.hidden) { const s = findSpot(this.world, info, ac.x, ac.z, 1.3, 6, 11); this.appear(s.x, s.z); }
          this.tpHazard = null;
          this.setState('recover', 1.0);
        }
        break;
      case 'cloneWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (Math.random() < 0.6) this.enragedFx();
        if (this.t >= 0.85) { this.makeClones(); this.setState('recover', 0.5); }
        break;
      case 'novaOut':
        this.fade = Math.max(0.05, 1 - this.t / 0.45);
        if (this.t >= 0.45) {
          this.appear(ac.x, ac.z);
          this.setState('novaWind');
          this.castNova();
        }
        break;
      case 'novaWind':
        this.turnTo(c.targetYaw, dt, 2);
        this.iframe = Math.max(this.iframe, 0.1);
        if (Math.random() < 0.8) {
          const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 4;
          const sx = this.pos.x + Math.cos(a) * r, sz = this.pos.z + Math.sin(a) * r, sy = this.pos.y + 1 + Math.random() * 6;
          FX.glow.spawn(sx, sy, sz, (this.pos.x - sx) * 1.2, (this.pos.y + 7.8 - sy) * 1.2, (this.pos.z - sz) * 1.2, 0.8, 0.45, 1, 0.8, 0, 0);
        }
        if (this.t >= NOVA_WARN) { this.novaCD = 15; this.setState('recover', 2.2); }
        break;
      case 'phase': {
        this.iframe = Math.max(this.iframe, 0.3);
        if (this.t > 0.5 && !this.didHit) {
          this.didHit = true;
          this.setPhaseLook(this.phase);
          const cc = this.center(), col = PHASE_RGB[this.phase];
          for (let i = 0; i < 80; i++) {
            const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2, s = 4 + Math.random() * 8;
            FX.glow.spawn(cc.x, cc.y + 1, cc.z, Math.cos(a) * s, e * 4, Math.sin(a) * s, col[0], col[1], col[2], 1.0, 1, 1.5);
          }
          FX.ring(this.pos.x, this.pos.y, this.pos.z, 7, col);
          SND.play('explode', { vol: 0.8 });
          vsnd('nova', null, 0.5);
          // duwt de speler weg, zonder schade
          const p = c.p;
          const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
          if (d < 7 && !p.dead) { p.kbx += dx / d * 8; p.kbz += dz / d * 8; p.vel.y = Math.max(p.vel.y, 5); }
        }
        if (this.t > 2.7) { this.setState('chase'); this.attackCD = 1.0; }
        break;
      }
      case 'recover':
        this.turnTo(c.targetYaw, dt, 1.5);
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph === 1 ? 1.9 + Math.random() * 1.0 : ph === 2 ? 1.7 + Math.random() * 0.8 : 1.3 + Math.random() * 0.7;
        }
        break;
      case 'stagger':
        if (this.t > 1.0) { this.setState('chase'); this.attackCD = 0.8; }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  pickAttack(c) {
    const ph = this.phase;
    const opts = [];
    if (c.dist < 4.6) opts.push(['slam', 4]);
    opts.push(['holes', 3], ['laser', 3], ['orbs', ph === 1 ? 3 : 2]);
    if (ph >= 2) {
      if (game.minions.filter((m) => !m.dead && !m.isClone).length < 3) opts.push(['gates', 2.2]);
      opts.push(['tele', 2]);
    }
    if (ph >= 3) {
      if (!game.minions.some((m) => !m.dead && m.isClone)) opts.push(['clones', 2.2]);
      if (this.novaCD <= 0) opts.push(['nova', 5]);
    }
    let list = opts.filter((o) => o[0] !== this.lastAtk);
    if (!list.length) list = opts;
    let tot = 0;
    for (const o of list) tot += o[1];
    let r = Math.random() * tot, pick = list[0][0];
    for (const o of list) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
    this.lastAtk = pick;
    switch (pick) {
      case 'slam': this.startSlam(); break;
      case 'holes': this.setState('holesWind'); vsnd('charge', this.pos, 0.6); break;
      case 'laser': this.startLasers(); break;
      case 'orbs': this.setState('orbWind'); break;
      case 'gates': this.setState('portalWind'); break;
      case 'tele': this.startTeleport(); break;
      case 'clones': this.setState('cloneWind'); SND.play('roar', { vol: 0.5 }); break;
      case 'nova': this.setState('novaOut'); SND.play('teleport'); break;
      default: break;
    }
  }

  /* Scepterslag: cirkel voor hem op de grond */
  startSlam() {
    const ph = this.phase;
    this.setState('slamWind');
    this.windT = [0, 0.85, 0.75, 0.65][ph];
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const col = PHASE_RGB[ph];
    game.addHazard(new GroundHazard({
      x: this.pos.x + fx * 1.8, y: this.info.floorY, z: this.pos.z + fz * 1.8, radius: 3.3, warn: this.windT, linger: 0.35, color: PHASE_HEX[ph],
      dmg: this.dmg(16), type: 'boss',
      onTrigger: (h) => {
        FX.ring(h.x, h.y, h.z, 3.3, col);
        FX.ring(h.x, h.y, h.z, 1.6, col);
        SND.play('slam', { at: { x: h.x, y: h.y, z: h.z }, range: 40 });
        game.shake = Math.max(game.shake, 0.7);
        if (h.playerInside()) damagePlayer(h.dmg, { x: this.pos.x, y: h.y, z: this.pos.z }, 'boss', 10, 7);
      },
    }));
  }

  /* Zwarte gaten: trekken je naar het midden, en daar doet het pijn */
  castHoles(n) {
    const p = player, info = this.info;
    const spots = [clampArena(info, p.pos.x + p.vel.x * 0.35, p.pos.z + p.vel.z * 0.35, 12.5)];
    for (let tries = 0; spots.length < n && tries < 40; tries++) {
      const a = Math.random() * Math.PI * 2, r = 3.5 + Math.random() * 3.5;
      const s = clampArena(info, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 12.5);
      if (spots.every((o) => Math.hypot(o.x - s.x, o.z - s.z) > 3.6)) spots.push(s);
    }
    for (const s of spots) game.addHazard(this.makeHole(s.x, info.floorY, s.z));
  }

  makeHole(x, y, z) {
    const ph = this.phase;
    voidMats();
    return new GroundHazard({
      x, y, z, radius: 1.5, warn: [0, 1.25, 1.1, 0.95][ph], linger: [0, 3.0, 3.4, 3.8][ph], color: 0x7a2cff, dmg: this.dmg(14), type: 'blackhole',
      onTrigger: (h) => {
        const core = new THREE.Mesh(sharedGeo('holeGeo', () => new THREE.BoxGeometry(1, 1, 1)), VC.holeMat);
        core.position.y = 1.0;
        const disc = new THREE.Mesh(sharedGeo('holeDisc', () => new THREE.PlaneGeometry(5, 5)), VC.swirlMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = 0.06;
        const tilt = new THREE.Mesh(sharedGeo('holeDisc', null), VC.swirlMat);
        tilt.position.y = 1.0;
        tilt.rotation.x = -Math.PI / 2 + 0.5;
        h.mesh.add(core, disc, tilt);
        h.hole = { core, disc, tilt };
        core.scale.setScalar(0.01); disc.scale.setScalar(0.01); tilt.scale.setScalar(0.01);
        vsnd('hole', { x: h.x, y: h.y, z: h.z });
        for (let i = 0; i < 20; i++) FX.glow.spawn(h.x, h.y + 1, h.z, (Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6, 0.5, 0.2, 0.9, 0.5, 2, 2);
        if (h.playerInside()) holeHit(h);
      },
      onLinger: (h, dt) => {
        if (!h.hole) return;
        if (h.coreCD > 0) h.coreCD -= dt;
        const age = h.t - h.warn, left = h.linger - age;
        const s = Math.min(1, age / 0.25) * Math.min(1, Math.max(0.01, left / 0.4));
        h.hole.core.scale.setScalar(Math.max(0.01, s * 1.3));
        h.hole.core.rotation.set(game.time * 2, game.time * 3, 0);
        h.hole.disc.scale.setScalar(Math.max(0.01, s));
        h.hole.disc.rotation.z = -game.time * 3;
        h.hole.tilt.scale.setScalar(Math.max(0.01, s * 0.7));
        h.hole.tilt.rotation.z = game.time * 4;
        if (Math.random() < dt * 30) {
          const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 2.5;
          FX.glow.spawn(h.x + Math.cos(a) * r, h.y + 0.3 + Math.random() * 1.5, h.z + Math.sin(a) * r,
            -Math.cos(a) * r * 1.4 - Math.sin(a) * 2, 0.4, -Math.sin(a) * r * 1.4 + Math.cos(a) * 2, 0.6, 0.3, 1, 0.65, 0, 0);
        }
        const p = player;
        if (p.dead || s < 0.3) return;
        const dx = h.x - p.pos.x, dz = h.z - p.pos.z, d = Math.hypot(dx, dz) || 0.01;
        if (d < 5.5 && p.pos.y < h.y + 3 && p.pos.y > h.y - 1.5 && !(h.coreCD > 0.6)) {
          const f = (1 - d / 5.5) * 20 + 5;
          p.kbx += dx / d * f * dt; p.kbz += dz / d * f * dt;
          if (d < 1.1 && !(h.coreCD > 0)) holeHit(h);
        }
      },
    });
  }

  /* Leegtestralen in banen (stoppen bij een pilaar) */
  startLasers() {
    const ph = this.phase;
    this.setState('laserWind');
    this.windT = [0, 1.05, 0.95, 0.85][ph];
    this.castLasers(false);
  }

  castLasers(second) {
    const ph = this.phase, p = player;
    const base = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
    this.yaw = base;
    let angs;
    if (ph === 1) angs = [base];
    else if (ph === 2) angs = [base - 0.42, base, base + 0.42];
    else angs = [0, 1, 2, 3].map((k) => base + k * Math.PI / 2);        // kruis, de tweede keer opnieuw gericht
    for (const a of angs) this.laserLane(a, second ? 0.9 : this.windT);
    vsnd('charge', this.pos, 0.5);
  }

  laserLane(ang, warn) {
    const fx = Math.sin(ang), fz = Math.cos(ang);
    const y0 = Math.floor(this.info.floorY);
    let len = 1.4;
    while (len < 24) {
      const x = Math.floor(this.pos.x + fx * len), z = Math.floor(this.pos.z + fz * len);
      if (this.world.solidAt(x, y0, z) || this.world.solidAt(x, y0 + 1, z)) break;
      len += 0.4;
    }
    if (len < 2.4) return;
    voidMats();
    const col = PHASE_RGB[this.phase];
    game.addHazard(new LaneHazard({
      x0: this.pos.x + fx * 1.2, z0: this.pos.z + fz * 1.2, x1: this.pos.x + fx * len, z1: this.pos.z + fz * len, y: this.info.floorY,
      width: 1.8, warn, linger: 0.45, color: PHASE_HEX[this.phase], dmg: this.dmg(15), type: 'voidlaser',
      onTrigger: (h) => {
        const g = new THREE.BoxGeometry(1, 1, 1);
        const outer = new THREE.Mesh(g, VC.beamMat), core = new THREE.Mesh(g, VC.beamCoreMat);
        outer.scale.set(0.95, 0.95, h.len); core.scale.set(0.38, 0.38, h.len + 0.1);
        outer.position.y = 1.1; core.position.y = 1.1;
        h.mesh.add(outer, core);
        h.beam = [outer, core];
        vsnd('laser', { x: h.x0, y: h.y, z: h.z0 });
        for (let i = 0; i < 24; i++) {
          const k = Math.random() * h.len;
          FX.glow.spawn(h.x0 + h.dirX * k, h.y + 1.1, h.z0 + h.dirZ * k, (Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3, col[0], col[1], col[2], 0.5, 3, 1);
        }
        if (h.playerInside()) laneHit(h);
      },
      onLinger: (h) => {
        if (!h.beam) return;
        const k = Math.max(0.01, 1 - (h.t - h.warn) / h.linger);
        h.beam[0].scale.x = h.beam[0].scale.y = 0.95 * k;
        h.beam[1].scale.x = h.beam[1].scale.y = 0.38 * k;
        if (h.t - h.warn < 0.3 && h.playerInside()) laneHit(h);
      },
    }));
  }

  /* Leegtebollen in een waaier (terugslaan mag!) */
  shootOrbs(n) {
    const p = player;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const origin = new THREE.Vector3(this.pos.x + fx * 1.3 + rx * 1.4, this.pos.y + 3.0, this.pos.z + fz * 1.3 + rz * 1.4);
    const aim = new THREE.Vector3(p.pos.x, p.pos.y + 1.1, p.pos.z).sub(origin).normalize();
    const speed = 6.5 + this.phase * 0.6;
    for (let i = 0; i < n; i++) {
      const dir = aim.clone().applyAxisAngle(UP, (i - (n - 1) / 2) * 0.32);
      game.addProjectile(voidOrb(origin.clone().addScaledVector(dir, 0.5), dir, speed, this.dmg(14), 0.7));
    }
    SND.play('shoot', { at: origin, range: 40 });
  }

  /* Poorten met kleine versies van oude schurken */
  openGates(n) {
    const p = player, info = this.info, kinds = ['lava', 'ice', 'shadow'];
    const base = Math.random() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = base + i * Math.PI * 2 / n, r = 4.5 + Math.random() * 2.5;
      const s = findSpot(this.world, info, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 0.9, 3, 12);
      const kind = kinds[this.minionIdx++ % 3];
      game.addHazard(new VoidGate(s.x, info.floorY, s.z, (x, y, z) => {
        if (!this.alive()) return;
        const fly = kind !== 'lava';
        game.addMinion(makeVoidMinion(kind, this.world, x, y + (fly ? 1.2 : 0.2), z, this));
      }));
    }
    HUD.actionbar('Poorten naar de leegte! Sla de handlangers weg!', 2);
  }

  /* Teleport: hij verdwijnt en duikt op waar jij staat */
  startTeleport() {
    this.setState('tpOut');
    SND.play('teleport', { at: this.pos, range: 40 });
  }

  teleportStrike() {
    const p = player, info = this.info, ph = this.phase;
    const s = findSpot(this.world, info, p.pos.x + p.vel.x * 0.5, p.pos.z + p.vel.z * 0.5, 1.3, 6, 11.5);
    this.vanish();
    this.setState('tpWait');
    const col = PHASE_RGB[ph];
    this.tpHazard = new GroundHazard({
      x: s.x, y: info.floorY, z: s.z, radius: 2.7, warn: [0, 1.0, 1.0, 0.9][ph], linger: 0.35, color: PHASE_HEX[ph], dmg: this.dmg(16), type: 'boss',
      onTrigger: (h) => {
        if (!this.alive()) return;
        this.appear(h.x, h.z);
        FX.ring(h.x, h.y, h.z, 2.7, col);
        SND.play('slam', { at: { x: h.x, y: h.y, z: h.z }, range: 40 });
        game.shake = Math.max(game.shake, 0.7);
        if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'boss', 10, 7);
      },
      onLinger: () => {},
    });
    game.addHazard(this.tpHazard);
  }

  /* Klonen: drie koningen om je heen, maar maar een is echt */
  makeClones() {
    const p = player, info = this.info;
    const a0 = Math.random() * Math.PI * 2;
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = a0 + i * Math.PI * 2 / 3;
      pts.push(findSpot(this.world, info, p.pos.x + Math.cos(a) * 6.5, p.pos.z + Math.sin(a) * 6.5, 1.0, 5, 12));
    }
    this.vanish();
    this.appear(pts[0].x, pts[0].z);
    for (let i = 1; i < 3; i++) {
      const cl = new Minion(this.world, pts[i].x, info.floorY, pts[i].z, {
        name: 'Spiegelbeeld', hp: 1, speed: 1.7, dmg: this.dmg(12), hw: 0.75, h: 4.4, life: 16, color: [0.6, 0.35, 1], model: () => cloneModel(this),
      });
      cl.isClone = true;
      game.addMinion(cl);
      for (let k = 0; k < 20; k++) FX.glow.spawn(pts[i].x, info.floorY + Math.random() * 4.5, pts[i].z, (Math.random() - 0.5) * 3, 1, (Math.random() - 0.5) * 3, 0.7, 0.4, 1, 0.6, 0, 1);
    }
    HUD.actionbar('Spiegelbeelden! Alleen de echte koning heeft een kroon.', 2.5);
  }

  /* De grote nova: alleen in de witte cirkels ben je veilig */
  castNova() {
    const info = this.info, ac = info.arenaCenter, p = player;
    const pa = Math.atan2(p.pos.z - ac.z, p.pos.x - ac.x);
    const safe = [];
    for (let i = 0; i < 4; i++) {
      const a = pa + i * Math.PI / 2;
      safe.push({ x: ac.x + Math.cos(a) * 8, z: ac.z + Math.sin(a) * 8 });
    }
    const col = PHASE_RGB[3];
    const nova = new GroundHazard({
      x: ac.x, y: info.floorY, z: ac.z, radius: 17, warn: NOVA_WARN, linger: 0.7, color: 0x8a1cff, dmg: this.dmg(18), type: 'nova',
      onTrigger: (h) => {
        if (!this.alive()) return;
        for (let i = 0; i < 160; i++) {
          const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 14;
          FX.glow.spawn(ac.x, info.floorY + 1 + Math.random() * 2, ac.z, Math.cos(a) * s, Math.random() * 3, Math.sin(a) * s, col[0], col[1], col[2], 1.1, 0, 0.6);
        }
        FX.ring(ac.x, info.floorY, ac.z, 12, [0.8, 0.5, 1]);
        vsnd('nova', null, 1);
        SND.play('explode', { vol: 1 });
        game.shake = Math.max(game.shake, 1.2);
        const pp = player;
        const inSafe = safe.some((s) => Math.hypot(pp.pos.x - s.x, pp.pos.z - s.z) < NOVA_SAFE_R + 0.35);
        if (!inSafe && h.playerInside()) damagePlayer(h.dmg, { x: ac.x, y: h.y, z: ac.z }, 'nova', 4, 6);
      },
    });
    game.addHazard(nova);
    for (const s of safe) {
      const hz = new GroundHazard({ x: s.x, y: info.floorY, z: s.z, radius: NOVA_SAFE_R, warn: NOVA_WARN, linger: 0.5, color: 0xfff4c8, dmg: 0, onTrigger: () => {} });
      hz.mesh.position.y += 0.03;
      // witte lichtzuil: hier ben je veilig
      const beam = new THREE.Mesh(sharedGeo('safeBeam', () => new THREE.BoxGeometry(NOVA_SAFE_R * 1.4, 7, NOVA_SAFE_R * 1.4).translate(0, 3.5, 0)), VC.safeMat);
      hz.mesh.add(beam);
      hz.onLinger = (h) => { beam.scale.x = beam.scale.z = Math.max(0.01, 1 - (h.t - h.warn) / h.linger); };
      game.addHazard(hz);
    }
    HUD.actionbar('De NOVA komt! Ga snel in een witte cirkel!', 3);
    vsnd('charge', null, 0.8);
    SND.play('roar', { vol: 0.8 });
  }

  animate(dt) {
    const a = this.anim, m = this.model, ph = this.phase;
    const sway = Math.sin(game.time * 1.6) * 0.08;
    let armA = sway, armB = -sway, armZ = 0.15, head = 0, lean = 0, rise = 0, eye = 1.1, cast = 0, sphere = 0, rate = 8;
    switch (this.state) {
      case 'sleep': case 'idle':
        head = 0.4; lean = 0.15; armA = 0.15; armB = 0.15; eye = this.state === 'sleep' ? 0.35 : 0.7;
        break;
      case 'roar': armA = armB = -2.4; armZ = 0.9; head = -0.45; eye = 2.4; rate = 6; break;
      case 'slamWind': { const k = clamp(this.t / (this.windT || 0.8), 0, 1); armB = -2.9 * easeOut(k); lean = -0.15 * k; eye = 1.8; rate = 12; break; }
      case 'slam': armB = 0.5; lean = 0.3; rate = 30; break;
      case 'holesWind': armA = armB = -2.7; armZ = 0.5; head = -0.3; eye = 2; cast = 1; break;
      case 'laserWind': case 'laser2': armB = -1.55; head = -0.05; eye = 2.8; break;
      case 'orbWind': armA = -1.5; cast = clamp(this.t / 0.7, 0, 1); eye = 1.6; break;
      case 'portalWind': armB = -2.8; armA = -0.8; armZ = 0.6; eye = 1.8; break;
      case 'cloneWind': armA = armB = -1.2; armZ = 1.3; eye = 2.2; break;
      case 'novaWind': armA = armB = -2.95; armZ = 0.3; head = -0.4; rise = 1.4; eye = 3; sphere = clamp(this.t / NOVA_WARN, 0, 1); rate = 5; break;
      case 'phase': armA = armB = -1.0; armZ = 1.4; head = -0.55; rise = 1.3; eye = 3.2; rate = 5; break;
      case 'stagger': head = 0.4 + Math.sin(this.t * 7) * 0.2; lean = 0.3; armA = armB = 0.4; eye = 0.6; break;
      case 'recover': head = 0.15; lean = 0.1; eye = 0.9; break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.armA += (armA - a.armA) * k; a.armB += (armB - a.armB) * k; a.armZ += (armZ - a.armZ) * k;
    a.head += (head - a.head) * k; a.lean += (lean - a.lean) * k; a.rise += (rise - a.rise) * Math.min(1, dt * 3);
    a.eye += (eye - a.eye) * Math.min(1, dt * 6);
    m.inner.position.set(0, 0.28 + Math.sin(game.time * 2.1) * 0.12 + a.rise, 0);
    const sc = this.fade * (ph === 3 ? 1.1 : 1);
    m.inner.scale.setScalar(Math.max(0.01, sc));
    m.arms[0].rotation.x = a.armA; m.arms[1].rotation.x = a.armB;
    m.arms[0].rotation.z = a.armZ; m.arms[1].rotation.z = -a.armZ;
    m.head.rotation.x = a.head; m.torso.rotation.x = a.lean;
    m.halo.rotation.z += dt * (0.5 + ph * 0.35);
    m.ring.rotation.z -= dt * (0.8 + ph * 0.3);
    const ot = game.time * (1.1 + ph * 0.5);
    for (let i = 0; i < 3; i++) {
      const ang = ot + i * 2.094;
      m.orbits[i].position.set(Math.cos(ang) * 2.2, 3.8 + Math.sin(ot * 1.7 + i) * 0.4, Math.sin(ang) * 2.2);
      m.orbits[i].rotation.set(ot * 2, ot * 3, 0);
    }
    m.face.emissiveIntensity = a.eye;
    m.castOrb.visible = cast > 0.05;
    m.castOrb.scale.setScalar(0.3 + cast * 0.9);
    m.sphere.visible = sphere > 0.01;
    if (sphere > 0) { m.sphere.scale.setScalar(0.6 + sphere * 2.6); m.sphere.rotation.set(game.time * 1.5, game.time * 2, 0); }
  }
}

const UP = new THREE.Vector3(0, 1, 0);
const FLASH_COL = new THREE.Color(1, 0.35, 0.35);
const NOVA_WARN = 3.2, NOVA_SAFE_R = 2.1;

// In het midden van een zwart gat: au, en je wordt eruit geslingerd (even geen zuigkracht)
function holeHit(h) {
  const p = player;
  let dx = p.pos.x - h.x, dz = p.pos.z - h.z;
  if (Math.hypot(dx, dz) < 0.3) { const a = Math.random() * Math.PI * 2; dx = Math.cos(a); dz = Math.sin(a); }
  const d = Math.hypot(dx, dz);
  damagePlayer(h.dmg, { x: p.pos.x - dx / d, y: h.y, z: p.pos.z - dz / d }, 'blackhole', 11, 6);
  h.coreCD = 1.4;
}

// Raak in een straal: zijwaarts weggeduwd
function laneHit(h) {
  const p = player;
  const px = p.pos.x - h.x0, pz = p.pos.z - h.z0;
  const s = px * h.dirZ - pz * h.dirX >= 0 ? 1 : -1;
  damagePlayer(h.dmg, { x: p.pos.x - h.dirZ * s, y: h.y, z: p.pos.z + h.dirX * s }, 'voidlaser', 7, 5);
}

/* ---------- Afbrokkelende rand ---------- */
function startCrumble(list, world) {
  const F = VOID_FX;
  const todo = list.slice().sort((a, b) => b.d - a.d);
  for (const c of todo) if (world.get(c.x, F_TOP, c.z) !== B.AIR) world.set(c.x, F_TOP, c.z, B.VOID_CRACKED);
  F.crumble = F.crumble.concat(todo);
  F.crumbleT = -1.6;              // eerst barsten, dan vallen
  F.crumbleRate = Math.max(40, todo.length / 1.6);
  vsnd('crumble', null, 0.8);
}
const F_TOP = F;

function updateCrumble(dt, info) {
  const V = VOID_FX, w = info.world;
  if (!V.crumble.length) return;
  V.crumbleT += dt;
  if (V.crumbleT < 0) {
    if (Math.random() < dt * 30) {
      const c = V.crumble[Math.floor(Math.random() * V.crumble.length)];
      FX.glow.spawn(c.x + Math.random(), F_TOP + 1.05, c.z + Math.random(), 0, 0.8, 0, 0.9, 0.4, 1, 0.5, 0, 0);
    }
    return;
  }
  let n = Math.floor(V.crumbleT * V.crumbleRate);
  V.crumbleT -= n / V.crumbleRate;
  while (n-- > 0 && V.crumble.length) {
    const c = V.crumble.shift();
    for (let y = c.bottom - 5; y <= F_TOP; y++) if (w.get(c.x, y, c.z) !== B.AIR) w.set(c.x, y, c.z, B.AIR);
    if (Math.random() < 0.35) {
      const col = sampleTileColor(T.VOID_STONE);
      for (let i = 0; i < 3; i++) FX.debris.spawn(c.x + Math.random(), F_TOP + Math.random(), c.z + Math.random(), (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2, col[0], col[1], col[2], 2.5, 14, 0.2);
    }
    if (Math.random() < 0.05) SND.play('break', { at: { x: c.x, y: F_TOP, z: c.z }, range: 40, vol: 0.6 });
  }
}

/* ---------- Sterren en de draaikolk onder het platform ---------- */
function voidEnter(info) {
  voidMats();
  if (typeof DEATH_REASONS !== 'undefined') {
    Object.assign(DEATH_REASONS, {
      blackhole: 'Opgeslokt door een zwart gat',
      voidlaser: 'Geraakt door een leegtestraal',
      voidorb: 'Geraakt door een leegtebol',
      nova: 'Weggevaagd door de leegtenova',
    });
  }
  const V = VOID_FX;
  V.crumble = []; V.crumbleT = 0; V.whisperT = 6;
  if (!VC.stars) {
    const R = mulberry32(1313);
    const n = 900, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * s * 160; pos[i * 3 + 1] = u * 160; pos[i * 3 + 2] = Math.sin(a) * s * 160;
      const k = R(), b = 0.45 + R() * 0.55;
      const c = k < 0.65 ? [b, b, b] : k < 0.85 ? [b * 0.8, b * 0.55, b] : [b * 0.55, b * 0.7, b];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.userShared = true;
    VC.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
    VC.stars.frustumCulled = false;
    VC.stars.renderOrder = -10;
    const vg = new THREE.PlaneGeometry(150, 150);
    vg.userShared = true;
    VC.vortexMesh = new THREE.Mesh(vg, new THREE.MeshBasicMaterial({ map: VC.vortex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    VC.vortexMesh.rotation.x = -Math.PI / 2;
    VC.vortexMesh.renderOrder = -9;
  }
  VC.stars.position.set(info.arenaCenter.x, info.floorY, info.arenaCenter.z);
  VC.vortexMesh.position.set(info.arenaCenter.x, info.floorY - 34, info.arenaCenter.z);
  game.realmGroup.add(VC.stars);
  game.realmGroup.add(VC.vortexMesh);
  V.vortex = VC.vortexMesh;
  // shaders vooraf klaarzetten, zodat de eerste aanval niet hapert
  try {
    const warm = [voidOrb(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 1, 1).mesh, lavaBlobModel().group, iceWispModel().group, shadowOrbModel().group, cloneModel(game.boss).group];
    for (const m of warm) { m.position.set(info.arenaCenter.x, -40, info.arenaCenter.z); game.realmGroup.add(m); }
    game.renderer.compile(game.scene, game.camera);
    for (const m of warm) game.realmGroup.remove(m);
  } catch (e) { /* niet erg */ }
}

function voidAmbience(dt, info) {
  const p = player, V = VOID_FX, ac = info.arenaCenter;
  // paarse stofjes stijgen op uit de leegte
  V.dustT += dt * 16;
  while (V.dustT > 1) {
    V.dustT -= 1;
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 24;
    const k = Math.random();
    FX.glow.spawn(p.pos.x + Math.cos(a) * r, info.floorY - 8 - Math.random() * 10, p.pos.z + Math.sin(a) * r, 0, 1.5 + Math.random() * 1.5, 0,
      0.5 + k * 0.4, 0.3 + k * 0.3, 0.9 + k * 0.1, 6, 0, 0);
  }
  // tranen van de pilaren
  V.tearT -= dt;
  if (V.tearT <= 0 && info.pillars.length) {
    V.tearT = 0.12;
    const pl = info.pillars[Math.floor(Math.random() * info.pillars.length)];
    const side = Math.random() < 0.5 ? -1.05 : 1.05;
    FX.glow.spawn(pl.x + (Math.random() < 0.5 ? side : (Math.random() - 0.5) * 2), info.floorY + 1 + Math.random() * 6, pl.z + (Math.random() < 0.5 ? side : (Math.random() - 0.5) * 2),
      0, -0.5, 0, 0.85, 0.45, 1, 1.4, 3, 0);
  }
  if (V.vortex) V.vortex.rotation.z += dt * 0.12;
  updateCrumble(dt, info);
  // na het gevecht: het zegel gloeit goud en gaat open als je er een stukje van breekt
  const w = info.world;
  if (PROG.phase !== 'boss' && !info.sealOpen) {
    info.sealOpen = 1;
    for (const [x, y, z] of info.seal) {
      if (w.get(x, y, z) === B.VOID_SEAL_LOCKED) w.set(x, y, z, B.VOID_SEAL);
      for (let i = 0; i < 6; i++) FX.glow.spawn(x + Math.random(), y + 1.1, z + Math.random(), 0, 2 + Math.random() * 2, 0, 1, 0.85, 0.35, 1.2, 0, 0);
    }
    SND.play('levelup', { vol: 0.6 });
  }
  if (info.sealOpen === 1) {
    if (Math.random() < dt * 14) FX.glow.spawn(ac.x - 1.5 + Math.random() * 3, info.floorY + 0.1, ac.z - 1.5 + Math.random() * 3, 0, 1.6, 0, 1, 0.85, 0.35, 1.3, 0, 0);
    if (info.seal.some(([x, y, z]) => w.get(x, y, z) !== B.VOID_SEAL)) {
      info.sealOpen = 2;
      for (const [x, y, z] of info.seal) {
        const id = w.get(x, y, z);
        if (id !== B.AIR) { w.set(x, y, z, B.AIR); FX.blockBreak(x, y, z, id); }
      }
      SND.play('break', { vol: 1 });
      SND.play('levelup', { vol: 0.5 });
      HUD.actionbar('Het zegel is open! Ga de trap af naar de schat.', 3);
    }
  }
  // af en toe gefluister uit de leegte
  V.whisperT -= dt;
  if (V.whisperT <= 0) { V.whisperT = 8 + Math.random() * 10; vsnd('whisper', null, 1); }
}

registerRealm('void', {
  gen: genVoid,
  makeBoss: (world, info) => new VoidKing(world, info),
  atmosphere: { background: 0x05030c, fog: 0x0b0718, near: 34, far: 100, amb: 0xd8ccff, ambI: 0.9, dir: 0xc4a8ff, dirI: 0.45, hand: 0xe2d8ff },
  intro: 'Dit is De Leegte, waar alles eindigt. Op de troon van niets wacht de Leegtekoning op de allerlaatste held... ben jij dat?',
  tip: 'Tip: loop weg uit de zwarte gaten en sla zijn paarse bollen terug!',
  treasureTip: 'De grote rune in het midden gloeit goud! Hak hem kapot en ga de trap af.',
  ambience: voidAmbience,
  ambientSound: 0.5,
  fallLimit: F - 10,
  onEnter: voidEnter,
  ruin: [B.VOID_STONE, B.VOID_CRYING, B.VOID_BRICKS, B.VOID_LAMP],
});

// Voor testen en ontwikkelen
window.LEEGTE = { gen: genVoid, Boss: VoidKing, fx: VOID_FX, cache: VC };
})();
