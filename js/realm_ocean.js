'use strict';
/* Portaaljacht – wereld 7: De Diepe Zee met De Kraak (tentakelklap, waterstraal, inktwolk, draaikolk) */
(() => {

/* ---------- Blokken ---------- */
defineTile('OCEAN_PRISMARINE', (h) => {
  const g = [];
  for (let i = 0; i < 256; i++) g.push(h.R());
  return (x, y) => {
    const v = (g[y * 16 + x] * 2 + g[((y + 1) & 15) * 16 + x] + g[y * 16 + ((x + 1) & 15)]) / 4;
    if (v > 0.7) return h.vary([150, 214, 198], 6);
    if (v > 0.52) return h.vary([110, 172, 162], 5);
    if (v < 0.3) return h.vary([70, 120, 118], 5);
    return h.vary([92, 150, 144], 5);
  };
});
defineTile('OCEAN_PRISMARINE_BRICKS', (h) => (x, y) => {
  const row = y >> 2, off = (row % 2) * 4;
  if (y % 4 === 3 || (x + off) % 8 === 7) return h.vary([78, 128, 120], 4);
  if (y % 4 === 0) return h.vary([168, 220, 206], 5);
  return h.vary(h.R() < 0.2 ? [150, 206, 192] : [134, 192, 178], 5);
});
defineTile('OCEAN_DARK_PRISMARINE', (h) => (x, y) => {
  if (x % 8 === 0 || y % 8 === 0) return h.vary([28, 54, 44], 3);
  if (x % 8 === 1 || y % 8 === 1) return h.vary([70, 118, 98], 4);
  return h.vary(h.R() < 0.25 ? [60, 104, 86] : [50, 90, 74], 5);
});
defineTile('OCEAN_SEA_LANTERN', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([168, 206, 200], 4);
  if (x === 7 || x === 8 || y === 7 || y === 8) return h.vary([184, 222, 214], 4);
  const ix = x < 7 ? x - 1 : x - 9, iy = y < 7 ? y - 1 : y - 9;
  if (ix >= 1 && ix <= 4 && iy >= 1 && iy <= 4) return h.vary([248, 255, 252], 3);
  return h.vary([214, 240, 234], 4);
});
defineTile('OCEAN_CORAL_TUBE', (h) => (x, y) => ((x * 5 + y * 3) % 7 === 0 || (x * 3 + y * 7) % 11 === 0 ? h.vary([30, 52, 150], 6) : h.vary([54, 96, 220], 8)));
defineTile('OCEAN_CORAL_BRAIN', (h) => (x, y) => (Math.sin(x * 1.3 + Math.sin(y * 0.9) * 2) > 0.45 ? h.vary([168, 58, 128], 6) : h.vary([222, 104, 170], 8)));
defineTile('OCEAN_CORAL_HORN', (h) => (x, y) => ((x + y * 2) % 5 === 0 ? h.vary([176, 146, 34], 6) : h.vary([226, 204, 70], 8)));

defineBlock('OCEAN_PRISMARINE', { name: 'Prismarien', tiles: all(T.OCEAN_PRISMARINE), hard: 1.0 });
defineBlock('OCEAN_PRISMARINE_BRICKS', { name: 'Prismarienstenen', tiles: all(T.OCEAN_PRISMARINE_BRICKS), hard: 1.2 });
defineBlock('OCEAN_DARK_PRISMARINE', { name: 'Donker prismarien', tiles: all(T.OCEAN_DARK_PRISMARINE), hard: 1.2 });
defineBlock('OCEAN_SEA_LANTERN', { name: 'Zeelantaarn', tiles: all(T.OCEAN_SEA_LANTERN), hard: 0.3, glow: true, sound: 'glass' });
defineBlock('OCEAN_CORAL_TUBE', { name: 'Blauw koraal', tiles: all(T.OCEAN_CORAL_TUBE), hard: 0.4 });
defineBlock('OCEAN_CORAL_BRAIN', { name: 'Roze koraal', tiles: all(T.OCEAN_CORAL_BRAIN), hard: 0.4 });
defineBlock('OCEAN_CORAL_HORN', { name: 'Geel koraal', tiles: all(T.OCEAN_CORAL_HORN), hard: 0.4 });

/* ---------- De wereld ---------- */
const S = 80, H = 40, C = 40, W = 8, F = 10, FY = 11;
const POOL_R = 10, RIM_R = 11.3, RING_R = 18, CLIFF_TOP = 19;
const SUB_Y = 0.6, LOW_Y = 6.0, RAISE_Y = 8.2;

// Alles wordt in een vaste opstelling gebouwd en daarna een kwartslag (0..3) gedraaid
function genOcean(seed) {
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand), n3 = new Noise2D(rand);
  const rot = Math.floor(rand() * 4);
  const L = new Uint8Array(S * H * S);
  const inb = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < S && y < H && z < S;
  const set = (x, y, z, id) => { if (inb(x, y, z)) L[(y * S + z) * S + x] = id; };
  const get = (x, y, z) => (inb(x, y, z) ? L[(y * S + z) * S + x] : B.AIR);

  // Platforms: hoogte van het bovenste blok per kolom (-1 = geen)
  const lvl = new Int8Array(S * S).fill(-1);
  const deck = new Uint8Array(S * S);
  const up = (x, z, v) => { if (x >= 0 && z >= 0 && x < S && z < S && v > lvl[z * S + x]) lvl[z * S + x] = v; };
  const pads = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    pads.push({ x: C + Math.cos(a) * RING_R, z: C + Math.sin(a) * RING_R });
  }
  for (const pd of pads) {
    for (let z = Math.floor(pd.z - 7); z <= pd.z + 7; z++) {
      for (let x = Math.floor(pd.x - 7); x <= pd.x + 7; x++) {
        const d = Math.hypot(x + 0.5 - pd.x, z + 0.5 - pd.z);
        up(x, z, d <= 4.6 ? F : d <= 5.4 ? F - 1 : d <= 6.2 ? W : -1);
      }
    }
  }
  // steiger voor de klif met de waterval
  for (let z = 8; z <= 16; z++) {
    for (let x = 34; x <= 46; x++) {
      if (x >= 36 && x <= 44 && z <= 14) up(x, z, F);
      else if (x >= 35 && x <= 45 && z <= 15) up(x, z, F - 1);
      else up(x, z, W);
    }
  }
  for (let z = 13; z <= 18; z++) for (let x = 39; x <= 41; x++) up(x, z, F);
  // bruggen tussen de eilanden (3 breed)
  const pillars = [];
  for (let i = 0; i < 6; i++) {
    const a = pads[i], b = pads[(i + 1) % 6];
    const len = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / len, uz = (b.z - a.z) / len;
    for (let z = Math.floor(Math.min(a.z, b.z) - 2); z <= Math.max(a.z, b.z) + 2; z++) {
      for (let x = Math.floor(Math.min(a.x, b.x) - 2); x <= Math.max(a.x, b.x) + 2; x++) {
        const px = x + 0.5 - a.x, pz = z + 0.5 - a.z;
        const t = px * ux + pz * uz, perp = Math.abs(-px * uz + pz * ux);
        if (t < 0 || t > len || perp > 1.5) continue;
        if (lvl[z * S + x] < 0) deck[z * S + x] = perp > 1.0 ? 2 : 1;
        up(x, z, F);
      }
    }
    pillars.push({ x: Math.floor(a.x + ux * len / 2), z: Math.floor(a.z + uz * len / 2) });
  }

  const floorTop = new Int8Array(S * S);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - C, dz = z + 0.5 - C, d = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
      const LR = 35 + n1.noise(Math.cos(ang) * 1.7 + 5.3, Math.sin(ang) * 1.7 + 5.3) * 3.5;
      const dockArea = x >= 30 && x <= 57;
      const cliff = dockArea ? z <= 7 : d > LR;
      set(x, 0, z, B.BEDROCK);
      if (cliff) {
        // Kliffen rondom de lagune, met een strandje aan het water
        let top;
        const e = dockArea ? 6 : d - LR;
        if (dockArea && x >= 34 && x <= 46) top = CLIFF_TOP;
        else if (e < 1.2) top = W;
        else if (e < 2.2) top = W + 1;
        else top = W + 4 + Math.floor((n2.fbm(x / 9, z / 9, 3) + 0.5) * 7) + Math.min(6, Math.floor(e * 0.7));
        if (dockArea) top = Math.max(top, 15);
        top = Math.min(top, H - 8);
        const beach = top <= W + 1;
        for (let y = 1; y <= top; y++) {
          let id;
          if (beach) id = y >= top - 1 ? B.SAND : B.STONE;
          else if (y === top) id = B.GRASS;
          else if (y >= top - 2) id = B.DIRT;
          else if (y <= W + 1 && rand() < 0.14) id = B.OCEAN_PRISMARINE;
          else id = rand() < 0.06 ? B.GRAVEL : B.STONE;
          set(x, y, z, id);
        }
        floorTop[z * S + x] = top;
        continue;
      }
      // Bodem van de lagune; de poel in het midden is heel diep
      let fy = 3 + Math.floor((n3.fbm(x / 8, z / 8, 2) + 0.5) * 3);
      if (dockArea && z >= 8 && z <= 10 && x >= 47) fy = 2;     // vrij uitzicht voor de ramen
      if (d < POOL_R) {
        fy = 0;
        set(x, 0, z, B.OCEAN_DARK_PRISMARINE);
      } else {
        for (let y = 1; y <= fy; y++) set(x, y, z, y === fy ? (n3.noise(x / 6 + 9, z / 6) > 0.22 ? B.GRAVEL : B.SAND) : (y < fy - 1 ? B.STONE : B.SAND));
      }
      floorTop[z * S + x] = fy;
      for (let y = fy + 1; y <= W; y++) set(x, y, z, B.WATER);
      if (d >= POOL_R && d < RIM_R) {
        for (let y = 1; y <= W; y++) set(x, y, z, y === W ? B.OCEAN_DARK_PRISMARINE : B.OCEAN_PRISMARINE_BRICKS);
      }
      const L0 = lvl[z * S + x];
      if (L0 >= 0) {
        const dk = deck[z * S + x];
        for (let y = dk ? F - 1 : fy + 1; y <= L0; y++) set(x, y, z, B.OCEAN_PRISMARINE);
        set(x, L0, z, L0 === F ? (dk === 2 ? B.OCEAN_DARK_PRISMARINE : B.OCEAN_PRISMARINE_BRICKS) : L0 === F - 1 ? B.OCEAN_PRISMARINE : B.OCEAN_DARK_PRISMARINE);
      }
    }
  }

  // Eilanden versieren: zeelantaarn in het midden, donkere rand, lantaarns op de onderste trede
  for (const pd of pads) {
    for (let z = Math.floor(pd.z - 5); z <= pd.z + 5; z++) {
      for (let x = Math.floor(pd.x - 5); x <= pd.x + 5; x++) {
        const d = Math.hypot(x + 0.5 - pd.x, z + 0.5 - pd.z);
        if (d > 3.7 && d <= 4.6 && lvl[z * S + x] === F && !deck[z * S + x]) set(x, F, z, B.OCEAN_DARK_PRISMARINE);
      }
    }
    set(Math.floor(pd.x), F, Math.floor(pd.z), B.OCEAN_SEA_LANTERN);
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + 0.5;
      const x = Math.floor(pd.x + Math.cos(a) * 5.8), z = Math.floor(pd.z + Math.sin(a) * 5.8);
      if (lvl[z * S + x] === W && get(x, W, z) === B.OCEAN_DARK_PRISMARINE) set(x, W, z, B.OCEAN_SEA_LANTERN);
    }
  }
  // pilaren onder de bruggen
  for (const p of pillars) {
    for (let dz = 0; dz < 2; dz++) {
      for (let dx = 0; dx < 2; dx++) {
        const x = p.x + dx, z = p.z + dz;
        if (!deck[z * S + x]) continue;
        for (let y = floorTop[z * S + x] + 1; y <= F - 2; y++) set(x, y, z, B.OCEAN_DARK_PRISMARINE);
      }
    }
  }
  // lantaarns op de rand van de poel en diep op de bodem
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    set(Math.floor(C + Math.cos(a) * 10.6), W, Math.floor(C + Math.sin(a) * 10.6), B.OCEAN_SEA_LANTERN);
  }
  for (let k = 0; k < 7; k++) {
    const a = rand() * Math.PI * 2, r = 2 + rand() * 6;
    set(Math.floor(C + Math.cos(a) * r), 0, Math.floor(C + Math.sin(a) * r), B.OCEAN_SEA_LANTERN);
  }

  // Waterval van de klif, met daarachter de grot
  for (let x = 38; x <= 42; x++) {
    for (let z = 8; z <= 9; z++) set(x, F, z, B.WATER);               // kom onder de waterval
    for (let y = F + 1; y <= CLIFF_TOP; y++) set(x, y, 8, B.WATER);   // het watergordijn
    for (let z = 2; z <= 7; z++) set(x, CLIFF_TOP, z, B.WATER);       // beekje bovenop
  }
  for (let x = 39; x <= 41; x++) {
    for (let z = 5; z <= 7; z++) {
      set(x, 9, z, B.OCEAN_PRISMARINE_BRICKS);
      for (let y = 10; y <= 12; y++) set(x, y, z, B.AIR);
    }
  }
  // trap naar beneden, de zee in
  for (let i = 0; i <= 5; i++) {
    const x = 42 + i, s = 9 - i;
    for (let z = 4; z <= 7; z++) {
      for (let y = s - 1; y <= s + 4; y++) {
        const inside = z >= 5 && z <= 6 && y >= s && y <= s + 3;
        if (inside) set(x, y, z, B.AIR);
        else if (get(x, y, z) !== B.AIR) set(x, y, z, y === s - 1 ? B.OCEAN_PRISMARINE_BRICKS : B.OCEAN_PRISMARINE);
      }
    }
  }
  // de verzonken schatkamer
  for (let x = 47; x <= 54; x++) {
    for (let z = 1; z <= 7; z++) {
      for (let y = 3; y <= 7; y++) {
        const room = x >= 48 && x <= 53 && z >= 2 && z <= 6 && y >= 4 && y <= 6;
        if (room) set(x, y, z, B.AIR);
        else if (get(x, y, z) !== B.AIR) set(x, y, z, B.OCEAN_PRISMARINE_BRICKS);
      }
    }
  }
  for (const [x, y, z] of [[50, 5, 7], [51, 5, 7], [50, 6, 7], [51, 6, 7]]) set(x, y, z, B.GLASS);
  for (const [x, y, z] of [[37, CLIFF_TOP, 7], [43, CLIFF_TOP, 7], [38, 11, 7], [42, 11, 7], [40, 13, 7], [45, 8, 4], [49, 7, 3], [52, 7, 5], [54, 5, 4]]) set(x, y, z, B.OCEAN_SEA_LANTERN);
  set(48, 4, 2, B.OCEAN_CORAL_TUBE); set(53, 4, 2, B.OCEAN_CORAL_BRAIN); set(53, 4, 6, B.OCEAN_CORAL_HORN);
  set(50, 3, 4, B.GOLD);
  set(50, 4, 4, B.CHEST);

  // Aankomstportaal op het zuidelijke eiland
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      set(C + i, y, 61, frame ? B.OBSIDIAN : B.PORTAL);
    }
    for (let z = 60; z <= 62; z++) if (lvl[z * S + C + i] === F) set(C + i, F, z, B.OBSIDIAN);
  }

  // Koraal op de bodem
  const corals = [B.OCEAN_CORAL_TUBE, B.OCEAN_CORAL_BRAIN, B.OCEAN_CORAL_HORN];
  const free = (x, z) => x > 1 && z > 1 && x < S - 2 && z < S - 2 && lvl[z * S + x] < 0 && get(x, W, z) === B.WATER;
  for (let i = 0; i < 46; i++) {
    let x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
    const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
    if (d < RIM_R + 1.5) continue;
    const id = corals[Math.floor(rand() * 3)];
    for (let k = 0; k < 3 + rand() * 5; k++) {
      if (free(x, z)) {
        const fy = floorTop[z * S + x];
        if (fy + 1 <= W - 2 && get(x, fy + 1, z) === B.WATER) {
          set(x, fy + 1, z, id);
          if (rand() < 0.35 && fy + 2 <= W - 2) set(x, fy + 2, z, id);
        }
      }
      x += Math.floor(rand() * 3) - 1; z += Math.floor(rand() * 3) - 1;
    }
  }
  // Rotspilaren en ingestorte zuilen in de lagune
  const nearPlat = (x, z, r) => {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, zz = z + dz;
      if (xx < 0 || zz < 0 || xx >= S || zz >= S || lvl[zz * S + xx] >= 0) return true;
    }
    return false;
  };
  let stacks = 0;
  for (let tries = 0; tries < 200 && stacks < 11; tries++) {
    const a = rand() * Math.PI * 2, r = 23 + rand() * 9;
    const x = Math.floor(C + Math.cos(a) * r), z = Math.floor(C + Math.sin(a) * r);
    if (z < 20 && x > 26 && x < 60) continue;            // vrij zicht op de waterval
    if (!free(x, z) || nearPlat(x, z, 4)) continue;
    stacks++;
    if (stacks <= 5) {
      const rr = 1.3 + rand() * 1.2, top = W + 3 + Math.floor(rand() * 7);
      for (let dz = -3; dz <= 3; dz++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (Math.hypot(dx, dz) > rr + (rand() < 0.3 ? 0.5 : 0)) continue;
          const xx = x + dx, zz = z + dz;
          if (!free(xx, zz)) continue;
          const t = top - (Math.hypot(dx, dz) > rr - 0.8 ? Math.floor(rand() * 2) : 0);
          for (let y = floorTop[zz * S + xx] + 1; y <= t; y++) set(xx, y, zz, y === t ? B.GRASS : y >= t - 1 ? B.DIRT : (rand() < 0.15 ? B.MOSSY_STONE_BRICKS : B.STONE));
        }
      }
    } else {
      const top = W - 2 + Math.floor(rand() * 6);
      for (let dz = 0; dz < 2; dz++) {
        for (let dx = 0; dx < 2; dx++) {
          const xx = x + dx, zz = z + dz;
          if (!free(xx, zz)) continue;
          const t = top - Math.floor(rand() * 3);
          for (let y = floorTop[zz * S + xx] + 1; y <= t; y++) set(xx, y, zz, (y + dx + dz) % 4 === 0 ? B.OCEAN_DARK_PRISMARINE : B.OCEAN_PRISMARINE_BRICKS);
        }
      }
    }
  }

  // Draaien en in de echte wereld zetten
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rotI = (x, z) => (rot === 0 ? [x, z] : rot === 1 ? [S - 1 - z, x] : rot === 2 ? [S - 1 - x, S - 1 - z] : [z, S - 1 - x]);
  const rotF = (x, z) => (rot === 0 ? [x, z] : rot === 1 ? [S - z, x] : rot === 2 ? [S - x, S - z] : [z, S - x]);
  for (let y = 0; y < H; y++) {
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const id = L[(y * S + z) * S + x];
        if (!id) continue;
        const [wx, wz] = rotI(x, z);
        w.setRaw(wx, y, wz, id);
      }
    }
  }
  w.portalAxis = rot % 2 ? 'z' : 'x';
  w.computeTops();

  const [sx, sz] = rotF(41, 58.5);
  const [px, pz] = rotF(41, 61.5);
  const [tx, tz] = rotI(50, 4);
  const fa = rotF(38, 8.5), fb = rotF(43, 8.5), fm = rotF(40.5, 7);
  return {
    world: w,
    spawn: { x: sx, y: FY, z: sz },
    spawnYaw: Math.atan2(-(C - sx), -(C - sz)),
    bossSpawn: { x: C, y: SUB_Y, z: C },
    portal: { x: px, y: F + 3.5, z: pz },
    portalAxis: w.portalAxis,
    arenaCenter: { x: C, z: C }, arenaRadius: 24, floorY: FY,
    treasure: { x: tx, y: 4, z: tz },
    fall: { ax: fa[0], az: fa[1], bx: fb[0], bz: fb[1], mx: fm[0], mz: fm[1] },
    rot,
  };
}

