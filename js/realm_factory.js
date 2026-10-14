'use strict';
/* Portaaljacht – wereld 9: De Fabriek met De IJzeren Titan (laserzwaai, zoekraketten, magneet + stamp, schild met generatoren) */

// Alles in een eigen functie, zodat namen niet botsen met de andere werelden
(() => {
const FAC_F = 8; // bovenste blok van de vloer

/* ---------- Tegels en blokken ---------- */
defineTile('FACTORY_IRON', (h) => (x, y) => {
  if (x === 0 || y === 0) return h.vary([226, 226, 230], 3);
  if (x === 15 || y === 15) return h.vary([150, 150, 156], 3);
  if ((x === 2 || x === 13) && (y === 2 || y === 13)) return [120, 120, 128];
  if (y === 7) return h.vary([236, 236, 240], 2);
  if (y === 8) return h.vary([178, 178, 184], 2);
  return h.vary([206, 206, 210], 4);
});
defineTile('FACTORY_PLATE', (h) => (x, y) => {
  if (x === 0 || y === 0) return h.vary([96, 98, 104], 3);
  if (x === 15 || y === 15) return h.vary([58, 60, 66], 3);
  const cx = x >> 2, cy = y >> 2, lx = x & 3, ly = y & 3;
  const dash = (cx + cy) % 2 === 0 ? lx === ly : lx + ly === 3;
  if (dash && lx > 0 && lx < 3) return h.vary([140, 142, 150], 4);
  return h.vary([84, 86, 92], 5);
});
defineTile('FACTORY_STRIPE', (h) => (x, y) => (((x + y) >> 2) % 2 ? h.vary([236, 190, 32], 8) : h.vary([38, 36, 34], 5)));
defineTile('FACTORY_COPPER', (h) => (x, y) => {
  const r = h.R();
  if (r < 0.05) return h.vary([84, 166, 140], 10);
  if (x === 0 || y === 0) return h.vary([232, 150, 108], 6);
  if (x === 15 || y === 15) return h.vary([148, 78, 56], 6);
  return h.vary(r < 0.35 ? [214, 128, 90] : r < 0.7 ? [192, 108, 78] : [170, 92, 66], 6);
});
defineTile('FACTORY_LAMP_ON', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([116, 66, 34], 5);
  if (x === 7 || x === 8 || y === 7 || y === 8) return h.vary([168, 100, 46], 6);
  return h.vary(h.R() < 0.3 ? [255, 236, 170] : [250, 196, 96], 8);
});
defineTile('FACTORY_LAMP_OFF', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([86, 52, 30], 5);
  if (x === 7 || x === 8 || y === 7 || y === 8) return h.vary([110, 66, 36], 5);
  return h.vary(h.R() < 0.3 ? [120, 60, 40] : [92, 46, 32], 6);
});
// Lopende band: pijltjes naar +z (S) of -z (N)
const beltTile = (sgn) => (h) => (x, y) => {
  if (x === 0 || x === 15) return h.vary([120, 122, 128], 4);
  const k = Math.floor(Math.abs(x - 7.5));
  if ((((y - sgn * k) % 8) + 8) % 8 < 2 && x > 1 && x < 14) return h.vary([226, 182, 40], 8);
  return h.vary(y % 4 === 0 ? [30, 30, 34] : [46, 46, 52], 4);
};
defineTile('FACTORY_BELT_S', beltTile(-1));
defineTile('FACTORY_BELT_N', beltTile(1));
defineTile('FACTORY_BELT_SIDE', (h) => (x, y) => {
  if (y < 3) return h.vary([40, 40, 46], 4);
  const rx = x % 8 - 3.5, ry = y - 8.5;
  if (rx * rx + ry * ry < 7) return h.vary(rx * rx + ry * ry < 2 ? [170, 170, 176] : [60, 60, 66], 4);
  return h.vary([118, 120, 126], 5);
});
defineTile('FACTORY_PIPE', (h) => (x, y) => {
  if (x % 8 === 0 || x % 8 === 1) return h.vary([118, 64, 44], 5);
  if (y === 4 || y === 5) return h.vary([240, 168, 124], 6);
  if (y > 12) return h.vary([140, 76, 54], 5);
  return h.vary([196, 112, 80], 6);
});
defineTile('FACTORY_DOOR_TOP', (h) => (x, y) => {
  if (x === 0 || x === 15 || y === 0) return h.vary([128, 128, 134], 3);
  if (y >= 3 && y <= 10 && ((x >= 3 && x <= 6) || (x >= 9 && x <= 12))) return h.vary([48, 52, 60], 4);
  return h.vary([206, 206, 212], 4);
});
defineTile('FACTORY_DOOR_BOT', (h) => (x, y) => {
  if (x === 0 || x === 15 || y === 15) return h.vary([128, 128, 134], 3);
  if (y % 5 === 4) return h.vary([160, 160, 168], 3);
  if (x === 12 && (y === 1 || y === 2)) return [50, 50, 56];
  return h.vary([206, 206, 212], 4);
});
defineTile('FACTORY_VENT', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([110, 112, 118], 3);
  return y % 3 === 0 ? h.vary([28, 28, 32], 3) : h.vary([92, 94, 100], 4);
});
defineTile('FACTORY_MACHINE', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([70, 72, 78], 3);
  const dx = x - 7.5, dy = y - 5.5, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 3.6) {
    if (d > 2.8) return [40, 40, 44];
    if (Math.abs(dx - dy * 0.6) < 0.7 && dy < 0.5) return [210, 40, 30]; // wijzer
    return [236, 236, 226];
  }
  if (y >= 11 && y <= 13 && x >= 2 && x <= 13) return x % 2 ? [36, 36, 40] : [120, 122, 128];
  if (y === 2 && x === 13) return [80, 240, 80];
  return h.vary([150, 152, 158], 5);
});

const FB = {
  IRON: defineBlock('FACTORY_IRON', { name: 'IJzerblok', tiles: all(T.FACTORY_IRON), hard: 1.8 }),
  PLATE: defineBlock('FACTORY_PLATE', { name: 'Stalen vloerplaat', tiles: all(T.FACTORY_PLATE), hard: 1.6 }),
  STRIPE: defineBlock('FACTORY_STRIPE', { name: 'Waarschuwingsstrepen', tiles: all(T.FACTORY_STRIPE), hard: 1.4 }),
  COPPER: defineBlock('FACTORY_COPPER', { name: 'Koperblok', tiles: all(T.FACTORY_COPPER), hard: 1.4 }),
  LAMP_ON: defineBlock('FACTORY_LAMP_ON', { name: 'Redstonelamp', tiles: all(T.FACTORY_LAMP_ON), hard: 0.4, glow: true, sound: 'glass' }),
  LAMP_OFF: defineBlock('FACTORY_LAMP_OFF', { name: 'Redstonelamp', tiles: all(T.FACTORY_LAMP_OFF), hard: 0.4, sound: 'glass' }),
  BELT_S: defineBlock('FACTORY_BELT_S', { name: 'Lopende band', tiles: { top: T.FACTORY_BELT_S, bottom: T.FACTORY_PLATE, side: T.FACTORY_BELT_SIDE }, hard: 1.2 }),
  BELT_N: defineBlock('FACTORY_BELT_N', { name: 'Lopende band', tiles: { top: T.FACTORY_BELT_N, bottom: T.FACTORY_PLATE, side: T.FACTORY_BELT_SIDE }, hard: 1.2 }),
  PIPE: defineBlock('FACTORY_PIPE', { name: 'Koperen buis', tiles: all(T.FACTORY_PIPE), hard: 1.0 }),
  DOOR_TOP: defineBlock('FACTORY_DOOR_TOP', { name: 'IJzeren deur', tiles: { top: T.FACTORY_IRON, bottom: T.FACTORY_IRON, side: T.FACTORY_DOOR_TOP }, hard: 1.0 }),
  DOOR_BOT: defineBlock('FACTORY_DOOR_BOT', { name: 'IJzeren deur', tiles: { top: T.FACTORY_IRON, bottom: T.FACTORY_IRON, side: T.FACTORY_DOOR_BOT }, hard: 1.0 }),
  VENT: defineBlock('FACTORY_VENT', { name: 'Rooster', tiles: all(T.FACTORY_VENT), hard: 1.2 }),
  MACHINE: defineBlock('FACTORY_MACHINE', { name: 'Machine', tiles: { top: T.FACTORY_IRON, bottom: T.FACTORY_IRON, side: T.FACTORY_MACHINE }, hard: 1.6 }),
};

