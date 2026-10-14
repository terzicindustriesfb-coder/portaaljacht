'use strict';
/* Portaaljacht – wereldgeneratie: de grote bovenwereld en de Nether-arena */

const SEA = 10;
const NETHER_FLOOR = 12; // bovenste blok van de arenavloer
const OW_SIZE = 224, OW_HEIGHT = 64;
const BIOME = { PLAINS: 0, FOREST: 1, DESERT: 2, SNOW: 3, MOUNTAIN: 4 };
const BIOME_PLACE = ['op de vlakte', 'in het bos', 'in de woestijn', 'in het sneeuwland', 'in de bergen'];

function sstep(a, b, v) { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

// De grote bovenwereld: biomen, bergen, rivieren, grotten, een dorp en twee verborgen schatten
function genOverworld(seed) {
  const S = OW_SIZE, H = OW_HEIGHT, C = S >> 1;
  const w = new World('overworld', S, H, S);
  const rand = mulberry32(seed);
  const nE = new Noise2D(rand), nHill = new Noise2D(rand), nTree = new Noise2D(rand);
  const nTemp = new Noise2D(rand), nWet = new Noise2D(rand), nMtn = new Noise2D(rand);
  const nPeak = new Noise2D(rand), nRiver = new Noise2D(rand), nPatch = new Noise2D(rand);
  const hm = new Int16Array(S * S);
  const bio = new Uint8Array(S * S);
  const river = new Uint8Array(S * S);

  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const calm = clamp(1.25 - Math.hypot(x - C, z - C) / 40, 0, 1); // rond het dorp blijft het rustig
      const e = nE.fbm(x / 48, z / 48, 4);
      const hill = Math.max(0, nHill.fbm(x / 32 + 50, z / 32 + 50, 3) + 0.1);
      const temp = nTemp.fbm(x / 130 + 7, z / 130 + 7, 2);
      const wet = nWet.fbm(x / 100 + 21, z / 100 + 21, 2);
      const mtn = sstep(0.1, 0.36, nMtn.fbm(x / 85 + 9, z / 85 + 9, 3) - calm * 0.45);
      const desert = sstep(0.04, 0.14, temp) * sstep(0.1, -0.02, wet);
      let h = 15 + e * 10 + hill * hill * 20 * (1 - desert * 0.75) * (1 - calm * 0.5);
      h += mtn * (8 + Math.max(0, nPeak.fbm(x / 20, z / 20, 3) + 0.15) * 34);
      // rivieren: smalle slingerende geulen door het land
      const rv = Math.abs(nRiver.fbm(x / 95 + 3, z / 95 + 3, 3));
      if (rv < 0.075) {
        const bed = SEA - 2 - (rv < 0.02 ? 1 : 0);
        if (h > bed) h = bed + (h - bed) * sstep(0.028, 0.075, rv);
        if (rv < 0.035) river[z * S + x] = 1;
      }
      const i = z * S + x;
      hm[i] = clamp(Math.floor(h), 3, H - 12);
      if (mtn > 0.5) bio[i] = BIOME.MOUNTAIN;
      else if (desert > 0.5) bio[i] = BIOME.DESERT;
      else if (temp < -0.18) bio[i] = BIOME.SNOW;
      else if (wet > 0.12 || nTree.noise(x / 40, z / 40) > 0.45) bio[i] = BIOME.FOREST;
      else bio[i] = BIOME.PLAINS;
    }
  }
  const biomeAt = (x, z) => bio[clamp(Math.floor(z), 0, S - 1) * S + clamp(Math.floor(x), 0, S - 1)];

  // Hoe vlak is het rond (cx, cz)? 99 = nat of buiten de wereld
  const flatness = (cx, cz, r) => {
    let mn = 99, mx = -1;
    for (let dz = -r; dz <= r; dz += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const x = cx + dx, z = cz + dz;
        if (x < 4 || z < 4 || x >= S - 4 || z >= S - 4) return 99;
        const h = hm[z * S + x];
        if (h <= SEA + 1 || river[z * S + x]) return 99;
        mn = Math.min(mn, h); mx = Math.max(mx, h);
      }
    }
    return mx - mn;
  };

  // Het dorp: een vlak, droog stuk zo dicht mogelijk bij het midden
  let vx = C, vz = C, best = 99;
  for (let r = 0; r <= 64 && best > 3; r += 3) {
    const n = Math.max(1, r * 2);
    for (let a = 0; a < n; a++) {
      const x = Math.round(C + Math.cos(a / n * Math.PI * 2) * r), z = Math.round(C + Math.sin(a / n * Math.PI * 2) * r);
      const f = flatness(x, z, 12);
      if (f < best) { best = f; vx = x; vz = z; }
    }
  }

  // Kolommen vullen: bodemsteen, steen, de grondlaag van het biome en water
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const i = z * S + x, h = hm[i], b = bio[i];
      let slope = 0;
      if (x > 0) slope = Math.max(slope, Math.abs(h - hm[i - 1]));
      if (x < S - 1) slope = Math.max(slope, Math.abs(h - hm[i + 1]));
      if (z > 0) slope = Math.max(slope, Math.abs(h - hm[i - S]));
      if (z < S - 1) slope = Math.max(slope, Math.abs(h - hm[i + S]));
      const patch = nPatch.noise(x / 7, z / 7);
      let top = B.GRASS, fill = B.DIRT;
      if (h < SEA) {
        top = h >= SEA - 2 || b === BIOME.DESERT ? B.SAND : patch > 0.1 ? B.GRAVEL : B.DIRT;
        fill = top === B.SAND ? B.SAND : B.DIRT;
      } else if (b === BIOME.MOUNTAIN) {
        if (h >= 40) { top = B.SNOW; fill = B.STONE; }
        else if (h >= 33 || slope >= 3) { top = patch > 0.45 ? B.GRAVEL : B.STONE; fill = B.STONE; }
        else if (h <= SEA + 1) { top = B.GRAVEL; fill = B.STONE; }
      } else if (h <= SEA + 1) {
        top = B.SAND; fill = B.SAND;
      } else if (b === BIOME.DESERT) {
        top = B.SAND; fill = B.SAND;
      } else if (b === BIOME.SNOW) {
        top = B.SNOW_GRASS;
      }
      if (h >= 44) top = B.SNOW;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0 || (y <= 2 && rand() < 0.5)) id = B.BEDROCK;
        else if (y === h) id = top;
        else if (y >= h - 3) id = fill;
        else if (b === BIOME.DESERT && y >= h - 7) id = B.SANDSTONE;
        else id = B.STONE;
        w.setRaw(x, y, z, id);
      }
      for (let y = h + 1; y <= SEA; y++) w.setRaw(x, y, z, (b === BIOME.SNOW && y === SEA) ? B.ICE : B.WATER);
    }
  }

  // Ertsen in de steen (verrassing voor wie gaat graven)
  const vein = (id, count, maxY, size) => {
    for (let i = 0; i < count; i++) {
      let x = Math.floor(rand() * S), z = Math.floor(rand() * S);
      let y = 2 + Math.floor(rand() * Math.max(1, Math.min(maxY, hm[z * S + x] - 4) - 2));
      for (let k = 0; k < size; k++) {
        if (w.get(x, y, z) === B.STONE) w.setRaw(x, y, z, id);
        x += Math.floor(rand() * 3) - 1; y += Math.floor(rand() * 3) - 1; z += Math.floor(rand() * 3) - 1;
      }
    }
  };
  vein(B.COAL_ORE, 620, 46, 6);
  vein(B.IRON_ORE, 320, 26, 4);
  vein(B.DIAMOND_ORE, 60, 9, 3);

  // Grotten: slingerende gangen; diep onder de grond soms met lava
  const carve = (cx, cy, cz, r, lava) => {
    const R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) {
      for (let dz = -R; dz <= R; dz++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy * 1.4 + dz * dz > r * r) continue;
          const x = Math.floor(cx) + dx, y = Math.floor(cy) + dy, z = Math.floor(cz) + dz;
          if (y < 1 || x < 1 || z < 1 || x >= S - 1 || z >= S - 1) continue;
          if (Math.abs(x - vx) < 34 && Math.abs(z - vz) < 30) continue;
          const id = w.get(x, y, z);
          if (id === B.AIR || id === B.BEDROCK || id === B.WATER || id === B.ICE || id === B.LAVA) continue;
          // geen water dat boven de grot blijft hangen
          let wet = false;
          for (const [ox, oy, oz] of [[0, 1, 0], [0, 2, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) {
            const n = w.get(x + ox, y + oy, z + oz);
            if (n === B.WATER || n === B.ICE) { wet = true; break; }
          }
          if (wet) continue;
          w.setRaw(x, y, z, lava && y <= 4 ? B.LAVA : B.AIR);
        }
      }
    }
  };
  for (let i = 0; i < 38; i++) {
    let x = 8 + rand() * (S - 16), z = 8 + rand() * (S - 16);
    let y = 5 + rand() * Math.max(2, hm[Math.floor(z) * S + Math.floor(x)] - 9);
    let yaw = rand() * Math.PI * 2, pitch = (rand() - 0.5) * 0.5;
    const len = 40 + rand() * 80, lava = rand() < 0.4;
    for (let s = 0; s < len; s++) {
      carve(x, y, z, 1.4 + Math.sin(s * 0.15 + i) * 0.45 + rand() * 0.5, lava);
      x += Math.sin(yaw) * Math.cos(pitch); z += Math.cos(yaw) * Math.cos(pitch); y += Math.sin(pitch);
      yaw += (rand() - 0.5) * 0.5;
      pitch = clamp(pitch * 0.85 + (rand() - 0.5) * 0.35, -0.6, 0.6);
      if (y < 4) pitch = Math.abs(pitch);
      if (x < 3 || z < 3 || x > S - 4 || z > S - 4) break;
    }
  }

  // Het dorp met de marktkraam van Handelaar Henk
  const village = buildVillage(w, vx, vz, rand, bio[vz * S + vx]);
  const spawn = village.spawn;
  const avoid = [{ x: vx, z: vz + 4, r: 34 }];

  // Twee verborgen schatten: een piramide in de woestijn en een oude toren met een kelder
  const bonus = [];
  const findSpot = (ok, minD, maxD) => {
    const cands = [];
    for (let z = 14; z < S - 14; z += 5) {
      for (let x = 14; x < S - 14; x += 5) {
        const d = Math.hypot(x - vx, z - vz);
        if (d < minD || d > maxD || !ok(bio[z * S + x])) continue;
        if (avoid.some((a) => Math.hypot(x - a.x, z - a.z) < a.r + 10)) continue;
        if (flatness(x, z, 6) <= 4) cands.push({ x, z });
      }
    }
    return cands.length ? cands[Math.floor(rand() * cands.length)] : null;
  };
  const pyr = findSpot((b) => b === BIOME.DESERT, 45, 100);
  if (pyr) {
    bonus.push(Object.assign(buildPyramid(w, pyr.x, pyr.z), { key: 'piramide', name: 'Schat van de piramide', coins: 60, diamonds: 3 }));
    avoid.push({ x: pyr.x, z: pyr.z, r: 12 });
  }
  const twr = findSpot((b) => b === BIOME.PLAINS || b === BIOME.FOREST || b === BIOME.SNOW, 40, 95);
  if (twr) {
    bonus.push(Object.assign(buildRuin(w, twr.x, twr.z, rand), { key: 'toren', name: 'Schat van de oude toren', coins: 40, diamonds: 2 }));
    avoid.push({ x: twr.x, z: twr.z, r: 10 });
  }

  // Het eerste portaal (verderop komen er nieuwe bij)
  const portal = placeOverworldPortal(w, spawn, rand, 0, avoid, null);
  const pc = portal.center;

  const blocked = (x, z, pad) => {
    if (Math.abs(x - vx) < 30 + pad && Math.abs(z - (vz + 4)) < 26 + pad) return true;
    if (Math.hypot(x - pc.x, z - pc.z) < 7 + pad) return true;
    for (const a of avoid) if (a.r < 30 && Math.hypot(x - a.x, z - a.z) < a.r + pad) return true;
    return false;
  };

  // Bomen per biome: eiken, berken, sparren en cactussen
  const trunk = new Uint8Array(S * S);
  const freeAround = (x, z, gap) => {
    for (let dz = -gap; dz <= gap; dz++) {
      for (let dx = -gap; dx <= gap; dx++) {
        const xx = x + dx, zz = z + dz;
        if (xx >= 0 && zz >= 0 && xx < S && zz < S && trunk[zz * S + xx]) return false;
      }
    }
    return true;
  };
  const TREE_CHANCE = [0.005, 0.024, 0, 0.014, 0.006];
  for (let z = 3; z < S - 3; z++) {
    for (let x = 3; x < S - 3; x++) {
      const i = z * S + x, b = bio[i], h = hm[i];
      let chance = TREE_CHANCE[b];
      if (b === BIOME.PLAINS && nTree.noise(x / 22, z / 22) > 0.25) chance *= 4; // bosjes op de vlakte
      if (b === BIOME.MOUNTAIN && h > 34) chance = 0;
      if (!chance || rand() > chance) continue;
      const ground = w.get(x, h, z);
      if (ground !== B.GRASS && ground !== B.SNOW_GRASS) continue;
      if (w.get(x, h + 1, z) !== B.AIR || blocked(x, z, 0) || !freeAround(x, z, 3)) continue;
      trunk[i] = 1;
      if (b === BIOME.SNOW || b === BIOME.MOUNTAIN) plantSpruce(w, x, h + 1, z, rand);
      else if (b === BIOME.FOREST && rand() < 0.4) plantBirch(w, x, h + 1, z, rand);
      else plantTree(w, x, h + 1, z, rand);
    }
  }

  // Planten: gras, bloemen, pompoenen, suikerriet langs het water en cactussen in de woestijn
  const nearWater = (x, y, z) => w.get(x + 1, y, z) === B.WATER || w.get(x - 1, y, z) === B.WATER || w.get(x, y, z + 1) === B.WATER || w.get(x, y, z - 1) === B.WATER;
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      const i = z * S + x, b = bio[i];
      const s = surfaceAt(w, x, z), y = s.y;
      if (w.get(x, y + 1, z) !== B.AIR || y + 4 >= H) continue;
      if (Math.abs(x + 0.5 - spawn.x) < 1.5 && Math.abs(z + 0.5 - spawn.z) < 1.5) continue;
      const r = rand();
      if ((s.id === B.GRASS || s.id === B.SAND) && y <= SEA + 1 && y >= SEA && r < 0.35 && nearWater(x, y, z) && !blocked(x, z, -8)) {
        const n = 1 + Math.floor(rand() * 3);
        for (let k = 1; k <= n; k++) w.setRaw(x, y + k, z, B.SUGAR_CANE);
        continue;
      }
      if (s.id === B.GRASS) {
        if (b === BIOME.PLAINS) {
          if (r < 0.11) w.setRaw(x, y + 1, z, B.TALLGRASS);
          else if (r < 0.122) w.setRaw(x, y + 1, z, B.FLOWER_R);
          else if (r < 0.134) w.setRaw(x, y + 1, z, B.FLOWER_Y);
          else if (r < 0.142) w.setRaw(x, y + 1, z, B.FLOWER_B);
          else if (r > 0.9988 && !blocked(x, z, -10)) w.setRaw(x, y + 1, z, B.PUMPKIN);
        } else if (b === BIOME.FOREST) {
          if (r < 0.07) w.setRaw(x, y + 1, z, B.TALLGRASS);
          else if (r < 0.076) w.setRaw(x, y + 1, z, B.FLOWER_R);
          else if (r < 0.08) w.setRaw(x, y + 1, z, B.FLOWER_Y);
          else if (r > 0.9992 && !blocked(x, z, -10)) w.setRaw(x, y + 1, z, B.PUMPKIN);
        } else if (r < 0.05) w.setRaw(x, y + 1, z, B.TALLGRASS);
      } else if (s.id === B.SNOW_GRASS) {
        if (r < 0.015) w.setRaw(x, y + 1, z, B.TALLGRASS);
        else if (r < 0.02) w.setRaw(x, y + 1, z, B.FLOWER_B);
      } else if (s.id === B.SAND && b === BIOME.DESERT && y > SEA + 1 && !blocked(x, z, 0)) {
        if (r < 0.006) {
          let free = true;
          for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.get(x + ox, y + 1, z + oz) !== B.AIR) free = false;
          if (free) { const n = 1 + Math.floor(rand() * 3); for (let k = 1; k <= n; k++) w.setRaw(x, y + k, z, B.CACTUS); }
        } else if (r < 0.018) w.setRaw(x, y + 1, z, B.DEAD_BUSH);
      }
    }
  }

  // Kuddes dieren op het gras
  const animalSpots = [];
  const KINDS = ['pig', 'sheep', 'cow'];
  for (let tries = 0; tries < 900 && animalSpots.length < 42; tries++) {
    const x = 6 + Math.floor(rand() * (S - 12)), z = 6 + Math.floor(rand() * (S - 12));
    const d = Math.hypot(x - vx, z - vz);
    if (d < 16 || d > 105) continue;
    const kind = bio[z * S + x] === BIOME.SNOW ? 'sheep' : KINDS[Math.floor(rand() * 3)];
    const herd = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < herd * 3 && herd > 0; k++) {
      const ax = x + Math.floor(rand() * 7) - 3, az = z + Math.floor(rand() * 7) - 3;
      const s = surfaceAt(w, ax, az);
      if (s.id !== B.GRASS && s.id !== B.SNOW_GRASS) continue;
      const above = w.get(ax, s.y + 1, az);
      if (above !== B.AIR && BLOCKS[above].render !== R_CROSS) continue;
      if (SOLID[w.get(ax, s.y + 2, az)]) continue;
      if (animalSpots.some((a) => Math.abs(a.x - ax - 0.5) < 1 && Math.abs(a.z - az - 0.5) < 1)) continue;
      animalSpots.push({ x: ax + 0.5, y: s.y + 1, z: az + 0.5, type: kind });
      if (animalSpots.length >= 42) break;
    }
  }

  w.computeTops();
  return {
    world: w, spawn, spawnYaw: 0, portal: pc, portalAxis: portal.axis, shop: village.shop,
    animalSpots, villagers: village.villagers, village: { x: vx, z: vz + 4, r: 26 },
    avoid, bonus, biomeAt, seed,
  };
}