/* ---------- De Kraak ---------- */
const KR = {};
function buildKrakenTextures() {
  const R = mulberry32(7007);
  const spot = new Uint8Array(256);
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(R() * 15), y = Math.floor(R() * 15);
    spot[y * 16 + x] = 1;
    if (R() < 0.6) spot[y * 16 + x + 1] = 1;
    if (R() < 0.4) spot[(y + 1) * 16 + x] = 1;
  }
  const skin = (x, y) => {
    if (spot[y * 16 + x]) return [222, 104, 112];
    const r = R();
    return r < 0.3 ? [124, 32, 50] : r < 0.7 ? [146, 42, 60] : [164, 54, 70];
  };
  KR.skin = pixelTexture(16, 16, skin);
  KR.skinGlow = pixelTexture(16, 16, (x, y) => (spot[y * 16 + x] ? [255, 70, 160] : [0, 0, 0]));
  KR.belly = pixelTexture(16, 16, (x, y) => {
    const cx = x % 8 - 3.5, cy = y % 8 - 3.5, d = Math.hypot(cx, cy);
    if (d < 1.3) return [150, 60, 84];
    if (d < 2.6) return [204, 112, 126];
    return R() < 0.3 ? [226, 158, 160] : [238, 172, 170];
  });
  const eye = (red) => (x, y) => {
    if (x === 0 || y === 0 || x === 7 || y === 7) return [52, 12, 24];
    if ((y === 3 || y === 4) && x >= 2 && x <= 5) return [12, 4, 10];
    if (x === 2 && y === 2) return [255, 255, 240];
    if (red) return (x + y) % 3 === 0 ? [255, 40, 30] : [255, 90, 50];
    return (x + y) % 3 === 0 ? [255, 160, 20] : [255, 214, 50];
  };
  const eyeGlow = (red) => (x, y) => {
    if (x === 0 || y === 0 || x === 7 || y === 7 || ((y === 3 || y === 4) && x >= 2 && x <= 5)) return [0, 0, 0];
    return red ? [255, 60, 40] : [255, 200, 60];
  };
  KR.eye = pixelTexture(8, 8, eye(false));
  KR.eyeGlow = pixelTexture(8, 8, eyeGlow(false));
  KR.eyeRed = pixelTexture(8, 8, eye(true));
  KR.eyeRedGlow = pixelTexture(8, 8, eyeGlow(true));
  KR.beak = pixelTexture(8, 8, (x, y) => (y >= 6 ? [120, 108, 100] : R() < 0.3 ? [46, 38, 42] : [62, 52, 56]));
  KR.whirl = pixelTexture(32, 32, (x, y) => {
    const dx = x - 15.5, dy = y - 15.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (r > 15.6) return null;
    if (r < 2.6) return [6, 30, 48, 235];
    const s = Math.sin(a * 3 + r * 0.6);
    if (s > 0.55) return [232, 250, 255, 220];
    if (s > 0.05) return [120, 210, 226, 150];
    return [16, 84, 116, 120];
  });
  KR.bubble = pixelTexture(8, 8, (x, y) => {
    if (x === 2 && y === 2) return [255, 255, 255, 255];
    if (x === 0 || y === 0 || x === 7 || y === 7) return [210, 248, 255, 220];
    return [150, 220, 255, 70];
  });
}