/* ---------- De wereld: een grote fabriekshal ---------- */
function genFactory(seed) {
  const S = 72, H = 40, C = 36, F = FAC_F, AR = 19;
  const W0 = 8, W1 = S - 9;     // hallmuren
  const WT = F + 11;            // bovenkant van de muren
  const w = new World('realm', S, H, S);
  const rand = mulberry32(seed);
  const set = (x, y, z, id) => w.setRaw(x, y, z, id);
  const distC = (x, z) => Math.hypot(x + 0.5 - C, z + 0.5 - C);
  const inHall = (x, z) => x >= W0 && x <= W1 && z >= W0 && z <= W1;

  // Kluis achter een ijzeren deur in de oost-, west- of noordmuur
  const vside = Math.floor(rand() * 3);
  const off = Math.floor((rand() - 0.5) * 14);
  let door, vault, out;
  if (vside === 0) { door = { x: W1, z: C + off }; out = [1, 0]; }
  else if (vside === 1) { door = { x: W0, z: C + off }; out = [-1, 0]; }
  else { door = { x: C + off, z: W0 }; out = [0, -1]; }
  vault = { x: door.x + out[0] * 3, z: door.z + out[1] * 3 };
  const perp = [out[1], out[0]];
  // vrij pad van de deur naar de arena
  const pathDist = (x, z) => {
    const ax = door.x + 0.5, az = door.z + 0.5, bx = C, bz = C;
    const vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz;
    const t = clamp(((x + 0.5 - ax) * vx + (z + 0.5 - az) * vz) / L, 0, 1);
    return Math.hypot(x + 0.5 - ax - vx * t, z + 0.5 - az - vz * t);
  };

  // Ondergrond en vloer
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      for (let y = 0; y < F; y++) set(x, y, z, y === 0 ? B.BEDROCK : B.STONE);
      let top;
      if (inHall(x, z)) {
        const d = distC(x, z);
        if (d < AR) {
          if (d >= AR - 1.1) top = FB.STRIPE;
          else if (d < 2.4) top = FB.IRON;
          else if (d < 3.4) top = FB.COPPER;
          else top = rand() < 0.04 ? FB.VENT : FB.PLATE;
        } else top = rand() < 0.07 ? FB.VENT : FB.PLATE;
      } else {
        const r = rand();
        top = r < 0.45 ? B.GRAVEL : r < 0.75 ? B.COBBLE : B.STONE;
      }
      set(x, F, z, top);
    }
  }

  // Bakstenen muren met ijzeren pilaren, koperband, ramen en lampen
  const wallCells = [];
  for (let i = W0; i <= W1; i++) {
    wallCells.push([i, W0, 0, 1], [i, W1, 0, -1], [W0, i, 1, 0], [W1, i, -1, 0]);
  }
  for (const [x, z, ix, iz] of wallCells) {
    const along = ix === 0 ? x : z;
    const seg = (along - W0) % 9;
    const corner = (x === W0 || x === W1) && (z === W0 || z === W1);
    const col = seg === 0 || corner;
    for (let y = F + 1; y <= WT; y++) {
      let id = B.BRICKS;
      if (col || y === F + 1) id = FB.IRON;
      else if (y === F + 4) id = FB.COPPER;
      else if (y >= F + 6 && y <= F + 8 && seg >= 3 && seg <= 6) id = B.GLASS;
      if (y === WT) id = FB.STRIPE;
      set(x, y, z, id);
    }
    if (col && !corner && Math.hypot(x - door.x, z - door.z) > 1.5) set(x + ix, F + 5, z + iz, FB.LAMP_ON);
  }

  // Koperen buizen langs de muren (niet voor de deur)
  for (const [x, z, ix, iz] of wallCells) {
    const corner = (x === W0 || x === W1) && (z === W0 || z === W1);
    if (corner) continue;
    const px = x + ix, pz = z + iz;
    if (Math.hypot(px - door.x, pz - door.z) < 3.5) continue;
    if (w.get(px, F + 2, pz) === B.AIR) set(px, F + 2, pz, FB.PIPE);
    const along = ix === 0 ? x : z;
    if ((along - W0) % 9 === 2 && Math.hypot(px - door.x, pz - door.z) > 4) for (let y = F + 3; y < WT; y++) set(px, y, pz, FB.PIPE);
  }

  // Dakbalken met hanglampen en buizen boven de hal
  for (let z = W0 + 6; z < W1; z += 7) {
    for (let x = W0; x <= W1; x++) set(x, WT + 1, z, FB.IRON);
    for (let x = W0 + 5; x < W1; x += 9) set(x, WT, z, FB.LAMP_ON);
  }
  for (let z = W0; z <= W1; z++) set(C, WT + 1, z, FB.IRON);
  for (let x = W0 + 1; x < W1; x++) { set(x, F + 9, C - 9, FB.PIPE); set(x, F + 9, C + 9, FB.PIPE); }

  // Vier ijzeren pilaren als dekking tegen raketten
  for (const [px, pz] of [[C - 10, C - 10], [C + 9, C - 10], [C - 10, C + 9], [C + 9, C + 9]]) {
    for (let y = F + 1; y <= F + 6; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) set(px + dx, y, pz + dz, y === F + 3 ? FB.COPPER : FB.IRON);
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) set(px + dx, F + 7, pz + dz, FB.LAMP_ON);
  }

  // Generatorplekken (koper met een lamp in het midden)
  const pads = [];
  for (const a of [Math.PI, Math.PI / 3, -Math.PI / 3]) {
    const px = Math.floor(C + Math.sin(a) * 11), pz = Math.floor(C + Math.cos(a) * 11);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(px + dx, F, pz + dz, dx || dz ? FB.COPPER : FB.LAMP_ON);
    pads.push({ x: px, z: pz });
  }

  // Twee lopende banden: oost naar het zuiden, west naar het noorden
  const belts = [];
  for (let z = C - 8; z <= C + 8; z++) {
    for (const x of [C + 14, C + 15]) set(x, F, z, FB.BELT_S);
    for (const x of [C - 16, C - 15]) set(x, F, z, FB.BELT_N);
  }
  for (const x of [C + 14, C + 15, C - 16, C - 15]) { set(x, F, C - 9, FB.STRIPE); set(x, F, C + 9, FB.STRIPE); }

  // Grote koperen tanks in de hoeken van de hal
  const vents = [];
  const tanks = [[W0 + 5, W0 + 5], [W1 - 5, W0 + 5], [W0 + 5, W1 - 5], [W1 - 5, W1 - 5]];
  for (const [tx, tz] of tanks) {
    const th = 7 + Math.floor(rand() * 3);
    for (let y = F + 1; y <= F + th; y++) {
      for (let dz = -3; dz <= 3; dz++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (Math.hypot(dx, dz) > 3.25) continue;
          const id = y === F + th ? FB.IRON : y === F + 3 || y === F + th - 2 ? FB.STRIPE : FB.COPPER;
          set(tx + dx, y, tz + dz, id);
        }
      }
    }
    set(tx, F + th + 1, tz, FB.VENT);
    vents.push({ x: tx + 0.5, y: F + th + 2.2, z: tz + 0.5, steam: true });
  }

  // Machines en kratten tussen de arena en de muren
  const machines = [];
  for (let tries = 0; tries < 120 && machines.length < 16; tries++) {
    const mx = W0 + 2 + Math.floor(rand() * (W1 - W0 - 5)), mz = W0 + 2 + Math.floor(rand() * (W1 - W0 - 5));
    const sx = 2 + Math.floor(rand() * 2), sz = 2, sh = 2 + Math.floor(rand() * 2);
    let ok = true;
    for (let dz = -1; dz <= sz && ok; dz++) {
      for (let dx = -1; dx <= sx && ok; dx++) {
        const x = mx + dx, z = mz + dz;
        if (distC(x, z) < AR + 1.5 || pathDist(x, z) < 3.2 || !inHall(x, z) || w.get(x, F + 1, z) !== B.AIR || w.get(x, F + 2, z) !== B.AIR) ok = false;
        if (tanks.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 4.6)) ok = false;
      }
    }
    if (!ok) continue;
    for (let dz = 0; dz < sz; dz++) {
      for (let dx = 0; dx < sx; dx++) {
        for (let y = F + 1; y <= F + sh; y++) set(mx + dx, y, mz + dz, y === F + sh ? (rand() < 0.3 ? FB.VENT : FB.IRON) : FB.MACHINE);
      }
    }
    if (rand() < 0.5) set(mx, F + sh + 1, mz, FB.LAMP_ON);
    else if (rand() < 0.5) for (let y = F + sh + 1; y <= F + sh + 3; y++) set(mx + sx - 1, y, mz, FB.PIPE);
    machines.push({ x: mx + sx / 2, y: F + sh, z: mz + sz / 2 });
  }
  for (let i = 0; i < 26; i++) {
    const x = W0 + 2 + Math.floor(rand() * (W1 - W0 - 3)), z = W0 + 2 + Math.floor(rand() * (W1 - W0 - 3));
    if (distC(x, z) < AR + 1.5 || pathDist(x, z) < 3.2 || w.get(x, F + 1, z) !== B.AIR) continue;
    set(x, F + 1, z, B.PLANKS);
    if (rand() < 0.4) set(x, F + 2, z, B.PLANKS);
  }

  // Schoorstenen buiten de hal (de rook komt in de sfeer-update)
  const chimneys = [];
  const chimney = (cx, cz) => {
    const top = F + 24 + Math.floor(rand() * 5);
    for (let y = F + 1; y <= top; y++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const rim = dx !== 0 || dz !== 0;
          if (!rim && y > top - 3) continue;
          set(cx + dx, y, cz + dz, (y - F) % 8 === 0 || y === top ? FB.IRON : B.BRICKS);
        }
      }
    }
    chimneys.push({ x: cx + 0.5, y: top + 0.6, z: cz + 0.5 });
  };
  chimney(3, 3); chimney(S - 4, 3); chimney(3, S - 4); chimney(S - 4, S - 4);
  if (vside !== 0) chimney(S - 4, C + 2);
  if (vside !== 1) chimney(3, C - 3);
  if (vside !== 2) chimney(C - 2, 3);
  chimney(C + 4, S - 4);

  // De deur met een gouden lijst en een knipperlamp erboven
  set(door.x, F + 1, door.z, FB.DOOR_BOT);
  set(door.x, F + 2, door.z, FB.DOOR_TOP);
  set(door.x, F + 3, door.z, FB.LAMP_OFF);
  for (const s of [-1, 1]) for (let y = F + 1; y <= F + 3; y++) set(door.x + perp[0] * s, y, door.z + perp[1] * s, B.GOLD);
  for (let k = 1; k <= 3; k++) for (const s of [-1, 0, 1]) set(door.x - out[0] * k + perp[0] * s, F, door.z - out[1] * k + perp[1] * s, FB.STRIPE);
  // de kluis zelf
  const treasure = buildVault(w, vault.x, F + 1, vault.z, FB.IRON, FB.LAMP_ON);
  for (let y = F + 1; y <= F + 2; y++) set(door.x + out[0], y, door.z + out[1], B.AIR);
  for (const s of [-1, 1]) set(vault.x + out[0] + perp[0] * s, F + 1, vault.z + out[1] + perp[1] * s, B.GOLD);

  // Aankomstportaal aan de zuidkant van de arena
  const PZ = C + 16;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      set(C + i, y, PZ, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) set(C + dx, F, PZ + dz, B.OBSIDIAN);
  w.portalAxis = 'x';

  w.computeTops();
  return {
    world: w,
    spawn: { x: C + 1, y: F + 1, z: PZ - 2.5 },
    spawnYaw: 0,
    bossSpawn: { x: C + 0.5, y: F + 1, z: C - 1.5 },
    portal: { x: C + 1, y: F + 3.5, z: PZ + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: AR, floorY: F + 1,
    treasure,
    pads, chimneys: chimneys.concat(vents), machines, belts,
    door: { x: door.x, y: F + 1, z: door.z }, lamp: { x: door.x, y: F + 3, z: door.z },
    wallTop: WT,
  };
}

