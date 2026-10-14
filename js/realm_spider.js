'use strict';
/* Portaaljacht – wereld 8: de Spinnengrot met De Spinnenkoningin (webschoten, spinnetjes, plafondsprong, gifspuug) */
(() => {

  /* ---------- Eigen tegels en blokken ---------- */
  defineTile('SPIDER_DEEPSLATE', (h) => (x, y) => {
    const r = h.R();
    if (y % 4 === 3 && r < 0.55) return h.vary([34, 32, 42], 3);
    if (r < 0.1) return h.vary([78, 74, 92], 5);
    return h.vary(r < 0.5 ? [50, 48, 60] : [58, 56, 68], 4);
  });
  defineTile('SPIDER_DEEPSLATE_TOP', (h) => {
    const cells = [];
    for (let i = 0; i < 7; i++) cells.push([h.R() * 16, h.R() * 16]);
    return (x, y) => {
      const v = h.voronoi(cells, x, y, 16);
      if (v.edge < 0.9) return h.vary([32, 30, 40], 3);
      return h.vary(v.i % 2 ? [54, 52, 64] : [61, 58, 72], 5);
    };
  });
  // diepsteen met spinsel erop (het grote web op de arenavloer)
  defineTile('SPIDER_WEBFLOOR', (h) => (x, y) => {
    if (((x + y) % 8 === 0 || (x - y + 16) % 8 === 4) && h.R() < 0.85) return h.vary([190, 186, 206], 6);
    return h.vary(h.R() < 0.5 ? [64, 61, 78] : [72, 69, 86], 4);
  });
  defineTile('SPIDER_COBWEB', (h) => (x, y) => {
    const ax = Math.abs(x - 7.5), ay = Math.abs(y - 7.5), m = Math.max(ax, ay);
    const radial = ax < 0.6 || ay < 0.6 || Math.abs(ax - ay) < 0.6;
    const ring = Math.abs(m - 3.5) < 0.5 || Math.abs(m - 6.5) < 0.5;
    if ((radial || ring) && h.R() < 0.9) return h.vary([232, 232, 240], 6);
    return null;
  });
  defineTile('SPIDER_SILK', (h) => (x, y) => {
    if ((x * 3 + y * 5) % 7 === 0 || (x * 5 - y * 3 + 64) % 9 === 0) return h.vary([242, 242, 248], 4);
    return h.vary(h.R() < 0.2 ? [172, 170, 186] : [206, 204, 218], 6);
  });
  defineTile('SPIDER_EGGSAC', (h) => (x, y) => {
    const r = h.R();
    if ((x + y * 2) % 6 === 0 && r < 0.7) return h.vary([242, 240, 228], 4);
    if (r < 0.1) return h.vary([140, 164, 108], 6);
    return h.vary(r < 0.55 ? [206, 202, 172] : [218, 214, 188], 5);
  });
  defineTile('SPIDER_GLOWEGG', (h) => {
    const eggs = [[4, 4, 2.7], [11.5, 4.5, 2.4], [7.5, 11, 2.9], [13.5, 12.5, 1.9], [2.5, 12.5, 1.8]];
    return (x, y) => {
      for (const [ex, ey, r] of eggs) {
        const d = Math.hypot(x + 0.5 - ex, y + 0.5 - ey);
        if (d < r) return d < r * 0.45 ? [250, 255, 214] : h.vary([176, 244, 92], 10);
      }
      return h.vary([46, 40, 56], 4);
    };
  });
  // gloeiend korstmos op de grotwanden
  defineTile('SPIDER_LICHEN', (h) => (x, y) => {
    const r = h.R();
    if (r < 0.16) return h.vary([90, 230, 220], 18);
    if (r < 0.22) return [200, 255, 250];
    return h.vary(r < 0.6 ? [44, 42, 54] : [52, 50, 62], 4);
  });
  const shroomTile = (cap, spot) => (h) => (x, y) => {
    if (y >= 9 && x >= 7 && x <= 8) return h.vary([206, 200, 222], 6);
    const HW = [0, 0, 0, 0, 2.5, 4, 5, 5.5, 5.5];
    if (y >= 4 && y <= 8 && Math.abs(x - 7.5) < HW[y]) return (x * 7 + y * 3) % 5 === 0 ? spot : h.vary(cap, 12);
    return null;
  };
  defineTile('SPIDER_SHROOM_C', shroomTile([70, 210, 240], [220, 255, 255]));
  defineTile('SPIDER_SHROOM_P', shroomTile([180, 80, 240], [250, 210, 255]));

  const DEEP = defineBlock('SPIDER_DEEPSLATE', { name: 'Diepsteen', tiles: { top: T.SPIDER_DEEPSLATE_TOP, bottom: T.SPIDER_DEEPSLATE_TOP, side: T.SPIDER_DEEPSLATE }, hard: 1.5 });
  const WEBFLOOR = defineBlock('SPIDER_WEBFLOOR', { name: 'Beweven diepsteen', tiles: { top: T.SPIDER_WEBFLOOR, bottom: T.SPIDER_DEEPSLATE_TOP, side: T.SPIDER_DEEPSLATE }, hard: 1.5 });
  const COBWEB = defineBlock('SPIDER_COBWEB', { name: 'Spinnenweb', render: R_CROSS, tiles: all(T.SPIDER_COBWEB), solid: false, opaque: false, ao: false, hard: 0.3, slow: 0.25, sound: 'snow' });
  const SILK = defineBlock('SPIDER_SILK', { name: 'Spinsel', tiles: all(T.SPIDER_SILK), hard: 0.45, sound: 'snow', soft: true });
  const EGGSAC = defineBlock('SPIDER_EGGSAC', { name: 'Eierzak', tiles: all(T.SPIDER_EGGSAC), hard: 0.5, sound: 'snow', soft: true });
  const GLOWEGG = defineBlock('SPIDER_GLOWEGG', { name: 'Gloeiende eieren', tiles: all(T.SPIDER_GLOWEGG), hard: 0.6, glow: true, sound: 'glass' });
  const LICHEN = defineBlock('SPIDER_LICHEN', { name: 'Gloeimos', tiles: all(T.SPIDER_LICHEN), hard: 1.2, glow: true });
  const SHROOM_C = defineBlock('SPIDER_SHROOM_C', { name: 'Gloeizwam', render: R_CROSS, tiles: all(T.SPIDER_SHROOM_C), solid: false, opaque: false, ao: false, hard: 0, glow: true, replace: true, sound: 'grass' });
  const SHROOM_P = defineBlock('SPIDER_SHROOM_P', { name: 'Paarse gloeizwam', render: R_CROSS, tiles: all(T.SPIDER_SHROOM_P), solid: false, opaque: false, ao: false, hard: 0, glow: true, replace: true, sound: 'grass' });

  /* ---------- De grot ---------- */
  const AR = 18;   // straal van de arena

  function genSpider(seed) {
    const S = 72, H = 30, C = 36, F = 6;
    const w = new World('realm', S, H, S);
    const rand = mulberry32(seed);
    const n1 = new Noise2D(rand), n2 = new Noise2D(rand);
    const side = rand() < 0.5 ? 1 : -1;            // portaal aan de noord- of zuidkant
    const nestSide = rand() < 0.5 ? 1 : -1;        // nest links of rechts
    const na = 0.15 + rand() * 0.45;               // een beetje naar de verre kant
    const ndx = nestSide * Math.cos(na), ndz = side * Math.sin(na);
    const nx = Math.round(C + ndx * 29), nz = Math.round(C + ndz * 29);
    const pz = C - side * 16;

    const wallR = (x, z) => 21 + n1.noise(x / 7, z / 7) * 2.2;
    const dC = (x, z) => Math.hypot(x + 0.5 - C, z + 0.5 - C);
    const inCave = (x, z) => dC(x, z) < wallR(x, z);
    // afstand tot de tunnellijn (van de arena naar het nest)
    const ax = C + ndx * 15, az = C + ndz * 15, tlen = Math.hypot(nx + 0.5 - ax, nz + 0.5 - az);
    const tdx = (nx + 0.5 - ax) / tlen, tdz = (nz + 0.5 - az) / tlen;
    const along = (x, z) => (x + 0.5 - ax) * tdx + (z + 0.5 - az) * tdz;
    const tunnelD = (x, z) => {
      const t = clamp(along(x, z), 0, tlen);
      return Math.hypot(x + 0.5 - (ax + tdx * t), z + 0.5 - (az + tdz * t));
    };

    // 1. alles vol diepsteen
    for (let y = 0; y < H; y++) {
      for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) w.setRaw(x, y, z, y === 0 ? B.BEDROCK : DEEP);
    }

    // 2. de grote grot uithollen (koepel, hobbelige rand, druipstenen)
    const fl = new Int16Array(S * S).fill(F);
    const ceil = new Int16Array(S * S).fill(0);
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const d = dC(x, z), wr = wallR(x, z);
        if (d >= wr) continue;
        const k = d / 22;
        let top = F + 1 + Math.floor(16 - k * k * 7 + n2.noise(x / 5, z / 5) * 1.5);
        if (d > 9 && rand() < 0.07) top -= 1 + Math.floor(rand() * 3);
        top = Math.max(top, F + 8);
        let rise = 0;
        if (d > AR + 1) rise = clamp(Math.floor((d - (wr - 3.2)) * 0.8 + n2.noise(x / 3, z / 3) * 0.8), 0, 3);
        for (let y = F + 1 + rise; y < top; y++) w.setRaw(x, y, z, B.AIR);
        fl[z * S + x] = F + rise;
        ceil[z * S + x] = top;
        if (rand() < 0.035) w.setRaw(x, top, z, LICHEN);
      }
    }

    // 3. het grote web op de arenavloer
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const d = dC(x, z);
        if (d > AR - 0.5) continue;
        const th = Math.atan2(z + 0.5 - C, x + 0.5 - C);
        let web = d < 1.2 || Math.abs(d - 6.5) < 0.5 || Math.abs(d - 13) < 0.5;
        for (let i = 0; i < 8 && !web; i++) {
          const a = th - i * Math.PI / 4;
          if (Math.cos(a) > 0 && Math.abs(Math.sin(a)) * d < 0.5) web = true;
        }
        if (web) w.setRaw(x, F, z, WEBFLOOR);
      }
    }

    // 4. vier stalagmietpilaren als dekking
    const pillars = [];
    const pa0 = rand() * 0.4;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2 + pa0;
      const px = Math.round(C + Math.cos(a) * 10.5), pzz = Math.round(C + Math.sin(a) * 10.5);
      const ph = 4 + Math.floor(rand() * 2);
      for (let y = F + 1; y <= F + ph; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, y, pzz + dz, DEEP);
      w.setRaw(px, F + ph + 1, pzz, DEEP); w.setRaw(px + 1, F + ph + 1, pzz + 1, DEEP);
      w.setRaw(px + 1, F + ph + 2, pzz + 1, DEEP);
      if (rand() < 0.7) w.setRaw(px + (rand() < 0.5 ? 0 : 1), F + ph + 1, pzz + 1, LICHEN);
      pillars.push({ x: px + 1, z: pzz + 1 });
    }

    // 5. de tunnel naar het nest, dichtgesponnen met een muur van spinsel
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        if (tunnelD(x, z) >= 1.6 || along(x, z) < 0) continue;
        for (let y = F + 1; y <= F + 3; y++) w.setRaw(x, y, z, B.AIR);
        if (dC(x, z) > AR) w.setRaw(x, F, z, DEEP);
        fl[z * S + x] = F;
      }
    }
    let tStart = tlen - 4;
    for (let t = 0; t < tlen; t += 0.25) {
      const x = Math.floor(ax + tdx * t), z = Math.floor(az + tdz * t);
      if (!inCave(x, z)) { tStart = t; break; }
    }
    const plug = [];
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        if (tunnelD(x, z) >= 1.6) continue;
        const t = along(x, z);
        if (t < tStart - 0.4 || t > tStart + 2.2) continue;
        for (let y = F + 1; y <= F + 3; y++) { w.setRaw(x, y, z, SILK); plug.push([x, y, z]); }
      }
    }
    // gloeiende eieren rond de dichtgesponnen tunnel (de hint)
    const hx = ax + tdx * tStart, hz = az + tdz * tStart;
    for (let z = Math.floor(hz - 4); z <= hz + 4; z++) {
      for (let x = Math.floor(hx - 4); x <= hx + 4; x++) {
        for (let y = F + 1; y <= F + 6; y++) {
          if (w.get(x, y, z) !== DEEP) continue;
          const d = Math.hypot(x + 0.5 - hx, y - F - 2, z + 0.5 - hz);
          if (d > 3.6) continue;
          let open = false;
          for (const [ox, oy, oz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (w.get(x + ox, y + oy, z + oz) === B.AIR) open = true;
          if (open && rand() < 0.6) w.setRaw(x, y, z, GLOWEGG);
        }
      }
    }
    // spinnenwebben voor de muur en in de tunnel erachter
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        if (tunnelD(x, z) >= 2.2) continue;
        const t = along(x, z);
        const inFront = t > tStart - 3 && t < tStart - 0.4 && dC(x, z) > AR + 0.5;
        const behind = t > tStart + 2.2 && t < tlen - 4.5;
        if (!inFront && !behind) continue;
        for (let y = F + 1; y <= F + 3; y++) if (w.get(x, y, z) === B.AIR && rand() < (behind ? 0.22 : 0.3)) w.setRaw(x, y, z, COBWEB);
      }
    }

    // 6. het nest met de schatkist
    const ny = F + 1;
    const nestAir = [];
    for (let dy = 0; dy <= 4; dy++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let dx = -5; dx <= 5; dx++) {
          if ((dx * dx + dz * dz) / 18.5 + (dy * dy) / 17.6 < 1) { w.setRaw(nx + dx, ny + dy, nz + dz, B.AIR); nestAir.push([nx + dx, ny + dy, nz + dz, dx, dy, dz]); }
        }
      }
    }
    for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) if (dx * dx + dz * dz <= 9) w.setRaw(nx + dx, F, nz + dz, SILK);
    // wanden bekleed met spinsel, eierzakken en gloeiende eieren
    for (let dy = -1; dy <= 6; dy++) {
      for (let dz = -6; dz <= 6; dz++) {
        for (let dx = -6; dx <= 6; dx++) {
          const x = nx + dx, y = ny + dy, z = nz + dz;
          if (w.get(x, y, z) !== DEEP || y <= F - 1) continue;
          let open = false;
          for (const [ox, oy, oz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (w.get(x + ox, y + oy, z + oz) === B.AIR) open = true;
          if (!open) continue;
          const r = rand();
          w.setRaw(x, y, z, r < 0.16 ? GLOWEGG : r < 0.24 ? EGGSAC : r < 0.75 ? SILK : DEEP);
        }
      }
    }
    for (const [x, y, z, dx, dy, dz] of nestAir) {
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && dy <= 2) continue;   // ruimte rond de kist
      if (w.get(x, y, z) === B.AIR && rand() < (dy >= 3 ? 0.4 : 0.2)) w.setRaw(x, y, z, COBWEB);
    }
    for (const [dx, dz] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) w.setRaw(nx + dx, ny, nz + dz, GLOWEGG);
    w.setRaw(nx, ny + 3, nz, GLOWEGG);
    w.setRaw(nx, ny, nz, B.CHEST);

    // 7. aankomstportaal
    for (let i = -1; i <= 2; i++) {
      for (let y = F + 1; y <= F + 5; y++) {
        const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
        w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
      }
    }
    for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
    w.setRaw(C - 3, F + 1, pz, B.TORCH); w.setRaw(C + 4, F + 1, pz, B.TORCH);
    w.portalAxis = 'x';
    const spawn = { x: C + 1, y: F + 1, z: pz + 0.5 + side * 2.5 };

    // 8. eierzakken rond de arena: hier komen de spinnetjes uit
    const sacs = [];
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + rand() * 0.3;
      const ca = Math.cos(a), sa = Math.sin(a);
      let sx = 0, sz = 0, ok = false;
      for (let r = 19.8; r > 17.6 && !ok; r -= 0.4) {
        sx = Math.round(C - 0.5 + ca * r); sz = Math.round(C - 0.5 + sa * r);
        ok = inCave(sx, sz) && w.get(sx, fl[sz * S + sx] + 1, sz) === B.AIR && w.get(sx, fl[sz * S + sx] + 3, sz) === B.AIR;
      }
      if (!ok || Math.hypot(sx + 0.5 - (C + 1), sz + 0.5 - pz) < 6.5 || tunnelD(sx, sz) < 3.5) continue;
      const y0 = fl[sz * S + sx] + 1;
      w.setRaw(sx, y0, sz, EGGSAC); w.setRaw(sx, y0 + 1, sz, EGGSAC);
      if (w.get(sx, y0 + 2, sz) === B.AIR) w.setRaw(sx, y0 + 2, sz, COBWEB);
      // klein zakje ernaast
      const ox = Math.round(-sa), oz = Math.round(ca);
      if (w.get(sx + ox, y0, sz + oz) === B.AIR && dC(sx + ox, sz + oz) > AR - 0.6) w.setRaw(sx + ox, y0, sz + oz, EGGSAC);
      const d = Math.hypot(sx + 0.5 - C, sz + 0.5 - C) || 1;
      sacs.push({ x: sx, y: y0, z: sz, cx: sx + 0.5 - (sx + 0.5 - C) / d * 1.7, cz: sz + 0.5 - (sz + 0.5 - C) / d * 1.7 });
    }

    // 9. versiering buiten de arena: gloeizwammen, webben, kleine stalagmieten, fakkels
    const nearSpecial = (x, z) => Math.hypot(x + 0.5 - (C + 1), z + 0.5 - pz) < 4.5 || Math.hypot(x + 0.5 - spawn.x, z + 0.5 - spawn.z) < 3 || tunnelD(x, z) < 2.4;
    for (let i = 0; i < 900; i++) {
      const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
      if (!inCave(x, z) || nearSpecial(x, z)) continue;
      const d = dC(x, z), y = fl[z * S + x] + 1;
      if (w.get(x, y, z) !== B.AIR) continue;
      const r = rand();
      if (d > AR + 0.6) {
        if (r < 0.3) w.setRaw(x, y, z, rand() < 0.6 ? SHROOM_C : SHROOM_P);
        else if (r < 0.42) w.setRaw(x, y, z, COBWEB);
        else if (r < 0.5) {
          const hgt = 1 + Math.floor(rand() * 3);
          for (let k = 0; k < hgt; k++) w.setRaw(x, y + k, z, DEEP);
        }
      } else if (d > 13.5 && r < 0.12) w.setRaw(x, y, z, rand() < 0.6 ? SHROOM_C : SHROOM_P);
    }
    // webben in de hoeken tussen wand en plafond
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const c = ceil[z * S + x];
        if (!c || dC(x, z) < wallR(x, z) - 2.2 || tunnelD(x, z) < 2) continue;
        if (rand() < 0.4 && w.get(x, c - 1, z) === B.AIR) w.setRaw(x, c - 1, z, COBWEB);
        if (rand() < 0.15 && w.get(x, c - 2, z) === B.AIR) w.setRaw(x, c - 2, z, COBWEB);
      }
    }
    // fakkels rond de arena
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + 0.31;
      const x = Math.floor(C + Math.cos(a) * 18.4), z = Math.floor(C + Math.sin(a) * 18.4);
      if (nearSpecial(x, z) || !inCave(x, z)) continue;
      const y = fl[z * S + x] + 1;
      if (w.get(x, y, z) === B.AIR || w.get(x, y, z) === COBWEB || w.get(x, y, z) === SHROOM_C || w.get(x, y, z) === SHROOM_P) w.setRaw(x, y, z, B.TORCH);
    }

    w.computeTops();
    return {
      world: w,
      spawn,
      spawnYaw: side > 0 ? Math.PI : 0,
      bossSpawn: { x: C + 0.5, y: F + 1, z: C + 0.5 + side * 3 },
      portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
      portalAxis: 'x',
      arenaCenter: { x: C, z: C }, arenaRadius: AR, floorY: F + 1,
      treasure: { x: nx, y: ny, z: nz },
      sacs, plug, pillars, tempWebs: [],
      nestHint: { x: hx, z: hz },
    };
  }

  /* ---------- Textures en vormen voor de koningin en haar spinnetjes ---------- */
  const SQ = {};
  function buildSpiderTextures() {
    const R = mulberry32(8181);
    const fur = () => { const r = R(); return r < 0.14 ? [74, 54, 94] : r < 0.5 ? [30, 22, 40] : [38, 28, 50]; };
    SQ.body = pixelTexture(16, 16, fur);
    const hg = (x, y) => y >= 2 && y <= 13 && Math.abs(x - 7.5) < Math.abs(y - 7.5) * 0.55 + 0.6;
    SQ.abd = pixelTexture(16, 16, (x, y) => (hg(x, y) ? (R() < 0.3 ? [255, 80, 56] : [222, 26, 32]) : fur()));
    SQ.abdGlow = pixelTexture(16, 16, (x, y) => (hg(x, y) ? [255, 40, 30] : [0, 0, 0]));
    SQ.leg = pixelTexture(8, 16, (x, y) => (y % 6 === 0 ? [96, 66, 116] : x === 0 || x === 7 ? [20, 14, 28] : fur()));
    SQ.gold = pixelTexture(8, 8, (x, y) => ((x === 3 || x === 4) && (y === 3 || y === 4) ? [230, 20, 40] : R() < 0.3 ? [255, 238, 120] : [234, 182, 40]));
    SQ.fang = pixelTexture(4, 8, (x, y) => (y > 5 ? [70, 40, 70] : [224, 216, 236]));
    SQ.web = pixelTexture(8, 8, (x, y) => (x === y || x === 7 - y || x === 3 || y === 4 ? [252, 252, 255] : [196, 196, 210]));
    SQ.poison = pixelTexture(8, 8, () => (R() < 0.3 ? [190, 255, 120] : [70, 210, 50]));
    SQ.miniBody = pixelTexture(8, 8, () => { const r = R(); return r < 0.15 ? [86, 64, 104] : r < 0.5 ? [40, 30, 52] : [50, 38, 62]; });
    const miniEye = (x, y) => (y === 3 && (x === 1 || x === 2 || x === 5 || x === 6)) || (y === 2 && (x === 3 || x === 4));
    SQ.miniFace = pixelTexture(8, 8, (x, y) => (miniEye(x, y) ? [255, 50, 40] : [40, 30, 52]));
    SQ.miniFaceGlow = pixelTexture(8, 8, (x, y) => (miniEye(x, y) ? [255, 40, 30] : [0, 0, 0]));
  }
  function shared(geo) { geo.userShared = true; return geo; }
  function spiderGeos() {
    if (SQ.geo) return SQ.geo;
    SQ.geo = {
      upR: shared(new THREE.BoxGeometry(1.4, 0.26, 0.26).translate(0.7, 0, 0)),
      upL: shared(new THREE.BoxGeometry(1.4, 0.26, 0.26).translate(-0.7, 0, 0)),
      low: shared(new THREE.BoxGeometry(0.22, 2.2, 0.22).translate(0, -1.1, 0)),
      eyeB: shared(new THREE.BoxGeometry(0.22, 0.22, 0.08)),
      eyeM: shared(new THREE.BoxGeometry(0.16, 0.16, 0.08)),
      eyeS: shared(new THREE.BoxGeometry(0.12, 0.12, 0.08)),
      thread: shared(new THREE.BoxGeometry(0.07, 1, 0.07).translate(0, 0.5, 0)),
      web: shared(new THREE.BoxGeometry(0.55, 0.55, 0.55)),
      glob: shared(new THREE.BoxGeometry(0.42, 0.42, 0.42)),
      mHead: shared(new THREE.BoxGeometry(0.46, 0.32, 0.42)),
      mAbd: shared(new THREE.BoxGeometry(0.56, 0.42, 0.56)),
      mLeg: shared(new THREE.BoxGeometry(1.1, 0.07, 0.07)),
    };
    SQ.webMat = new THREE.MeshBasicMaterial({ map: SQ.web });
    SQ.globMat = new THREE.MeshBasicMaterial({ map: SQ.poison });
    return SQ.geo;
  }

  // Een klein spinnetje (handlanger)
  function spiderlingModel(ph2) {
    const G = spiderGeos();
    const body = new THREE.MeshLambertMaterial({ map: SQ.miniBody });
    const face = new THREE.MeshLambertMaterial({ map: SQ.miniFace, emissive: 0xffffff, emissiveMap: SQ.miniFaceGlow, emissiveIntensity: ph2 ? 1.8 : 1.1 });
    const leg = new THREE.MeshLambertMaterial({ map: SQ.leg });
    const group = new THREE.Group();
    const head = new THREE.Mesh(G.mHead, [body, body, body, body, face, body]);
    head.position.set(0, 0.3, 0.2);
    const abd = new THREE.Mesh(G.mAbd, body);
    abd.position.set(0, 0.36, -0.28);
    group.add(head, abd);
    const legs = [];
    [[0.3, 0.35], [0.17, 0.12], [0.04, -0.12], [-0.09, -0.35]].forEach(([z, ry]) => {
      const l = new THREE.Mesh(G.mLeg, leg);
      l.position.set(0, 0.27, z);
      l.rotation.y = ry;
      group.add(l);
      legs.push(l);
    });
    return {
      group, mats: [body, face, leg],
      animate(m) {
        for (let i = 0; i < 4; i++) legs[i].rotation.z = Math.sin(m.walk * 1.6 + i * 1.7) * 0.35;
        head.position.y = 0.3 + Math.abs(Math.sin(m.walk * 1.6)) * 0.03;
      },
    };
  }

  function makeSpiderling(world, x, y, z, ph2) {
    const sc = roundScale();
    return new Minion(world, x, y, z, {
      name: 'Spinnetje', hp: Math.round(22 * sc), speed: ph2 ? 4.4 : 4.0, dmg: 6 * sc, hw: 0.38, h: 0.5, life: 25,
      color: [0.4, 0.25, 0.5], model: () => spiderlingModel(ph2),
    });
  }

  /* ---------- Tijdelijke spinnenwebben (van de webschoten) ---------- */
  function addTempWeb(info, x, y, z, t) {
    const w = info.world;
    if (w.get(x, y, z) !== B.AIR) return false;
    // nooit bij het portaal of de schatkist
    const pc = info.portal, tr = info.treasure;
    if (Math.abs(x + 0.5 - pc.x) < 2.5 && Math.abs(z + 0.5 - pc.z) < 1.6) return false;
    if (Math.abs(x - tr.x) <= 1 && Math.abs(z - tr.z) <= 1) return false;
    w.set(x, y, z, COBWEB);
    info.tempWebs.push({ x, y, z, t });
    while (info.tempWebs.length > 16) {
      const o = info.tempWebs.shift();
      if (w.get(o.x, o.y, o.z) === COBWEB) w.set(o.x, o.y, o.z, B.AIR);
    }
    return true;
  }

  function playerInWeb() {
    const p = player, w = game.world;
    for (const dy of [0.1, 1.0]) {
      for (const [ox, oz] of [[-p.hw, -p.hw], [p.hw, -p.hw], [-p.hw, p.hw], [p.hw, p.hw]]) {
        if (w.get(Math.floor(p.pos.x + ox), Math.floor(p.pos.y + dy), Math.floor(p.pos.z + oz)) === COBWEB) return true;
      }
    }
    return false;
  }

  /* ---------- De Spinnenkoningin ---------- */
  const SPREAD = [0.62, 0.22, -0.2, -0.6];
  const CEIL_STATES = { climbWind: 1, climb: 1, stalk: 1, aim: 1, drop: 1 };
  const ZO = 0.5;   // model iets naar voren, zodat het midden van de spin op pos ligt

  class SpiderQueen extends BossBase {
    constructor(world, info) {
      super(world, info, {
        name: 'De Spinnenkoningin', ref: 'de Spinnenkoningin', hp: 700, hw: 1.7, h: 2.6,
        deathTiles: [T.SPIDER_DEEPSLATE, T.SPIDER_SILK, T.SPIDER_EGGSAC],
        yaw: Math.atan2(info.spawn.x - info.bossSpawn.x, info.spawn.z - info.bossSpawn.z),
      });
      this.anim = { raise: 0, tuck: 0.5, crouch: 0.45, rear: 0, abd: 0.3, flip: 0, fang: 0, amp: 0, splay: 0, pulse: 0 };
      this.broodCD = 4; this.ceilCD = 6; this.last = '';
      this.hidden = false; this.pendingBrood = false;
      this.topY = info.floorY + 10; this.threadLen = 0;
      this.told = {};
    }

    buildModel() {
      if (!SQ.body) buildSpiderTextures();
      const G = spiderGeos();
      const body = new THREE.MeshLambertMaterial({ map: SQ.body });
      const abd = new THREE.MeshLambertMaterial({ map: SQ.abd, emissive: 0xffffff, emissiveMap: SQ.abdGlow, emissiveIntensity: 0.9 });
      const leg = new THREE.MeshLambertMaterial({ map: SQ.leg });
      const gold = new THREE.MeshLambertMaterial({ map: SQ.gold, emissive: 0x664400, emissiveIntensity: 0.5 });
      const fang = new THREE.MeshLambertMaterial({ map: SQ.fang });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x551010, fog: false });
      const threadMat = new THREE.MeshBasicMaterial({ color: 0xe6e6f0 });
      const group = new THREE.Group();
      const inner = new THREE.Group();
      group.add(inner);
      const bodyG = new THREE.Group();
      const eyesG = new THREE.Group();
      inner.add(bodyG, eyesG);
      // kopborststuk en kop
      bodyG.add(bossBox(1.7, 0.9, 1.6, body, 1.25, 0, 0.55 + ZO));
      bodyG.add(bossBox(1.15, 0.85, 0.75, body, 1.38, 0, 1.5 + ZO));
      // gifkaken
      const fangs = [];
      for (const sx of [-1, 1]) {
        const f = new THREE.Group();
        f.position.set(sx * 0.24, 1.05, 1.8 + ZO);
        f.add(bossBox(0.18, 0.5, 0.18, fang, -0.25));
        bodyG.add(f);
        fangs.push(f);
      }
      // kroontje
      bodyG.add(bossBox(0.9, 0.2, 0.6, gold, 1.9, 0, 1.45 + ZO));
      for (const [x, hh] of [[-0.33, 0.3], [0, 0.42], [0.33, 0.3]]) bodyG.add(bossBox(0.15, hh, 0.15, gold, 2.0 + hh / 2, x, 1.62 + ZO));
      // achterlijf met de rode zandloper
      const abdG = new THREE.Group();
      abdG.position.set(0, 1.35, -0.25 + ZO);
      const am = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.6).translate(0, 0.25, -1.3), [body, body, abd, body, body, abd]);
      abdG.add(am);
      abdG.add(bossBox(0.5, 0.35, 0.35, leg, 0.05, 0, -2.7));
      bodyG.add(abdG);
      // acht poten
      const legs = [];
      const hipZ = [1.45, 1.05, 0.6, 0.15];
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const hip = new THREE.Group();
          hip.position.set(sx * 0.8, 1.25, hipZ[i] - 0.5 + ZO);
          const up = new THREE.Group();
          hip.add(up);
          up.add(new THREE.Mesh(sx > 0 ? G.upR : G.upL, leg));
          const knee = new THREE.Group();
          knee.position.x = sx * 1.4;
          up.add(knee);
          knee.add(new THREE.Mesh(G.low, leg));
          bodyG.add(hip);
          legs.push({ hip, up, knee, sx, i });
        }
      }
      // een cluster van gloeiende rode ogen
      const fz = 1.88 + ZO;
      for (const [geo, x, y] of [[G.eyeB, 0.2, 1.48], [G.eyeM, 0.43, 1.6], [G.eyeS, 0.11, 1.7], [G.eyeS, 0.37, 1.32]]) {
        for (const sx of [-1, 1]) {
          const e = new THREE.Mesh(geo, eyeMat);
          e.position.set(sx * x, y, fz);
          eyesG.add(e);
        }
      }
      // de draad waarmee ze naar het plafond klimt
      const thread = new THREE.Mesh(G.thread, threadMat);
      thread.visible = false;
      group.add(thread);
      return { group, inner, bodyG, eyesG, abdG, legs, fangs, thread, mats: [body, abd, leg, gold, fang], body, abd, leg, gold, eyeMat };
    }

    onWake() { this.model.eyeMat.color.setHex(0xff2a1a); }

    onEnrage() {
      const m = this.model;
      m.abd.emissiveIntensity = 1.8;
      m.gold.emissiveIntensity = 1.2;
      m.body.userBase = new THREE.Color(1, 0.7, 0.78);
      m.leg.userBase = new THREE.Color(1, 0.7, 0.78);
      m.eyesG.scale.setScalar(1.3);
      const c = this.center();
      for (let i = 0; i < 40; i++) FX.glow.spawn(c.x, c.y, c.z, (Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8, 1, 0.2, 0.25, 0.8, 4, 1.5);
      if (CEIL_STATES[this.state]) this.pendingBrood = true;
      else this.startAttack('brood');
    }

    enragedFx() {
      if (this.hidden) return;
      const a = Math.random() * Math.PI * 2;
      FX.glow.spawn(this.pos.x + Math.cos(a) * 1.4, this.pos.y + 1 + Math.random() * 1.8, this.pos.z + Math.sin(a) * 1.4,
        0, 0.6, 0, 0.9, 0.15, 0.3, 0.7, -0.3, 0.5);
    }

    onGoHome() {
      this.flying = false; this.hidden = false; this.pendingBrood = false;
      this.anim.flip = 0;
      this.model.thread.visible = false;
      this.model.inner.rotation.z = 0;
    }

    // Hoogte van het plafond boven een plek
    ceilingAt(x, z) {
      const fx = Math.floor(x), fz = Math.floor(z);
      for (let y = this.info.floorY + 3; y < this.world.sy; y++) if (this.world.solidAt(fx, y, fz)) return y;
      return this.world.sy;
    }

    // Plek binnen de arena en niet op het portaal
    clampSpot(x, z, rmax) {
      const ac = this.info.arenaCenter;
      let dx = x - ac.x, dz = z - ac.z;
      const d = Math.hypot(dx, dz);
      if (d > rmax) { dx *= rmax / d; dz *= rmax / d; }
      x = ac.x + dx; z = ac.z + dz;
      const pc = this.info.portal;
      const px = x - pc.x, pz = z - pc.z, pd = Math.hypot(px, pz);
      if (pd < 4.8) {
        // van het portaal weg duwen, een beetje naar het midden toe
        const cx = ac.x - pc.x, cz = ac.z - pc.z, cl = Math.hypot(cx, cz) || 1;
        const ux = px / (pd || 1) + cx / cl * 1.5, uz = pz / (pd || 1) + cz / cl * 1.5, ul = Math.hypot(ux, uz) || 1;
        x = pc.x + ux / ul * 4.8; z = pc.z + uz / ul * 4.8;
      }
      return { x, z };
    }

    pickAttack(c) {
      const ph2 = this.enraged, p = c.p;
      const alive = game.minions.reduce((n, m) => n + (m.dead ? 0 : 1), 0);
      const ac = this.info.arenaCenter;
      const pd = Math.hypot(p.pos.x - ac.x, p.pos.z - ac.z);
      const opts = [];
      if (c.dist < 4.8) opts.push(['stomp', 6]);
      opts.push(['web', c.dist > 4.5 ? 3 : 1.2]);
      opts.push(['spit', 2.4]);
      if (this.broodCD <= 0 && alive < (ph2 ? 6 : 4)) opts.push(['brood', 3]);
      if (this.ceilCD <= 0 && p.slow <= 0 && !playerInWeb() && pd < AR + 1 && Math.abs(p.pos.y - this.info.floorY) < 3 &&
        this.ceilingAt(this.pos.x, this.pos.z) - this.info.floorY >= 8) opts.push(['ceil', 3.5]);
      let tot = 0;
      for (const o of opts) { if (o[0] === this.last) o[1] *= 0.3; tot += o[1]; }
      let r = Math.random() * tot, pick = opts[0][0];
      for (const o of opts) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
      this.startAttack(pick);
    }

    startAttack(kind) {
      const ph2 = this.enraged;
      this.last = kind;
      if (kind === 'stomp') {
        this.setState('stompWind');
        this.windT = ph2 ? 0.55 : 0.7;
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        const y = this.info.floorY;
        game.addHazard(new GroundHazard({
          x: this.pos.x + fx * 2.4, y, z: this.pos.z + fz * 2.4, radius: 2.3, warn: this.windT, linger: 0.35, color: 0xff3a3a,
          dmg: this.dmg(13), type: 'boss', knock: 9, up: 6,
          onTrigger: (h) => {
            FX.ring(h.x, h.y, h.z, 2.3, [0.45, 0.4, 0.55]);
            SND.play('slam', { at: h, range: 36 });
            game.shake = Math.max(game.shake, 0.55);
            if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'boss', h.knock, h.up);
          },
        }));
      } else if (kind === 'web') {
        this.setState('webWind');
      } else if (kind === 'spit') {
        this.setState('spitWind');
      } else if (kind === 'brood') {
        this.setState('broodWind');
        this.broodCD = ph2 ? 8 : 11;
        const p = player;
        const sacs = this.info.sacs.filter((s) => this.world.get(s.x, s.y, s.z) === EGGSAC && Math.hypot(s.cx - p.pos.x, s.cz - p.pos.z) > 4);
        sacs.sort((a, b) => Math.hypot(a.cx - p.pos.x, a.cz - p.pos.z) - Math.hypot(b.cx - p.pos.x, b.cz - p.pos.z));
        this.broodSacs = sacs.slice(0, ph2 ? 3 : 2);
        SND.play('roar', { at: this.pos, range: 50, vol: 0.55 });
        if (!this.told.brood) { this.told.brood = true; HUD.actionbar('Spinnetjes! Sla ze snel weg!', 2.5); }
      } else if (kind === 'ceil') {
        this.setState('climbWind');
        this.ceilY = this.ceilingAt(this.pos.x, this.pos.z);
        this.topY = Math.min(this.ceilY - this.h - 0.6, this.info.floorY + 10);
        SND.play('fizz', { at: this.pos, range: 40, vol: 0.8 });
        if (!this.told.ceil) { this.told.ceil = true; HUD.actionbar('Ze klimt naar het plafond... kijk uit voor de schaduw!', 2.8); }
      }
    }

    think(dt, c) {
      const ph2 = this.enraged, p = c.p;
      this.broodCD -= dt; this.ceilCD -= dt;
      let speed = 0;
      switch (this.state) {
        case 'chase':
          this.turnTo(c.targetYaw, dt, ph2 ? 4 : 3);
          if (c.dist > 3.6) speed = ph2 ? 3.3 : 2.5;
          this.attackCD -= dt;
          if (this.pendingBrood) { this.pendingBrood = false; this.startAttack('brood'); break; }
          if (this.attackCD <= 0 && !p.dead) this.pickAttack(c);
          break;
        case 'stompWind':
          if (this.t > this.windT) this.setState('recover', ph2 ? 0.5 : 0.8);
          break;
        case 'webWind':
        case 'webWind2': {
          this.turnTo(c.targetYaw, dt, 3.5);
          const wt = this.state === 'webWind2' ? 0.5 : ph2 ? 0.6 : 0.75;
          if (Math.random() < 0.6) {
            const m = this.mouth();
            FX.glow.spawn(m.x + (Math.random() - 0.5) * 1.2, m.y + (Math.random() - 0.5) * 1.2, m.z + (Math.random() - 0.5) * 1.2, 0, 0, 0, 0.95, 0.95, 1, 0.3, 0, 0);
          }
          if (this.t > wt) {
            this.shootWebs();
            if (ph2 && this.state === 'webWind') this.setState('webWind2');
            else this.setState('recover', 0.7);
          }
          break;
        }
        case 'spitWind':
          this.turnTo(c.targetYaw, dt, 3);
          if (Math.random() < 0.5) {
            const m = this.mouth();
            FX.glow.spawn(m.x + (Math.random() - 0.5) * 0.5, m.y - 0.3, m.z + (Math.random() - 0.5) * 0.5, 0, -1.5, 0, 0.3, 1, 0.25, 0.5, 4, 0);
          }
          if (this.t > (ph2 ? 0.55 : 0.7)) { this.spitPoison(); this.setState('recover', 0.6); }
          break;
        case 'broodWind':
          this.turnTo(c.targetYaw, dt, 2);
          for (const s of this.broodSacs || []) {
            if (Math.random() < 0.5) FX.glow.spawn(s.x + Math.random(), s.y + Math.random() * 2, s.z + Math.random(), (Math.random() - 0.5), 1.2, (Math.random() - 0.5), 0.6, 1, 0.4, 0.5, 0, 0);
          }
          if (this.t > 1.0) { this.spawnBrood(); this.setState('recover', 0.6); }
          break;
        case 'climbWind': {
          // een draad naar het plafond schieten
          const k = clamp(this.t / 0.5, 0, 1);
          this.threadLen = (this.ceilY - this.pos.y - this.h) * k;
          if (this.t > 0.65) {
            this.flying = true; this.vel.set(0, 0, 0);
            this.climbFrom = this.pos.y;
            this.setState('climb');
            SND.play('whoosh', { at: this.pos, range: 40 });
          }
          break;
        }
        case 'climb': {
          const k = clamp(this.t / 0.9, 0, 1);
          this.pos.y = this.climbFrom + (this.topY - this.climbFrom) * easeOut(k);
          this.threadLen = Math.max(0, this.ceilY - this.pos.y - this.h);
          if (k >= 1) { this.hidden = true; this.setState('stalk'); }
          break;
        }
        case 'stalk': {
          // over het plafond naar de speler toe kruipen: alleen de ogen zijn te zien
          const tgt = this.clampSpot(p.pos.x, p.pos.z, AR - 2.6);
          const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z, d = Math.hypot(dx, dz);
          const sp = (ph2 ? 8.5 : 7) * dt;
          if (d > 0.05) { this.pos.x += dx / d * Math.min(sp, d); this.pos.z += dz / d * Math.min(sp, d); }
          this.turnTo(c.targetYaw, dt, 4);
          const want = Math.min(this.info.floorY + 10, this.ceilingAt(this.pos.x, this.pos.z) - this.h - 0.4);
          this.pos.y += (want - this.pos.y) * Math.min(1, dt * 4);
          if (Math.random() < dt * 3) SND.play('step', { kind: 'stone', vol: 0.8 });
          if (this.t > (ph2 ? 1.0 : 1.4)) {
            const s = this.clampSpot(this.pos.x, this.pos.z, AR - 2.6);
            this.pos.x = s.x; this.pos.z = s.z;
            this.dropSpot = s;
            this.dropWarn = ph2 ? 1.0 : 1.2;
            this.dropR = ph2 ? 2.6 : 2.8;
            this.topY = this.pos.y;
            this.ceilY = this.ceilingAt(s.x, s.z);
            game.addHazard(new GroundHazard({ x: s.x, y: this.info.floorY, z: s.z, radius: this.dropR, warn: this.dropWarn, linger: 0.4, color: 0xb030ff, onTrigger: () => {} }));
            SND.play('fizz', { vol: 0.7 });
            this.setState('aim');
          }
          break;
        }
        case 'aim':
          if (this.t > this.dropWarn - 0.3) { this.hidden = false; this.setState('drop'); }
          break;
        case 'drop': {
          const k = clamp(this.t / 0.3, 0, 1);
          this.pos.y = this.topY + (this.info.floorY - this.topY) * k * k;
          this.threadLen = Math.max(0, this.ceilY - this.pos.y - this.h);
          if (k >= 1) this.land();
          break;
        }
        case 'landed':
          if (Math.random() < 0.3) FX.glow.spawn(this.pos.x + Math.cos(this.t * 8) * 1, this.pos.y + 2.9, this.pos.z + Math.sin(this.t * 8) * 1, 0, 0.2, 0, 1, 1, 0.6, 0.4, 0, 0);
          if (this.t > (ph2 ? 1.1 : 1.5)) { this.setState('chase'); this.attackCD = ph2 ? 0.7 : 1.1; }
          break;
        case 'recover':
          if (this.t > this.recoverTime) {
            this.setState('chase');
            this.attackCD = ph2 ? 0.9 + Math.random() * 0.6 : 1.6 + Math.random() * 1.0;
          }
          break;
        default:
          this.setState('chase');
          break;
      }
      return speed;
    }

    // Neerploffen uit het plafond: schokgolf, en ze is even duizelig
    land() {
      const s = this.dropSpot, y = this.info.floorY;
      this.pos.set(s.x, y, s.z);
      this.flying = false; this.hidden = false; this.vel.set(0, 0, 0);
      this.threadLen = 0;
      // blokken waar ze bovenop landt gaan kapot (alleen in de arena)
      const ac = this.info.arenaCenter, ar = this.info.arenaRadius;
      for (let yy = Math.floor(y); yy <= Math.floor(y + this.h); yy++) {
        for (let zz = Math.floor(s.z - this.hw); zz <= Math.floor(s.z + this.hw); zz++) {
          for (let xx = Math.floor(s.x - this.hw); xx <= Math.floor(s.x + this.hw); xx++) {
            const id = this.world.get(xx, yy, zz);
            if (!SOLID[id] || BLOCKS[id].hard === Infinity || Math.hypot(xx + 0.5 - ac.x, zz + 0.5 - ac.z) > ar - 0.8) continue;
            this.world.set(xx, yy, zz, B.AIR);
            FX.blockBreak(xx, yy, zz, id);
          }
        }
      }
      this.shockwave(s.x, y, s.z, this.dropR + 0.3, 14, [0.5, 0.42, 0.62]);
      game.shake = Math.max(game.shake, 0.9);
      this.ceilCD = this.enraged ? 6 : 8.5;
      this.setState('landed');
    }

    mouth() {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      return new THREE.Vector3(this.pos.x + fx * 2.5, this.pos.y + 1.3, this.pos.z + fz * 2.5);
    }

    // Webschoten: drie webballen in een waaier
    shootWebs() {
      const G = spiderGeos();
      const p = player, info = this.info;
      const origin = this.mouth();
      const ph2 = this.enraged;
      const speed = ph2 ? 14 : 12.5, grav = 4;
      const tgt = new THREE.Vector3(p.pos.x, p.pos.y + 0.9, p.pos.z);
      const dist = origin.distanceTo(tgt);
      const T = dist / speed;
      const base = tgt.sub(origin).normalize();
      for (let i = -1; i <= 1; i++) {
        const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.32).multiplyScalar(speed);
        dir.y += 0.5 * grav * T;
        game.addProjectile(new Projectile({
          pos: origin, vel: dir, owner: 'boss', type: 'spiderWeb', dmg: this.dmg(11), radius: 0.32, knock: 0, gravity: grav,
          destroyable: true, life: 3, mesh: new THREE.Mesh(G.web, SQ.webMat),
          trail: (pr) => { if (Math.random() < 0.4) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, 0, 0, 0.9, 0.9, 0.95, 0.35, 0, 0); },
          onHitPlayer: (pr) => {
            pr.hitP = true;
            const q = player;
            if (addTempWeb(info, Math.floor(q.pos.x), Math.floor(q.pos.y + 0.1), Math.floor(q.pos.z), 1.8)) {
              HUD.actionbar('Je zit vast in een web! Sla het kapot of wacht even.', 1.8);
            }
          },
          explodeFx: (pr) => {
            for (let k = 0; k < 10; k++) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 0.92, 0.92, 0.96, 0.6, 10, 0.5, true);
            if (pr.hitP || !game.world.solidAt(Math.floor(pr.pos.x), Math.floor(pr.pos.y), Math.floor(pr.pos.z))) return;
            // web op de plek waar hij landt (op de grond)
            const v = pr.vel.clone().normalize();
            for (const back of [0.5, 1.0, 1.5]) {
              const x = Math.floor(pr.pos.x - v.x * back), z = Math.floor(pr.pos.z - v.z * back);
              let y = Math.floor(pr.pos.y - v.y * back);
              if (game.world.get(x, y, z) !== B.AIR) continue;
              for (let k = 0; k < 4 && game.world.get(x, y - 1, z) === B.AIR; k++) y--;
              addTempWeb(info, x, y, z, 6);
              break;
            }
          },
        }));
      }
      SND.play('shoot', { at: origin, range: 40, vol: 0.7 });
      SND.play('whoosh', { at: origin, range: 30, vol: 0.5 });
    }

    // Gifspuug: groene klodders die blijvende gifplassen maken
    spitPoison() {
      const G = spiderGeos();
      const p = player, ph2 = this.enraged;
      const origin = this.mouth();
      const y = this.info.floorY;
      const n = ph2 ? 5 : 3;
      const tickDmg = this.dmg(4);
      for (let i = 0; i < n; i++) {
        let tx = p.pos.x + p.vel.x * 0.35, tz = p.pos.z + p.vel.z * 0.35;
        if (i > 0) {
          const a = Math.random() * Math.PI * 2, r = 2.4 + Math.random() * 2.2;
          tx = p.pos.x + Math.cos(a) * r; tz = p.pos.z + Math.sin(a) * r;
        }
        const s = this.clampSpot(tx, tz, AR - 1);
        const T = 0.85 + Math.hypot(s.x - origin.x, s.z - origin.z) * 0.02 + i * 0.08;
        const g = 16;
        game.addProjectile(new Projectile({
          pos: origin, vel: new THREE.Vector3((s.x - origin.x) / T, (y + 0.1 - origin.y) / T + 0.5 * g * T, (s.z - origin.z) / T),
          owner: 'boss', type: 'spiderPoison', dmg: 0, gravity: g, radius: 0.25, life: T - 0.01, mesh: new THREE.Mesh(G.glob, SQ.globMat),
          trail: (pr) => { if (Math.random() < 0.5) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, -0.5, 0, 0.3, 1, 0.3, 0.35, 0, 0); },
          explodeFx: () => {},
        }));
        game.addHazard(new GroundHazard({
          x: s.x, y, z: s.z, radius: 1.5, warn: T, linger: ph2 ? 4 : 3.5, color: 0x3cff3c,
          dmg: this.dmg(12), type: 'spiderPoison', knock: 3, up: 4,
          onTrigger: (h) => {
            for (let k = 0; k < 16; k++) FX.glow.spawn(h.x, h.y + 0.3, h.z, (Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5, 0.35, 1, 0.3, 0.6, 8, 1);
            SND.play('splash', { at: h, range: 30, vol: 0.6 });
            h.tick = 0.6;
            if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'spiderPoison', h.knock, h.up);
          },
          onLinger: (h, dt) => {
            h.tick -= dt;
            if (Math.random() < dt * 6) FX.glow.spawn(h.x + (Math.random() - 0.5) * 2.4, h.y + 0.1, h.z + (Math.random() - 0.5) * 2.4, 0, 0.8, 0, 0.3, 0.95, 0.3, 0.6, -0.2, 0);
            if (h.tick <= 0) {
              h.tick = 0.6;
              if (h.playerInside()) { damagePlayer(tickDmg, null, 'spiderPoison', 0, 0); SND.play('fizz', { vol: 0.5 }); }
            }
          },
        }));
      }
      SND.play('shoot', { at: origin, range: 40, vol: 0.6 });
    }

    // Spinnetjes uit de eierzakken (of uit haar achterlijf als de zakken kapot zijn)
    spawnBrood() {
      const ph2 = this.enraged;
      const alive = game.minions.reduce((k, m) => k + (m.dead ? 0 : 1), 0);
      const n = Math.min(ph2 ? 5 : 3, (ph2 ? 8 : 5) - alive);
      const sacs = (this.broodSacs || []).filter((s) => this.world.get(s.x, s.y, s.z) === EGGSAC);
      for (let i = 0; i < n; i++) {
        let x, y, z;
        if (sacs.length) {
          const s = sacs[i % sacs.length];
          x = s.cx + (Math.random() - 0.5) * 0.8; y = s.y; z = s.cz + (Math.random() - 0.5) * 0.8;
        } else {
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          x = this.pos.x - fx * 2.6 + (Math.random() - 0.5); y = this.pos.y; z = this.pos.z - fz * 2.6 + (Math.random() - 0.5);
        }
        const f = freeSpot(this.world, x, y, z);
        game.addMinion(makeSpiderling(this.world, f.x, f.y, f.z, ph2));
        for (let k = 0; k < 10; k++) FX.glow.spawn(f.x, f.y + 0.4, f.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 0.85, 0.85, 0.7, 0.5, 6, 1);
      }
      if (n > 0) SND.play('pop', { at: this.pos, range: 50, vol: 0.8 });
    }

    die() {
      this.hidden = false; this.flying = false;
      if (this.pos.y > this.info.floorY + 0.2) this.pos.y = this.info.floorY;
      this.anim.flip = 0;
      const m = this.model;
      m.inner.rotation.z = 0; m.bodyG.visible = true; m.thread.visible = false;
      this.mesh.position.copy(this.pos);
      super.die();
      // tijdelijke webben verdwijnen (in ambience)
    }

    animate(dt, speed) {
      const a = this.anim, m = this.model, ph2 = this.enraged;
      this.walkPhase += dt * (speed * 2.4);
      let raise = 0, tuck = 0, crouch = 0, rear = 0, abd = 0.3, flip = 0, fang = 0, splay = 0, pulse = 0, rate = 10;
      const amp = Math.min(1, speed / 1.5);
      switch (this.state) {
        case 'sleep': case 'idle':
          tuck = 0.5; crouch = 0.45; abd = 0.15; rate = 4;
          break;
        case 'roar':
          raise = 1.1; rear = 0.35; fang = -0.5; abd = 0.6; rate = 7;
          break;
        case 'stompWind': {
          const k = clamp(this.t / (this.windT || 0.7), 0, 1);
          raise = 1.3 * easeOut(k); rear = 0.3 * k; fang = -0.4; rate = 14;
          break;
        }
        case 'webWind': case 'webWind2':
          rear = 0.28; abd = 0.75; raise = 0.35; fang = -0.3; rate = 10;
          break;
        case 'spitWind':
          rear = -0.12; crouch = 0.15; fang = -0.6 + Math.sin(this.t * 30) * 0.15; rate = 10;
          break;
        case 'broodWind':
          abd = 0.9; rear = 0.15; raise = 0.5; pulse = 1; splay = 0.15; rate = 9;
          break;
        case 'climbWind':
          crouch = 0.35; abd = 0.55; splay = 0.2; rate = 9;
          break;
        case 'climb': case 'stalk': case 'aim':
          flip = 1; tuck = 0.2; rate = 8;
          break;
        case 'drop':
          flip = 0; raise = 0.6; splay = 0.35; rate = 30;
          break;
        case 'landed':
          crouch = 0.4; splay = 0.4; abd = 0.1; rate = 12;
          break;
        case 'recover':
          abd = 0.35; rate = 8;
          break;
        default: break;
      }
      const k = 1 - Math.exp(-dt * rate);
      a.raise += (raise - a.raise) * k;
      a.tuck += (tuck - a.tuck) * k;
      a.crouch += (crouch - a.crouch) * k;
      a.rear += (rear - a.rear) * k;
      a.abd += (abd - a.abd) * k;
      a.flip += (flip - a.flip) * Math.min(1, k * 1.2);
      a.fang += (fang - a.fang) * k;
      a.splay += (splay - a.splay) * k;
      a.pulse += (pulse - a.pulse) * k;
      a.amp += (amp - a.amp) * Math.min(1, dt * 8);
      // poten
      for (const L of m.legs) {
        const { sx, i } = L;
        const ph = this.walkPhase + (((i + (sx > 0 ? 0 : 1)) & 1) ? Math.PI : 0);
        const swing = Math.sin(ph) * 0.3 * a.amp;
        const lift = Math.max(0, Math.cos(ph)) * 0.35 * a.amp;
        const front = i === 0 ? 1 : i === 1 ? 0.55 : 0;
        const twitch = this.state === 'landed' ? Math.sin(game.time * 22 + i * 2) * 0.12 : 0;
        const up = 0.6 + lift + a.raise * front + a.tuck - a.splay * 0.4 + twitch;
        const kb = 0.385 - a.raise * front * 0.9 - a.tuck * 0.6 + a.splay;
        L.hip.rotation.y = -sx * (SPREAD[i] + swing);
        L.up.rotation.z = sx * up;
        L.knee.rotation.z = sx * (kb - up);
      }
      const bob = Math.abs(Math.sin(this.walkPhase * 2)) * 0.06 * a.amp + (this.state === 'sleep' ? Math.sin(game.time * 1.3) * 0.03 : 0);
      m.inner.rotation.x = -a.rear;
      m.inner.rotation.z = Math.PI * a.flip;
      m.inner.position.set(0, -a.crouch * (1 - a.flip) + bob + this.h * a.flip, 0);
      m.abdG.rotation.x = a.abd;
      const ps = 1 + a.pulse * (0.06 + Math.sin(game.time * 18) * 0.06);
      m.abdG.scale.set(ps, ps, ps);
      m.fangs[0].rotation.z = a.fang * 0.6; m.fangs[1].rotation.z = -a.fang * 0.6;
      m.fangs[0].rotation.x = m.fangs[1].rotation.x = a.fang * 0.4;
      m.bodyG.visible = !this.hidden;
      // ogen: dof als ze slaapt, fel (en knipperend in fase 2) als ze wakker is
      if (this.state === 'sleep' || this.state === 'idle') m.eyeMat.color.setHex(0x551010);
      else if (this.hidden) m.eyeMat.color.setRGB(1, 0.15 + Math.sin(game.time * 9) * 0.1, 0.1);
      else if (ph2) m.eyeMat.color.setRGB(1, 0.25 + Math.sin(game.time * 12) * 0.15, 0.15);
      else m.eyeMat.color.setHex(0xff2a1a);
      if (ph2) m.abd.emissiveIntensity = 1.5 + Math.sin(game.time * 6) * 0.5;
      // draad naar het plafond
      m.thread.visible = this.threadLen > 0.2 && this.state !== 'stalk' && this.state !== 'aim';
      if (m.thread.visible) { m.thread.position.y = this.h; m.thread.scale.y = this.threadLen; }
    }
  }

  registerRealm('spider', {
    gen: genSpider,
    makeBoss: (world, info) => {
      if (typeof DEATH_REASONS !== 'undefined') {
        DEATH_REASONS.spiderWeb = 'Ingesponnen door de Spinnenkoningin';
        DEATH_REASONS.spiderPoison = 'Vergiftigd door spinnengif';
      }
      return new SpiderQueen(world, info);
    },
    atmosphere: { background: 0x050308, fog: 0x0b0612, near: 6, far: 36, amb: 0xa898c8, ambI: 0.8, dir: 0xc0a0ff, dirI: 0.45, hand: 0xc4b8dc },
    intro: 'Sssst... hoor je dat geritsel? Dit is het rijk van de Spinnenkoningin. Pas op voor haar webben!',
    tip: 'Tip: sla de spinnetjes snel weg, en ren weg uit de paarse schaduw als ze van het plafond valt!',
    treasureTip: 'Zie je de gloeiende eieren in de grotmuur? Sla het witte spinsel kapot: daarachter ligt het nest met de schat!',
    ruin: [DEEP, DEEP, SILK, COBWEB],
    ambientSound: 0.3,
    ambience(dt, info) {
      const w = info.world, webs = info.tempWebs, p = player;
      const bossDead = !game.boss || !game.boss.alive();
      // tijdelijke webben weer weghalen
      for (let i = webs.length - 1; i >= 0; i--) {
        const wb = webs[i];
        wb.t -= dt * (bossDead ? 4 : 1);
        if (wb.t > 0) continue;
        if (w.get(wb.x, wb.y, wb.z) === COBWEB) {
          w.set(wb.x, wb.y, wb.z, B.AIR);
          for (let k = 0; k < 6; k++) FX.glow.spawn(wb.x + Math.random(), wb.y + Math.random(), wb.z + Math.random(), 0, 0.4, 0, 0.8, 0.8, 0.85, 0.6, -0.2, 0);
        }
        webs.splice(i, 1);
      }
      // zwevende sporen en stofjes
      info.moteT = (info.moteT || 0) + dt * 9;
      while (info.moteT > 1) {
        info.moteT -= 1;
        const teal = Math.random() < 0.5;
        FX.glow.spawn(p.pos.x + (Math.random() - 0.5) * 24, p.pos.y + Math.random() * 7, p.pos.z + (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 0.3, 0.15, (Math.random() - 0.5) * 0.3, teal ? 0.25 : 0.55, teal ? 0.6 : 0.3, teal ? 0.65 : 0.7, 3, -0.02, 0.2);
      }
      // druppels van het plafond
      if (Math.random() < dt * 1.5) {
        const x = p.pos.x + (Math.random() - 0.5) * 20, z = p.pos.z + (Math.random() - 0.5) * 20;
        FX.debris.spawn(x, info.floorY + 9 + Math.random() * 4, z, 0, -2, 0, 0.45, 0.5, 0.7, 2, 16, 0, true);
      }
      // eierzakken bewegen soms
      if (info.sacs.length && Math.random() < dt * 1.2) {
        const s = info.sacs[Math.floor(Math.random() * info.sacs.length)];
        if (w.get(s.x, s.y, s.z) === EGGSAC) FX.glow.spawn(s.x + Math.random(), s.y + 1 + Math.random(), s.z + Math.random(), 0, 0.5, 0, 0.6, 0.95, 0.4, 0.8, 0, 0);
      }
      // de gloeiende eieren bij het nest twinkelen als je de schat zoekt
      if (PROG.phase === 'treasure' && Math.random() < dt * 6) {
        const h = info.nestHint;
        FX.glow.spawn(h.x + (Math.random() - 0.5) * 5, info.floorY + Math.random() * 4, h.z + (Math.random() - 0.5) * 5, 0, 0.6, 0, 0.75, 1, 0.4, 1, 0, 0);
      }
    },
  });

  window.SPIDER = { gen: genSpider, Queen: SpiderQueen, COBWEB, SILK, EGGSAC, GLOWEGG };
})();