// Gedeelde vormen voor de projectielen
const PR = {};
function projParts() {
  if (PR.drop) return PR;
  PR.drop = new THREE.BoxGeometry(0.34, 0.34, 0.34);
  PR.bubble = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  PR.ink = new THREE.BoxGeometry(0.75, 0.75, 0.75);
  for (const g of [PR.drop, PR.bubble, PR.ink]) g.userShared = true;
  PR.dropMat = new THREE.MeshBasicMaterial({ color: 0xaef4ff });
  PR.bubbleMat = new THREE.MeshBasicMaterial({ map: KR.bubble, transparent: true, depthWrite: false });
  PR.inkMat = new THREE.MeshLambertMaterial({ color: 0x24102e });
  return PR;
}
// Water spat stil uiteen (geen ontploffingsgeluid)
function quiet(pr) {
  pr.explode = function (loud, noSplash) { Projectile.prototype.explode.call(this, false, noSplash); };
  return pr;
}

function splashFx(x, y, z, n, spread) {
  for (let i = 0; i < n; i++) {
    FX.debris.spawn(x + (Math.random() - 0.5) * spread, y + 0.2, z + (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 4, 0.8, 0.95, 1, 0.7, 16, 0.3, false);
  }
  for (let i = 0; i < n / 2; i++) FX.glow.spawn(x + (Math.random() - 0.5) * spread, y + 0.3, z + (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2, 0.75, 0.95, 1, 0.6, 9, 0.5);
}
function inkFx(x, y, z, n, spread, up) {
  for (let i = 0; i < n; i++) {
    const g = Math.random() * 0.12;
    FX.debris.spawn(x + (Math.random() - 0.5) * spread, y + Math.random() * 1.2, z + (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 1.5, (up || 0.4) + Math.random(), (Math.random() - 0.5) * 1.5, 0.1 + g, 0.04 + g * 0.5, 0.16 + g, 1.1 + Math.random() * 0.8, 0, 1.5, false);
  }
}

const NSEG = 9;
// Eén vlak van een doos krijgt materiaal 1, de rest materiaal 0 (3 tekenbeurten in plaats van 6)
function faceGroups(g, face) {
  g.clearGroups();
  const s = face * 6;
  if (s > 0) g.addGroup(0, s, 0);
  g.addGroup(s, 6, 1);
  if (s + 6 < 36) g.addGroup(s + 6, 30 - s, 0);
  return g;
}
class Kraken extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Kraak', ref: 'de Kraak', hp: 640, hw: 1.3, h: 4.8, deathTiles: [T.OCEAN_PRISMARINE, T.WATER, T.OCEAN_CORAL_BRAIN], wakeRange: 14.5 });
    this.flying = true;
    this.anim = { beak: 0.1, swell: 1, tilt: 0, armAmp: 0.2, eye: 0.3, armRate: 1 };
    this.gx = this.pos.x; this.gy = this.pos.y; this.gz = this.pos.z; this.gr = 2;
    this.rx = this.pos.x; this.rz = this.pos.z; this.raiseT = 3.6;
    this.lastAtk = null; this.lastOther = null;
    this.whirlOn = false; this.whirlA = 0; this.chompHz = null;
    this.slamEnd = 0; this.shots = 0; this.shotT = 0; this.roarT = 0;
    this.farBox = [-999, -999, -999, -998, -998, -998];
    this.box = [0, 0, 0, 0, 0, 0];
  }

  buildModel() {
    if (!KR.skin) buildKrakenTextures();
    const skin = new THREE.MeshLambertMaterial({ map: KR.skin, emissive: 0xffffff, emissiveMap: KR.skinGlow, emissiveIntensity: 0.12 });
    const belly = new THREE.MeshLambertMaterial({ map: KR.belly });
    const eye = new THREE.MeshLambertMaterial({ map: KR.eye, emissive: 0xffffff, emissiveMap: KR.eyeGlow, emissiveIntensity: 1.1 });
    const beak = new THREE.MeshLambertMaterial({ map: KR.beak });
    const whirlMat = new THREE.MeshBasicMaterial({ map: KR.whirl, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const head = new THREE.Group();
    inner.add(head);
    // mantel (de grote kop) met puntmuts en vinnen
    const mantle = new THREE.Group();
    mantle.position.y = 0.6;
    head.add(mantle);
    mantle.add(new THREE.Mesh(faceGroups(new THREE.BoxGeometry(3.6, 4.0, 3.2).translate(0, 2.0, 0), 3), [skin, belly]));
    const tip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.3, 2.4).translate(0, 1.15, 0), skin);
    tip.position.set(0, 3.8, -0.4); tip.rotation.x = -0.35;
    mantle.add(tip);
    for (const sx of [-1, 1]) {
      const fin = bossBox(0.25, 1.7, 1.9, skin, 0.85);
      fin.position.set(sx * 1.3, 4.5, -0.7); fin.rotation.z = -sx * 0.75;
      mantle.add(fin);
    }
    // grote gloeiende ogen met boze wenkbrauwen
    const eyes = [];
    const eyeGeo = faceGroups(new THREE.BoxGeometry(1.05, 1.0, 0.3), 4);
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(eyeGeo, [skin, eye]);
      e.position.set(sx * 1.05, 2.7, 1.62);
      mantle.add(e);
      eyes.push(e);
      const brow = bossBox(1.35, 0.36, 0.45, skin);
      brow.position.set(sx * 1.05, 3.4, 1.66); brow.rotation.z = sx * 0.38;
      mantle.add(brow);
    }
    // snavel
    const beakU = bossBox(1.0, 0.6, 0.9, beak, 0, 0, 0.45);
    beakU.position.set(0, 1.3, 1.3); beakU.rotation.x = 0.25;
    head.add(beakU);
    const jaw = new THREE.Group();
    jaw.position.set(0, 1.0, 1.35);
    jaw.add(bossBox(0.85, 0.45, 0.8, beak, -0.1, 0, 0.4));
    head.add(jaw);
    // zes korte armen rond de snavel
    const arms = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const root = new THREE.Group();
      root.position.set(Math.sin(a) * 1.3, 0.9, Math.cos(a) * 1.3);
      root.rotation.y = a;
      const swing = new THREE.Group();
      root.add(swing);
      swing.add(bossBox(0.6, 1.7, 0.6, skin, -0.85));
      const sub = new THREE.Group();
      sub.position.y = -1.7;
      sub.add(bossBox(0.45, 1.5, 0.45, skin, -0.75));
      swing.add(sub);
      head.add(root);
      arms.push({ swing, sub });
    }
    // De grote tentakels en de draaikolk staan in wereldcoordinaten
    const world = new THREE.Group();
    group.add(world);
    const tents = [];
    const segGeo = [];
    for (let i = 0; i < NSEG; i++) {
      const wd = 2.0 - i * 0.15;
      segGeo.push(faceGroups(new THREE.BoxGeometry(wd, wd * 0.72, 1).translate(0, 0, 0.5), 3));
    }
    const baseGeo = faceGroups(new THREE.BoxGeometry(2.1, 1, 1.6).translate(0, -0.5, 0), 3);
    const segMats = [skin, belly];
    for (let k = 0; k < 2; k++) {
      const root = new THREE.Group();
      const col = new THREE.Mesh(baseGeo, segMats);
      col.scale.y = 5;
      root.add(col);
      const pivot = new THREE.Group();
      root.add(pivot);
      const segs = [];
      let parent = pivot;
      for (let i = 0; i < NSEG; i++) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(segGeo[i], segMats);
        g.add(m);
        parent.add(g);
        segs.push({ g, m });
        parent = g;
      }
      root.visible = false;
      world.add(root);
      tents.push({ root, pivot, segs, phase: 'off', t: 0, warn: 1, ox: 0, oz: 0 });
    }
    const whirl = new THREE.Mesh(new THREE.CircleGeometry(12, 32), whirlMat);
    whirl.rotation.x = -Math.PI / 2;
    whirl.position.set(this.info.arenaCenter.x, W + 0.97, this.info.arenaCenter.z);
    whirl.renderOrder = 3;
    whirl.visible = false;
    world.add(whirl);
    return { group, inner, head, mantle, eyes, beakU, jaw, arms, world, tents, whirl, whirlMat, skin, eye, mats: [skin, belly, eye, beak] };
  }

  // Alleen te raken als de kop boven water is
  hittable() { return this.alive() && this.pos.y > 6.6; }
  aabb() {
    if (!this.hittable()) return this.farBox;
    const b = this.box, p = this.pos, s = this.enraged ? 2.4 : 2.2;
    b[0] = p.x - s; b[1] = p.y + 0.8; b[2] = p.z - s;
    b[3] = p.x + s; b[4] = p.y + 6.4; b[5] = p.z + s;
    return b;
  }
  center() { return new THREE.Vector3(this.pos.x, this.pos.y + 3.3, this.pos.z); }

  hurt(amount, kind) {
    if (kind === 'melee' && !this.hittable()) return false;
    return super.hurt(amount, kind);
  }

  goal(x, y, z, rate) { this.gx = x; this.gy = y; this.gz = z; this.gr = rate; }

  onWake() { SND.play('splash', { vol: 1 }); splashFx(this.pos.x, W + 0.9, this.pos.z, 30, 4); }

  onEnrage() {
    const m = this.model;
    m.eye.map = KR.eyeRed; m.eye.emissiveMap = KR.eyeRedGlow; m.eye.needsUpdate = true;
    m.skin.emissiveIntensity = 0.9;
    m.inner.scale.setScalar(1.12);
    this.roarT = 1.2;
    if (this.state === 'swim') this.attackCD = Math.min(this.attackCD, 0.5);
  }
  enragedFx() {
    const p = this.pos;
    if (p.y > 4) FX.glow.spawn(p.x + (Math.random() - 0.5) * 3.6, p.y + 2 + Math.random() * 4, p.z + (Math.random() - 0.5) * 3.6, (Math.random() - 0.5) * 0.5, 0.8, (Math.random() - 0.5) * 0.5, 1, 0.3, 0.7, 0.6, -0.3, 0.5);
  }

  onGoHome() {
    for (const tn of this.model.tents) { tn.phase = 'off'; tn.root.visible = false; }
    this.whirlOn = false; this.chompHz = null;
    this.lastAtk = null; this.lastOther = null;
    this.goal(this.home.x, this.home.y, this.home.z, 2);
  }

  die() {
    for (const tn of this.model.tents) { tn.phase = 'off'; tn.root.visible = false; }
    this.whirlOn = false;
    this.model.whirl.visible = false;
    if (this.pos.y < RAISE_Y - 0.5) this.pos.y = RAISE_Y - 0.5;
    this.mesh.position.copy(this.pos);
    super.die();
  }

  think(dt, c) {
    const ph2 = this.enraged, p = c.p, A = this.info.arenaCenter;
    const pdx = p.pos.x - A.x, pdz = p.pos.z - A.z, pr = Math.hypot(pdx, pdz) || 0.01;
    const ux = pdx / pr, uz = pdz / pr;
    this.turnTo(c.targetYaw, dt, 3.5);
    if (this.roarT > 0) this.roarT -= dt;
    switch (this.state) {
      case 'chase':
        this.setState('dive');
        break;
      case 'swim':
        this.goal(A.x + ux * 4, SUB_Y, A.z + uz * 4, 1.2);
        this.attackCD -= dt;
        if (this.attackCD <= 0 && !p.dead) this.pickAttack();
        break;
      case 'slamWind':
        this.goal(this.slamOX, SUB_Y + 1, this.slamOZ, 2);
        if (this.t >= this.slamEnd) {
          const r = clamp(pr - 3.3, 2, 9.4);
          this.rx = A.x + ux * r; this.rz = A.z + uz * r;
          this.raiseT = ph2 ? 2.8 : 3.3;
          this.setState('rise');
          SND.play('splash', { at: this.pos, range: 40 });
        }
        break;
      case 'rise':
        this.goal(this.rx, RAISE_Y, this.rz, 5);
        if (this.t > 0.55) { this.setState('raised'); splashFx(this.pos.x, W + 0.9, this.pos.z, 16, 3); }
        break;
      case 'raised':
        this.goal(this.rx, RAISE_Y + Math.sin(this.t * 2) * 0.15, this.rz, 4);
        if (this.t > this.raiseT) this.setState('dive');
        break;
      case 'dive':
        this.goal(this.pos.x, SUB_Y, this.pos.z, 3);
        if (this.t > 0.6) {
          this.setState('swim');
          this.attackCD = ph2 ? 0.6 + Math.random() * 0.5 : 1.0 + Math.random() * 0.6;
        }
        break;
      case 'jetWind':
        this.goal(this.rx, RAISE_Y, this.rz, 5);
        if (Math.random() < 0.7) {
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          FX.glow.spawn(this.pos.x + fx * 2 + (Math.random() - 0.5) * 3, W + 0.9, this.pos.z + fz * 2 + (Math.random() - 0.5) * 3, -fx, 1.5, -fz, 0.7, 0.95, 1, 0.5, -1, 0);
        }
        if (this.t > (ph2 ? 0.7 : 0.95)) { this.setState('jet'); this.shots = 0; this.shotT = 0; }
        break;
      case 'jet':
        this.goal(this.rx, RAISE_Y, this.rz, 4);
        this.shotT -= dt;
        if (this.shotT <= 0 && !p.dead) { this.fireJet(p); this.shots++; this.shotT = ph2 ? 0.09 : 0.13; }
        if (this.shots >= (ph2 ? 11 : 7)) this.setState('jetEnd');
        break;
      case 'jetEnd':
        this.goal(this.rx, RAISE_Y, this.rz, 4);
        if (this.t > 0.8) this.setState('dive');
        break;
      case 'inkWind':
        this.goal(this.rx, RAISE_Y, this.rz, 5);
        if (this.t > (ph2 ? 0.75 : 0.95)) { this.fireInk(p); this.setState('inkEnd'); }
        break;
      case 'inkEnd':
        this.goal(this.rx, RAISE_Y, this.rz, 4);
        if (this.t > 0.9) this.setState('dive');
        break;
      case 'whirlWind':
        this.goal(A.x, LOW_Y, A.z, 3);
        if (this.t > 0.8) {
          this.setState('whirl');
          this.whirlDur = ph2 ? 4.6 : 4.0;
          this.whirlOn = true; this.chompHz = null;
          SND.play('wind', { vol: 0.9 }); SND.play('splash');
        }
        break;
      case 'whirl':
        this.updateWhirl(dt, p, A);
        if (this.t >= this.whirlDur) {
          this.whirlOn = false;
          this.rx = A.x; this.rz = A.z; this.raiseT = 2.2;
          this.setState('raised');
        }
        break;
      default:
        this.setState('swim');
        break;
    }
    return 0;
  }

  // Afwisselend een tentakelklap (dan kun je hem raken) en een andere aanval
  pickAttack() {
    let a;
    if (this.lastAtk !== 'slam') a = 'slam';
    else {
      const opts = ['jet', 'ink', 'whirl'].filter((o) => o !== this.lastOther);
      a = opts[Math.floor(Math.random() * opts.length)];
      this.lastOther = a;
    }
    this.lastAtk = a;
    const A = this.info.arenaCenter, p = player;
    const dx = p.pos.x - A.x, dz = p.pos.z - A.z, d = Math.hypot(dx, dz) || 1;
    if (a === 'slam') this.startSlam();
    else if (a === 'jet' || a === 'ink') {
      this.rx = A.x + dx / d * Math.min(5, d); this.rz = A.z + dz / d * Math.min(5, d);
      this.setState(a + 'Wind');
      SND.play('splash', { at: this.pos, range: 40 });
    } else this.setState('whirlWind');
  }

  /* --- Aanval 1: tentakelklap --- */
  startSlam() {
    const ph2 = this.enraged, p = player, A = this.info.arenaCenter;
    let dx = p.pos.x - A.x, dz = p.pos.z - A.z, d = Math.hypot(dx, dz);
    if (d < 0.5) { dx = 1; dz = 0; d = 1; }
    const inPool = d < 10.2;
    const base = Math.atan2(dz, dx) + (inPool ? Math.PI : 0);
    const R0 = 9.6;
    const lanes = [{ a: base, warn: ph2 ? 0.95 : 1.2 }];
    if (ph2) lanes.push({ a: base + (Math.random() < 0.5 ? 1 : -1) * 0.95, warn: 1.4 });
    let maxWarn = 0;
    lanes.forEach((ln, k) => {
      const ox = A.x + Math.cos(ln.a) * R0, oz = A.z + Math.sin(ln.a) * R0;
      const tx = p.pos.x - ox, tz = p.pos.z - oz, td = Math.hypot(tx, tz) || 1;
      const len = clamp(td + 3.5, 7, 19), lx = tx / td, lz = tz / td;
      const tn = this.model.tents[k];
      this.startTent(tn, ox, oz, Math.atan2(lx, lz), len, ln.warn);
      game.addHazard(new LaneHazard({
        x0: ox, z0: oz, x1: ox + lx * len, z1: oz + lz * len, y: FY, width: 2.6, warn: ln.warn, linger: 0.6, color: 0xff2a10,
        onTrigger: (h) => this.slamHit(h),
      }));
      maxWarn = Math.max(maxWarn, ln.warn);
      if (k === 0) { this.slamOX = A.x + Math.cos(ln.a) * 6.5; this.slamOZ = A.z + Math.sin(ln.a) * 6.5; }
    });
    this.slamEnd = maxWarn + 0.85;
    this.setState('slamWind');
    SND.play('splash', { vol: 1 });
    SND.play('whoosh', { vol: 0.7 });
  }

  startTent(tn, ox, oz, yaw, len, warn) {
    tn.phase = 'rise'; tn.t = 0; tn.warn = warn; tn.ox = ox; tn.oz = oz; tn.len = len;
    tn.root.visible = true;
    tn.root.position.set(ox, W - 9, oz);
    tn.root.rotation.y = yaw;
    const sl = len / NSEG;
    tn.segs.forEach((s, i) => { s.m.scale.z = sl; if (i > 0) s.g.position.z = sl; });
    splashFx(ox, W + 0.9, oz, 18, 2.5);
  }

  slamHit(h) {
    const p = player;
    if (!p.dead && (p.pos.y > W - 1.6 || p.inWater) && p.pos.y < FY + 2.6) {
      const px = p.pos.x - h.x0, pz = p.pos.z - h.z0;
      const t = clamp(px * h.dirX + pz * h.dirZ, 0, h.len);
      const cx = h.x0 + h.dirX * t, cz = h.z0 + h.dirZ * t;
      if (Math.hypot(p.pos.x - cx, p.pos.z - cz) < h.width / 2 + p.hw) damagePlayer(this.dmg(13), { x: cx, y: FY, z: cz }, 'tentacle', 9, 7);
    }
    for (let k = 1; k < h.len; k += 1.5) splashFx(h.x0 + h.dirX * k, FY - 0.5, h.z0 + h.dirZ * k, 5, 1.6);
    game.shake = Math.max(game.shake, 0.6);
    const mx = (h.x0 + h.x1) / 2, mz = (h.z0 + h.z1) / 2;
    SND.play('slam', { at: { x: mx, y: FY, z: mz }, range: 40 });
    SND.play('splash', { at: { x: mx, y: FY, z: mz }, range: 40 });
  }

  updateTents(dt) {
    for (const tn of this.model.tents) {
      if (tn.phase === 'off') continue;
      tn.t += dt;
      const t = tn.t, w0 = tn.warn - 0.16;
      let pitch, curl, y = FY + 0.4;
      const sway = Math.sin(game.time * 5 + tn.ox) * 0.06;
      if (t < w0) {
        const k = clamp(t / (w0 * 0.45), 0, 1);
        y = W - 9 + (FY + 0.4 - (W - 9)) * easeOut(k);
        pitch = -Math.PI / 2 - 0.25 + sway;
        curl = -0.07 + sway * 0.5;
      } else if (t < tn.warn) {
        const k = (t - w0) / 0.16;
        pitch = (-Math.PI / 2 - 0.25) * (1 - k * k) + 0.04 * k * k;
        curl = -0.07 * (1 - k);
      } else if (t < tn.warn + 0.85) {
        pitch = 0.04; curl = Math.sin((t - tn.warn) * 18) * 0.015 * (1 - (t - tn.warn));
      } else if (t < tn.warn + 1.35) {
        const k = (t - tn.warn - 0.85) / 0.5;
        pitch = 0.04 - 0.6 * k; curl = -0.05 * k;
        y = FY + 0.4 - 7 * k * k;
      } else {
        tn.phase = 'off'; tn.root.visible = false;
        continue;
      }
      tn.root.position.y = y;
      tn.pivot.rotation.x = pitch;
      // de punt krult een beetje omhoog als hij ligt
      const tipCurl = t >= tn.warn ? -0.3 : 0;
      for (let i = 1; i < NSEG; i++) tn.segs[i].g.rotation.x = curl + (i >= NSEG - 2 ? tipCurl : 0);
    }
  }

  /* --- Aanval 2: waterstraal (met terug te slaan bubbels) --- */
  fireJet(p) {
    const pp = projParts();
    const ph2 = this.enraged;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const o = new THREE.Vector3(this.pos.x + fx * 2.1, this.pos.y + 1.5, this.pos.z + fz * 2.1);
    const bubble = this.shots % 3 === 1;
    const tgt = new THREE.Vector3(p.pos.x + p.vel.x * 0.12, p.pos.y + 1.0, p.pos.z + p.vel.z * 0.12);
    const dir = tgt.sub(o).normalize();
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 0.1);
    const speed = bubble ? 8.5 : (ph2 ? 18.5 : 15);
    const pr = new Projectile({
      pos: o, vel: dir.multiplyScalar(speed), owner: 'boss', type: bubble ? 'bubble' : 'water',
      dmg: this.dmg(bubble ? 7 : 5), radius: bubble ? 0.42 : 0.22, knock: bubble ? 4 : 3.5,
      reflectable: bubble, spin: bubble, life: bubble ? 4 : 2.5,
      mesh: new THREE.Mesh(bubble ? pp.bubble : pp.drop, bubble ? pp.bubbleMat : pp.dropMat),
      trail: (q) => { if (Math.random() < (bubble ? 0.3 : 0.8)) FX.glow.spawn(q.pos.x, q.pos.y, q.pos.z, 0, -0.5, 0, 0.7, 0.95, 1, 0.35, 4, 0); },
      explodeFx: (q) => { splashFx(q.pos.x, q.pos.y - 0.2, q.pos.z, bubble ? 10 : 5, 0.6); SND.play(bubble ? 'pop' : 'splash', { at: q.pos, range: 20, vol: 0.5 }); },
    });
    game.addProjectile(quiet(pr));
    if (this.shots % 2 === 0) SND.play('shoot', { at: o, range: 40, vol: 0.5 });
  }

  /* --- Aanval 3: inktwolk (donker en traag) --- */
  fireInk(p) {
    const pp = projParts();
    const ph2 = this.enraged;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const o = new THREE.Vector3(this.pos.x + fx * 2.1, this.pos.y + 1.6, this.pos.z + fz * 2.1);
    const bx = p.pos.x + clamp(p.vel.x, -4, 4) * 0.35, bz = p.pos.z + clamp(p.vel.z, -4, 4) * 0.35;
    const spots = [{ x: bx, z: bz }];
    if (ph2) {
      const sx = -fz, sz = fx;
      spots.push({ x: bx + sx * 3.8, z: bz + sz * 3.8 }, { x: bx - sx * 3.8, z: bz - sz * 3.8 });
    }
    const T0 = 1.1, G = 14;
    for (const s of spots) {
      const y = this.surfaceY(s.x, s.z);
      const vel = new THREE.Vector3((s.x - o.x) / T0, (y + 0.3 - o.y) / T0 + 0.5 * G * T0, (s.z - o.z) / T0);
      game.addProjectile(quiet(new Projectile({
        pos: o, vel, gravity: G, owner: 'boss', type: 'ink', dmg: 0, radius: 0.4, life: T0 + 0.05,
        mesh: new THREE.Mesh(pp.ink, pp.inkMat),
        trail: (q) => { if (Math.random() < 0.6) inkFx(q.pos.x, q.pos.y - 0.5, q.pos.z, 1, 0.3, 0); },
        explodeFx: () => {},
      })));
      game.addHazard(new GroundHazard({
        x: s.x, y, z: s.z, radius: 2.7, warn: T0, linger: 3.0, color: 0x40107a,
        onTrigger: (h) => {
          inkFx(h.x, h.y, h.z, 40, 4.5, 1.5);
          SND.play('splash', { at: h, range: 30 });
          if (this.inInk(h)) {
            damagePlayer(this.dmg(10), { x: h.x, y: h.y, z: h.z }, 'ink', 3, 4);
            player.dark = Math.max(player.dark, 2.6);
            player.slow = Math.max(player.slow, 2.5);
          }
        },
        onLinger: (h, dt) => {
          if (Math.random() < dt * 30) inkFx(h.x, h.y, h.z, 1, 4.6, 0.3);
          if (this.inInk(h)) { player.dark = Math.max(player.dark, 0.9); player.slow = Math.max(player.slow, 0.4); }
        },
      }));
    }
    SND.play('shoot', { at: o, range: 40, vol: 0.8 });
  }
  inInk(h) {
    const p = player;
    return !p.dead && Math.hypot(p.pos.x - h.x, p.pos.z - h.z) < h.radius + 0.3 && (p.pos.y > h.y - 2.2 || (p.inWater && h.y < W + 1)) && p.pos.y < h.y + 3;
  }
  // Hoogte van de vloer of het wateroppervlak op een plek
  surfaceY(x, z) {
    const w = this.world, ix = Math.floor(x), iz = Math.floor(z);
    for (let y = FY + 4; y >= 0; y--) {
      const id = w.get(ix, y, iz);
      if (id === B.WATER) return W + 0.92;
      if (SOLID[id]) return y + 1;
    }
    return FY;
  }

  /* --- Aanval 4: draaikolk (trekt je naar de poel, dan een grote golf over de hele poel) --- */
  updateWhirl(dt, p, A) {
    const ph2 = this.enraged, t = this.t;
    const fade = clamp(t / 0.8, 0, 1) * clamp((this.whirlDur - t) / 0.3, 0, 1);
    if (!p.dead && t < this.whirlDur - 0.15) {
      const dx = A.x - p.pos.x, dz = A.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
      if (d < 28 && d > 0.8) {
        const k = (ph2 ? 1.2 : 1) * (1 - d / 32) * (p.inWater ? 6 : 22) * fade;
        p.kbx += (dx / d + -dz / d * 0.35) * k * dt;
        p.kbz += (dz / d + dx / d * 0.35) * k * dt;
      }
    }
    if (Math.random() < dt * 40) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 10;
      FX.glow.spawn(A.x + Math.cos(a) * r, W + 0.95, A.z + Math.sin(a) * r, -Math.sin(a) * 3 - Math.cos(a), 0.2, Math.cos(a) * 3 - Math.sin(a), 0.9, 1, 1, 0.7, 0, 0);
    }
    if (Math.random() < dt * 1.5) SND.play('wind', { vol: 0.5 });
    if (t > this.whirlDur - 0.6) this.goal(A.x, RAISE_Y, A.z, 5);
    else this.goal(A.x, LOW_Y, A.z, 3);
    if (!this.chompHz && t > this.whirlDur - 1.25) {
      this.chompHz = new GroundHazard({
        x: A.x, y: W + 1, z: A.z, radius: 12.6, warn: this.whirlDur - t, linger: 0.4, color: 0xff2040,
        onTrigger: (h) => {
          const q = player;
          if (!q.dead && Math.hypot(q.pos.x - h.x, q.pos.z - h.z) < h.radius + 0.3 && q.pos.y < FY + 1) {
            damagePlayer(this.dmg(12), { x: h.x, y: W, z: h.z }, 'chomp', 10, 8);
          }
          splashFx(h.x, W + 0.9, h.z, 30, 6);
          for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; splashFx(h.x + Math.cos(a) * 11, W + 0.9, h.z + Math.sin(a) * 11, 3, 1.5); }
          SND.play('slam', { at: h, range: 40 });
          game.shake = Math.max(game.shake, 0.6);
        },
      });
      game.addHazard(this.chompHz);
      SND.play('roar', { vol: 0.7 });
    }
  }

  animate(dt) {
    // naar het doel zwemmen
    const st = this.state;
    if (st === 'sleep' || st === 'idle') this.goal(this.home.x, SUB_Y + Math.sin(game.time * 0.8) * 0.2, this.home.z, 1.5);
    else if (st === 'roar') this.goal(this.home.x, RAISE_Y, this.home.z, 3);
    const km = 1 - Math.exp(-dt * this.gr);
    this.pos.x += (this.gx - this.pos.x) * km;
    this.pos.y += (this.gy - this.pos.y) * km;
    this.pos.z += (this.gz - this.pos.z) * km;

    const a = this.anim, ph2 = this.enraged, t = this.t;
    let beak = 0.08, swell = 1, tilt = 0, armAmp = 0.3, armRate = 2.2, eye = 1.1;
    switch (st) {
      case 'sleep': case 'idle': eye = 0.25; armAmp = 0.12; armRate = 0.8; break;
      case 'roar': beak = 0.75 + Math.sin(t * 22) * 0.1; armAmp = 0.8; armRate = 7; eye = 2.2; tilt = -0.25; break;
      case 'raised': beak = 0.15 + Math.sin(t * 3) * 0.1; armAmp = 0.45; tilt = Math.sin(t * 1.7) * 0.06; eye = 1.3; break;
      case 'slamWind': eye = 1.8; armAmp = 0.6; armRate = 5; break;
      case 'jetWind': beak = 0.85 * clamp(t / 0.6, 0, 1); tilt = -0.18; eye = 1.9; break;
      case 'jet': beak = 0.9; tilt = -0.12; eye = 1.9; break;
      case 'inkWind': swell = 1 + 0.25 * clamp(t / 0.9, 0, 1); beak = 0.35; eye = 1.7; tilt = -0.12; break;
      case 'inkEnd': beak = t < 0.3 ? 0.8 : 0.2; break;
      case 'whirlWind': case 'whirl': armAmp = 0.9; armRate = 6; eye = 1.7;
        if (st === 'whirl' && t > this.whirlDur - 0.6) { beak = 1.0; tilt = -0.3; }
        break;
      default: break;
    }
    if (this.roarT > 0) { beak = 0.9; armAmp = 0.9; armRate = 8; eye = 2.4; }
    const k = 1 - Math.exp(-dt * 10);
    a.beak += (beak - a.beak) * k;
    a.swell += (swell - a.swell) * k;
    a.tilt += (tilt - a.tilt) * k;
    a.armAmp += (armAmp - a.armAmp) * k;
    a.armRate += (armRate - a.armRate) * k;
    a.eye += (eye - a.eye) * k;
    const m = this.model, tm = game.time;
    m.jaw.rotation.x = a.beak * 0.9;
    m.beakU.rotation.x = 0.25 - a.beak * 0.35;
    m.mantle.scale.set(a.swell, a.swell * 0.95 + 0.05, a.swell);
    m.head.rotation.x = a.tilt;
    m.head.position.y = Math.sin(tm * 1.3) * 0.12;
    m.arms.forEach((arm, i) => {
      const ph = tm * a.armRate + i * 1.1;
      arm.swing.rotation.x = -(0.5 + a.armAmp * 0.5 * Math.sin(ph));
      arm.sub.rotation.x = -(0.35 + a.armAmp * 0.6 * Math.sin(ph + 0.9));
    });
    m.eye.emissiveIntensity = a.eye * (ph2 ? 1.3 : 1);

    this.updateTents(dt);
    // draaikolk
    this.whirlA += ((this.whirlOn ? 0.85 : 0) - this.whirlA) * Math.min(1, dt * 3);
    m.whirl.visible = this.whirlA > 0.02;
    m.whirlMat.opacity = this.whirlA;
    m.whirl.rotation.z -= dt * (ph2 ? 3.2 : 2.5);
    // de wereldgroep blijft op zijn plek als de kop beweegt en draait
    const cy = Math.cos(-this.yaw), sy = Math.sin(-this.yaw);
    m.world.rotation.y = -this.yaw;
    m.world.position.set(-this.pos.x * cy - this.pos.z * sy, -this.pos.y, this.pos.x * sy - this.pos.z * cy);
    // bubbels boven de kop als hij onder water zwemt
    if (this.alive() && this.pos.y < 4 && Math.random() < dt * (st === 'sleep' ? 3 : 10)) {
      FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 3, W + 0.9, this.pos.z + (Math.random() - 0.5) * 3, 0, 0.6, 0, 0.8, 0.97, 1, 0.6, -0.5, 0);
    }
  }
}