/* ---------- Gedeelde textures, geometrie en materialen ---------- */
const FT = {};
function buildFacTextures() {
  if (FT.body) return;
  const R = mulberry32(4242);
  const v = (c, s) => { const k = (R() - 0.5) * 2 * s; return [c[0] + k, c[1] + k, c[2] + k]; };
  const seam = (x, y) => x % 8 === 0 || y % 8 === 0;
  FT.body = pixelTexture(16, 16, (x, y) => {
    if (seam(x, y)) return v([82, 84, 92], 4);
    if (x % 8 === 7 || y % 8 === 7) return v([112, 114, 122], 4);
    if (x % 8 === 2 && y % 8 === 2) return [220, 222, 228];
    return v([156, 160, 168], 6);
  });
  FT.seams = pixelTexture(16, 16, (x, y) => (seam(x, y) ? [255, 120, 30] : [0, 0, 0]));
  FT.dark = pixelTexture(16, 16, (x, y) => (y % 4 === 0 ? v([40, 42, 46], 3) : x % 5 === 0 ? v([76, 78, 84], 3) : v([60, 62, 68], 4)));
  FT.stripe = pixelTexture(16, 16, (x, y) => (((x + y) >> 2) % 2 ? v([236, 190, 32], 8) : v([38, 36, 34], 5)));
  FT.copper = pixelTexture(16, 16, (x, y) => {
    const r = R();
    if (x === 0 || y === 0) return v([232, 150, 108], 5);
    if (r < 0.05) return v([84, 166, 140], 8);
    return v(r < 0.4 ? [214, 128, 90] : [186, 104, 76], 6);
  });
  const eye = (x, y) => (y === 6 || y === 7) && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13));
  FT.face = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return [255, 70, 50];
    if (y >= 5 && y <= 8 && x >= 1 && x <= 14) return [22, 22, 26];
    if (y >= 11 && y <= 13 && x >= 4 && x <= 11) return x % 2 ? [30, 30, 34] : [120, 122, 130];
    if (y === 3 && (x === 2 || x === 13)) return [220, 222, 228];
    return v([156, 160, 168], 6);
  });
  FT.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [255, 60, 40] : [0, 0, 0]));
  FT.core = pixelTexture(8, 8, (x, y) => {
    const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
    return d < 1 ? [255, 255, 255] : d < 2 ? [200, 240, 255] : d < 3 ? [110, 200, 255] : [50, 90, 130];
  });
  FT.lamp = pixelTexture(16, 16, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [150, 80, 40];
    if (x === 7 || x === 8 || y === 7 || y === 8) return [220, 130, 60];
    return R() < 0.3 ? [255, 250, 210] : [255, 214, 110];
  });
}

const FS = {};
function facShared() {
  if (FS.ready) return FS;
  buildFacTextures();
  const shared = (g) => { g.userShared = true; return g; };
  FS.beamCore = new THREE.MeshBasicMaterial({ color: 0xff3018 });
  FS.beamGlow = new THREE.MeshBasicMaterial({ color: 0xff7050, transparent: true, opacity: 0.4, depthWrite: false });
  FS.genBeam = new THREE.MeshBasicMaterial({ color: 0x70e8ff, transparent: true, opacity: 0.75, depthWrite: false });
  FS.genBeamGeo = shared(new THREE.BoxGeometry(0.14, 0.14, 1).translate(0, 0, 0.5));
  FS.missileBody = new THREE.MeshLambertMaterial({ map: FT.body });
  FS.missileTip = new THREE.MeshLambertMaterial({ color: 0xdd2a20, emissive: 0xff2010, emissiveIntensity: 0.6 });
  FS.missileFin = new THREE.MeshLambertMaterial({ map: FT.stripe });
  FS.mBodyGeo = shared(new THREE.BoxGeometry(0.28, 0.28, 0.8));
  FS.mTipGeo = shared(new THREE.BoxGeometry(0.2, 0.2, 0.26).translate(0, 0, 0.52));
  FS.mFinGeo1 = shared(new THREE.BoxGeometry(0.7, 0.06, 0.24).translate(0, 0, -0.34));
  FS.mFinGeo2 = shared(new THREE.BoxGeometry(0.06, 0.7, 0.24).translate(0, 0, -0.34));
  FS.puffGeo = shared(new THREE.BoxGeometry(1, 1, 1));
  FS.puffMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
  FS.lampGeo = shared(new THREE.BoxGeometry(1.04, 1.04, 1.04));
  FS.lampMat = new THREE.MeshBasicMaterial({ map: FT.lamp });
  FS.fans = {};
  FS.lines = {};
  FS.beams = {};
  FS.ready = true;
  return FS;
}