// Bovenste vaste blok van een kolom (bomen en planten tellen niet mee)
function surfaceAt(w, x, z) {
  for (let y = w.sy - 1; y >= 0; y--) {
    const id = w.get(x, y, z);
    if (NOT_GROUND[id] || BLOCKS[id].render === R_CROSS) continue;
    return { y, id };
  }
  return { y: 0, id: B.BEDROCK };
}
const NOT_GROUND = new Uint8Array(256);
for (const id of [B.AIR, B.LEAVES, B.LOG, B.BIRCH_LOG, B.BIRCH_LEAVES, B.SPRUCE_LEAVES, B.CACTUS, B.PUMPKIN]) NOT_GROUND[id] = 1;

// Kolommen op hoogte y brengen: alles erboven weg, eronder opvullen, bovenop gras
function flattenArea(w, x0, z0, x1, z1, y, top) {
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || z < 0 || x >= w.sx || z >= w.sz) continue;
      for (let yy = y + 1; yy < w.sy; yy++) if (w.get(x, yy, z) !== B.AIR) w.set(x, yy, z, B.AIR);
      for (let yy = 1; yy < y; yy++) if (!SOLID[w.get(x, yy, z)]) w.set(x, yy, z, B.DIRT);
      w.set(x, y, z, top || B.GRASS);
    }
  }
}

