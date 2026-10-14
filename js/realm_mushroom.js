'use strict';
/* Portaaljacht – wereld 10: het Paddenstoeleiland met De Sporenreus (sporenwolken, stuiterstamp, paddenstoelmannetjes, sporenregen) */
(() => {
  /* ---------- Blokken ---------- */
  const SPOTS = [[3.5, 3.5, 1.7], [11.5, 4.5, 1.5], [7.5, 10.5, 1.9], [13.5, 12.5, 1.3], [2.5, 12.5, 1.2]];
  const inSpot = (x, y) => SPOTS.some(([sx, sy, r]) => Math.hypot(x + 0.5 - sx, y + 0.5 - sy) < r);

  defineTile('MUSHROOM_MYCELIUM_TOP', (h) => () => {
    const r = h.R();
    return h.vary(r < 0.2 ? [98, 80, 106] : r < 0.45 ? [132, 110, 138] : r < 0.53 ? [168, 146, 168] : [116, 96, 122], 6);
  });
  defineTile('MUSHROOM_MYCELIUM_SIDE', (h) => {
    const depth = [];
    for (let x = 0; x < 16; x++) depth[x] = 2 + Math.floor(h.R() * 3);
    return (x, y) => (y < depth[x] ? h.vary(h.R() < 0.4 ? [98, 80, 106] : [124, 104, 130], 6) : h.dirtPx());
  });
  defineTile('MUSHROOM_STEM', (h) => (x, y) => {
    const s = (x * 5 + (y >> 2) * 3) % 7;
    return h.vary(s === 0 ? [196, 188, 168] : s < 3 ? [214, 206, 188] : [228, 222, 206], 4);
  });
  defineTile('MUSHROOM_STEM_TOP', (h) => (x, y) => {
    const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    return r > 6 ? h.vary([214, 206, 188], 4) : h.vary(h.R() < 0.3 ? [170, 146, 116] : [194, 168, 136], 5);
  });
  defineTile('MUSHROOM_RED', (h) => (x, y) => (inSpot(x, y) ? h.vary([236, 230, 220], 5) : h.vary(h.R() < 0.2 ? [164, 28, 30] : [194, 38, 36], 6)));
  defineTile('MUSHROOM_BROWN', (h) => () => h.vary(h.R() < 0.25 ? [124, 92, 64] : [146, 108, 76], 6));
  defineTile('MUSHROOM_PURPLE', (h) => (x, y) => (inSpot(x, y) ? h.vary([150, 255, 230], 8) : h.vary(h.R() < 0.2 ? [100, 38, 150] : [126, 54, 178], 8)));
  defineTile('MUSHROOM_SHROOMLIGHT', (h) => (x, y) => {
    const blob = ((x * 3 + y * 5) % 7 === 0) || ((x + 2 * y) % 9 === 0);
    return blob ? h.vary([255, 236, 170], 6) : h.vary(h.R() < 0.3 ? [240, 120, 80] : [252, 156, 96], 8);
  });
  defineTile('MUSHROOM_SMALL_RED', () => (x, y) => {
    if (y >= 10 && x >= 7 && x <= 8) return [222, 214, 194];
    if (y >= 6 && y <= 9 && x >= 4 && x <= 11 && !(y === 6 && (x === 4 || x === 11))) return (y < 9 && (x * 3 + y) % 5 === 0) ? [244, 240, 232] : [204, 40, 36];
    return null;
  });
  defineTile('MUSHROOM_SMALL_BROWN', () => (x, y) => {
    if (y >= 10 && x >= 7 && x <= 8) return [214, 204, 184];
    if (y >= 8 && y <= 9 && x >= 3 && x <= 12) return y === 8 ? [160, 120, 86] : [136, 100, 70];
    if (y === 7 && x >= 5 && x <= 10) return [168, 128, 92];
    return null;
  });
  defineTile('MUSHROOM_GLOWCAP', () => {
    const sh = [[4, 8, 2], [11, 5, 2], [8, 11, 1]];
    return (x, y) => {
      for (const [cx, cy, w] of sh) {
        if (y >= cy && y <= cy + 1 && Math.abs(x - cx) <= w && !(y === cy && Math.abs(x - cx) === w)) return y === cy ? [190, 255, 240] : [90, 240, 210];
        if (y > cy + 1 && x === cx) return [200, 236, 226];
      }
      return null;
    };
  });

  const cross = { render: R_CROSS, solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' };
  defineBlock('MUSHROOM_MYCELIUM', { name: 'Mycelium', tiles: { top: T.MUSHROOM_MYCELIUM_TOP, bottom: T.DIRT, side: T.MUSHROOM_MYCELIUM_SIDE }, hard: 0.45, sound: 'grass' });
  defineBlock('MUSHROOM_STEM', { name: 'Paddenstoelsteel', tiles: { top: T.MUSHROOM_STEM_TOP, bottom: T.MUSHROOM_STEM_TOP, side: T.MUSHROOM_STEM }, hard: 0.5, sound: 'wood' });
  defineBlock('MUSHROOM_RED', { name: 'Rode paddenstoelhoed', tiles: all(T.MUSHROOM_RED), hard: 0.3, sound: 'wood', soft: true });
  defineBlock('MUSHROOM_BROWN', { name: 'Bruine paddenstoelhoed', tiles: all(T.MUSHROOM_BROWN), hard: 0.3, sound: 'wood', soft: true });
  defineBlock('MUSHROOM_PURPLE', { name: 'Glimhoed', tiles: all(T.MUSHROOM_PURPLE), hard: 0.3, sound: 'wood', soft: true, glow: true });
  defineBlock('MUSHROOM_SHROOMLIGHT', { name: 'Zwamlicht', tiles: all(T.MUSHROOM_SHROOMLIGHT), hard: 0.3, glow: true, sound: 'grass' });
  defineBlock('MUSHROOM_SMALL_RED', Object.assign({ name: 'Rode paddenstoel', tiles: all(T.MUSHROOM_SMALL_RED) }, cross));
  defineBlock('MUSHROOM_SMALL_BROWN', Object.assign({ name: 'Bruine paddenstoel', tiles: all(T.MUSHROOM_SMALL_BROWN) }, cross));
  defineBlock('MUSHROOM_GLOWCAP', Object.assign({ name: 'Gloeipaddenstoeltjes', tiles: all(T.MUSHROOM_GLOWCAP), glow: true }, cross));

  /* ---------- De wereld ---------- */
  const S = 80, H = 44, C = 40, F = 12, WL = 8, AR = 17, TD = 25;

  // Reuzenpaddenstoel met bolle rode hoed (zoals in Minecraft)
  function bigRed(w, x, y, z, hgt, r, rand) {
    for (let i = 0; i < hgt; i++) w.setRaw(x, y + i, z, B.MUSHROOM_STEM);
    const top = y + hgt;
    const side = r >= 3 ? 3 : 2;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const ax = Math.abs(dx), az = Math.abs(dz);
        if (ax === r && az === r) continue;
        if (ax < r && az < r) w.setRaw(x + dx, top, z + dz, B.MUSHROOM_RED);
        else for (let k = 1; k <= side; k++) w.setRaw(x + dx, top - k, z + dz, B.MUSHROOM_RED);
      }
    }
    if (rand() < 0.6) w.setRaw(x + (rand() < 0.5 ? 1 : -1), top - 1, z, B.MUSHROOM_SHROOMLIGHT);
  }

  // Reuzenpaddenstoel met platte bruine hoed
  function bigBrown(w, x, y, z, hgt, r, rand) {
    for (let i = 0; i < hgt; i++) w.setRaw(x, y + i, z, B.MUSHROOM_STEM);
    const top = y + hgt;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) if (dx * dx + dz * dz <= r * r + r * 0.5) w.setRaw(x + dx, top, z + dz, B.MUSHROOM_BROWN);
    }
    if (rand() < 0.5) w.setRaw(x, top - 1, z + (rand() < 0.5 ? 2 : -2), B.MUSHROOM_SHROOMLIGHT);
  }

  function genMushroom(seed) {
    const w = new World('realm', S, H, S);
    w.skyShade = true;
    const rand = mulberry32(seed);
    const n1 = new Noise2D(rand), n2 = new Noise2D(rand);

    // Richting van de poort en de schat-paddenstoel; het portaal staat aan de overkant
    const side = rand() < 0.5 ? 1 : -1;
    const gAng = side * Math.PI / 2 + (rand() - 0.5) * 1.2;
    const gdx = Math.cos(gAng), gdz = Math.sin(gAng);
    const tx = Math.round(C + gdx * TD), tz = Math.round(C + gdz * TD);

    const arena = new Uint8Array(S * S);
    const heights = new Int16Array(S * S);
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const dx = x + 0.5 - C, dz = z + 0.5 - C;
        const d = Math.hypot(dx, dz);
        if (d < AR + 0.5) { arena[z * S + x] = 1; heights[z * S + x] = F; continue; }
        let h = F + Math.round(n2.fbm(x / 12, z / 12, 3) * 5);
        // zacht aflopen naar de zee
        const coast = 33 + n1.noise(x / 9, z / 9) * 3.5;
        if (d > coast - 5) h = Math.round(lerp(h, WL - 3, clamp((d - (coast - 5)) / 8, 0, 1)));
        // vlak bij de arenamuur
        if (d < AR + 5) h = Math.round(lerp(F, h, (d - AR) / 5));
        // pad van de poort naar de reuzenpaddenstoel, en een vlak plein eromheen
        const along = dx * gdx + dz * gdz, across = Math.abs(-dx * gdz + dz * gdx);
        if (along > AR - 1 && along < TD + 2) h = Math.round(lerp(h, F, clamp((4.5 - across) / 1.5, 0, 1)));
        const dt = Math.hypot(x - tx, z - tz);
        h = Math.round(lerp(h, F, clamp((7 - dt) / 2, 0, 1)));
        heights[z * S + x] = clamp(h, 3, F + 3);
      }
    }

    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const h = heights[z * S + x];
        for (let y = 0; y <= h; y++) {
          let id;
          if (y === 0) id = B.BEDROCK;
          else if (y < h - 3) id = B.STONE;
          else if (y < h) id = h <= WL ? B.SAND : B.DIRT;
          else id = h > WL ? B.MUSHROOM_MYCELIUM : h >= WL - 1 ? B.SAND : B.GRAVEL;
          w.setRaw(x, y, z, id);
        }
        for (let y = h + 1; y <= WL; y++) w.setRaw(x, y, z, B.WATER);
        if (arena[z * S + x]) {
          const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
          let top = B.MUSHROOM_MYCELIUM;
          if (d < 1.6) top = B.MUSHROOM_SHROOMLIGHT;
          else if (d > 5.5 && d < 6.5) top = B.MUSHROOM_BROWN;
          w.setRaw(x, F, z, top);
        }
      }
    }

    // Muur van paddenstoelstelen rond de arena, met een bruine poort richting de schat
    const gate = [];
    for (let z = 1; z < S - 1; z++) {
      for (let x = 1; x < S - 1; x++) {
        if (arena[z * S + x]) continue;
        let near = false;
        for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1; dx++) if (arena[(z + dz) * S + x + dx]) { near = true; break; }
        if (!near) continue;
        for (let y = 1; y <= F; y++) if (!SOLID[w.get(x, y, z)]) w.setRaw(x, y, z, B.DIRT);
        const ddx = x + 0.5 - C, ddz = z + 0.5 - C;
        const along = ddx * gdx + ddz * gdz, across = Math.abs(-ddx * gdz + ddz * gdx);
        const isGate = along > 10 && across < 2.2;
        for (let y = F + 1; y <= F + 2; y++) {
          w.setRaw(x, y, z, isGate ? B.MUSHROOM_BROWN : B.MUSHROOM_STEM);
          if (isGate) gate.push([x, y, z]);
        }
        if (!isGate && (x * 7 + z * 13) % 9 === 0) w.setRaw(x, F + 3, z, B.MUSHROOM_SHROOMLIGHT);
        else if (!isGate && (x * 7 + z * 13) % 9 === 4) w.setRaw(x, F + 3, z, B.MUSHROOM_RED);
      }
    }

    // Vier kleine paddenstoelen in de arena (dekking tegen de sporenregen; de reus stampt ze kapot)
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      const px = Math.round(C + Math.cos(a) * 9.5), pz = Math.round(C + Math.sin(a) * 9.5);
      w.setRaw(px, F + 1, pz, B.MUSHROOM_STEM); w.setRaw(px, F + 2, pz, B.MUSHROOM_STEM);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) w.setRaw(px + dx, F + 3, pz + dz, (dx || dz) ? B.MUSHROOM_RED : B.MUSHROOM_SHROOMLIGHT);
    }

    // De oude glimzwam: een enorme paars-gloeiende paddenstoel; de schat ligt onder zijn steel
    const TG = F;
    for (let y = TG; y <= TG + 11; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) w.setRaw(tx + dx, y, tz + dz, B.MUSHROOM_STEM);
    const yb = TG + 8, RD = 5.3;
    for (let y = yb; y <= yb + 4; y++) {
      const k = (y - yb) / 4.5, ki = (y - yb) / 3.4;
      for (let dz = -6; dz <= 6; dz++) {
        for (let dx = -6; dx <= 6; dx++) {
          const q = dx * dx + dz * dz;
          if (q / (RD * RD) + k * k > 1) continue;
          if (q / ((RD - 1.3) * (RD - 1.3)) + ki * ki <= 1) continue;
          w.setRaw(tx + dx, y, tz + dz, B.MUSHROOM_PURPLE);
        }
      }
    }
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.4;
      w.setRaw(Math.round(tx + Math.cos(a) * 3.5), yb + 1, Math.round(tz + Math.sin(a) * 3.5), B.MUSHROOM_SHROOMLIGHT);
    }
    // ring van gloeiende paddenstoeltjes rond de steel (de hint)
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * Math.PI * 2;
      const x = Math.round(tx + Math.cos(a) * 3.3), z = Math.round(tz + Math.sin(a) * 3.3);
      if (w.get(x, TG + 1, z) === B.AIR && SOLID[w.get(x, TG, z)]) w.setRaw(x, TG + 1, z, B.MUSHROOM_GLOWCAP);
    }
    // holle kern in de steel met een lampje; onder het goudblok ligt de kist
    for (let y = TG + 1; y <= TG + 3; y++) w.setRaw(tx, y, tz, B.AIR);
    w.setRaw(tx, TG + 4, tz, B.MUSHROOM_SHROOMLIGHT);
    w.setRaw(tx, TG, tz, B.GOLD);
    w.setRaw(tx, TG - 1, tz, B.CHEST);
    w.setRaw(tx, TG - 2, tz, B.DIRT);

    // Reuzenpaddenstoelen over het eiland verspreid
    const shrooms = [];
    for (let i = 0; i < 600 && shrooms.length < 18; i++) {
      const x = 3 + Math.floor(rand() * (S - 6)), z = 3 + Math.floor(rand() * (S - 6));
      const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
      const red = rand() < 0.55, big = rand() < 0.55;
      if (d < AR + (red ? 4.5 : 6.5)) continue;
      const h = heights[z * S + x];
      if (h <= WL) continue;
      if (Math.hypot(x - tx, z - tz) < 10) continue;
      const ddx = x + 0.5 - C, ddz = z + 0.5 - C;
      const along = ddx * gdx + ddz * gdz, across = Math.abs(-ddx * gdz + ddz * gdx);
      if (along > AR - 3 && along < TD + 3 && across < 6) continue;
      if (shrooms.some((s) => Math.hypot(s.x - x, s.z - z) < 7)) continue;
      const hgt = big ? 6 + Math.floor(rand() * 4) : 4 + Math.floor(rand() * 2);
      if (red) bigRed(w, x, h + 1, z, hgt, big ? 3 : 2, rand);
      else bigBrown(w, x, h + 1, z, hgt, big ? 4 : 3, rand);
      shrooms.push({ x, z });
    }

    // Aankomstportaal aan de overkant van de poort
    const pz = side > 0 ? C - 15 : C + 15;
    for (let i = -1; i <= 2; i++) {
      for (let y = F + 1; y <= F + 5; y++) {
        const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
        w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
      }
    }
    for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
    w.portalAxis = 'x';
    const spawn = { x: C + 1, y: F + 1, z: side > 0 ? pz + 3 : pz - 2 };

    // Kleine paddenstoelen: overal op het eiland, en een heksenkring in de arena
    for (let z = 1; z < S - 1; z++) {
      for (let x = 1; x < S - 1; x++) {
        const h = heights[z * S + x];
        if (w.get(x, h, z) !== B.MUSHROOM_MYCELIUM || w.get(x, h + 1, z) !== B.AIR) continue;
        if (arena[z * S + x]) {
          const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
          if (Math.abs(d - 13.5) > 0.5 || Math.hypot(x + 0.5 - spawn.x, z + 0.5 - spawn.z) < 3) continue;
          const hsh = (x * 31 + z * 17) % 5;
          if (hsh === 0 || hsh === 3) w.setRaw(x, h + 1, z, B.MUSHROOM_GLOWCAP);
          else if (hsh === 1) w.setRaw(x, h + 1, z, B.MUSHROOM_SMALL_RED);
          continue;
        }
        if (Math.hypot(x - tx, z - tz) < 4) continue;
        const r = rand();
        if (r < 0.03) w.setRaw(x, h + 1, z, B.MUSHROOM_SMALL_RED);
        else if (r < 0.06) w.setRaw(x, h + 1, z, B.MUSHROOM_SMALL_BROWN);
        else if (r < 0.072) w.setRaw(x, h + 1, z, B.MUSHROOM_GLOWCAP);
      }
    }

    w.computeTops();
    return {
      world: w,
      spawn,
      spawnYaw: side > 0 ? Math.PI : 0,
      bossSpawn: { x: C + 0.5, y: F + 1, z: C + 0.5 + side * 2 },
      portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
      portalAxis: 'x',
      arenaCenter: { x: C, z: C }, arenaRadius: AR, floorY: F + 1,
      treasure: { x: tx, y: TG - 1, z: tz },
      gate,
    };
  }

  /* ---------- Textures en modellen voor de schurk ---------- */
  const MT = {};
  function buildTextures() {
    const R = mulberry32(5150);
    const stemPx = (x) => { const s = (x * 3 + 7) % 5; const r = R(); return s === 0 ? [204, 194, 168] : r < 0.15 ? [238, 232, 214] : [224, 216, 194]; };
    MT.stem = pixelTexture(16, 16, stemPx);
    // boos gezicht: oogkassen, frons en een brede mond met tandjes
    MT.face = pixelTexture(16, 16, (x, y) => {
      if (y >= 9 && y <= 13 && x >= 3 && x <= 12) {
        if ((y === 9 || y === 13) && (x === 3 || x === 12)) return stemPx(x);
        if (y === 9 && x % 2 === 1) return [250, 246, 230];
        if (y === 13 && x % 2 === 0 && x > 3) return [250, 246, 230];
        return [56, 16, 30];
      }
      if (y >= 4 && y <= 6 && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13))) return [40, 18, 24];
      if (y === 7 && (x === 7 || x === 8)) return [190, 176, 150];
      return stemPx(x);
    });
    MT.cap = pixelTexture(16, 16, (x, y) => (inSpot(x, y) ? [242, 238, 230] : R() < 0.2 ? [172, 28, 30] : [204, 38, 36]));
    MT.capGlow = pixelTexture(16, 16, (x, y) => (inSpot(x, y) ? [255, 255, 255] : [30, 0, 16]));
    MT.gills = pixelTexture(16, 16, (x) => (x % 3 === 0 ? [146, 116, 92] : [196, 170, 140]));
    MT.miniFace = pixelTexture(8, 8, (x, y) => {
      if (y === 3 && (x === 1 || x === 2 || x === 5 || x === 6)) return [255, 60, 40];
      if (y === 2 && (x === 2 || x === 5)) return [70, 30, 30];
      if (y === 5 && x >= 2 && x <= 5) return [60, 20, 30];
      return [226, 218, 196];
    });
    MT.miniGlow = pixelTexture(8, 8, (x, y) => (y === 3 && (x === 1 || x === 2 || x === 5 || x === 6) ? [255, 80, 40] : [0, 0, 0]));
    MT.spore = pixelTexture(8, 8, () => { const r = R(); return r < 0.25 ? [255, 220, 250] : r < 0.6 ? [220, 110, 230] : [170, 70, 200]; });
  }

  const GEO = {};
  function shared(g) { g.userShared = true; return g; }
  function geos() {
    if (GEO.cloud) return GEO;
    GEO.cloud = shared(new THREE.BoxGeometry(1, 1, 1));
    GEO.ball = shared(new THREE.BoxGeometry(0.5, 0.5, 0.5));
    GEO.ring = shared(new THREE.RingGeometry(0.86, 1, 40));
    GEO.band = shared(new THREE.CylinderGeometry(1, 1, 0.55, 40, 1, true).translate(0, 0.27, 0));
    GEO.mStem = shared(new THREE.BoxGeometry(0.5, 0.5, 0.5).translate(0, 0.42, 0));
    GEO.mCap = shared(new THREE.BoxGeometry(0.95, 0.38, 0.95).translate(0, 0.84, 0));
    GEO.mFoot = shared(new THREE.BoxGeometry(0.2, 0.18, 0.28).translate(0, 0.09, 0.02));
    GEO.cloudMat = new THREE.MeshBasicMaterial({ color: 0xd070e0, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    GEO.ballMat = new THREE.MeshBasicMaterial({ map: MT.spore });
    return GEO;
  }

  // Klein boos paddenstoelmannetje (handlanger)
  function minionModel() {
    const G = geos();
    const stem = new THREE.MeshLambertMaterial({ map: MT.stem });
    const face = new THREE.MeshLambertMaterial({ map: MT.miniFace, emissive: 0xffffff, emissiveMap: MT.miniGlow });
    const cap = new THREE.MeshLambertMaterial({ map: MT.cap });
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);
    body.add(new THREE.Mesh(G.mStem, [stem, stem, stem, stem, face, stem]));
    body.add(new THREE.Mesh(G.mCap, cap));
    const feet = [];
    for (const sx of [-1, 1]) {
      const f = new THREE.Mesh(G.mFoot, stem);
      f.position.x = sx * 0.14;
      group.add(f); feet.push(f);
    }
    return {
      group, mats: [stem, face, cap],
      animate(m) {
        const s = Math.sin(m.walk * 1.3);
        feet[0].position.z = s * 0.13; feet[1].position.z = -s * 0.13;
        body.position.y = Math.abs(s) * 0.07;
        body.rotation.z = s * 0.12;
      },
    };
  }

  // Schokgolf-ring die over de grond naar buiten rolt (spring eroverheen!)
  class SporeRing {
    constructor(x, y, z, dmg, delay, maxR) {
      const G = geos();
      Object.assign(this, { x, y, z, dmg, delay, maxR, r: 0.8, speed: 7, dead: false, hit: false, t: 0 });
      this.mat = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
      this.mesh = new THREE.Group();
      const flat = new THREE.Mesh(G.ring, this.mat);
      flat.rotation.x = -Math.PI / 2;
      flat.position.y = 0.05;
      this.band = new THREE.Mesh(G.band, this.mat);
      this.mesh.add(flat, this.band);
      this.mesh.position.set(x, y, z);
      this.mesh.visible = false;
    }

    update(dt) {
      this.t += dt;
      if (this.t < this.delay) return;
      if (!this.mesh.visible) { this.mesh.visible = true; SND.play('slam', { at: this, range: 30, vol: 0.5 }); }
      this.r += this.speed * dt;
      this.mesh.scale.set(this.r, 1 + Math.sin(this.r * 2.2) * 0.35, this.r);
      this.mat.opacity = 0.9 * clamp((this.maxR - this.r) / 2.5, 0, 1);
      // stofwolkjes langs de ring
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        FX.debris.spawn(this.x + Math.cos(a) * this.r, this.y + 0.1, this.z + Math.sin(a) * this.r, Math.cos(a) * 2, 2 + Math.random() * 2, Math.sin(a) * 2, 0.85, 0.6, 0.85, 0.4, 10, 1, true);
      }
      const p = player;
      if (!this.hit && !p.dead) {
        const d = Math.hypot(p.pos.x - this.x, p.pos.z - this.z);
        if (Math.abs(d - this.r) < 0.5 + p.hw && p.pos.y < this.y + 0.7 && p.pos.y > this.y - 1.2) {
          this.hit = true;
          damagePlayer(this.dmg, { x: this.x, y: this.y, z: this.z }, 'mushroomRing', 7, 6);
        }
      }
      if (this.r >= this.maxR) this.dead = true;
    }

    dispose() {}
  }

  /* ---------- De Sporenreus ---------- */
  class SporeBoss extends BossBase {
    constructor(world, info) {
      const s = info.bossSpawn, sp = info.spawn;
      super(world, info, {
        name: 'De Sporenreus', ref: 'de Sporenreus', hp: 820, hw: 1.6, h: 6.0, wakeRange: 12.5,
        yaw: Math.atan2(sp.x - s.x, sp.z - s.z),
        deathTiles: [T.MUSHROOM_RED, T.MUSHROOM_STEM, T.MUSHROOM_PURPLE],
      });
      this.anim = { squash: 0, armX: 0, armZ: 0.2, lean: 0, capTilt: 0, legL: 0, legR: 0, roll: 0, eye: 1 };
      this.setup = false;
      this.lastAtk = ''; this.sinceSummon = 2; this.forceNext = null;
      this.bounceIdx = 0; this.bounceMax = 1; this.jumpMark = null; this.jv = { x: 0, z: 0 }; this.jumpW = 0.7;
    }

    setState(s, r) { super.setState(s, r); this.setup = false; }

    buildModel() {
      if (!MT.stem) buildTextures();
      const stem = new THREE.MeshLambertMaterial({ map: MT.stem });
      const face = new THREE.MeshLambertMaterial({ map: MT.face });
      const cap = new THREE.MeshLambertMaterial({ map: MT.cap, emissive: 0xff50c0, emissiveMap: MT.capGlow, emissiveIntensity: 0.06 });
      const gills = new THREE.MeshLambertMaterial({ map: MT.gills });
      const brow = new THREE.MeshLambertMaterial({ color: 0x4a2a1c });
      brow.userBase = brow.color.clone();
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe8ff50 });
      const group = new THREE.Group();
      const inner = new THREE.Group();
      group.add(inner);
      // korte dikke beentjes
      const legs = [];
      for (const sx of [-1, 1]) {
        const p = new THREE.Group();
        p.position.set(sx * 0.7, 1.0, 0);
        p.add(bossBox(0.8, 0.75, 0.8, stem, -0.4));
        p.add(bossBox(1.0, 0.32, 1.3, stem, -0.84, 0, 0.18));
        inner.add(p); legs.push(p);
      }
      // dikke steel als lijf, met het gezicht
      const body = new THREE.Group();
      body.position.y = 1.0;
      inner.add(body);
      body.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.6, 2.0).translate(0, 1.3, 0), [stem, stem, stem, stem, face, stem]));
      body.add(bossBox(2.6, 0.3, 2.3, gills, 2.2));
      const eyes = [];
      for (const sx of [-1, 1]) {
        const e = bossBox(0.56, 0.32, 0.08, eyeMat);
        e.position.set(sx * 0.5, 1.71, 1.03);
        body.add(e); eyes.push(e);
        const b = bossBox(0.75, 0.16, 0.12, brow);
        b.position.set(sx * 0.5, 2.0, 1.05);
        b.rotation.z = sx * 0.38;
        body.add(b);
      }
      // stompe armpjes
      const arms = [];
      for (const sx of [-1, 1]) {
        const p = new THREE.Group();
        p.position.set(sx * 1.3, 1.9, 0);
        p.add(bossBox(0.55, 1.0, 0.55, stem, -0.5));
        p.add(bossBox(0.72, 0.55, 0.72, stem, -1.2));
        body.add(p); arms.push(p);
      }
      // grote rode hoed met witte stippen
      const hat = new THREE.Group();
      hat.position.y = 2.6;
      body.add(hat);
      hat.add(bossBox(4.3, 0.3, 4.3, gills, 0.15));
      hat.add(bossBox(5.0, 1.2, 5.0, cap, 0.9));
      hat.add(bossBox(3.9, 0.7, 3.9, cap, 1.85));
      hat.add(bossBox(2.5, 0.45, 2.5, cap, 2.42));
      for (const [x, y, z, s] of [[1.6, 2.2, -1.1, 1], [-1.55, 2.2, 0.7, 0.85], [0.35, 2.64, 0.3, 1.2]]) {
        const st = bossBox(0.22 * s, 0.45 * s, 0.22 * s, stem, 0.22 * s);
        const cp = bossBox(0.62 * s, 0.26 * s, 0.62 * s, cap, 0.55 * s);
        st.position.set(x, y, z); cp.position.set(x, y, z);
        hat.add(st, cp);
      }
      return { group, inner, legs, body, arms, hat, eyes, eyeMat, cap, mats: [stem, face, cap, gills, brow] };
    }

    onEnrage() {
      // hoed kleurt roze en gaat gloeien
      this.model.cap.userBase = new THREE.Color(1, 0.72, 0.92);
      this.model.cap.emissive.setHex(0xff3cc8);
      this.forceNext = 'jumpWind';
      this.attackCD = Math.min(this.attackCD, 0.8);
      for (let i = 0; i < 40; i++) this.capPuff(3);
    }
    enragedFx() { this.capPuff(1.5); }
    onGoHome() {
      this.noSteer = false;
      this.bounceIdx = 0;
      if (this.jumpMark) { this.jumpMark.dead = true; this.jumpMark = null; }
    }

    // sporenwolkje uit de hoed
    capPuff(sp) {
      const k = Math.random();
      const col = this.enraged ? (k < 0.5 ? [1, 0.4, 0.8] : [0.6, 1, 0.9]) : (k < 0.5 ? [0.9, 0.6, 0.95] : [0.75, 0.9, 0.7]);
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 1.5;
      FX.glow.spawn(this.pos.x + Math.cos(a) * r, this.pos.y + 5.4 + Math.random() * 0.8, this.pos.z + Math.sin(a) * r,
        Math.cos(a) * sp, 0.6 + Math.random() * sp, Math.sin(a) * sp, col[0], col[1], col[2], 0.9 + Math.random() * 0.6, -0.3, 1);
    }

    pickAttack(c) {
      const ph2 = this.enraged;
      let s = this.forceNext;
      this.forceNext = null;
      if (!s) {
        const alive = game.minions.filter((m) => !m.dead).length;
        const opts = [];
        const add = (st, wgt) => { if (st !== this.lastAtk) opts.push([st, wgt]); };
        add('jumpWind', c.dist < 6 ? 3 : 2);
        add('sporeWind', 2);
        add('barrageWind', c.dist > 6 ? 3 : 1.3);
        if (alive < (ph2 ? 5 : 3)) add('summonWind', this.sinceSummon >= 3 ? 5 : 1.2);
        let tot = 0;
        for (const o of opts) tot += o[1];
        let r = Math.random() * tot;
        s = opts[opts.length - 1][0];
        for (const o of opts) { r -= o[1]; if (r <= 0) { s = o[0]; break; } }
      }
      this.lastAtk = s;
      this.sinceSummon = s === 'summonWind' ? 0 : this.sinceSummon + 1;
      if (s === 'jumpWind') { this.bounceIdx = 0; this.bounceMax = ph2 ? 3 : 1; }
      this.setState(s);
    }

    think(dt, c) {
      const ph2 = this.enraged;
      const first = !this.setup;
      this.setup = true;
      let speed = 0;
      switch (this.state) {
        case 'chase':
          this.turnTo(c.targetYaw, dt, ph2 ? 3.4 : 2.6);
          if (c.dist > 3.0) speed = ph2 ? 2.8 : 2.1;
          this.attackCD -= dt;
          if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
          break;
        case 'sporeWind':
          // hoed schudden: sporen dwarrelen eruit
          this.turnTo(c.targetYaw, dt, 2);
          if (first) SND.play('fizz', { at: this.pos, range: 40 });
          if (Math.random() < dt * 40) this.capPuff(1.2);
          if (this.t > (ph2 ? 0.7 : 0.9)) { this.castSpores(c.p); this.setState('recover', ph2 ? 0.6 : 0.9); }
          break;
        case 'jumpWind':
          if (first) this.planJump(c.p);
          this.turnTo(c.targetYaw, dt, 4);
          if (this.t > this.jumpW) {
            const tgt = this.jumpTarget, T = this.jumpT;
            this.jv.x = (tgt.x - this.pos.x) / T; this.jv.z = (tgt.z - this.pos.z) / T;
            this.vel.set(this.jv.x, GRAVITY * T / 2, this.jv.z);
            this.noSteer = true;
            SND.play('whoosh', { at: this.pos, range: 40 });
            this.setState('jump');
          }
          break;
        case 'jump':
          this.vel.x = this.jv.x; this.vel.z = this.jv.z;
          if (Math.random() < 0.5) this.capPuff(0.5);
          if ((this.onGround && this.t > 0.2) || this.t > 2.5) this.land();
          break;
        case 'summonWind':
          // armen omhoog: uit de gemarkeerde plekken springen paddenstoelmannetjes
          if (first) this.planSummon();
          this.turnTo(c.targetYaw, dt, 2);
          if (Math.random() < dt * 25) this.capPuff(2);
          if (this.t > 1.15) this.setState('recover', 0.5);
          break;
        case 'barrageWind':
          // naar achteren leunen, hoed laden en dan sporenballen de lucht in
          this.turnTo(c.targetYaw, dt, 3);
          if (first) SND.play('fizz', { at: this.pos, range: 40, vol: 0.6 });
          if (Math.random() < dt * 30) this.capPuff(0.6);
          if (this.t > (ph2 ? 0.6 : 0.75)) { this.launchBarrage(c.p); this.setState('recover', ph2 ? 0.6 : 0.9); }
          break;
        case 'recover':
          if (this.t > this.recoverTime) {
            this.setState('chase');
            this.attackCD = ph2 ? 1.0 + Math.random() * 0.8 : 1.9 + Math.random() * 1.1;
          }
          break;
        default:
          this.setState('chase');
          break;
      }
      return speed;
    }

    // Landingsplek kiezen en met een oranje cirkel aanwijzen
    planJump(p) {
      const ph2 = this.enraged, ac = this.info.arenaCenter, lim = this.info.arenaRadius - 3;
      let tx = p.pos.x, tz = p.pos.z;
      const dx = tx - ac.x, dz = tz - ac.z, d = Math.hypot(dx, dz);
      if (d > lim) { tx = ac.x + dx / d * lim; tz = ac.z + dz / d * lim; }
      this.jumpTarget = { x: tx, z: tz };
      this.jumpW = this.bounceIdx === 0 ? (ph2 ? 0.55 : 0.7) : 0.32;
      this.jumpT = ph2 ? 0.8 : 0.95;
      if (this.jumpMark) this.jumpMark.dead = true;
      this.jumpMark = new GroundHazard({ x: tx, y: this.info.floorY, z: tz, radius: 3.0, warn: this.jumpW + this.jumpT + 0.05, linger: 0.15, color: 0xff7a1a, onTrigger: () => {} });
      game.addHazard(this.jumpMark);
    }

    land() {
      const ph2 = this.enraged;
      this.noSteer = false;
      this.vel.x = 0; this.vel.z = 0;
      if (this.jumpMark) { this.jumpMark.dead = true; this.jumpMark = null; }
      const x = this.pos.x, y = this.pos.y, z = this.pos.z;
      FX.ring(x, y, z, 3.2, [0.95, 0.6, 0.9]);
      FX.ring(x, y, z, 1.6, [1, 0.85, 0.6]);
      for (let i = 0; i < 30; i++) this.capPuff(3);
      SND.play('slam', { at: this.pos, range: 50 });
      game.shake = Math.max(game.shake, 0.8);
      const p = player;
      if (!p.dead && Math.hypot(p.pos.x - x, p.pos.z - z) < 3.2 + p.hw && p.pos.y < y + 2.2 && p.pos.y > y - 1.5) {
        damagePlayer(this.dmg(14), { x, y, z }, 'mushroomStomp', 9, 7);
      }
      // ringen die naar buiten stuiteren
      this.bounceIdx++;
      const last = this.bounceIdx >= this.bounceMax;
      const n = ph2 ? (last ? 3 : 1) : 2;
      for (let i = 0; i < n; i++) game.addHazard(new SporeRing(x, y, z, this.dmg(12), i * 0.5, 9));
      if (!last) this.setState('jumpWind');
      else this.setState('recover', ph2 ? 0.8 : 1.2);
    }

    // Sporenwolken: roze cirkels, daarna een blijvende wolk die vertraagt en het zicht verduistert
    castSpores(p) {
      const ph2 = this.enraged, G = geos();
      const n = ph2 ? 5 : 3;
      const ac = this.info.arenaCenter, lim = this.info.arenaRadius - 2;
      const spots = [{ x: p.pos.x + p.mvx * 0.5, z: p.pos.z + p.mvz * 0.5 }];
      for (let i = 1; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 3.5;
        spots.push({ x: p.pos.x + Math.cos(a) * r, z: p.pos.z + Math.sin(a) * r });
      }
      let clouds = game.hazards.filter((h) => h.spore && !h.dead).length;
      const fy = this.info.floorY;
      const cp = { x: this.pos.x, y: this.pos.y + 5.6, z: this.pos.z };
      for (const s of spots) {
        if (clouds >= 9) break;
        clouds++;
        const dx = s.x - ac.x, dz = s.z - ac.z, d = Math.hypot(dx, dz);
        if (d > lim) { s.x = ac.x + dx / d * lim; s.z = ac.z + dz / d * lim; }
        // sporenstroom van de hoed naar de plek
        for (let i = 0; i < 10; i++) {
          const T = 0.8 + Math.random() * 0.3;
          FX.glow.spawn(cp.x, cp.y, cp.z, (s.x - cp.x) / T + (Math.random() - 0.5), (fy + 0.5 - cp.y) / T + 3.5, (s.z - cp.z) / T + (Math.random() - 0.5), 0.9, 0.5, 0.95, T, 7, 0);
        }
        game.addHazard(new GroundHazard({
          x: s.x, y: fy, z: s.z, radius: 2.2, warn: ph2 ? 0.85 : 1.0, linger: ph2 ? 5 : 4.2, color: 0xc040d0,
          spore: true, tickT: 1, dmg: this.dmg(12), cloud: null,
          onTrigger: (h) => {
            const g = new THREE.Group();
            for (const [ox, oy, oz, sx, sy] of [[0, 0.7, 0, 3.2, 1.3], [0.8, 1.35, -0.6, 2.2, 0.9], [-0.7, 1.15, 0.7, 2, 1]]) {
              const m = new THREE.Mesh(G.cloud, G.cloudMat);
              m.position.set(ox, oy, oz); m.scale.set(sx, sy, sx);
              g.add(m);
            }
            g.rotation.y = Math.random() * Math.PI;
            g.scale.setScalar(0.2);
            h.mesh.add(g);
            h.cloud = g;
            SND.play('fizz', { at: { x: h.x, y: h.y, z: h.z }, range: 30 });
            for (let i = 0; i < 18; i++) {
              const a = Math.random() * Math.PI * 2, r = Math.random() * h.radius;
              FX.glow.spawn(h.x + Math.cos(a) * r, h.y + 0.3, h.z + Math.sin(a) * r, Math.cos(a) * 2, 2 + Math.random() * 2, Math.sin(a) * 2, 0.95, 0.55, 0.95, 0.9, 1, 1);
            }
            if (h.playerInside()) {
              damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'mushroomSpores', 3, 4);
              player.slow = Math.max(player.slow, 1.2);
            }
          },
          onLinger: (h, dt) => {
            const k = h.t - h.warn, left = h.linger - k;
            if (h.cloud) h.cloud.scale.setScalar(clamp(Math.min(0.2 + k * 3, left / 0.6), 0.05, 1));
            if (Math.random() < dt * 9) {
              const a = Math.random() * Math.PI * 2, r = Math.random() * h.radius;
              FX.glow.spawn(h.x + Math.cos(a) * r, h.y + 0.3 + Math.random() * 1.2, h.z + Math.sin(a) * r, 0, 0.4, 0, 0.85, 0.5, 0.9, 1.3, -0.1, 0);
            }
            if (left > 0.3 && h.playerInside()) {
              player.slow = Math.max(player.slow, 0.4);
              player.dark = Math.max(player.dark, 0.55);
              h.tickT -= dt;
              if (h.tickT <= 0) { h.tickT = 1; damagePlayer(this.dmg(3), null, 'mushroomSpores'); }
            } else h.tickT = Math.min(h.tickT, 0.5);
          },
        }));
      }
    }

    // Rode cirkeltjes naast de reus: daar springen paddenstoelmannetjes uit de grond
    planSummon() {
      const ph2 = this.enraged, fy = this.info.floorY, ac = this.info.arenaCenter, lim = this.info.arenaRadius - 2;
      const alive = game.minions.filter((m) => !m.dead).length;
      const n = Math.max(1, Math.min(ph2 ? 3 : 2, (ph2 ? 5 : 3) - alive));
      for (let i = 0; i < n; i++) {
        let x = 0, z = 0;
        for (let tries = 0; tries < 8; tries++) {
          const a = this.yaw + (i - (n - 1) / 2) * 1.0 + (Math.random() - 0.5) * 0.4;
          const r = 3 + Math.random() * 1.5;
          x = this.pos.x + Math.sin(a) * r; z = this.pos.z + Math.cos(a) * r;
          const dx = x - ac.x, dz = z - ac.z, d = Math.hypot(dx, dz);
          if (d > lim) { x = ac.x + dx / d * lim; z = ac.z + dz / d * lim; }
          if (!this.world.solidAt(Math.floor(x), Math.floor(fy), Math.floor(z))) break;
        }
        game.addHazard(new GroundHazard({
          x, y: fy, z, radius: 0.8, warn: 0.9, linger: 0.2, color: 0xff4040,
          onTrigger: (h) => {
            if (!game.boss || !game.boss.alive()) return;
            const m = new Minion(this.world, h.x, h.y, h.z, {
              name: 'Paddenstoelmannetje', hp: 40, speed: ph2 ? 3.4 : 3.0, dmg: this.dmg(6), hw: 0.36, h: 1.0, life: 20,
              model: minionModel, color: [0.85, 0.2, 0.2],
            });
            m.vel.y = 6;
            game.addMinion(m);
            FX.blockBreak(Math.floor(h.x), Math.floor(h.y) - 1, Math.floor(h.z), B.MUSHROOM_MYCELIUM);
            SND.play('pop', { at: { x: h.x, y: h.y, z: h.z }, range: 30 });
          },
        }));
      }
      SND.play('roar', { at: this.pos, range: 40, vol: 0.45 });
    }

    // Sporenballen in een boog; paarse cirkels laten zien waar ze landen
    launchBarrage(p) {
      const ph2 = this.enraged, G = geos();
      const n = ph2 ? 7 : 5;
      const fy = this.info.floorY, ac = this.info.arenaCenter, lim = this.info.arenaRadius - 1.5;
      const o = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * 0.6, this.pos.y + 5.8, this.pos.z + Math.cos(this.yaw) * 0.6);
      const g = 16;
      for (let i = 0; i < n; i++) {
        const T = 1.0 + i * 0.07 + Math.random() * 0.1;
        let tx, tz;
        if (i === 0) { tx = p.pos.x + p.mvx * T * 0.6; tz = p.pos.z + p.mvz * T * 0.6; }
        else { const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 4.5; tx = p.pos.x + Math.cos(a) * r; tz = p.pos.z + Math.sin(a) * r; }
        const dx = tx - ac.x, dz = tz - ac.z, d = Math.hypot(dx, dz);
        if (d > lim) { tx = ac.x + dx / d * lim; tz = ac.z + dz / d * lim; }
        const vel = new THREE.Vector3((tx - o.x) / T, (fy - o.y + 0.5 * g * T * T) / T, (tz - o.z) / T);
        game.addHazard(new GroundHazard({ x: tx, y: fy, z: tz, radius: 1.9, warn: T, linger: 0.25, color: 0x9a40ff, onTrigger: () => {} }));
        game.addProjectile(new Projectile({
          pos: o, vel, owner: 'boss', type: 'mushroomBall', dmg: this.dmg(12), splash: this.dmg(12), gravity: g,
          radius: 0.3, knock: 4, destroyable: true, life: 4, mesh: new THREE.Mesh(G.ball, G.ballMat),
          trail: (pr) => { if (Math.random() < 0.6) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, 0.2, 0, 0.9, 0.55, 0.95, 0.5, 0, 0); },
          onHitPlayer: () => { player.dark = Math.max(player.dark, 0.5); },
          explodeFx: (pr) => {
            for (let k = 0; k < 16; k++) {
              const a = Math.random() * Math.PI * 2;
              FX.glow.spawn(pr.pos.x, pr.pos.y + 0.2, pr.pos.z, Math.cos(a) * 3, 1 + Math.random() * 3, Math.sin(a) * 3, 0.9, 0.5 + Math.random() * 0.3, 0.95, 0.7, 3, 1.5);
            }
            SND.play('fizz', { at: pr.pos, range: 26, vol: 0.5 });
          },
        }));
      }
      SND.play('shoot', { at: o, range: 40, vol: 0.7 });
    }

    die() {
      super.die();
      this.noSteer = false;
      this.info.crumbleT = 2.8;
      this.info.crumbleI = 0;
    }

    animate(dt, speed) {
      const a = this.anim, m = this.model, ph2 = this.enraged;
      this.walkPhase += dt * speed * 2.4;
      const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2);
      let squash = 0, armX = -sw * 0.5, armZ = 0.25, lean = 0.05, capTilt = 0, legL = sw * 0.6, legR = -sw * 0.6, roll = sw * 0.07, eye = 1, rate = 10, shake = 0;
      switch (this.state) {
        case 'sleep': case 'idle':
          armX = 0.1; armZ = 0.1; lean = 0.18; capTilt = 0.22; legL = 0; legR = 0; roll = 0;
          eye = this.state === 'sleep' ? 0.12 : 0.6;
          squash = this.state === 'sleep' ? 0.04 + Math.sin(game.time * 1.3) * 0.03 : 0;
          if (this.state === 'sleep' && Math.random() < dt * 2) this.capPuff(0.2);
          break;
        case 'roar': armX = -2.6; armZ = 0.7; lean = -0.25; capTilt = -0.25; squash = -0.12; eye = 1.6; rate = 7; break;
        case 'jumpWind': {
          const k = clamp(this.t / (this.jumpW || 0.6), 0, 1);
          squash = 0.3 * k; armX = -0.6 - 1.4 * k; armZ = 0.9 * k; lean = 0.1; eye = 1.4; rate = 16;
          break;
        }
        case 'jump': squash = this.vel.y > 0 ? -0.18 : -0.06; armX = -2.8; armZ = 0.6; legL = -0.5; legR = -0.5; eye = 1.4; rate = 12; break;
        case 'recover': squash = this.t < 0.18 && this.lastAtk === 'jumpWind' ? 0.32 : 0; armX = 0.3; armZ = 0.6; lean = 0.15; rate = 12; break;
        case 'sporeWind': shake = 1; armX = -1.0; armZ = 0.9; lean = 0.1; eye = 1.3; break;
        case 'summonWind': armX = -2.9 + Math.sin(this.t * 18) * 0.25; armZ = 0.35; lean = -0.1; eye = 1.8; squash = Math.sin(this.t * 12) * 0.05; break;
        case 'barrageWind': {
          const k = clamp(this.t / (ph2 ? 0.6 : 0.75), 0, 1);
          lean = -0.4 * k; capTilt = -0.3 * k; armX = 0.6; armZ = 0.9; eye = 1.5; squash = 0.12 * k;
          break;
        }
        default: break;
      }
      const k = 1 - Math.exp(-dt * rate);
      for (const [key, v] of [['squash', squash], ['armX', armX], ['armZ', armZ], ['lean', lean], ['capTilt', capTilt], ['roll', roll], ['eye', eye]]) a[key] += (v - a[key]) * k;
      a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
      a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
      m.inner.scale.set(1 + a.squash * 0.6, 1 - a.squash, 1 + a.squash * 0.6);
      m.body.rotation.x = a.lean; m.body.rotation.z = a.roll;
      m.hat.rotation.x = a.capTilt;
      m.hat.rotation.z = shake ? Math.sin(game.time * 40) * 0.1 : 0;
      m.arms[0].rotation.x = a.armX; m.arms[1].rotation.x = a.armX;
      m.arms[0].rotation.z = -a.armZ; m.arms[1].rotation.z = a.armZ;
      m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
      // ogen: geelgroen, in fase 2 rood; dicht als hij slaapt
      const e = clamp(a.eye, 0, 1.8) / 1.8;
      if (ph2) m.eyeMat.color.setRGB(0.55 + 0.45 * e, 0.12 + 0.2 * e, 0.08);
      else m.eyeMat.color.setRGB(0.45 + 0.5 * e, 0.5 + 0.5 * e, 0.12 + 0.2 * e);
      const open = a.eye < 0.3 ? 0.25 : 1;
      m.eyes[0].scale.y = open; m.eyes[1].scale.y = open;
      // hoed gloeit: zacht bij het laden, fel en pulserend in fase 2
      const charging = this.state === 'barrageWind' || this.state === 'sporeWind' || this.state === 'summonWind';
      m.cap.emissiveIntensity = ph2 ? 1.0 + Math.sin(game.time * 7) * 0.45 + (charging ? 0.5 : 0) : charging ? 0.55 + Math.sin(game.time * 20) * 0.2 : 0.06;
    }
  }

  /* ---------- Sfeer: zwevende sporen en de poort die afbrokkelt ---------- */
  function ambience(dt, info) {
    const p = player;
    if (info.crumbleT !== undefined && info.crumbleI < info.gate.length) {
      info.crumbleT -= dt;
      if (info.crumbleI === 0 && !info.sorted) { info.gate.sort((a, b) => b[1] - a[1]); info.sorted = true; }
      while (info.crumbleT <= 0 && info.crumbleI < info.gate.length) {
        const [x, y, z] = info.gate[info.crumbleI++];
        info.crumbleT += 0.07;
        if (info.world.get(x, y, z) === B.MUSHROOM_BROWN) {
          info.world.set(x, y, z, B.AIR);
          FX.blockBreak(x, y, z, B.MUSHROOM_BROWN);
          if (info.crumbleI % 3 === 0) SND.play('break', { at: { x, y, z }, range: 40, vol: 0.7 });
        }
        if (info.crumbleI === info.gate.length) HUD.actionbar('De poort is open! Zoek de paarse reuzenpaddenstoel.', 3);
      }
    }
    game.ashT += dt * 16;
    while (game.ashT > 1) {
      game.ashT -= 1;
      const k = Math.random();
      const col = k < 0.4 ? [1, 0.55, 0.85] : k < 0.7 ? [0.6, 1, 0.85] : [0.85, 0.75, 1];
      FX.glow.spawn(p.pos.x + (Math.random() - 0.5) * 28, p.pos.y - 1 + Math.random() * 9, p.pos.z + (Math.random() - 0.5) * 28,
        (Math.random() - 0.5) * 0.3, 0.15 + Math.random() * 0.25, (Math.random() - 0.5) * 0.3, col[0], col[1], col[2], 3 + Math.random() * 2, -0.02, 0);
    }
  }

  registerRealm('mushroom', {
    gen: genMushroom,
    makeBoss: (world, info) => new SporeBoss(world, info),
    atmosphere: { background: 0xb488c4, fog: 0xb488c4, near: 16, far: 58, amb: 0xffe6ff, ambI: 0.9, dir: 0xffd8f0, dirI: 0.5, hand: 0xffeeff },
    intro: 'Wat ruikt het hier muf... Midden op het eiland slaapt de Sporenreus.',
    tip: 'Tip: spring over de stuiterringen en blijf uit de roze sporenwolken!',
    treasureTip: 'Zie je de paarse reuzenpaddenstoel met de ring van gloeiende paddenstoeltjes? Hak de steel open en graaf onder het goud naar beneden!',
    ambientSound: 0.3,
    fallLimit: 1,
    ruin: [B.MUSHROOM_MYCELIUM, B.MUSHROOM_RED, B.MUSHROOM_STEM, B.MUSHROOM_SHROOMLIGHT],
    onEnter() {
      Object.assign(DEATH_REASONS, {
        mushroomSpores: 'Ademde te veel sporen in',
        mushroomRing: 'Weggestuiterd door een sporenring',
        mushroomStomp: 'Platgestampt door de Sporenreus',
        mushroomBall: 'Geraakt door een sporenbal',
      });
    },
    ambience,
  });

  window.MUSHROOM = { gen: genMushroom, Boss: SporeBoss };
})();