/* ---------- Sfeer: schuim op de golven en de waterval ---------- */
function oceanAmbience(dt, info) {
  const p = player, w = info.world;
  info.foamT = (info.foamT || 0) + dt * 16;
  while (info.foamT > 1) {
    info.foamT -= 1;
    const x = p.pos.x + (Math.random() - 0.5) * 40, z = p.pos.z + (Math.random() - 0.5) * 40;
    if (w.get(Math.floor(x), W, Math.floor(z)) === B.WATER && w.get(Math.floor(x), W + 1, Math.floor(z)) === B.AIR) {
      FX.glow.spawn(x, W + 0.93, z, (Math.random() - 0.5) * 0.8, 0.1, (Math.random() - 0.5) * 0.8, 0.86, 0.98, 1, 1.0, 0, 0.5);
    }
  }
  const f = info.fall;
  if (Math.hypot(f.mx - p.pos.x, f.mz - p.pos.z) < 42) {
    info.fallT = (info.fallT || 0) + dt * 36;
    while (info.fallT > 1) {
      info.fallT -= 1;
      const k = Math.random(), x = f.ax + (f.bx - f.ax) * k, z = f.az + (f.bz - f.az) * k;
      if (Math.random() < 0.6) FX.debris.spawn(x, F + 2 + Math.random() * 8, z, (Math.random() - 0.5) * 0.4, -7, (Math.random() - 0.5) * 0.4, 0.85, 0.97, 1, 0.5, 6, 0, false);
      else FX.glow.spawn(x, F + 0.9, z, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.9, 1, 1, 0.5, 8, 0.5);
    }
  }
}