// Een rand van m blokken rond een vlakgemaakt stuk geleidelijk laten aansluiten op het land
function blendEdges(w, x0, z0, x1, z1, y, m) {
  for (let z = z0 - m; z <= z1 + m; z++) {
    for (let x = x0 - m; x <= x1 + m; x++) {
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;
      if (x < 0 || z < 0 || x >= w.sx || z >= w.sz) continue;
      const d = Math.max(x0 - x, x - x1, z0 - z, z - z1);
      const s = surfaceAt(w, x, z);
      if (s.id === B.WATER || s.id === B.ICE) continue;
      const topId = s.id === B.STONE || s.id === B.GRAVEL || s.id === B.SAND || s.id === B.SNOW_GRASS || s.id === B.SNOW ? s.id : B.GRASS;
      if (s.y > y + d) {
        for (let yy = y + d + 1; yy < w.sy; yy++) if (w.get(x, yy, z) !== B.AIR) w.set(x, yy, z, B.AIR);
        w.set(x, y + d, z, topId);
      } else if (s.y < y - d) {
        for (let yy = s.y; yy < y - d; yy++) w.set(x, yy, z, topId === B.SAND ? B.SAND : B.DIRT);
        if (w.get(x, y - d + 1, z) !== B.AIR) w.set(x, y - d + 1, z, B.AIR);
        w.set(x, y - d, z, topId);
      }
    }
  }
}