// Rode waaier op de vloer (waar de laser langs gaat), cache per lengte en hoek
function fanGeo(len, span) {
  const key = len + '_' + span.toFixed(2);
  if (!FS.fans[key]) FS.fans[key] = Object.assign(new THREE.CircleGeometry(len, 28, -Math.PI / 2, span), { userShared: true });
  return FS.fans[key];
}
function arcGeo(len, span) {
  const key = 'r' + len + '_' + span.toFixed(2);
  if (!FS.fans[key]) FS.fans[key] = Object.assign(new THREE.RingGeometry(len - 0.4, len, 28, 1, -Math.PI / 2, span), { userShared: true });
  return FS.fans[key];
}
function lineGeo(len) {
  if (!FS.lines[len]) FS.lines[len] = Object.assign(new THREE.PlaneGeometry(0.7, len).translate(0, -len / 2, 0), { userShared: true });
  return FS.lines[len];
}
// De laserstraal: schuin van de borst naar de vloer, dan laag over de vloer
function beamGeos(len) {
  if (!FS.beams[len]) {
    const L = len - 3;
    const slope = Math.hypot(2.9, 1.9);
    FS.beams[len] = {
      floorCore: new THREE.BoxGeometry(0.26, 0.26, L).translate(0, 0.5, 3 + L / 2),
      floorGlow: new THREE.BoxGeometry(0.75, 0.6, L).translate(0, 0.5, 3 + L / 2),
      slopeCore: new THREE.BoxGeometry(0.3, 0.3, slope),
      slopeGlow: new THREE.BoxGeometry(0.7, 0.7, slope),
    };
    for (const g of Object.values(FS.beams[len])) g.userShared = true;
  }
  return FS.beams[len];
}