registerRealm('ocean', {
  gen: genOcean,
  makeBoss: (world, info) => {
    if (typeof DEATH_REASONS !== 'undefined') {
      Object.assign(DEATH_REASONS, {
        tentacle: 'Geplet door een tentakel van de Kraak',
        water: 'Weggespoten door een waterstraal',
        bubble: 'Geraakt door een reuzenbubbel',
        ink: 'Verdwaald in de inktwolk',
        chomp: 'Meegesleurd door de draaikolk',
      });
    }
    return new Kraken(world, info);
  },
  atmosphere: { background: 0x6cbcd0, fog: 0x4aa6bc, near: 22, far: 80, amb: 0xd6f2ff, ambI: 0.85, dir: 0xfff6e0, dirI: 0.5, hand: 0xd6f2ff, sky: true },
  intro: 'Sst... Diep in de poel slaapt De Kraak. Blijf op de stenen eilanden!',
  tip: 'Tip: spring opzij voor de rode strepen! Na een tentakelklap steekt hij zijn kop boven water: sla dan!',
  treasureTip: 'Zie je de zeelantaarns bij de waterval? Loop door het water de grot in en neem de trap naar beneden!',
  ambience: oceanAmbience,
  ambientSound: 0.4,
  ruin: [B.OCEAN_PRISMARINE, B.OCEAN_PRISMARINE_BRICKS, B.OCEAN_DARK_PRISMARINE, B.OCEAN_SEA_LANTERN],
});

// Voor testen en ontwikkelen
window.OCEAN = { gen: genOcean, Boss: Kraken };
})();