/* ---------- Het dorp ---------- */
const VILLAGE_STYLES = {
  normal: { wall: 'PLANKS', corner: 'LOG', base: 'COBBLE', roof: 'BRICKS', floor: 'PLANKS', flat: false },
  desert: { wall: 'SANDSTONE', corner: 'SANDSTONE', base: 'SANDSTONE', roof: 'SANDSTONE', floor: 'SANDSTONE', flat: true },
  snow: { wall: 'PLANKS', corner: 'LOG', base: 'COBBLE', roof: 'SNOW', floor: 'PLANKS', flat: false },
};

function buildVillage(w, vx, vz, rand, biome) {
  const raw = biome === BIOME.DESERT ? VILLAGE_STYLES.desert : biome === BIOME.SNOW ? VILLAGE_STYLES.snow : VILLAGE_STYLES.normal;
  const st = {};
  for (const k in raw) st[k] = typeof raw[k] === 'string' ? B[raw[k]] : raw[k];
  const ground = biome === BIOME.DESERT ? B.SAND : biome === BIOME.SNOW ? B.SNOW_GRASS : B.GRASS;
  // pleintje voor de kraam
  let sum = 0, n = 0;
  for (let dz = -6; dz <= 12; dz += 2) for (let dx = -8; dx <= 8; dx += 2) { sum += surfaceAt(w, vx + dx, vz + dz).y; n++; }
  const gy = Math.max(SEA + 2, Math.round(sum / n));
  flattenArea(w, vx - 9, vz - 6, vx + 9, vz + 13, gy, ground);
  blendEdges(w, vx - 9, vz - 6, vx + 9, vz + 13, gy, 4);
  const shop = buildShopStall(w, vx, vz, gy);

  // paden van grind (met een bruggetje over water)
  const path = (x, z) => {
    const s = surfaceAt(w, x, z);
    if (s.id === B.WATER || s.id === B.ICE) { w.set(x, s.y, z, B.PLANKS); return; }
    if (s.id === B.GRASS || s.id === B.DIRT || s.id === B.SAND || s.id === B.SNOW_GRASS || s.id === B.SNOW || s.id === B.GRAVEL) {
      w.set(x, s.y, z, B.GRAVEL);
      const above = w.get(x, s.y + 1, z);
      if (above !== B.AIR && BLOCKS[above].render === R_CROSS) w.set(x, s.y + 1, z, B.AIR);
    }
  };
  for (let x = vx - 32; x <= vx + 32; x++) for (let z = vz + 3; z <= vz + 5; z++) path(x, z);
  for (let z = vz + 6; z <= vz + 24; z++) for (let x = vx - 1; x <= vx + 1; x++) path(x, z);

  // huizen langs de weg, met de deur naar de weg
  const lots = [
    [-13, -2, 1], [13, -2, 1], [-24, -2, 1], [24, -2, 1],
    [-12, 11, -1], [12, 11, -1], [-23, 11, -1], [23, 11, -1],
  ];
  const villagers = [];
  let houses = 0;
  for (const [dx, dz, door] of lots) {
    const cx = vx + dx, cz = vz + dz;
    let mn = 99, mx = -1, wet = false;
    for (let zz = cz - 3; zz <= cz + 3; zz++) {
      for (let xx = cx - 3; xx <= cx + 3; xx++) {
        const s = surfaceAt(w, xx, zz);
        if (s.id === B.WATER || s.id === B.ICE || s.y <= SEA) wet = true;
        mn = Math.min(mn, s.y); mx = Math.max(mx, s.y);
      }
    }
    if (wet || mx - mn > 5 || houses >= 6) continue;
    const hy = Math.round((mn + mx) / 2);
    buildHouse(w, cx, cz, hy, door, st, ground, rand);
    villagers.push({ x: cx + 0.5, z: cz + door * 5.5 + 0.5 });
    houses++;
  }

  // de waterput naast het plein
  buildWell(w, vx + 4, vz + 8, gy, st);
  // lantaarnpalen
  for (const [dx, dz] of [[-7, 2], [7, 2], [-7, 6], [7, 6], [-18, 6], [18, 6], [-2, 14], [2, 20]]) {
    const s = surfaceAt(w, vx + dx, vz + dz);
    if (s.id === B.WATER || s.id === B.ICE) continue;
    w.set(vx + dx, s.y + 1, vz + dz, B.LOG);
    w.set(vx + dx, s.y + 2, vz + dz, B.LOG);
    w.set(vx + dx, s.y + 3, vz + dz, B.GLOWSTONE);
  }
  // een akker met tarwe en hooibalen
  if (biome !== BIOME.DESERT || rand() < 0.5) {
    const fx = vx - 13, fz = vz + 19;
    let ok = true;
    for (let z = fz; z <= fz + 6 && ok; z++) for (let x = fx; x <= fx + 8; x++) { const s = surfaceAt(w, x, z); if (s.id === B.WATER || s.y <= SEA) { ok = false; break; } }
    if (ok) {
      const fy = surfaceAt(w, fx + 4, fz + 3).y;
      flattenArea(w, fx - 1, fz - 1, fx + 9, fz + 7, fy, ground);
      blendEdges(w, fx - 1, fz - 1, fx + 9, fz + 7, fy, 2);
      for (let z = fz; z <= fz + 6; z++) {
        for (let x = fx; x <= fx + 8; x++) {
          const edge = x === fx || x === fx + 8 || z === fz || z === fz + 6;
          if (edge) w.set(x, fy, z, B.LOG);
          else if (z === fz + 3) w.set(x, fy, z, B.WATER);
          else { w.set(x, fy, z, B.FARMLAND); if (rand() < 0.92) w.set(x, fy + 1, z, B.WHEAT); }
        }
      }
      w.set(fx + 10, fy + 1, fz + 1, B.HAY); w.set(fx + 10, fy + 1, fz + 2, B.HAY); w.set(fx + 10, fy + 2, fz + 1, B.HAY);
      villagers.push({ x: fx + 4.5, z: fz - 1.5 });
    }
  }
  // een paar hooibalen en een pompoen op het plein
  w.set(vx - 5, gy + 1, vz + 9, B.HAY); w.set(vx - 5, gy + 1, vz + 10, B.HAY); w.set(vx - 4, gy + 1, vz + 10, B.PUMPKIN);

  for (const v of villagers) v.y = surfaceAt(w, Math.floor(v.x), Math.floor(v.z)).y + 1;
  const spawn = { x: vx + 0.5, y: gy + 1, z: vz + 7.5 };
  return { shop, spawn, villagers };
}