/* ---------- Rookwolkjes (één mesh voor alle blokjes rook) ---------- */
class PuffPool {
  constructor(group, n) {
    facShared();
    this.n = n;
    this.mesh = new THREE.InstancedMesh(FS.puffGeo, FS.puffMat, n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.list = [];
    this.next = 0;
    this.m4 = new THREE.Matrix4();
    this.col = new THREE.Color();
    this.sv = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      this.list.push({ age: 1, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 0, s1: 0, rot: 0 });
      this.m4.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(i, this.m4);
      this.mesh.setColorAt(i, this.col.setRGB(0.5, 0.5, 0.5));
    }
    group.add(this.mesh);
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, grey) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    const p = this.list[i];
    Object.assign(p, { age: 0, life, x, y, z, vx, vy, vz, s0, s1, rot: Math.random() * 3 });
    this.mesh.setColorAt(i, this.col.setRGB(grey, grey * 0.97, grey * 0.93));
    this.mesh.instanceColor.needsUpdate = true;
  }
  update(dt) {
    const m = this.m4;
    for (let i = 0; i < this.n; i++) {
      const p = this.list[i];
      if (p.age >= p.life) continue;
      p.age += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const k = Math.min(1, p.age / p.life);
      const s = p.age >= p.life ? 0 : (p.s0 + (p.s1 - p.s0) * k) * (k > 0.75 ? (1 - k) / 0.25 : 1);
      m.makeRotationY(p.rot + k);
      m.scale(this.sv.set(s, s, s));
      m.setPosition(p.x, p.y, p.z);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ---------- Laserzwaai: waarschuwing (waaier) en dan een draaiende straal ---------- */
class FacSweep {
  // o: ox, oz, y (vloer), a0 (startrichting), dir (+1/-1), span, len, warn, speed (rad/s), dmg, back (tweede straal achteruit)
  constructor(o) {
    facShared();
    Object.assign(this, o);
    this.t = 0; this.dead = false; this.fired = false; this.hit = false; this.done = false;
    this.ang = this.a0;
    this.beamsN = this.back ? 2 : 1;
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.ox, this.y + 0.04, this.oz);
    this.mesh.renderOrder = 4;
    this.warnMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
    this.lineMat = new THREE.MeshBasicMaterial({ color: 0xffe020, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
    this.warn3d = [];
    this.beams = [];
    const bg = beamGeos(this.len);
    const lo = this.dir > 0 ? this.a0 : this.a0 - this.span;
    for (let b = 0; b < this.beamsN; b++) {
      const off = b * Math.PI;
      const fh = new THREE.Group(); fh.rotation.y = lo + off;
      const fan = new THREE.Mesh(fanGeo(this.len, this.span), this.warnMat); fan.rotation.x = -Math.PI / 2;
      const arc = new THREE.Mesh(arcGeo(this.len, this.span), this.lineMat); arc.rotation.x = -Math.PI / 2;
      fh.add(fan, arc);
      const lh = new THREE.Group(); lh.rotation.y = this.a0 + off;
      const line = new THREE.Mesh(lineGeo(this.len), this.lineMat); line.rotation.x = -Math.PI / 2; line.position.y = 0.01;
      lh.add(line);
      this.mesh.add(fh, lh);
      this.warn3d.push(fh, lh);
      // de straal zelf (eerst verborgen)
      const beam = new THREE.Group();
      beam.visible = false;
      const zb = b ? -1 : 1;
      const sc = new THREE.Mesh(bg.slopeCore, FS.beamCore), sg = new THREE.Mesh(bg.slopeGlow, FS.beamGlow);
      for (const s of [sc, sg]) { s.position.set(0, 1.95 - 0.04, 2.05); s.rotation.x = Math.atan2(2.9, 1.9); }
      beam.add(sc, sg, new THREE.Mesh(bg.floorCore, FS.beamCore), new THREE.Mesh(bg.floorGlow, FS.beamGlow));
      beam.userData.zb = zb;
      this.mesh.add(beam);
      this.beams.push(beam);
    }
  }

  update(dt) {
    this.t += dt;
    if (this.t < this.warn) {
      const k = this.t / this.warn;
      this.warnMat.opacity = 0.2 + 0.22 * (Math.sin(this.t * 16) * 0.5 + 0.5);
      this.lineMat.opacity = 0.35 + 0.6 * k;
      return;
    }
    if (!this.fired) {
      this.fired = true;
      for (const b of this.beams) b.visible = true;
      for (const m of this.warn3d) if (m.children[0].material === this.lineMat) m.visible = false;
      SND.play('zap', { at: { x: this.ox, y: this.y, z: this.oz }, range: 50, vol: 1 });
      SND.play('shoot', { at: { x: this.ox, y: this.y, z: this.oz }, range: 50, vol: 0.6 });
    }
    const prev = this.ang;
    const st = this.t - this.warn;
    const k = Math.min(1, st * this.speed / this.span);
    this.ang = this.a0 + this.dir * this.span * k;
    this.warnMat.opacity = 0.16 * (1 - k * 0.6);
    for (let b = 0; b < this.beamsN; b++) {
      const off = b * Math.PI;
      this.beams[b].rotation.y = this.ang + off;
      this.checkHit(prev + off, this.ang + off);
      // vonken aan het eind en vuur langs de straal
      const fx = Math.sin(this.ang + off), fz = Math.cos(this.ang + off);
      const r = 3 + Math.random() * (this.len - 3);
      FX.flame(this.ox + fx * r, this.y + 0.5, this.oz + fz * r, 0.3);
      const ex = this.ox + fx * this.len, ez = this.oz + fz * this.len;
      FX.glow.spawn(ex, this.y + 0.5, ez, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4, 1, 0.6 + Math.random() * 0.3, 0.2, 0.4, 12, 0.5);
    }
    if (k >= 1) {
      this.done = true;
      if (st * this.speed / this.span > 1 + 0.25 * this.speed / this.span) this.dead = true;
    }
  }

  checkHit(a0, a1) {
    if (this.hit) return;
    const p = player;
    if (p.dead) return;
    const dx = p.pos.x - this.ox, dz = p.pos.z - this.oz;
    const r = Math.hypot(dx, dz);
    if (r > this.len + p.hw || r < 0.8) return;
    const pa = Math.atan2(dx, dz);
    const half = Math.atan2(0.4 + p.hw, Math.max(r, 0.5));
    const d0 = angleDiff(a0, pa), d1 = angleDiff(a1, pa);
    const crossed = Math.abs(d1) < half || (Math.sign(d0) !== Math.sign(d1) && Math.abs(d0) < 1.5 && Math.abs(d1) < 1.5);
    if (!crossed) return;
    // over de lage straal gesprongen? (vlak bij de schurk loopt de straal schuin omhoog)
    if ((r > 3.2 && p.pos.y > this.y + 0.75) || p.pos.y > this.y + 3.4) return;
    this.hit = true;
    damagePlayer(this.dmg, { x: this.ox, y: this.y, z: this.oz }, 'factory_laser', 7, 6);
    FX.explosion(p.pos.x, p.pos.y + 0.6, p.pos.z, 0.35);
  }

  dispose() {}
}

/* ---------- Generator (handlanger die stil staat en het schild voedt) ---------- */
function makeGenerator(boss, pad) {
  const fs = facShared();
  const gen = new Minion(boss.world, pad.x + 0.5, boss.info.floorY, pad.z + 0.5, {
    name: 'Generator', hp: 45, speed: 0, dmg: 1, hw: 0.55, h: 2.0, life: 9999, color: [1, 0.8, 0.25],
    model: () => {
      const body = new THREE.MeshLambertMaterial({ map: FT.dark });
      const coil = new THREE.MeshLambertMaterial({ map: FT.copper, emissive: 0x663300, emissiveIntensity: 0.5 });
      const core = new THREE.MeshLambertMaterial({ map: FT.core, emissive: 0xffffff, emissiveMap: FT.core, emissiveIntensity: 1 });
      const group = new THREE.Group();
      const inner = new THREE.Group();
      group.add(inner);
      inner.add(bossBox(1.15, 0.5, 1.15, body, 0.25));
      const coilM = bossBox(0.8, 1.0, 0.8, coil, 1.0);
      inner.add(coilM);
      const coreM = bossBox(0.55, 0.55, 0.55, core, 0);
      coreM.position.y = 1.85;
      inner.add(coreM);
      const beam = new THREE.Mesh(fs.genBeamGeo, fs.genBeam);
      beam.position.y = 1.85;
      inner.add(beam);
      const tmp = new THREE.Vector3(), zAxis = new THREE.Vector3(0, 0, 1);
      return {
        group, mats: [body, coil, core],
        animate(m, dt) {
          // blijft op zijn plek staan en doet zelf geen schade
          m.pos.set(m.ax, m.ay, m.az); m.vel.set(0, 0, 0); m.hitCD = 99;
          inner.rotation.y = -m.yaw;
          coilM.rotation.y += dt * 3;
          coreM.rotation.y -= dt * 4; coreM.rotation.x += dt * 2.5;
          coreM.position.y = 1.85 + Math.sin(game.time * 4 + m.ax) * 0.08;
          const b = game.boss;
          if (b && b.alive() && b.shield) {
            const c = b.center();
            tmp.set(c.x - m.pos.x, c.y - m.pos.y - 1.85, c.z - m.pos.z);
            const L = tmp.length();
            beam.visible = true;
            beam.scale.set(1 + Math.sin(game.time * 30) * 0.3, 1, L);
            beam.quaternion.setFromUnitVectors(zAxis, tmp.normalize());
            if (Math.random() < dt * 8) {
              const k = Math.random();
              FX.glow.spawn(m.pos.x + tmp.x * L * k, m.pos.y + 1.85 + tmp.y * L * k, m.pos.z + tmp.z * L * k, 0, 0.5, 0, 0.6, 0.95, 1, 0.3, 0, 0);
            }
          } else beam.visible = false;
          if (Math.random() < dt * 3) FX.glow.spawn(m.pos.x + (Math.random() - 0.5), m.pos.y + 1.4 + Math.random() * 0.6, m.pos.z + (Math.random() - 0.5), 0, 1, 0, 1, 0.85, 0.3, 0.3, 0, 0);
        },
      };
    },
  });
  gen.ax = pad.x + 0.5; gen.ay = boss.info.floorY; gen.az = pad.z + 0.5;
  return gen;
}

/* ---------- De IJzeren Titan ---------- */
const COL_CYAN = 0x66ddff, COL_BLUE = 0x3366ff, COL_RED = 0xff3020;

class FactoryBoss extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De IJzeren Titan', ref: 'de IJzeren Titan', hp: 760, hw: 1.5, h: 5.6, deathTiles: [T.FACTORY_IRON, T.FACTORY_COPPER, T.FACTORY_STRIPE], wakeRange: 12.5 });
    this.anim = { armL: 0.1, armR: 0.1, armLZ: 0.08, armRZ: 0.08, legL: 0, legR: 0, lean: 0.25, head: 0.5, crouch: 0.25, visor: 0, core: 0.2, pods: 0.3, rot: 0 };
    this.shield = false; this.shieldsDone = 0; this.gens = []; this.gensSpawned = false;
    this.shieldMsgT = 0; this.bubbleHit = 0;
    this.sweep = null; this.lastAtk = ''; this.combo = 0; this.fired = 0;
    this.rotor = 0; this.puffT = 0; this.windT = 0.8;
  }

  buildModel() {
    facShared();
    const body = new THREE.MeshLambertMaterial({ map: FT.body, emissive: 0xffffff, emissiveMap: FT.seams, emissiveIntensity: 0 });
    const dark = new THREE.MeshLambertMaterial({ map: FT.dark });
    const stripe = new THREE.MeshLambertMaterial({ map: FT.stripe });
    const copper = new THREE.MeshLambertMaterial({ map: FT.copper });
    const face = new THREE.MeshLambertMaterial({ map: FT.face, emissive: 0xffffff, emissiveMap: FT.faceGlow, emissiveIntensity: 0.1 });
    const visor = new THREE.MeshLambertMaterial({ color: 0x331010, emissive: 0xff2a10, emissiveIntensity: 0 });
    visor.userBase = new THREE.Color(0x331010);
    const core = new THREE.MeshLambertMaterial({ map: FT.core, emissive: COL_CYAN, emissiveMap: FT.core, emissiveIntensity: 0.3 });
    const podTip = new THREE.MeshLambertMaterial({ color: 0xcc2a20, emissive: 0xff3010, emissiveIntensity: 0.3 });
    podTip.userBase = new THREE.Color(0xcc2a20);
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    // benen
    const legs = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.78, 2.0, 0);
      p.add(bossBox(0.85, 1.0, 0.85, dark, -0.5));
      p.add(bossBox(1.05, 1.0, 1.1, body, -1.4));
      p.add(bossBox(1.25, 0.4, 1.65, stripe, -1.8, 0, 0.18));
      inner.add(p);
      legs.push(p);
    }
    inner.add(bossBox(2.0, 0.6, 1.2, dark, 2.1));
    // romp met kern, waarschuwingsplaat en twee rookpijpen
    const torso = new THREE.Group();
    torso.position.y = 2.3;
    inner.add(torso);
    torso.add(bossBox(3.0, 2.1, 1.8, body, 1.05));
    torso.add(bossBox(2.2, 0.45, 0.12, stripe, 0.35, 0, 0.92));
    const coreM = bossBox(0.85, 0.85, 0.2, core, 1.25, 0, 0.95);
    torso.add(coreM);
    for (const sx of [-1, 1]) torso.add(bossBox(0.42, 1.3, 0.42, dark, 2.5, sx * 0.62, -0.72));
    // hoofd met rood vizier en antenne
    const head = new THREE.Group();
    head.position.set(0, 2.1, 0.1);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.15, 1.3).translate(0, 0.58, 0), [body, body, body, body, face, body]));
    head.add(bossBox(1.2, 0.26, 0.1, visor, 0.62, 0, 0.67));
    head.add(bossBox(0.1, 0.6, 0.1, dark, 1.45, 0.45, -0.2));
    head.add(bossBox(0.22, 0.22, 0.22, visor, 1.8, 0.45, -0.2));
    // schouders met draaiende tandwielen en raketkastjes; armen: hamer links, laserkanon rechts
    const rotors = [], arms = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(sx * 1.9, 1.65, 0);
      torso.add(sh);
      sh.add(bossBox(1.0, 1.0, 1.25, stripe, 0));
      const rot = new THREE.Group();
      rot.position.x = sx * 0.58;
      rot.add(bossBox(0.18, 1.6, 0.36, copper, 0));
      rot.add(bossBox(0.18, 0.36, 1.6, copper, 0));
      sh.add(rot);
      rotors.push(rot);
      sh.add(bossBox(0.85, 0.55, 1.05, dark, 0.78));
      sh.add(bossBox(0.62, 0.22, 0.08, podTip, 0.8, 0, 0.54));
      const arm = new THREE.Group();
      arm.position.set(sx * 0.15, -0.35, 0);
      sh.add(arm);
      arm.add(bossBox(0.8, 1.3, 0.8, body, -0.65));
      arm.add(bossBox(0.95, 1.2, 0.95, dark, -1.8));
      if (sx < 0) arm.add(bossBox(1.3, 0.95, 1.3, body, -2.85));
      else {
        arm.add(bossBox(0.6, 0.6, 1.3, dark, -2.6, 0, 0.3));
        arm.add(bossBox(0.36, 0.36, 0.12, visor, -2.6, 0, 1.0));
      }
      arms.push(arm);
    }
    // schild (verborgen tot de generatoren aangaan)
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xaaf4ff, transparent: true, opacity: 0.5, wireframe: true, depthWrite: false });
    const bubble = new THREE.Group();
    const bg = new THREE.IcosahedronGeometry(3.6, 1);
    bubble.add(new THREE.Mesh(bg, bubbleMat), new THREE.Mesh(bg, wireMat));
    bubble.position.y = 2.9;
    bubble.visible = false;
    group.add(bubble);
    return { group, inner, legs, torso, head, rotors, arms, bubble, bubbleMat, coreM, mats: [body, dark, stripe, copper, face, visor, core, podTip], body, face, visor, core, podTip };
  }

  needShield() {
    return (this.shieldsDone === 0 && this.hp <= this.maxHp * 0.72) || (this.shieldsDone === 1 && this.enraged && this.hp <= this.maxHp * 0.3);
  }

  onWake() { SND.play('zap', { vol: 0.8 }); }
  onEnrage() {
    this.model.body.emissiveIntensity = 0.9;
    this.model.face.emissiveIntensity = 1.6;
    SND.play('zap', { vol: 1 });
    FX.explosion(this.pos.x, this.pos.y + 4, this.pos.z, 0.8);
  }
  enragedFx() {
    FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 3, this.pos.y + 1 + Math.random() * 4.5, this.pos.z + (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3, 1, 0.55 + Math.random() * 0.3, 0.15, 0.35, 10, 0.5);
  }
  onGoHome() {
    if (this.sweep) { this.sweep.dead = true; this.sweep = null; }
    this.shield = false; this.gens = []; this.gensSpawned = false; this.combo = 0;
    this.model.bubble.visible = false;
  }

  hurt(amount, kind) {
    if (this.shield && this.alive()) {
      if (kind !== 'burn') {
        this.bubbleHit = 0.25;
        SND.play('deflect', { at: this.pos });
        const c = this.center();
        FX.crit(c.x, c.y, c.z);
        if (this.shieldMsgT <= 0) { HUD.actionbar('Het schild houdt alles tegen! Sla eerst de generatoren kapot!', 2.4); this.shieldMsgT = 2.6; }
      }
      this.burn = 0;
      return false;
    }
    return super.hurt(amount, kind);
  }

  local(lx, ly, lz) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    return new THREE.Vector3(this.pos.x + lx * c + lz * s, this.pos.y + ly, this.pos.z - lx * s + lz * c);
  }

  think(dt, c) {
    const ph2 = this.enraged, p = c.p;
    let speed = 0;
    this.shieldMsgT -= dt;
    if (this.shield) this.updateGens();
    if ((this.state === 'chase' || this.state === 'recover') && !this.shield && this.needShield()) this.setState('shieldUp');
    switch (this.state) {
      case 'chase':
        this.turnTo(c.targetYaw, dt, ph2 ? 3.2 : 2.4);
        if (c.dist > 3.6) speed = this.shield ? 1.1 : ph2 ? 2.5 : 1.9;
        this.attackCD -= dt;
        if (this.attackCD <= 0 && !p.dead) this.pickAttack(c);
        break;

      // Hamerslag: rode cirkel voor hem, dan slaat de hamer
      case 'punchWind':
        if (this.t < dt * 1.5) {
          this.windT = ph2 ? 0.6 : 0.8;
          this.yaw = c.targetYaw;
          const f = this.local(0, 0, 2.7);
          game.addHazard(new GroundHazard({
            x: f.x, y: this.info.floorY, z: f.z, radius: ph2 ? 2.6 : 2.3, warn: this.windT, linger: 0.3, color: 0xff3300,
            onTrigger: (h) => {
              FX.ring(h.x, h.y, h.z, h.radius, [0.75, 0.75, 0.8]);
              for (let i = 0; i < 14; i++) FX.debris.spawn(h.x, h.y + 0.2, h.z, (Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.5) * 6, 0.45, 0.45, 0.5, 0.7, 16, 0.5, true);
              SND.play('slam', { at: h, range: 40 });
              game.shake = Math.max(game.shake, 0.55);
              if (h.playerInside()) damagePlayer(this.dmg(13), { x: h.x, y: h.y, z: h.z }, 'boss', 9, 6.5);
            },
          }));
          SND.play('whoosh', { at: this.pos, vol: 0.6 });
        }
        if (this.t >= this.windT) this.setState('punch');
        break;
      case 'punch':
        if (this.t > 0.35) {
          if (ph2 && !this.combo && c.dist < 6) { this.combo = 1; this.setState('punchWind'); }
          else { this.combo = 0; this.setState('recover', ph2 ? 0.45 : 0.75); }
        }
        break;

      // Laserzwaai: waaier op de vloer, dan draait de straal er langzaam overheen
      case 'laserWind':
        this.turnTo(c.targetYaw, dt, 4);
        if (this.t < dt * 1.5) SND.play('zap', { at: this.pos, range: 40, vol: 0.5 });
        if (Math.random() < 0.6) { const q = this.local(0, 3.55, 1.1); FX.glow.spawn(q.x, q.y, q.z, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1, 0.3, 0.2, 0.3, 0, 1); }
        if (this.t > (ph2 ? 0.45 : 0.6)) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const offA = clamp(2.7 / Math.max(c.dist, 1), 0.24, 0.95);
          const a0 = c.targetYaw - dir * offA;
          this.sweep = new FacSweep({
            ox: this.pos.x, oz: this.pos.z, y: this.info.floorY, a0, dir,
            span: ph2 ? 2.0 : 2.1, len: ph2 ? 19 : 17, warn: ph2 ? 0.9 : 1.1, speed: ph2 ? 1.75 : 1.35,
            dmg: this.dmg(12), back: ph2,
          });
          game.addHazard(this.sweep);
          this.setState('laser');
        }
        break;
      case 'laser': {
        const s = this.sweep;
        if (!s || s.dead) { this.sweep = null; this.setState('recover', ph2 ? 0.5 : 0.8); break; }
        if (s.fired) this.yaw = s.ang;
        else this.turnTo(s.a0, dt, 5);
        if (s.done) { this.sweep = null; this.setState('recover', ph2 ? 0.5 : 0.8); }
        break;
      }

      // Zoekraketten uit de schouders (stuk te slaan met het zwaard)
      case 'missilesWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t < dt * 1.5) SND.play('click', { at: this.pos, range: 40 });
        if (this.t > (ph2 ? 0.5 : 0.65)) { this.fired = 0; this.setState('missiles'); }
        break;
      case 'missiles': {
        this.turnTo(c.targetYaw, dt, 3);
        const n = ph2 ? 4 : 2;
        if (this.fired < n && this.t >= this.fired * 0.24) { this.fireMissile(this.fired); this.fired++; }
        if (this.fired >= n && this.t > n * 0.24 + 0.2) this.setState('recover', ph2 ? 0.5 : 0.8);
        break;
      }

      // Magneet: trekt je naar zich toe, dan een stamp met een schokgolf
      case 'magnetWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t < dt * 1.5) SND.play('zap', { at: this.pos, range: 40, vol: 0.7 });
        if (this.t > (ph2 ? 0.5 : 0.7)) {
          this.pullT = ph2 ? 1.6 : 1.5;
          game.addHazard(new GroundHazard({
            x: this.pos.x, y: this.info.floorY, z: this.pos.z, radius: 5.2, warn: this.pullT + 0.45, linger: 0.4, color: 0x2255ff,
            onTrigger: (h) => {
              FX.ring(h.x, h.y, h.z, h.radius, [0.55, 0.7, 1]);
              FX.ring(h.x, h.y, h.z, h.radius * 0.5, [0.8, 0.8, 0.85]);
              SND.play('slam', { at: h, range: 50 });
              SND.play('explode', { at: h, range: 50, vol: 0.5 });
              game.shake = Math.max(game.shake, 0.8);
              if (h.playerInside()) damagePlayer(this.dmg(14), { x: h.x, y: h.y, z: h.z }, 'boss', 11, 7);
            },
          }));
          SND.play('wind', { vol: 0.7 });
          HUD.actionbar('De magneet trekt aan je! Ren weg uit de blauwe cirkel!', 2);
          this.setState('magnet');
        }
        break;
      case 'magnet': {
        this.turnTo(c.targetYaw, dt, 2);
        const dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
        if (!p.dead && d > 2.4 && d < 30) {
          // duwtje richting de schurk, tot een maximale treksnelheid
          const pull = ph2 ? 3.4 : 3.0, ux = dx / d, uz = dz / d;
          if (p.kbx * ux + p.kbz * uz < pull) { p.kbx += ux * 28 * dt; p.kbz += uz * 28 * dt; }
        }
        if (Math.random() < 0.8) {
          const r = Math.random();
          FX.glow.spawn(p.pos.x + dx * r, p.pos.y + 1 + Math.random(), p.pos.z + dz * r, dx / d * 6, 0, dz / d * 6, 0.4, 0.6, 1, 0.3, 0, 0);
        }
        if (this.t > this.pullT) this.setState('stompWind');
        break;
      }
      case 'stompWind':
        if (this.t > 0.45) this.setState('stomp');
        break;
      case 'stomp':
        if (this.t > 0.3) this.setState('recover', ph2 ? 0.6 : 0.9);
        break;

      // Schild: drie generatoren gaan aan
      case 'shieldUp':
        if (this.t < dt * 1.5) {
          SND.play('roar', { vol: 0.9 });
          SND.play('zap', { vol: 1 });
          this.shield = true;
          this.model.bubble.visible = true;
          HUD.title('', 'Een schild! Sla de 3 generatoren kapot!', 3.2);
        }
        if (!this.gensSpawned && this.t > 0.5) {
          this.gensSpawned = true;
          this.gens = this.info.pads.map((pad) => game.addMinion(makeGenerator(this, pad)));
          for (const g of this.gens) { FX.explosion(g.pos.x, g.pos.y + 1, g.pos.z, 0.5); }
          SND.play('teleport', { vol: 0.8 });
        }
        if (this.t > 1.3) { this.setState('chase'); this.attackCD = 2.2; }
        break;
      case 'overload':
        if (Math.random() < 0.5) {
          const q = this.local((Math.random() - 0.5) * 3, 1 + Math.random() * 4.5, (Math.random() - 0.5) * 2);
          FX.glow.spawn(q.x, q.y, q.z, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.6, 0.9, 1, 0.4, 10, 0.5);
        }
        if (this.t > 3.0) { this.setState('chase'); this.attackCD = 1.0; }
        break;
      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = (ph2 ? 0.9 + Math.random() * 0.6 : 1.5 + Math.random() * 0.8) + (this.shield ? 1.2 : 0);
        }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  pickAttack(c) {
    const d = c.dist;
    let opts;
    if (this.shield) opts = this.enraged ? ['missiles', 'laser'] : ['missiles', 'missiles', 'laser'];
    else if (d < 5) opts = ['punch', 'punch', 'laser', 'missiles'];
    else if (d > 8) opts = ['magnet', 'missiles', 'laser', 'magnet'];
    else opts = ['laser', 'missiles', 'magnet', 'punch'];
    let pick = opts[Math.floor(Math.random() * opts.length)];
    if (pick === this.lastAtk && Math.random() < 0.65) pick = opts[(opts.indexOf(pick) + 1) % opts.length];
    this.lastAtk = pick;
    this.setState(pick + 'Wind');
  }

  fireMissile(i) {
    const fs = facShared();
    const sx = i % 2 ? 1 : -1;
    const o = this.local(sx * 1.9, 4.75, 0.3);
    // eerst schuin opzij, daarna sturen ze bij naar de speler
    const vel = new THREE.Vector3(player.pos.x - o.x, player.pos.y + 1.1 - o.y, player.pos.z - o.z).normalize();
    vel.x += Math.cos(this.yaw) * sx * 0.6; vel.z -= Math.sin(this.yaw) * sx * 0.6; vel.y += 0.2;
    vel.normalize();
    const speed = this.enraged ? 8.5 : 7;
    const mesh = new THREE.Group();
    mesh.add(new THREE.Mesh(fs.mBodyGeo, fs.missileBody), new THREE.Mesh(fs.mTipGeo, fs.missileTip),
      new THREE.Mesh(fs.mFinGeo1, fs.missileFin), new THREE.Mesh(fs.mFinGeo2, fs.missileFin));
    mesh.scale.setScalar(1.35);
    game.addProjectile(new Projectile({
      pos: o, vel: vel.multiplyScalar(speed), owner: 'boss', type: 'factory_missile',
      dmg: this.dmg(11), radius: 0.35, destroyable: true, homing: this.enraged ? 2.0 : 1.6, life: 5, knock: 6, spin: false, mesh,
      trail: (pr) => {
        pr.mesh.lookAt(pr.pos.x + pr.vel.x, pr.pos.y + pr.vel.y, pr.pos.z + pr.vel.z);
        const k = 0.5 / pr.speed;
        FX.flame(pr.pos.x - pr.vel.x * k, pr.pos.y - pr.vel.y * k, pr.pos.z - pr.vel.z * k, 0.15);
        if (Math.random() < 0.5) FX.smoke(pr.pos.x - pr.vel.x * k, pr.pos.y - pr.vel.y * k, pr.pos.z - pr.vel.z * k);
      },
      explodeFx: (pr) => { FX.explosion(pr.pos.x, pr.pos.y, pr.pos.z, 0.55); },
    }));
    SND.play('shoot', { at: o, range: 40, vol: 0.7 });
    FX.explosion(o.x, o.y, o.z, 0.2);
  }

  updateGens() {
    let alive = 0;
    for (const g of this.gens) {
      if (g.dead) {
        if (!g.boomed) {
          g.boomed = true;
          FX.explosion(g.pos.x, g.pos.y + 1, g.pos.z, 0.9);
          SND.play('explode', { at: g.pos, range: 50, vol: 0.8 });
          game.shake = Math.max(game.shake, 0.4);
          const left = this.gens.filter((m) => !m.dead).length;
          if (left > 0) HUD.actionbar('Generator kapot! Nog ' + left + ' te gaan!', 2);
        }
      } else alive++;
    }
    if (this.gensSpawned && alive === 0) this.breakShield();
  }

  breakShield() {
    this.shield = false; this.shieldsDone++; this.gens = []; this.gensSpawned = false;
    if (this.sweep) { this.sweep.dead = true; this.sweep = null; }
    this.model.bubble.visible = false;
    const c = this.center();
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * Math.PI;
      const x = Math.cos(a) * Math.cos(e), y = Math.sin(e), z = Math.sin(a) * Math.cos(e);
      FX.glow.spawn(c.x + x * 3.4, c.y + y * 3.4, c.z + z * 3.4, x * 5, y * 5 + 2, z * 5, 0.6, 0.9, 1, 0.8, 6, 1);
    }
    SND.play('shatter', { vol: 1 });
    SND.play('explode', { vol: 0.6 });
    game.shake = Math.max(game.shake, 0.6);
    HUD.title('', 'Het schild is kapot! Sla hem nu!', 2.6);
    this.setState('overload');
  }

  die() {
    if (this.sweep) { this.sweep.dead = true; this.sweep = null; }
    this.shield = false;
    this.model.bubble.visible = false;
    super.die();
  }

  animate(dt, speed) {
    const a = this.anim, m = this.model, ph2 = this.enraged;
    this.walkPhase += dt * speed * 1.7;
    const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 1.9) * 0.5;
    let armL = -sw * 0.5, armR = sw * 0.5, armLZ = 0.08, armRZ = 0.08, legL = sw, legR = -sw, lean = 0.05, head = 0;
    let crouch = Math.abs(Math.cos(this.walkPhase)) * 0.1 * Math.min(1, speed);
    let visor = ph2 ? 2.4 : 1.5, core = 1, coreCol = ph2 ? COL_RED : COL_CYAN, pods = 0.3, rotSpd = ph2 ? 9 : 4, rate = 9;
    switch (this.state) {
      case 'sleep': case 'idle':
        armL = armR = 0.12; lean = 0.25; head = 0.5; crouch = 0.25; legL = legR = 0; core = 0.2; rotSpd = 0;
        visor = this.state === 'idle' ? 0.6 : (Math.sin(game.time * 1.3) > 0.97 ? 0.5 : 0.04);
        break;
      case 'roar':
        armL = armR = -2.7; armLZ = armRZ = 0.5; lean = -0.2; head = -0.4; rotSpd = 16; rate = 6; core = 3;
        visor = Math.random() < 0.85 ? 3 : 0.3;
        break;
      case 'punchWind': {
        const k = clamp(this.t / this.windT, 0, 1);
        armL = -2.9 * easeOut(k); armLZ = 0.25; lean = -0.15 * k; head = -0.1; visor = 2.8; rate = 12;
        break;
      }
      case 'punch': armL = 0.45; armLZ = 0.1; lean = 0.38; crouch = 0.3; rate = 26; break;
      case 'laserWind': armR = -1.3; lean = -0.1; head = 0.1; visor = 3; core = 2.5; coreCol = COL_RED; rate = 8; break;
      case 'laser': armR = -1.1; lean = -0.05; head = 0.2; visor = 3.2; core = 3; coreCol = COL_RED; break;
      case 'missilesWind': case 'missiles':
        armL = armR = -0.3; armLZ = armRZ = 0.5; lean = -0.25; head = -0.2; pods = 3; rotSpd = 18;
        break;
      case 'magnetWind': case 'magnet':
        armL = armR = -1.45; armLZ = armRZ = -0.2; crouch = 0.3; lean = 0.1; coreCol = COL_BLUE; core = 3; legL = 0.25; legR = -0.25; rotSpd = 14;
        break;
      case 'stompWind': {
        const k = clamp(this.t / 0.45, 0, 1);
        legL = -1.1 * k; legR = 0.1; armL = armR = -0.5; armLZ = armRZ = 0.75; lean = -0.12; coreCol = COL_BLUE; core = 3; rate = 14;
        break;
      }
      case 'stomp': legL = 0.1; legR = 0; crouch = 0.4; lean = 0.25; armLZ = armRZ = 0.85; rate = 26; break;
      case 'shieldUp': armL = armR = -2.9; armLZ = armRZ = 0.3; head = -0.45; lean = -0.2; core = 3; coreCol = COL_CYAN; rotSpd = 20; break;
      case 'overload':
        armL = 0.3 + Math.sin(this.t * 9) * 0.2; armR = 0.3 - Math.sin(this.t * 9) * 0.2; armLZ = armRZ = 0.3;
        lean = 0.45; head = 0.55 + Math.sin(this.t * 7) * 0.2; crouch = 0.35; legL = legR = 0; rotSpd = 1; core = 0.3;
        visor = Math.random() < 0.5 ? 0.2 : 2;
        break;
      case 'recover': armL = armR = 0.1; lean = 0.12; head = 0.12; rate = 6; break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.armL += (armL - a.armL) * k; a.armR += (armR - a.armR) * k;
    a.armLZ += (armLZ - a.armLZ) * k; a.armRZ += (armRZ - a.armRZ) * k;
    a.legL += (legL - a.legL) * Math.min(1, k * 1.5); a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
    a.lean += (lean - a.lean) * k; a.head += (head - a.head) * k; a.crouch += (crouch - a.crouch) * k;
    const kv = 1 - Math.exp(-dt * 10);
    a.visor += (visor - a.visor) * kv; a.core += (core - a.core) * kv; a.pods += (pods - a.pods) * kv;
    a.rot += (rotSpd - a.rot) * (1 - Math.exp(-dt * 3));
    this.rotor += dt * a.rot;
    m.arms[0].rotation.x = a.armL; m.arms[1].rotation.x = a.armR;
    m.arms[0].rotation.z = -a.armLZ; m.arms[1].rotation.z = a.armRZ;
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head;
    m.inner.position.y = -a.crouch;
    m.rotors[0].rotation.x = this.rotor; m.rotors[1].rotation.x = -this.rotor;
    m.visor.emissiveIntensity = a.visor;
    m.face.emissiveIntensity = Math.min(1.6, a.visor * 0.6);
    m.core.emissive.setHex(coreCol);
    m.core.emissiveIntensity = a.core;
    m.podTip.emissiveIntensity = a.pods;
    if (this.state === 'magnet' || this.state === 'magnetWind') m.coreM.scale.setScalar(1 + Math.sin(game.time * 20) * 0.12);
    else m.coreM.scale.setScalar(1);

    // schild: groeit op, golft, en flitst als je erop slaat
    const bub = m.bubble;
    if (this.shield) {
      bub.visible = true;
      const g = this.state === 'shieldUp' ? easeOut(clamp(this.t / 0.6, 0, 1)) : 1;
      bub.scale.setScalar(g * (1 + Math.sin(game.time * 5) * 0.03));
      bub.rotation.y += dt * 0.6;
      this.bubbleHit -= dt;
      m.bubbleMat.opacity = 0.18 + Math.sin(game.time * 6) * 0.05 + (this.bubbleHit > 0 ? 0.35 : 0);
    } else bub.visible = false;

    // rookwolkjes uit de pijpen op zijn rug
    const pool = this.info.puffs;
    if (pool && this.state !== 'sleep' && this.alive()) {
      this.puffT -= dt;
      if (this.puffT <= 0) {
        this.puffT = ph2 ? 0.14 : this.state === 'idle' ? 0.6 : 0.3;
        for (const sx of [-1, 1]) {
          const q = this.local(sx * 0.62, 2.3 + 2.5 + 0.7 - a.crouch, -0.72);
          const g = ph2 ? 0.25 : 0.42;
          pool.spawn(q.x, q.y, q.z, (Math.random() - 0.5) * 0.6, 1.6 + Math.random(), (Math.random() - 0.5) * 0.6, 1.3, 0.35, 1.1, g);
          if (ph2 && Math.random() < 0.5) FX.flame(q.x, q.y, q.z, 0.3);
        }
      }
    }
  }
}