// Huisje van 7x7 met fundering, ramen, een deuropening naar de weg en een puntdak
function buildHouse(w, cx, cz, gy, door, st, ground, rand) {
  const x0 = cx - 3, x1 = cx + 3, z0 = cz - 3, z1 = cz + 3;
  flattenArea(w, x0 - 1, z0 - 1, x1 + 1, z1 + 1, gy, ground);
  blendEdges(w, x0 - 1, z0 - 1, x1 + 1, z1 + 1, gy, 2);
  const front = door > 0 ? z1 : z0, back = door > 0 ? z0 : z1;
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const edgeX = x === x0 || x === x1, edgeZ = z === z0 || z === z1;
      w.set(x, gy, z, edgeX || edgeZ ? st.base : st.floor);
      if (!edgeX && !edgeZ) continue;
      for (let y = gy + 1; y <= gy + 3; y++) {
        let id = edgeX && edgeZ ? st.corner : y === gy + 1 ? st.base : st.wall;
        const win = y === gy + 2 && !(edgeX && edgeZ) && ((edgeX && Math.abs(z - cz) === 1) || (z === back && Math.abs(x - cx) === 1));
        if (win) id = B.GLASS;
        if (z === front && x === cx && y <= gy + 2) id = B.AIR;
        w.set(x, y, z, id);
      }
    }
  }
  // dak
  if (st.flat) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) w.set(x, gy + 4, z, st.roof);
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if ((x === x0 || x === x1 || z === z0 || z === z1) && (x + z) % 2 === 0) w.set(x, gy + 5, z, st.wall);
  } else {
    for (let k = 0; k <= 4; k++) {
      for (let z = z0 - 1 + k; z <= z1 + 1 - k; z++) {
        for (let x = x0 - 1 + k; x <= x1 + 1 - k; x++) {
          const ring = x === x0 - 1 + k || x === x1 + 1 - k || z === z0 - 1 + k || z === z1 + 1 - k;
          if (k === 0 || ring || k === 4) w.set(x, gy + 4 + k, z, k === 0 && !ring ? B.PLANKS : st.roof);
        }
      }
    }
  }
  w.set(cx, gy + 4, cz, B.GLOWSTONE);
  // inrichting: boekenkast, hooibaal of pompoen, en een fakkel bij de deur
  const zb = back + door;
  w.set(x0 + 1, gy + 1, zb, B.BOOKSHELF); w.set(x0 + 1, gy + 2, zb, B.BOOKSHELF);
  w.set(x1 - 1, gy + 1, zb, rand() < 0.5 ? B.HAY : B.PUMPKIN);
  w.set(cx + 1, gy + 1, front + door, B.TORCH);
}

// Waterput: rand van keien, water in het midden, vier palen en een dakje
function buildWell(w, x, z, gy, st) {
  for (let dz = 0; dz <= 3; dz++) {
    for (let dx = 0; dx <= 3; dx++) {
      const inner = dx >= 1 && dx <= 2 && dz >= 1 && dz <= 2;
      w.set(x + dx, gy - 4, z + dz, B.COBBLE);
      for (let y = gy - 3; y <= gy; y++) w.set(x + dx, y, z + dz, inner ? B.WATER : B.COBBLE);
      if (!inner) w.set(x + dx, gy + 1, z + dz, B.COBBLE);
      if ((dx === 0 || dx === 3) && (dz === 0 || dz === 3)) { w.set(x + dx, gy + 2, z + dz, B.LOG); w.set(x + dx, gy + 3, z + dz, B.LOG); }
      w.set(x + dx, gy + 4, z + dz, st.flat ? B.SANDSTONE : B.COBBLE);
    }
  }
}

// Piramide van zandsteen met een gang naar een schatkamer; geeft de kistpositie terug
function buildPyramid(w, cx, cz) {
  const gy = Math.max(SEA + 2, surfaceAt(w, cx, cz).y);
  flattenArea(w, cx - 8, cz - 8, cx + 8, cz + 8, gy, B.SAND);
  blendEdges(w, cx - 8, cz - 8, cx + 8, cz + 8, gy, 3);
  for (let k = 0; k <= 7; k++) {
    for (let z = cz - 7 + k; z <= cz + 7 - k; z++) {
      for (let x = cx - 7 + k; x <= cx + 7 - k; x++) w.set(x, gy + 1 + k, z, k === 7 ? B.GOLD : B.SANDSTONE);
    }
  }
  // schatkamer 5x5x3 met fakkels en een gang vanaf de zuidkant
  for (let y = gy + 1; y <= gy + 3; y++) for (let z = cz - 2; z <= cz + 2; z++) for (let x = cx - 2; x <= cx + 2; x++) w.set(x, y, z, B.AIR);
  for (let z = cz + 3; z <= cz + 7; z++) { w.set(cx, gy + 1, z, B.AIR); w.set(cx, gy + 2, z, B.AIR); }
  for (let z = cz - 2; z <= cz + 2; z++) for (let x = cx - 2; x <= cx + 2; x++) w.set(x, gy, z, (x + z) % 2 ? B.SANDSTONE : B.GOLD);
  w.set(cx - 2, gy + 1, cz - 2, B.TORCH); w.set(cx + 2, gy + 1, cz - 2, B.TORCH);
  w.set(cx - 2, gy + 1, cz + 2, B.TORCH); w.set(cx + 2, gy + 1, cz + 2, B.TORCH);
  w.set(cx, gy + 4, cz, B.GLOWSTONE);
  w.set(cx, gy + 1, cz - 1, B.CHEST);
  return { x: cx, y: gy + 1, z: cz - 1 };
}

// Ingestorte toren van (bemoste) stenen met een trap naar een kelder met een kist
function buildRuin(w, cx, cz, rand) {
  const gy = Math.max(SEA + 2, surfaceAt(w, cx, cz).y);
  flattenArea(w, cx - 4, cz - 4, cx + 4, cz + 4, gy);
  blendEdges(w, cx - 4, cz - 4, cx + 4, cz + 4, gy, 2);
  const brick = () => (rand() < 0.4 ? B.MOSSY_STONE_BRICKS : rand() < 0.15 ? B.COBBLE : B.STONE_BRICKS);
  // kelder: 5x5 binnen, 3 hoog, met muren eromheen
  for (let y = gy - 4; y <= gy; y++) {
    for (let z = cz - 3; z <= cz + 3; z++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        const wall = Math.abs(x - cx) === 3 || Math.abs(z - cz) === 3 || y === gy - 4 || y === gy;
        w.set(x, y, z, wall ? brick() : B.AIR);
      }
    }
  }
  // muren van de toren, bovenaan afgebrokkeld
  for (let z = cz - 3; z <= cz + 3; z++) {
    for (let x = cx - 3; x <= cx + 3; x++) {
      if (Math.abs(x - cx) !== 3 && Math.abs(z - cz) !== 3) continue;
      const top = gy + 3 + Math.floor(rand() * 5);
      for (let y = gy + 1; y <= top; y++) {
        if (z === cz + 3 && x === cx && y <= gy + 2) continue; // ingang
        if (y === gy + 3 && (x === cx || z === cz) && rand() < 0.7) continue; // raampjes
        w.set(x, y, z, brick());
      }
    }
  }
  // trap naar beneden langs de zuidmuur
  w.set(cx + 1, gy, cz + 2, B.AIR); w.set(cx, gy, cz + 2, B.AIR);
  w.set(cx + 1, gy - 1, cz + 2, B.STONE_BRICKS);
  w.set(cx, gy - 2, cz + 2, B.STONE_BRICKS);
  w.set(cx - 1, gy - 3, cz + 2, B.STONE_BRICKS);
  w.set(cx + 2, gy - 3, cz - 2, B.TORCH); w.set(cx - 2, gy - 3, cz - 2, B.TORCH);
  w.set(cx, gy - 1, cz - 1, B.GLOWSTONE);
  w.set(cx, gy - 3, cz - 2, B.CHEST);
  return { x: cx, y: gy - 3, z: cz - 2 };
}

const PORTAL_RUINS = [
  [B.NETHERRACK, B.MAGMA, B.OBSIDIAN, B.GOLD],
  [B.SNOW, B.PACKED_ICE, B.ICE, B.BLUE_ICE],
  [B.END_STONE, B.SCULK, B.CRYSTAL, B.OBSIDIAN],
  [B.QUARTZ, B.CLOUD, B.GOLD, B.QUARTZ],
];