/* ---------- Registratie en sfeer ---------- */
registerRealm('factory', {
  gen: genFactory,
  makeBoss: (world, info) => new FactoryBoss(world, info),
  atmosphere: { background: 0x6e6058, fog: 0x7c6b5e, near: 18, far: 70, amb: 0xffe4cc, ambI: 0.82, dir: 0xffd8b0, dirI: 0.5, hand: 0xffe8d4 },
  intro: 'Klank... klank... De fabriek dreunt. Daar staat de IJzeren Titan stil. Pas op voor zijn laser!',
  tip: 'Tip: spring over de laser of stap opzij! Heeft hij een schild? Sla de 3 generatoren kapot!',
  treasureTip: 'Zie je de knipperende lamp boven de ijzeren deur met goud? Hak de deur kapot, daarachter ligt de schat!',
  ambientSound: 0.45,
  ruin: [FB.IRON, FB.COPPER, FB.STRIPE, FB.LAMP_ON],
  onEnter(info) {
    DEATH_REASONS.factory_laser = 'Geraakt door de laser van de IJzeren Titan';
    DEATH_REASONS.factory_missile = 'Geraakt door een zoekraket';
    facShared();
    info.puffs = new PuffPool(game.realmGroup, 170);
    const lamp = new THREE.Mesh(FS.lampGeo, FS.lampMat);
    lamp.position.set(info.lamp.x + 0.5, info.lamp.y + 0.5, info.lamp.z + 0.5);
    lamp.visible = false;
    game.realmGroup.add(lamp);
    info.blink = lamp;
    info.blinkT = 0; info.clankT = 2; info.sparkT = 3; info.smokeT = 0;
  },
  ambience(dt, info) {
    const p = player;
    if (!info.puffs) return;
    // rook uit de schoorstenen
    info.smokeT += dt * info.chimneys.length * 2.6;
    while (info.smokeT > 1) {
      info.smokeT -= 1;
      const c = info.chimneys[Math.floor(Math.random() * info.chimneys.length)];
      if (c.steam) info.puffs.spawn(c.x, c.y, c.z, (Math.random() - 0.5) * 0.8, 1.6 + Math.random(), (Math.random() - 0.5) * 0.8, 2.6, 0.6, 2.4, 0.8 + Math.random() * 0.15);
      else info.puffs.spawn(c.x + (Math.random() - 0.5) * 0.6, c.y, c.z + (Math.random() - 0.5) * 0.6, 1.0 + Math.random() * 0.6, 2.0 + Math.random(), 0.4, 6 + Math.random() * 2, 1.4, 4.6, 0.18 + Math.random() * 0.2);
    }
    info.puffs.update(dt);
    // lopende banden duwen je mee
    if (p.onGround && !p.dead) {
      const id = info.world.get(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.05), Math.floor(p.pos.z));
      const dir = id === FB.BELT_S ? 1 : id === FB.BELT_N ? -1 : 0;
      if (dir && p.kbz * dir < 2.0) p.kbz += dir * 16 * dt;
    }
    // vonken van de dakbalken en machinegeluiden
    info.sparkT -= dt;
    if (info.sparkT <= 0) {
      info.sparkT = 1 + Math.random() * 2;
      const x = p.pos.x + (Math.random() - 0.5) * 24, z = p.pos.z + (Math.random() - 0.5) * 24;
      for (let i = 0; i < 10; i++) FX.glow.spawn(x, info.wallTop + 0.5, z, (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2, 1, 0.65 + Math.random() * 0.3, 0.2, 1.4, 12, 0.3, true);
    }
    info.clankT -= dt;
    if (info.clankT <= 0 && info.machines.length) {
      info.clankT = 1.5 + Math.random() * 3;
      const m = info.machines[Math.floor(Math.random() * info.machines.length)];
      SND.play(Math.random() < 0.5 ? 'click' : 'slam', { at: m, range: 30, vol: 0.25 });
      info.puffs.spawn(m.x, m.y + 1, m.z, 0, 1.2, 0, 1.5, 0.4, 1.2, 0.85);
    }
    // de lamp boven de kluisdeur knippert als je de schat mag zoeken
    if (PROG.phase === 'treasure') {
      info.blinkT += dt;
      const on = info.blinkT % 0.7 < 0.35;
      info.blink.visible = on;
      if (on && Math.random() < dt * 10) FX.glow.spawn(info.lamp.x + 0.5 + (Math.random() - 0.5) * 1.4, info.lamp.y + 0.5 + (Math.random() - 0.5) * 1.4, info.lamp.z + 0.5 + (Math.random() - 0.5) * 1.4, 0, 0.8, 0, 1, 0.8, 0.3, 0.6, 0, 0);
    } else info.blink.visible = false;
  },
});

window.FACTORY = { gen: genFactory, Boss: FactoryBoss, FB, Sweep: FacSweep };
})();