// Bouw een (geruïneerd) portaal ergens 40–85 blokken van de start, ver van eerdere portalen,
// het dorp en de schatten (avoid: [{x, z, r}]). Werkt tijdens het genereren en later in een bestaande wereld.
function placeOverworldPortal(w, spawn, rand, level, avoid, prev) {
  const S = w.sx;
  let spot = null;
  for (let tries = 0; tries < 900 && !spot; tries++) {
    const ang = rand() * Math.PI * 2, dist = 40 + rand() * (tries < 600 ? 45 : 20);
    const px = Math.floor(spawn.x + Math.cos(ang) * dist), pz = Math.floor(spawn.z + Math.sin(ang) * dist);
    if (px < 12 || pz < 12 || px > S - 13 || pz > S - 13) continue;
    if (prev && Math.hypot(px - prev.x, pz - prev.z) < 30) continue;
    if (avoid && avoid.some((a) => Math.hypot(px - a.x, pz - a.z) < (a.r || 12))) continue;
    let mn = 99, mx = -1, wet = false;
    for (let dz = -3; dz <= 3 && !wet; dz++) {
      for (let dx = -3; dx <= 4; dx++) {
        const sfc = surfaceAt(w, px + dx, pz + dz);
        mn = Math.min(mn, sfc.y); mx = Math.max(mx, sfc.y);
        if (sfc.id === B.WATER || sfc.y <= SEA) { wet = true; break; }
      }
    }
    if (wet || mx - mn > (tries < 600 ? 5 : 9)) continue;
    spot = { x: px, z: pz, y: Math.round((mn + mx) / 2) };
  }
  if (!spot) {
    const px = clamp(Math.floor(spawn.x) + (level % 2 ? -46 : 46), 12, S - 13), pz = Math.floor(spawn.z);
    spot = { x: px, z: pz, y: Math.max(SEA + 2, surfaceAt(w, px, pz).y) };
  }
  const axis = rand() < 0.5 ? 'x' : 'z';
  const by = spot.y;
  flattenArea(w, spot.x - 4, spot.z - 4, spot.x + 5, spot.z + 5, by);
  const frame = new Set();
  for (let i = -1; i <= 2; i++) {
    for (let y = by + 1; y <= by + 5; y++) {
      const fx = axis === 'x' ? spot.x + i : spot.x;
      const fz = axis === 'x' ? spot.z : spot.z + i;
      const edge = i === -1 || i === 2 || y === by + 1 || y === by + 5;
      w.set(fx, y, fz, edge ? B.OBSIDIAN : B.PORTAL);
      frame.add(fx + ',' + fz);
    }
  }
  w.portalAxis = axis;
  const ruin = (REALMS[level] && REALMS[level].ruin) || PORTAL_RUINS[level % PORTAL_RUINS.length];
  for (let k = 0; k < 18; k++) {
    const dx = Math.floor(rand() * 9) - 4, dz = Math.floor(rand() * 9) - 4;
    const x = spot.x + dx, z = spot.z + dz;
    if (frame.has(x + ',' + z)) continue;
    // de plekken voor en achter het portaal vrij houden
    if (axis === 'x' ? (Math.abs(dz) <= 2 && dx >= -1 && dx <= 2) : (Math.abs(dx) <= 2 && dz >= -1 && dz <= 2)) continue;
    const r = rand();
    w.set(x, by, z, ruin[r < 0.5 ? 0 : r < 0.8 ? 1 : 2]);
    if (rand() < 0.25) w.set(x, by + 1, z, ruin[rand() < 0.3 ? 3 : 0]);
  }
  const center = axis === 'x' ? { x: spot.x + 1, y: by + 3.5, z: spot.z + 0.5 } : { x: spot.x + 0.5, y: by + 3.5, z: spot.z + 1 };
  return { x: spot.x, z: spot.z, y: by, axis, center };
}

// Het oude portaal dooft uit en stort een beetje in
function breakOverworldPortal(w, center) {
  const cx = Math.floor(center.x), cy = Math.floor(center.y), cz = Math.floor(center.z);
  for (let y = cy - 3; y <= cy + 3; y++) {
    for (let z = cz - 3; z <= cz + 3; z++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        if (w.get(x, y, z) === B.PORTAL) w.set(x, y, z, B.AIR);
      }
    }
  }
  let n = 0;
  for (let y = cy + 3; y >= cy && n < 2; y--) {
    for (let z = cz - 2; z <= cz + 2 && n < 2; z++) {
      for (let x = cx - 2; x <= cx + 2 && n < 2; x++) {
        if (w.get(x, y, z) === B.OBSIDIAN && (x + z) % 2 === 0) { w.set(x, y, z, B.AIR); n++; }
      }
    }
  }
}

// Een marktkraampje: vloer, palen, toonbank en een dak met lamp. De handelaar staat achter de toonbank.
function buildShopStall(w, sx, sz, y, ground) {
  const gy = y !== undefined ? y : Math.max(SEA + 1, surfaceAt(w, sx, sz).y);
  flattenArea(w, sx - 4, sz - 4, sx + 4, sz + 4, gy, ground);
  for (let z = sz - 2; z <= sz + 1; z++) for (let x = sx - 2; x <= sx + 2; x++) w.set(x, gy, z, B.PLANKS);
  for (const [px, pz] of [[sx - 2, sz - 2], [sx + 2, sz - 2], [sx - 2, sz + 1], [sx + 2, sz + 1]]) {
    for (let y = gy + 1; y <= gy + 3; y++) w.set(px, y, pz, B.LOG);
  }
  for (let x = sx - 1; x <= sx + 1; x++) w.set(x, gy + 1, sz + 1, B.PLANKS);
  for (let x = sx - 1; x <= sx + 1; x++) {
    w.set(x, gy + 1, sz - 2, B.PLANKS);
    w.set(x, gy + 2, sz - 2, B.GLASS);
    w.set(x, gy + 3, sz - 2, B.PLANKS);
  }
  for (let z = sz - 3; z <= sz + 2; z++) {
    for (let x = sx - 3; x <= sx + 3; x++) w.set(x, gy + 4, z, (x + z) % 2 ? B.BRICKS : B.PLANKS);
  }
  w.set(sx, gy + 3, sz - 1, B.GLOWSTONE);
  return { x: sx + 0.5, y: gy + 1, z: sz - 0.5, yaw: 0 };
}

function plantTree(w, x, y, z, rand) {
  const th = 4 + Math.floor(rand() * 3);
  w.setRaw(x, y - 1, z, B.DIRT);
  for (let i = 0; i < th; i++) w.setRaw(x, y + i, z, B.LOG);
  const top = y + th;
  for (let ly = top - 3; ly <= top; ly++) {
    const r = ly >= top - 1 ? 1 : 2;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && rand() < 0.6) continue;
        if (ly === top && Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
        const cur = w.get(x + dx, ly, z + dz);
        if (cur === B.AIR || cur === B.TALLGRASS || cur === B.FLOWER_R || cur === B.FLOWER_Y) w.setRaw(x + dx, ly, z + dz, B.LEAVES);
      }
    }
  }
}

function plantBirch(w, x, y, z, rand) {
  const th = 5 + Math.floor(rand() * 3);
  w.setRaw(x, y - 1, z, B.DIRT);
  for (let i = 0; i < th; i++) w.setRaw(x, y + i, z, B.BIRCH_LOG);
  const top = y + th;
  for (let ly = top - 3; ly <= top; ly++) {
    const r = ly >= top - 1 ? 1 : 2;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        if (ly === top && Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
        const cur = w.get(x + dx, ly, z + dz);
        if (cur === B.AIR || BLOCKS[cur].render === R_CROSS) w.setRaw(x + dx, ly, z + dz, B.BIRCH_LEAVES);
      }
    }
  }
}

// Spar: hoge stam met een kegel van naalden
const SPRUCE_RINGS = [0, 1, 1, 2, 1, 2, 3, 2, 3, 2, 3];
function plantSpruce(w, x, y, z, rand) {
  const th = 6 + Math.floor(rand() * 4);
  w.setRaw(x, y - 1, z, B.DIRT);
  for (let i = 0; i < th; i++) w.setRaw(x, y + i, z, B.LOG);
  for (let k = 0; ; k++) {
    const ly = y + th - k;
    if (ly < y + 2) break;
    const r = SPRUCE_RINGS[Math.min(k, SPRUCE_RINGS.length - 1)];
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r >= 2 && Math.abs(dx) === r && Math.abs(dz) === r) continue;
        const cur = w.get(x + dx, ly, z + dz);
        if (cur === B.AIR || BLOCKS[cur].render === R_CROSS) w.setRaw(x + dx, ly, z + dz, B.SPRUCE_LEAVES);
      }
    }
  }
}

// De Nether: een ronde arena boven een lavazee, met pilaren en het aankomstportaal
function genNether(seed) {
  const S = 64, H = 40, C = 32;
  const w = new World('nether', S, H, S);
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand);
  const F = NETHER_FLOOR;
  const LAVA_Y = 7;
  const arena = new Uint8Array(S * S);

  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= 18 + n1.noise(x / 6, z / 6) * 1.6) arena[z * S + x] = 1;
    }
  }

  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      let h;
      if (arena[z * S + x]) h = F;
      else {
        const isl = n2.fbm(x / 10, z / 10, 3);
        h = 3 + Math.floor((isl + 0.5) * 5);
        if (isl > 0.3) h = 9 + Math.floor((isl - 0.3) * 70);
        h = clamp(h, 2, 32);
      }
      for (let y = 0; y <= h; y++) w.setRaw(x, y, z, y === 0 ? B.BEDROCK : B.NETHERRACK);
      for (let y = h + 1; y <= LAVA_Y; y++) w.setRaw(x, y, z, B.LAVA);
      if (!arena[z * S + x] && h > 14 && rand() < 0.35) w.setRaw(x, h + 1, z, B.GLOWSTONE);
    }
  }

  // Rand-muur rond de arena (2 hoog) met lantaarnpalen van gloeisteen
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      if (arena[z * S + x]) continue;
      let nearArena = false;
      for (let dz = -1; dz <= 1 && !nearArena; dz++) {
        for (let dx = -1; dx <= 1; dx++) if (arena[(z + dz) * S + x + dx]) { nearArena = true; break; }
      }
      if (!nearArena) continue;
      for (let y = 1; y <= F; y++) w.setRaw(x, y, z, B.NETHERRACK);
      w.setRaw(x, F + 1, z, B.NETHERBRICK);
      w.setRaw(x, F + 2, z, B.NETHERBRICK);
      if ((x * 7 + z * 13) % 9 === 0) {
        w.setRaw(x, F + 3, z, B.NETHERBRICK);
        w.setRaw(x, F + 4, z, B.GLOWSTONE);
      }
    }
  }

  // Vloer-versiering: paden van netherbaksteen en een magmaring rond het midden
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      if (!arena[z * S + x]) continue;
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.sqrt(dx * dx + dz * dz);
      let id = B.NETHERRACK;
      if (d > 3 && d < 4.3) id = B.MAGMA;
      else if ((Math.abs(dx) < 1 || Math.abs(dz) < 1) && d > 5) id = B.NETHERBRICK;
      else if (rand() < 0.03) id = B.MAGMA;
      w.setRaw(x, F, z, id);
    }
  }

  // Vier pilaren als dekking tegen vuurballen
  for (const [px, pz] of [[C - 10, C - 10], [C + 9, C - 10], [C - 10, C + 9], [C + 9, C + 9]]) {
    for (let y = F + 1; y <= F + 5; y++) {
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, y, pz + dz, B.NETHERBRICK);
    }
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, F + 6, pz + dz, B.GLOWSTONE);
  }

  // Aankomstportaal aan de zuidkant, kijkend naar het midden
  const pz = C + 15;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
  w.portalAxis = 'x';

  // Verborgen schatkamer onder de vloer, met een gouden X erboven
  const ang = rand() * Math.PI * 2, dist = 7 + rand() * 5;
  const tx = Math.floor(C + Math.cos(ang) * dist), tz = Math.floor(C - 4 + Math.sin(ang) * dist * 0.7);
  const treasure = buildVault(w, tx, F - 4, tz, B.NETHERBRICK, B.GLOWSTONE);
  for (const [dx, dz] of [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) w.setRaw(tx + dx, F, tz + dz, B.GOLD);

  w.computeTops();
  return {
    world: w,
    spawn: { x: C + 1, y: F + 1, z: pz - 2.5 },
    spawnYaw: 0,
    bossSpawn: { x: C + 0.5, y: F + 1, z: C - 1.5 },
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: 18, floorY: F + 1,
    treasure,
  };
}

// Kleine schatkamer (3x3 binnenruimte, 2 hoog) met een kist in het midden; geeft de kistpositie terug
function buildVault(w, cx, y0, cz, wall, lamp) {
  for (let dy = -1; dy <= 2; dy++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2 || dy === -1 || dy === 2;
        w.setRaw(cx + dx, y0 + dy, cz + dz, edge ? wall : B.AIR);
      }
    }
  }
  if (lamp) w.setRaw(cx, y0 + 2, cz, lamp);
  w.setRaw(cx, y0, cz, B.CHEST);
  return { x: cx, y: y0, z: cz };
}
