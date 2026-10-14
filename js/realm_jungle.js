'use strict';
/* Portaaljacht – wereld 6: het Oerwoud met De Oerwoudreus (rotsblokken, borstroffel-brul, lianen, sprong met kokosnoten, aapjes) */
(() => {

/* ---------- Eigen tegels en blokken ---------- */
defineTile('JUNGLE_LOG', (h) => {
  const col = [];
  for (let x = 0; x < 16; x++) col[x] = h.R();
  return (x, y) => {
    if (h.R() < 0.07 && (y > 9 || x % 5 === 1)) return h.vary([74, 116, 40], 8);       // mos
    const s = col[x];
    let c = s < 0.3 ? [70, 50, 28] : s < 0.7 ? [96, 68, 38] : [84, 60, 34];
    if ((y * 3 + x * 7) % 13 === 0) c = [56, 40, 22];
    return h.vary(c, 6);
  };
});
defineTile('JUNGLE_LOG_TOP', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([84, 60, 34], 5);
  const d = Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)));
  return h.vary(d % 2 ? [176, 128, 84] : [152, 108, 68], 5);
});
defineTile('JUNGLE_LEAVES', (h) => () => {
  const r = h.R();
  if (r < 0.14) return h.vary([22, 66, 18], 5);
  if (r > 0.94) return h.vary([96, 176, 60], 8);
  return h.vary(r < 0.55 ? [42, 112, 30] : [56, 136, 38], 8);
});
defineTile('JUNGLE_MOSS', (h) => () => {
  const r = h.R();
  if (r < 0.06) return h.vary([110, 160, 62], 6);
  return h.vary(r < 0.35 ? [52, 98, 30] : r < 0.7 ? [66, 116, 38] : [78, 130, 44], 7);
});
defineTile('JUNGLE_VINE', (h) => (x, y) => {
  for (const s of [2, 7, 12]) {
    const sx = s + ((y + s) % 6 < 3 ? 0 : 1);
    if (x === sx && (y + s) % 11 !== 10) return h.vary([40, 108, 28], 8);
    if (Math.abs(x - sx) === 1 && (y * 5 + s) % 4 === 0) return h.vary([64, 146, 42], 8);
  }
  return null;
});
defineTile('JUNGLE_MOSSY_COBBLE', (h) => {
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push([h.R() * 16, h.R() * 16, 96 + h.R() * 48]);
  return (x, y) => {
    const v = h.voronoi(pts, x, y, 16);
    if (v.edge < 1.0) return h.R() < 0.5 ? h.vary([58, 84, 36], 6) : h.vary([60, 60, 60], 5);
    if (h.R() < 0.3 + (y < 5 ? 0.25 : 0)) return h.vary([78, 120, 48], 10);
    const b = pts[v.i][2];
    return h.vary([b, b, b], 8);
  };
});
defineTile('JUNGLE_CHISELED', (h) => (x, y) => {
  // tempelsteen met een gloeiend oog
  const dx = x - 7.5, dy = y - 7.5;
  const r = Math.sqrt(dx * dx * 0.6 + dy * dy * 1.4);
  if (r < 1.6) return [20, 40, 16];
  if (r < 3.4) return h.vary([150, 255, 90], 10);
  if (r < 4.4) return h.vary([46, 70, 40], 5);
  if (x === 0 || y === 0 || x === 15 || y === 15 || x === 1 || y === 14) return h.vary([70, 76, 64], 5);
  return h.R() < 0.25 ? h.vary([80, 120, 50], 8) : h.vary([112, 116, 104], 6);
});
defineTile('JUNGLE_GLOWFLOWER', (h) => (x, y) => {
  if (x === 7 && y > 7) return [40, 120, 40];
  if ((x === 6 || x === 9) && y === 12) return [50, 140, 50];
  const dx = x - 7.5, dy = y - 4.5;
  const d = Math.abs(dx) + Math.abs(dy);
  if (d < 1.5) return [255, 255, 200];
  if (d < 3.6) return h.vary([120, 255, 230], 12);
  if (d < 4.6 && (x + y) % 2 === 0) return [80, 220, 255];
  return null;
});
defineTile('JUNGLE_FERN', (h) => (x, y) => {
  const cx = 7.5;
  for (const k of [-1, 1]) {
    // twee gebogen bladeren
    const fy = 15 - Math.abs(x - cx) * 0.9 - (k * (x - cx) > 0 ? 3 : 0);
    if (k * (x - cx) >= 0 && Math.abs(y - fy) < 1.2 && y > 2) return h.vary(y % 2 ? [52, 130, 40] : [70, 150, 50], 8);
  }
  if (Math.abs(x - cx) < 1 && y > 4) return h.vary([46, 116, 34], 6);
  return null;
});
defineTile('JUNGLE_PLANKS', (h) => (x, y) => {
  if (y % 4 === 3) return h.vary([96, 62, 40], 4);
  if ((x + (y >> 2) * 5) % 8 === 0) return h.vary([110, 72, 46], 4);
  return h.vary([168, 116, 78], 7);
});
defineTile('JUNGLE_BARK', (h) => {
  const col = [];
  for (let x = 0; x < 16; x++) col[x] = h.R();
  return (x, y) => {
    // gebarsten schors met groen licht erachter
    const crack = Math.abs(x - 8 + Math.round(Math.sin(y * 0.9) * 2)) < 1 && y > 1 && y < 15;
    const branch = (y === 5 && x > 8 && x < 13) || (y === 10 && x > 3 && x < 8);
    if (crack || branch) return h.vary([170, 255, 110], 10);
    if (Math.abs(x - 8 + Math.round(Math.sin(y * 0.9) * 2)) < 2) return [30, 22, 12];
    const s = col[x];
    return h.vary(s < 0.3 ? [64, 46, 26] : s < 0.7 ? [90, 64, 36] : [80, 58, 32], 6);
  };
});
defineTile('JUNGLE_THICKET', (h) => (x, y) => {
  // dichte doornige lianen
  const a = (x * 3 + y * 5) % 7, b = (x * 5 + 16 - y * 3) % 9;
  if ((a === 0 || b === 0) && h.R() < 0.6) return h.vary([90, 60, 36], 8);
  if ((x + y * 3) % 11 === 0) return [220, 220, 170];                                  // doorn
  if ((x * 7 + y) % 23 === 0) return [230, 70, 120];                                  // bloempje
  return h.R() < 0.2 ? h.vary([22, 60, 16], 5) : h.vary(h.R() < 0.5 ? [40, 100, 28] : [54, 124, 36], 8);
});

const all = (t) => ({ top: t, bottom: t, side: t });
const cross = { render: R_CROSS, solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' };
const J = {
  LOG: defineBlock('JUNGLE_LOG', { name: 'Oerwoudhout', tiles: { top: T.JUNGLE_LOG_TOP, bottom: T.JUNGLE_LOG_TOP, side: T.JUNGLE_LOG }, hard: 0.9, sound: 'wood' }),
  // snelle bladeren (dicht), zodat het grote bladerdak licht blijft voor telefoons
  LEAVES: defineBlock('JUNGLE_LEAVES', { name: 'Oerwoudbladeren', tiles: all(T.JUNGLE_LEAVES), hard: 0.2, sound: 'grass' }),
  MOSS: defineBlock('JUNGLE_MOSS', { name: 'Mosblok', tiles: all(T.JUNGLE_MOSS), hard: 0.4, sound: 'grass' }),
  VINE: defineBlock('JUNGLE_VINE', Object.assign({ name: 'Lianen', tiles: all(T.JUNGLE_VINE) }, cross)),
  COBBLE: defineBlock('JUNGLE_MOSSY_COBBLE', { name: 'Bemoste keien', tiles: all(T.JUNGLE_MOSSY_COBBLE), hard: 1.2 }),
  CHISELED: defineBlock('JUNGLE_CHISELED', { name: 'Tempeloog', tiles: all(T.JUNGLE_CHISELED), hard: 1.4, glow: true }),
  GLOWFLOWER: defineBlock('JUNGLE_GLOWFLOWER', Object.assign({ name: 'Gloeibloem', tiles: all(T.JUNGLE_GLOWFLOWER), glow: true }, cross)),
  FERN: defineBlock('JUNGLE_FERN', Object.assign({ name: 'Varen', tiles: all(T.JUNGLE_FERN) }, cross)),
  PLANKS: defineBlock('JUNGLE_PLANKS', { name: 'Oerwoudplanken', tiles: all(T.JUNGLE_PLANKS), hard: 0.8, sound: 'wood' }),
  BARK: defineBlock('JUNGLE_BARK', { name: 'Gebarsten schors', tiles: { top: T.JUNGLE_LOG_TOP, bottom: T.JUNGLE_LOG_TOP, side: T.JUNGLE_BARK }, hard: 0.6, sound: 'wood', glow: true }),
  THICKET: defineBlock('JUNGLE_THICKET', { name: 'Doornige lianen', tiles: all(T.JUNGLE_THICKET), hard: 2.5, sound: 'grass' }),
};

/* ---------- De wereld ---------- */
function genJungle(seed) {
  const S = 80, H = 44, C = 40, F = 12, AR = 16;
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand), n3 = new Noise2D(rand);

  // De holle boom met de schat ligt over de rivier, oost of west; de tempel ligt achter de reus (noord)
  const side = rand() < 0.5 ? 1 : -1;
  const gAng = (side > 0 ? 0 : Math.PI) + (rand() - 0.5) * 0.6;
  const gdx = Math.cos(gAng), gdz = Math.sin(gAng);
  const treeAcr = (rand() - 0.5) * 4;
  const rivPh = rand() * 6;
  const along = (x, z) => (x + 0.5 - C) * gdx + (z + 0.5 - C) * gdz;
  const across = (x, z) => -(x + 0.5 - C) * gdz + (z + 0.5 - C) * gdx;
  const pathMid = (a) => treeAcr * clamp((a - 15) / 13, 0, 1);
  const riverD = (a, c) => Math.abs(a - (24 + Math.sin(c / 6 + rivPh) * 1.4)) - (2.3 + Math.sin(c / 9) * 0.4);

  // schatboom: 4x4 stam, hol van binnen
  let tx = Math.round(C + gdx * 31.5 - gdz * treeAcr - 1), tz = Math.round(C + gdz * 31.5 + gdx * treeAcr - 1);
  tx = clamp(tx, 5, S - 8); tz = clamp(tz, 5, S - 8);
  const tcx = tx + 1, tcz = tz + 1;

  // tempel achter de reus
  const TX0 = C - 7, TX1 = C + 7, TZ0 = C - 28, TZ1 = C - 17;
  const inTemple = (x, z) => x >= TX0 && x <= TX1 && z >= TZ0 && z <= TZ1;

  const arena = new Uint8Array(S * S);
  const heights = new Int16Array(S * S);
  const kind = new Uint8Array(S * S);   // 0 grond, 1 rivier, 2 pad, 3 oever
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const i = z * S + x;
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.hypot(dx, dz);
      if (d <= AR + n1.noise(x / 5, z / 5) * 0.9 && !inTemple(x, z)) arena[i] = 1;
      const a = along(x, z), c = across(x, z);
      const rd = riverD(a, c);
      const onPath = a > 12 && a < 31 && Math.abs(c - pathMid(a)) < 1.6;
      let h = F + Math.round(n2.fbm(x / 12, z / 12, 3) * 3.2);
      if (d < AR + 4 || Math.hypot(x + 0.5 - tcx, z + 0.5 - tcz) < 6.5 || rd < 2.5 || onPath) h = F;
      h = clamp(h, F - 1, F + 2);
      if (arena[i]) h = F;
      heights[i] = h;
      if (rd < 0 && !arena[i]) kind[i] = 1;
      else if (onPath) kind[i] = 2;
      else if (rd < 1.3) kind[i] = 3;
    }
  }

  // grond, rivier en paden
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const i = z * S + x;
      const h = heights[i];
      for (let y = 0; y <= h; y++) w.setRaw(x, y, z, y === 0 ? B.BEDROCK : y < h - 3 ? B.STONE : B.DIRT);
      let top = B.GRASS;
      const m = n3.noise(x / 4, z / 4);
      if (m > 0.32) top = J.MOSS;
      if (kind[i] === 3) top = rand() < 0.6 ? B.SAND : B.GRAVEL;
      if (kind[i] === 2) top = rand() < 0.55 ? B.GRAVEL : rand() < 0.5 ? J.COBBLE : J.MOSS;
      w.setRaw(x, h, z, top);
      if (kind[i] === 1) {
        const rd = riverD(along(x, z), across(x, z));
        const depth = rd < -1.2 ? 3 : 2;
        w.setRaw(x, F - depth, z, rand() < 0.5 ? B.SAND : B.GRAVEL);
        for (let y = F - depth + 1; y <= F; y++) w.setRaw(x, y, z, B.WATER);
        for (let y = F + 1; y <= h; y++) w.setRaw(x, y, z, B.AIR);
      }
    }
  }

  // arenavloer: oude stenen kring in het midden en een pad naar het portaal
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      if (!arena[z * S + x]) continue;
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.hypot(dx, dz);
      if (d > 3.4 && d < 4.7) w.setRaw(x, F, z, rand() < 0.7 ? J.COBBLE : B.MOSSY_STONE_BRICKS);
      else if (d < 1.2) w.setRaw(x, F, z, J.CHISELED);
      else if (Math.abs(dx) < 1.1 && dz > 5 && dz < 13) w.setRaw(x, F, z, rand() < 0.6 ? J.COBBLE : B.GRAVEL);
      else if (rand() < 0.05) w.setRaw(x, F + 1, z, rand() < 0.7 ? B.TALLGRASS : J.FERN);
      else if (rand() < 0.012) w.setRaw(x, F + 1, z, rand() < 0.5 ? B.FLOWER_R : B.FLOWER_Y);
    }
  }

  // De oude tempel (trappiramide), half ingestort en overwoekerd
  const tblock = () => { const r = rand(); return r < 0.6 ? J.COBBLE : r < 0.85 ? B.MOSSY_STONE_BRICKS : B.STONE_BRICKS; };
  const levels = [[0, F + 1, F + 3], [2, F + 4, F + 6], [4, F + 7, F + 9]];
  for (const [ins, y0, y1] of levels) {
    for (let z = TZ0 + ins; z <= TZ1 - ins; z++) {
      for (let x = TX0 + ins; x <= TX1 - ins; x++) {
        for (let y = y0; y <= y1; y++) {
          const shell = x === TX0 + ins || x === TX1 - ins || z === TZ0 + ins || z === TZ1 - ins || y === y1;
          if (shell && rand() < 0.08 && y === y1) continue;   // ingestorte stukjes
          w.setRaw(x, y, z, tblock());
        }
      }
    }
  }
  for (let z = TZ0; z <= TZ1; z++) for (let x = TX0; x <= TX1; x++) w.setRaw(x, F, z, J.COBBLE);
  // kleine tempel bovenop
  const sy = F + 10;
  for (const [x, z] of [[C - 3, TZ1 - 7], [C + 3, TZ1 - 7], [C - 3, TZ1 - 4], [C + 3, TZ1 - 4]]) {
    w.setRaw(x, sy, z, B.MOSSY_STONE_BRICKS); w.setRaw(x, sy + 1, z, B.MOSSY_STONE_BRICKS);
  }
  for (let z = TZ1 - 7; z <= TZ1 - 4; z++) for (let x = C - 3; x <= C + 3; x++) if (rand() < 0.85) w.setRaw(x, sy + 2, z, J.COBBLE);
  // ingang met gloeiende ogen erboven
  for (let y = F + 1; y <= F + 3; y++) for (let x = C - 1; x <= C + 1; x++) for (let z = TZ1 - 2; z <= TZ1; z++) w.setRaw(x, y, z, B.AIR);
  w.setRaw(C, F + 1, TZ1 - 2, J.GLOWFLOWER);
  w.setRaw(C - 2, F + 8, TZ1 - 4, J.CHISELED); w.setRaw(C + 2, F + 8, TZ1 - 4, J.CHISELED);
  w.setRaw(C - 3, F + 2, TZ1, J.CHISELED); w.setRaw(C + 3, F + 2, TZ1, J.CHISELED);
  // mos en lianen over de tempel
  for (let z = TZ0; z <= TZ1; z++) {
    for (let x = TX0; x <= TX1; x++) {
      let y = F + 13;
      while (y > F && w.get(x, y, z) === B.AIR) y--;
      if (y <= F) continue;
      if (rand() < 0.3) w.setRaw(x, y + 1, z, J.LEAVES);
      else if (rand() < 0.12) w.setRaw(x, y + 1, z, rand() < 0.5 ? J.FERN : J.GLOWFLOWER);
    }
  }
  for (let x = TX0; x <= TX1; x++) {
    for (const [ins, y1] of [[0, F + 3], [2, F + 6], [4, F + 9]]) {
      const z = TZ1 - ins + 1;
      if (x < TX0 + ins || x > TX1 - ins || rand() > 0.35) continue;
      const len = 1 + Math.floor(rand() * 3);
      for (let k = 0; k < len; k++) if (w.get(x, y1 - k, z) === B.AIR) w.setRaw(x, y1 - k, z, J.VINE);
    }
  }

  // Heg van bladeren rond de arena, met een poort van doornige lianen richting de schatboom
  const gate = [];
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      if (arena[z * S + x]) continue;
      let near = false;
      for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1; dx++) if (arena[(z + dz) * S + x + dx]) { near = true; break; }
      if (!near) continue;
      const a = along(x, z), c = across(x, z);
      const isGate = a > 10 && Math.abs(c - pathMid(a)) < 2.4;
      const top = isGate ? F + 4 : F + 3 + (rand() < 0.3 ? 1 : 0);
      for (let y = F + 1; y <= top; y++) {
        if (SOLID[w.get(x, y, z)]) continue;
        if (isGate) { w.setRaw(x, y, z, J.THICKET); gate.push([x, y, z]); }
        else w.setRaw(x, y, z, J.LEAVES);
      }
      if (!isGate && rand() < 0.08) w.setRaw(x, top + 1, z, rand() < 0.5 ? J.GLOWFLOWER : B.FLOWER_R);
    }
  }

  // Brug over de rivier
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const i = z * S + x;
      if (kind[i] !== 1) continue;
      const a = along(x, z), c = across(x, z);
      const off = Math.abs(c - pathMid(a));
      if (off < 1.6) w.setRaw(x, F, z, J.PLANKS);
      else if (off < 2.6) { w.setRaw(x, F, z, J.PLANKS); w.setRaw(x, F + 1, z, J.LOG); }
    }
  }

  // Bomen: reuzenbomen in een kring om de open plek en verder het woud in
  const trees = [];
  const pathFree = (x, z, m) => {
    const a = along(x, z), c = across(x, z);
    return !(a > 11 && a < 34 && Math.abs(c - pathMid(a)) < m);
  };
  const okTree = (x, z, r) => {
    if (x < 3 || z < 3 || x > S - 5 || z > S - 5) return false;
    if (inTemple(x, z) || inTemple(x + 1, z + 1) || (x > TX0 - 3 && x < TX1 + 3 && z > TZ0 - 3 && z < TZ1 + 2)) return false;
    if (Math.hypot(x + 1 - tcx, z + 1 - tcz) < 9) return false;
    if (riverD(along(x, z), across(x, z)) < 2 || riverD(along(x + 1, z + 1), across(x + 1, z + 1)) < 2) return false;
    if (!pathFree(x, z, 5) || !pathFree(x + 1, z + 1, 5)) return false;
    for (const t of trees) if (Math.hypot(t[0] - x, t[1] - z) < r) return false;
    return true;
  };
  for (let k = 0; k < 10; k++) {
    const ang = k / 10 * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const x = Math.round(C + Math.cos(ang) * 19.5 - 1), z = Math.round(C + Math.sin(ang) * 19.5 - 1);
    if (Math.sin(ang) > 0.93) continue;                       // achter het portaal niet nodig
    if (!okTree(x, z, 6)) continue;
    trees.push([x, z]);
    giantTree(w, x, z, heights[z * S + x] + 1, 17 + Math.floor(rand() * 7), rand, Math.atan2(z + 1 - C, x + 1 - C));
  }
  for (let tries = 0; tries < 260; tries++) {
    const x = 3 + Math.floor(rand() * (S - 8)), z = 3 + Math.floor(rand() * (S - 8));
    if (Math.hypot(x + 1 - C, z + 1 - C) < AR + 5.5) continue;
    if (!okTree(x, z, 10)) continue;
    trees.push([x, z]);
    giantTree(w, x, z, heights[z * S + x] + 1, 14 + Math.floor(rand() * 9), rand, rand() * 6.28);
  }
  // struiken en kleine boompjes
  for (let tries = 0; tries < 140; tries++) {
    const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
    const i = z * S + x;
    if (arena[i] || kind[i] || Math.hypot(x + 0.5 - C, z + 0.5 - C) < AR + 2 || !pathFree(x, z, 3.5)) continue;
    if (Math.hypot(x + 0.5 - tcx, z + 0.5 - tcz) < 6) continue;
    const y = heights[i] + 1;
    if (w.get(x, y, z) !== B.AIR) continue;
    const th = rand() < 0.5 ? 1 : 2 + Math.floor(rand() * 3);
    for (let k = 0; k < th; k++) w.setRaw(x, y + k, z, J.LOG);
    leafBlob(w, x + 0.5, y + th - 1, z + 0.5, th > 1 ? 2.3 : 1.8, rand, 2);
  }

  // De holle schatboom
  const ty0 = F + 1, tth = 25;
  for (let y = F - 2; y <= ty0 + tth; y++) {
    for (let dz = -1; dz <= 2; dz++) {
      for (let dx = -1; dx <= 2; dx++) {
        if ((dx === -1 || dx === 2) && (dz === -1 || dz === 2) && y > ty0 + 4) continue;   // ronde stam hoger op
        w.setRaw(tx + dx, y, tz + dz, J.LOG);
      }
    }
  }
  // wortels (niet aan de kant van de ingang)
  const openX = gdx > 0 ? tx - 1 : tx + 2, outX = gdx > 0 ? -1 : 1;
  for (const [rx, rz] of [[0, -1], [0, 1], [-outX, 0]]) {
    for (const off of [0, 1]) {
      if (rand() < 0.3) continue;
      const len = 2 + Math.floor(rand() * 2);
      for (let k = 1; k <= len; k++) {
        const x = rz !== 0 ? tx + off : (rx < 0 ? tx - 1 - k : tx + 2 + k);
        const z = rz !== 0 ? (rz < 0 ? tz - 1 - k : tz + 2 + k) : tz + off;
        for (let y = ty0; y < ty0 + (len - k + 1); y++) w.setRaw(x, y, z, J.LOG);
      }
    }
  }
  for (let y = ty0; y <= ty0 + 2; y++) for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) w.setRaw(tx + dx, y, tz + dz, B.AIR);
  for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) w.setRaw(tx + dx, F, tz + dz, J.MOSS);
  w.setRaw(tx + 1, ty0 + 3, tz + 1, B.GLOWSTONE);
  w.setRaw(tx + 1, ty0, tz + 1, J.GLOWFLOWER);
  for (let y = ty0; y <= ty0 + 1; y++) for (let dz = 0; dz <= 1; dz++) w.setRaw(openX, y, tz + dz, J.BARK);
  w.setRaw(tx, ty0, tz, B.CHEST);
  leafBlob(w, tcx, ty0 + tth, tcz, 7.5, rand, 3);
  for (const ang of [gAng + 2.2, gAng - 2.0, gAng + Math.PI]) branch(w, tcx, ty0 + 15 + Math.floor(rand() * 4), tcz, ang, 4, rand);
  // gloeiende bloemen rond de boom en langs het pad
  for (let k = 0; k < 40; k++) {
    const a = rand() * Math.PI * 2, r = 3.2 + rand() * 2.5;
    const x = Math.floor(tcx + Math.cos(a) * r), z = Math.floor(tcz + Math.sin(a) * r);
    const y = surfaceY(w, x, z);
    if (y > 0 && w.get(x, y + 1, z) === B.AIR && SOLID[w.get(x, y, z)] && w.get(x, y, z) !== J.LOG) w.setRaw(x, y + 1, z, J.GLOWFLOWER);
  }
  for (const dz of [0, 1]) { const x = openX + outX; if (w.get(x, ty0, tz + dz) === B.AIR) w.setRaw(x, ty0, tz + dz, J.GLOWFLOWER); }
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const a = along(x, z), c = across(x, z);
      if (a < 18 || a > 30 || kind[z * S + x] === 1) continue;
      const off = Math.abs(c - pathMid(a));
      if (off > 1.7 && off < 2.6 && (Math.floor(a) % 3 === 0) && w.get(x, F + 1, z) === B.AIR && SOLID[w.get(x, F, z)]) w.setRaw(x, F + 1, z, J.GLOWFLOWER);
    }
  }

  // Onderbegroeiing buiten de arena
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      const i = z * S + x;
      if (arena[i] || kind[i] === 1 || kind[i] === 2) continue;
      const y = heights[i];
      if (w.get(x, y + 1, z) !== B.AIR || !SOLID[w.get(x, y, z)]) continue;
      const r = rand();
      if (r < 0.12) w.setRaw(x, y + 1, z, rand() < 0.5 ? B.TALLGRASS : J.FERN);
      else if (r < 0.14) w.setRaw(x, y + 1, z, rand() < 0.5 ? B.FLOWER_R : B.FLOWER_Y);
      else if (r < 0.155 && kind[i] !== 3) { w.setRaw(x, y + 1, z, J.LEAVES); if (rand() < 0.4) w.setRaw(x, y + 2, z, J.LEAVES); }
      else if (r < 0.161) w.setRaw(x, y + 1, z, J.GLOWFLOWER);
    }
  }

  // Gebroken tempelpilaren in de arena (dekking tegen rotsblokken)
  const pillars = [];
  for (let k = 0; k < 40 && pillars.length < 5; k++) {
    const ang = rand() * Math.PI * 2, r = 8 + rand() * 4;
    if (Math.abs(angleDiff(ang, Math.PI / 2)) < 0.8) continue;                 // vrij zicht vanaf het portaal
    if (Math.abs(angleDiff(ang, gAng)) < 0.45) continue;                       // poort vrij
    const x = Math.floor(C + Math.cos(ang) * r), z = Math.floor(C + Math.sin(ang) * r);
    if (pillars.some((p) => Math.hypot(p[0] - x, p[1] - z) < 6)) continue;
    pillars.push([x, z]);
    const ph = 2 + Math.floor(rand() * 4);
    for (let y = F + 1; y < F + 1 + ph; y++) {
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
        if (y === F + ph && rand() < 0.35) continue;
        w.setRaw(x + dx, y, z + dz, rand() < 0.5 ? B.MOSSY_STONE_BRICKS : J.COBBLE);
      }
    }
    const topY = F + ph;
    if (rand() < 0.6) w.setRaw(x, topY + 1, z, rand() < 0.5 ? J.LEAVES : J.GLOWFLOWER);
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++) {
      if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue;
      if (rand() < 0.2 && w.get(x + dx, F + 1, z + dz) === B.AIR) w.setRaw(x + dx, F + 1, z + dz, rand() < 0.5 ? B.TALLGRASS : J.FERN);
    }
  }

  // Aankomstportaal aan de zuidkant
  const pz = C + 14;
  for (let x = C - 3; x <= C + 4; x++) for (let z = pz - 1; z <= pz + 1; z++) for (let y = F + 1; y <= F + 6; y++) w.setRaw(x, y, z, B.AIR);
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, J.COBBLE);
  w.setRaw(C - 2, F + 1, pz, J.GLOWFLOWER); w.setRaw(C + 3, F + 1, pz, J.GLOWFLOWER);
  w.portalAxis = 'x';
  // spawnplek vrij
  for (let y = F + 1; y <= F + 3; y++) for (let x = C - 1; x <= C + 2; x++) for (let z = pz - 4; z <= pz - 1; z++) w.setRaw(x, y, z, B.AIR);

  w.computeTops();
  return {
    world: w,
    spawn: { x: C + 1, y: F + 1, z: pz - 2.5 },
    spawnYaw: 0,
    bossSpawn: { x: C + 0.5, y: F + 1, z: C - 2.5 },
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: AR, floorY: F + 1,
    treasure: { x: tx, y: ty0, z: tz },
    gate, bark: { x: openX, y: ty0, z: tz },
  };
}

function surfaceY(w, x, z) {
  for (let y = w.sy - 1; y > 0; y--) {
    const id = w.get(x, y, z);
    if (id !== B.AIR && BLOCKS[id].render !== R_CROSS && id !== J.LEAVES) return y;
  }
  return 0;
}

// Bladerbol: platte lagen zoals echte oerwoudbomen, met lianen eronder
function leafBlob(w, cx, cy, cz, r, rand, layers) {
  const lay = layers || 3;
  for (let dy = -1; dy <= lay - 1; dy++) {
    const rr = dy < 0 ? r - 1.3 : r - dy * (r > 4 ? 1.4 : 0.9);
    if (rr <= 0.5) continue;
    const y = Math.floor(cy) + dy + 1;
    for (let z = Math.floor(cz - rr); z <= Math.ceil(cz + rr); z++) {
      for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) {
        const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
        if (d > rr || (d > rr - 1 && rand() < 0.15)) continue;
        if (w.get(x, y, z) !== B.AIR) continue;
        w.setRaw(x, y, z, J.LEAVES);
        // lianen aan de onderkant van de rand
        if (dy === -1 || (dy === 0 && d > rr - 1.2)) {
          if (rand() < 0.05) {
            const len = 2 + Math.floor(rand() * 4);
            for (let k = 1; k <= len; k++) {
              if (w.get(x, y - k, z) !== B.AIR) break;
              w.setRaw(x, y - k, z, J.VINE);
            }
          }
        }
      }
    }
  }
}

function branch(w, cx, y, cz, ang, len, rand) {
  const dx = Math.cos(ang), dz = Math.sin(ang);
  let x = cx, z = cz;
  for (let k = 1; k <= len; k++) {
    x = cx + dx * (k + 1); z = cz + dz * (k + 1);
    w.setRaw(Math.floor(x), y + (k > len - 1 ? 1 : 0), Math.floor(z), J.LOG);
  }
  leafBlob(w, x, y + 1, z, 2.6 + rand(), rand, 2);
}

function giantTree(w, x, z, y0, ht, rand, outAng) {
  const top = y0 + ht;
  for (let y = y0 - 2; y <= top; y++) for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) w.setRaw(x + dx, y, z + dz, J.LOG);
  // brede wortels
  for (const [rx, rz] of [[-1, 0], [2, 1], [0, -1], [1, 2], [-1, 1], [2, 0], [1, -1], [0, 2]]) {
    if (rand() < 0.4) continue;
    const hgt = 1 + Math.floor(rand() * 3);
    for (let y = y0; y < y0 + hgt; y++) w.setRaw(x + rx, y, z + rz, J.LOG);
    if (hgt > 1 && rand() < 0.6) {
      const ex = rx < 0 ? x + rx - 1 : rx > 1 ? x + rx + 1 : x + rx, ez = rz < 0 ? z + rz - 1 : rz > 1 ? z + rz + 1 : z + rz;
      if (w.get(ex, y0, ez) === B.AIR || BLOCKS[w.get(ex, y0, ez)].render === R_CROSS) w.setRaw(ex, y0, ez, J.LOG);
    }
  }
  const cx = x + 1, cz = z + 1;
  leafBlob(w, cx, top, cz, 5 + rand() * 1.8, rand, 2);
  const nb = 1 + (rand() < 0.3 ? 1 : 0);
  for (let i = 0; i < nb; i++) {
    const a = outAng + (rand() - 0.5) * 1.6 + (i ? Math.PI * 0.6 : 0);
    branch(w, cx, y0 + Math.floor(ht * (0.55 + rand() * 0.2)), cz, a, 3, rand);
  }
  // lianen langs de stam
  for (const [vx, vz] of [[-1, 0], [2, 1], [0, -1], [1, 2]]) {
    if (rand() < 0.7) continue;
    const y1 = top - 1 - Math.floor(rand() * 4), len = 3 + Math.floor(rand() * 5);
    for (let k = 0; k < len; k++) if (w.get(x + vx, y1 - k, z + vz) === B.AIR) w.setRaw(x + vx, y1 - k, z + vz, J.VINE);
  }
}

/* ---------- Texturen voor de reus en de aapjes ---------- */
const JT = {};
function buildJungleTextures() {
  const R = mulberry32(5150);
  const moss = new Uint8Array(256);
  const cells = [];
  for (let i = 0; i < 7; i++) cells.push([R() * 16, R() * 16, R()]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) moss[y * 16 + x] = cells[voronoi(cells, x, y, 16).i][2] < 0.3 ? 1 : 0;
  const col = [];
  for (let x = 0; x < 16; x++) col[x] = R();
  const bark = (x, y) => {
    if (moss[y * 16 + x]) return R() < 0.2 ? [96, 150, 52] : R() < 0.5 ? [62, 106, 36] : [74, 122, 42];
    const s = col[x];
    let c = s < 0.3 ? [70, 48, 26] : s < 0.7 ? [98, 68, 38] : [86, 60, 32];
    if ((y * 3 + x * 7) % 13 === 0) c = [54, 38, 20];
    const k = (R() - 0.5) * 12;
    return [c[0] + k, c[1] + k, c[2] + k];
  };
  JT.body = pixelTexture(16, 16, bark);
  JT.bodyGlow = pixelTexture(16, 16, (x, y) => (moss[y * 16 + x] ? [60, 200, 50] : [0, 0, 0]));
  const eye = (x, y) => ((x >= 2 && x <= 5) || (x >= 10 && x <= 13)) && (y === 7 || y === 8);
  const socket = (x, y) => ((x >= 1 && x <= 6) || (x >= 9 && x <= 14)) && y >= 6 && y <= 9;
  JT.face = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return (x === 3 || x === 12) && y === 7 ? [200, 255, 170] : [60, 230, 50];
    if (socket(x, y)) return [22, 14, 8];
    if (y === 5 && x >= 1 && x <= 14 && x !== 7 && x !== 8) return [40, 28, 14];             // boze wenkbrauw
    if (y >= 11 && x >= 4 && x <= 11) {
      if (y === 12 && (x === 6 || x === 9)) return [30, 20, 12];                            // neusgaten
      return R() < 0.3 ? [140, 118, 80] : [156, 132, 92];
    }
    return bark(x, y);
  });
  JT.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [50, 255, 40] : [0, 0, 0]));
  JT.muzzle = pixelTexture(8, 8, (x, y) => {
    if (y <= 1 && x >= 1 && x <= 6) return [34, 20, 12];                                      // mond
    if (y === 2 && (x === 1 || x === 6)) return [230, 225, 200];                              // tandjes
    return R() < 0.3 ? [140, 118, 80] : [156, 132, 92];
  });
  JT.leaf = pixelTexture(16, 16, () => { const r = R(); return r < 0.15 ? [24, 70, 20] : r < 0.55 ? [44, 116, 32] : r < 0.93 ? [58, 140, 40] : [100, 180, 62]; });
  const flower = (a, b) => pixelTexture(8, 8, (x, y) => {
    const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
    if (d < 1) return [255, 230, 80];
    if (d < 2.5) return (x + y) % 2 ? a : b;
    return (x + y) % 3 ? a : [40, 120, 40];
  });
  JT.pink = flower([255, 96, 170], [235, 70, 150]);
  JT.orange = flower([255, 150, 40], [250, 110, 30]);
  JT.rock = pixelTexture(8, 8, () => { const r = R(); return r < 0.25 ? [76, 120, 48] : r < 0.5 ? [96, 96, 96] : r < 0.8 ? [124, 124, 120] : [146, 146, 140]; });
  JT.vine = pixelTexture(4, 8, (x, y) => ((x + y) % 3 ? [46, 122, 34] : [70, 156, 46]));
  JT.coco = pixelTexture(4, 4, (x, y) => ((x + y) % 2 ? [92, 60, 30] : [120, 80, 40]));
  JT.fur = pixelTexture(8, 8, () => { const r = R(); return r < 0.3 ? [96, 60, 30] : r < 0.7 ? [118, 76, 38] : [134, 88, 46]; });
  JT.monkeyFace = pixelTexture(8, 8, (x, y) => {
    if (y >= 2 && y <= 6 && x >= 1 && x <= 6) {
      if (y === 3 && (x === 2 || x === 5)) return [20, 16, 10];
      if (y === 2 && (x === 1 || x === 2 || x === 5 || x === 6)) return [70, 44, 22];
      if (y === 5 && x >= 3 && x <= 4) return [90, 50, 40];
      return [214, 176, 128];
    }
    return [118, 76, 38];
  });
}

/* ---------- Gedeelde stukjes voor aanvallen ---------- */
const G = {};
function shared() {
  if (G.rock) return;
  if (!JT.body) buildJungleTextures();
  const mk = (geo) => { geo.userShared = true; return geo; };
  G.rock = mk(new THREE.BoxGeometry(1.1, 1.1, 1.1));
  G.rockMat = new THREE.MeshLambertMaterial({ map: JT.rock });
  G.coco = mk(new THREE.BoxGeometry(0.45, 0.45, 0.45));
  G.cocoMat = new THREE.MeshLambertMaterial({ map: JT.coco });
  G.vine = mk(new THREE.BoxGeometry(0.22, 1.7, 0.22).translate(0, 0.85, 0));
  G.vineMat = new THREE.MeshLambertMaterial({ map: JT.vine, emissive: 0x1a5010, emissiveIntensity: 0.6 });
  G.leafTuft = mk(new THREE.BoxGeometry(0.5, 0.3, 0.5).translate(0, 1.75, 0));
  G.leafMat = new THREE.MeshLambertMaterial({ map: JT.leaf });
  G.ring = mk(new THREE.CylinderGeometry(1, 1, 0.7, 40, 1, true).translate(0, 0.35, 0));
  // aapjes
  G.mBody = mk(new THREE.BoxGeometry(0.5, 0.5, 0.42).translate(0, 0.5, 0));
  G.mHead = mk(new THREE.BoxGeometry(0.44, 0.4, 0.4).translate(0, 0.18, 0.04));
  G.mArm = mk(new THREE.BoxGeometry(0.14, 0.5, 0.14).translate(0, -0.22, 0));
  G.mLeg = mk(new THREE.BoxGeometry(0.16, 0.28, 0.16).translate(0, -0.14, 0));
  G.mTail = mk(new THREE.BoxGeometry(0.09, 0.09, 0.6).translate(0, 0, -0.3));
  G.mEar = mk(new THREE.BoxGeometry(0.1, 0.14, 0.06));
}

// Uitdijende brulgolf: spring eroverheen of sta er buiten
class JungleWave {
  constructor(boss, x, y, z, maxR, dmg) {
    this.boss = boss; this.x = x; this.y = y; this.z = z; this.maxR = maxR; this.dmg = dmg;
    this.r = 0.6; this.dead = false; this.hit = false;
    this.mat = new THREE.MeshBasicMaterial({ color: 0x9cff4a, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(G.ring, this.mat);
    this.mesh.position.set(x, y + 0.02, z);
    this.mesh.scale.set(this.r, 1, this.r);
    this.mesh.renderOrder = 4;
  }
  update(dt) {
    const prev = this.r;
    this.r += dt * 10;
    this.mesh.scale.set(this.r, 1, this.r);
    this.mat.opacity = 0.75 * (1 - Math.max(0, this.r - this.maxR + 1.5) / 1.5);
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      FX.debris.spawn(this.x + Math.cos(a) * this.r, this.y + 0.1, this.z + Math.sin(a) * this.r, Math.cos(a) * 2, 2 + Math.random() * 2, Math.sin(a) * 2, 0.45, 0.75, 0.25, 0.4, 12, 1, true);
    }
    const p = player;
    const d = Math.hypot(p.pos.x - this.x, p.pos.z - this.z);
    if (!this.hit && !p.dead && d <= this.maxR + p.hw && this.r + p.hw >= d && prev - p.hw <= d && p.pos.y < this.y + 0.75 && p.pos.y > this.y - 1.5) {
      this.hit = true;
      damagePlayer(this.dmg, { x: this.x, y: this.y, z: this.z }, 'jungleWave', 9, 6.5);
    }
    if (this.r >= this.maxR) this.dead = true;
  }
  dispose() {}
}

// Lianen schieten omhoog langs een baan
class VineBurst {
  constructor(x0, z0, dirX, dirZ, len, y) {
    this.t = 0; this.dead = false; this.life = 1.1;
    this.mesh = new THREE.Group();
    this.parts = [];
    const n = Math.max(4, Math.round(len * 1.6));
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n * len;
      const side = (Math.random() - 0.5) * 1.2;
      const m = new THREE.Mesh(G.vine, G.vineMat);
      m.position.set(x0 + dirX * s - dirZ * side, y, z0 + dirZ * s + dirX * side);
      m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * 3, (Math.random() - 0.5) * 0.5);
      m.scale.y = 0.01;
      this.mesh.add(m);
      if (i % 2 === 0) {
        const tuft = new THREE.Mesh(G.leafTuft, G.leafMat);
        m.add(tuft);
      }
      this.parts.push({ m, delay: s / len * 0.18, h: 0.7 + Math.random() * 0.6 });
    }
  }
  update(dt) {
    this.t += dt;
    for (const p of this.parts) {
      const k = this.t - p.delay;
      const up = k < 0 ? 0.01 : k < 0.12 ? k / 0.12 : k > this.life - 0.35 ? Math.max(0.01, (this.life - k) / 0.35) : 1;
      p.m.scale.y = Math.max(0.01, up * p.h);
    }
    if (this.t > this.life + 0.2) this.dead = true;
  }
  dispose() {}
}

function monkeyModel() {
  shared();
  const body = new THREE.MeshLambertMaterial({ map: JT.fur });
  const face = new THREE.MeshLambertMaterial({ map: JT.monkeyFace });
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  inner.add(new THREE.Mesh(G.mBody, body));
  const head = new THREE.Mesh(G.mHead, [body, body, body, body, face, body]);
  head.position.set(0, 0.78, 0.06);
  inner.add(head);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(G.mEar, face); e.position.set(sx * 0.26, 0.24, 0); head.add(e); }
  const arms = [], legs = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Mesh(G.mArm, body); a.position.set(sx * 0.32, 0.7, 0); inner.add(a); arms.push(a);
    const l = new THREE.Mesh(G.mLeg, body); l.position.set(sx * 0.14, 0.27, 0); inner.add(l); legs.push(l);
  }
  const tail = new THREE.Mesh(G.mTail, body);
  tail.position.set(0, 0.4, -0.2);
  inner.add(tail);
  return {
    group, mats: [body, face],
    animate(m, dt) {
      const s = Math.sin(m.walk * 1.4);
      arms[0].rotation.x = -0.6 + s * 0.8; arms[1].rotation.x = -0.6 - s * 0.8;
      legs[0].rotation.x = -s * 0.7; legs[1].rotation.x = s * 0.7;
      tail.rotation.x = -0.7 + Math.sin(m.walk * 0.7) * 0.3;
      tail.rotation.y = Math.sin(m.walk * 0.5) * 0.4;
      inner.position.y = Math.abs(s) * 0.06;
      head.rotation.z = Math.sin(m.walk * 0.9) * 0.12;
      // speelse sprongetjes
      if (m.onGround && Math.random() < dt * 1.2) m.vel.y = 6.5;
    },
  };
}

/* ---------- De Oerwoudreus ---------- */
class JungleBoss extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Oerwoudreus', ref: 'de Oerwoudreus', hp: 580, hw: 1.6, h: 5.0, deathTiles: [T.JUNGLE_LOG, T.JUNGLE_LEAVES, T.JUNGLE_MOSS] });
    this.anim = { armL: 0, armR: 0, armZ: 0.2, fore: 0, legL: 0, legR: 0, lean: 0.8, head: 0.4, crouch: 0.5, jaw: 0 };
    this.monkeyT = 7;
    this.last = '';
    this.combo = 0;
    this.leapTo = null;
    this.vineLane = null;
    this.shownRock = false;
  }

  buildModel() {
    shared();
    const body = new THREE.MeshLambertMaterial({ map: JT.body, emissive: 0xffffff, emissiveMap: JT.bodyGlow, emissiveIntensity: 0 });
    const face = new THREE.MeshLambertMaterial({ map: JT.face, emissive: 0xffffff, emissiveMap: JT.faceGlow, emissiveIntensity: 1.3 });
    const muzzle = new THREE.MeshLambertMaterial({ map: JT.muzzle });
    const leaf = new THREE.MeshLambertMaterial({ map: JT.leaf });
    const pink = new THREE.MeshLambertMaterial({ map: JT.pink, emissive: 0xff60b0, emissiveIntensity: 0.25 });
    const orange = new THREE.MeshLambertMaterial({ map: JT.orange, emissive: 0xff9020, emissiveIntensity: 0.25 });
    const rock = new THREE.MeshLambertMaterial({ map: JT.rock });
    const vine = new THREE.MeshLambertMaterial({ map: JT.vine });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const legs = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.78, 1.5, -0.2);
      p.add(bossBox(1.0, 1.5, 1.05, body, -0.75));
      p.add(bossBox(1.15, 0.32, 1.35, body, -1.34, 0, 0.12));
      inner.add(p);
      legs.push(p);
    }
    const torso = new THREE.Group();
    torso.position.set(0, 1.5, -0.2);
    inner.add(torso);
    torso.add(bossBox(2.9, 2.4, 1.8, body, 1.2));
    torso.add(bossBox(1.9, 1.3, 0.3, leaf, 1.35, 0, 0.95));          // bladerborst
    for (const sx of [-1, 1]) {
      const s = bossBox(1.35, 0.85, 1.4, leaf, 0);
      s.position.set(sx * 1.45, 2.45, 0); s.rotation.z = sx * -0.2;
      torso.add(s);
    }
    const back = bossBox(2.1, 0.9, 1.1, leaf, 0);
    back.position.set(0, 2.25, -0.7); back.rotation.x = -0.3;
    torso.add(back);
    for (const sx of [-0.6, 0.7]) {
      const v = bossBox(0.14, 1.5, 0.14, vine, -0.75);
      v.position.set(sx, 0.6, 0.92);
      torso.add(v);
    }
    const arms = [], fores = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 1.85, 2.05, 0.1);
      p.add(bossBox(1.05, 1.8, 1.05, body, -0.85));
      const f = new THREE.Group();
      f.position.y = -1.7;
      f.add(bossBox(1.15, 1.55, 1.15, body, -0.75));
      f.add(bossBox(1.4, 0.85, 1.4, body, -1.8));
      const v = bossBox(0.12, 1.2, 0.12, vine, -0.6);
      v.position.set(sx * 0.6, -0.2, 0.3);
      f.add(v);
      p.add(f);
      torso.add(p);
      arms.push(p); fores.push(f);
    }
    const head = new THREE.Group();
    head.position.set(0, 2.35, 0.55);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.5, 1.4).translate(0, 0.62, 0.2), [body, body, body, body, face, body]));
    head.add(bossBox(1.85, 0.34, 0.45, body, 1.12, 0, 0.8));        // zware wenkbrauw
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.55).translate(0, -0.25, 0.25), [muzzle, muzzle, body, muzzle, muzzle, muzzle]);
    jaw.position.set(0, 0.22, 0.62);
    head.add(jaw);
    // bloemenkroon
    const crown = new THREE.Group();
    crown.position.set(0, 1.4, 0.2);
    head.add(crown);
    const flowers = [];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const f = bossBox(0.34, 0.26, 0.34, i % 2 ? orange : pink, 0.13);
      f.position.set(Math.sin(a) * 0.72, 0, Math.cos(a) * 0.64);
      f.rotation.y = a;
      crown.add(f);
      flowers.push(f);
    }
    const held = new THREE.Mesh(G.rock, rock);
    held.scale.setScalar(1.25);
    held.position.set(0, 4.3, 0.4);
    held.visible = false;
    torso.add(held);
    return { group, inner, legs, torso, arms, fores, head, jaw, crown, flowers, held, mats: [body, face, muzzle, leaf, pink, orange, rock, vine], body, face, pink, orange };
  }

  onWake() { this.monkeyT = 7; }

  onEnrage() {
    // fase 2: de bloemen bloeien open, het mos gaat gloeien en er komen meteen aapjes
    this.model.body.emissiveIntensity = 0.6;
    
    this.model.pink.emissiveIntensity = 0.9; this.model.orange.emissiveIntensity = 0.9;
    for (const f of this.model.flowers) f.scale.set(1.6, 1.8, 1.6);
    this.monkeyT = 0;
    const c = this.center();
    for (let i = 0; i < 40; i++) FX.glow.spawn(c.x, c.y + 1.5, c.z, (Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8, 1, 0.45 + Math.random() * 0.4, 0.75, 1, 3, 1);
  }
  enragedFx() {
    FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 3, this.pos.y + 1 + Math.random() * 4, this.pos.z + (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 0.5, 0.6, (Math.random() - 0.5) * 0.5, 0.55, 1, 0.35, 0.8, -0.2, 0.5);
  }
  onGoHome() { this.noSteer = false; this.combo = 0; this.model.held.visible = false; this.monkeyT = 7; }

  liveMonkeys() { let n = 0; for (const m of game.minions) if (!m.dead) n++; return n; }

  pickAttack(c) {
    const ph2 = this.enraged;
    if (this.monkeyT <= 0 && this.liveMonkeys() < 2) { this.setState('callWind'); this.monkeyT = ph2 ? 14 : 18; return; }
    const opts = [];
    const add = (s, wgt) => { if (s !== this.last) opts.push([s, wgt]); else opts.push([s, wgt * 0.3]); };
    if (c.dist < 7) add('poundWind', 3);
    if (c.dist > 6.5) add('leapWind', ph2 ? 2.2 : 1.4);
    add('throwWind', c.dist > 5 ? 2.4 : 1.2);
    add('vineWind', c.dist > 4 ? 2 : 0.8);
    let sum = 0;
    for (const o of opts) sum += o[1];
    let r = Math.random() * sum, pick = opts[0][0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
    this.last = pick;
    this.setState(pick);
  }

  think(dt, c) {
    const ph2 = this.enraged;
    const fy = this.info.floorY;
    let speed = 0;
    this.monkeyT -= dt;
    switch (this.state) {
      case 'chase':
        this.turnTo(c.targetYaw, dt, ph2 ? 4 : 3);
        if (c.dist > 3.8) speed = ph2 ? 3.0 : 2.4;
        this.attackCD -= dt;
        if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
        break;

      // 1. Rotsblok gooien (in fase 2 twee tegelijk)
      case 'throwWind':
        this.turnTo(c.targetYaw, dt, 3.5);
        this.model.held.visible = this.t > 0.15;
        if (this.t > (ph2 ? 0.7 : 0.9)) {
          this.model.held.visible = false;
          this.throwBoulder(c.p, 0);
          if (ph2) this.throwBoulder(c.p, 1);
          this.setState('throw');
        }
        break;
      case 'throw':
        if (this.t > 0.35) this.setState('recover', ph2 ? 0.5 : 0.8);
        break;

      // 2. Op de borst roffelen en brullen: een groene golf
      case 'poundWind': {
        const R = ph2 ? 9 : 8;
        if (this.t < dt * 1.5) {
          game.addHazard(new GroundHazard({ x: this.pos.x, y: fy, z: this.pos.z, radius: R, warn: ph2 ? 0.9 : 1.1, linger: 0.1, color: 0x9cff4a, onTrigger: () => {} }));
          SND.play('roar', { at: this.pos, range: 40, vol: 0.5 });
        }
        if (Math.random() < 0.4) { const a = Math.random() * 6.28; FX.glow.spawn(this.pos.x + Math.cos(a) * R, fy + 0.2, this.pos.z + Math.sin(a) * R, 0, 1, 0, 0.6, 1, 0.3, 0.5, 0, 0); }
        if (this.t > 0.2 && Math.floor(this.t * 6) !== Math.floor((this.t - dt) * 6)) SND.play('hit', { at: this.pos, range: 30, vol: 0.5 });
        if (this.t > (ph2 ? 0.9 : 1.1)) {
          SND.play('roar', { vol: 1 });
          game.shake = Math.max(game.shake, 0.7);
          if (c.dist < R + 4 && !c.p.dead) { c.p.slow = Math.max(c.p.slow, 0.8); HUD.actionbar('Spring over de groene golf!', 1.2); }
          game.addHazard(new JungleWave(this, this.pos.x, fy, this.pos.z, R, this.dmg(11)));
          FX.ring(this.pos.x, fy, this.pos.z, 2.5, [0.55, 1, 0.3]);
          this.setState('pound');
        }
        break;
      }
      case 'pound':
        if (this.t > 0.8) this.setState('recover', ph2 ? 0.6 : 0.9);
        break;

      // 3. Lianen naar de speler: grijpen, naar de reus trekken en vertragen
      case 'vineWind': {
        if (this.t < dt * 1.5) {
          const p = c.p;
          let dx = p.pos.x + p.vel.x * 0.25 - this.pos.x, dz = p.pos.z + p.vel.z * 0.25 - this.pos.z;
          const d = Math.hypot(dx, dz) || 1;
          dx /= d; dz /= d;
          this.yaw = Math.atan2(dx, dz);
          const len = clamp(d + 3, 7, 18);
          const x0 = this.pos.x + dx * 1.4, z0 = this.pos.z + dz * 1.4;
          const warn = ph2 ? 0.75 : 0.95;
          this.vineLane = { dx, dz };
          game.addHazard(new LaneHazard({
            x0, z0, x1: x0 + dx * len, z1: z0 + dz * len, y: fy, width: ph2 ? 2.1 : 1.8, warn, linger: 0.6, color: 0xffe23a,
            onTrigger: (h) => {
              game.addHazard(new VineBurst(x0, z0, dx, dz, len, fy));
              SND.play('break', { at: { x: x0 + dx * len / 2, y: fy, z: z0 + dz * len / 2 }, range: 30 });
              SND.play('whoosh', { vol: 0.6 });
              if (h.playerInside()) this.snare();
            },
          }));
        }
        if (this.t > (ph2 ? 0.75 : 0.95)) this.setState('vine');
        break;
      }
      case 'vine':
        if (this.t > 0.5) this.setState('recover', ph2 ? 0.45 : 0.7);
        break;

      // 4. Sprong met landingsklap; daarna vallen er kokosnoten en bladeren
      case 'leapWind': {
        const wind = ph2 ? (this.combo ? 0.4 : 0.5) : 0.75;
        if (this.t < dt * 1.5) {
          const p = c.p;
          const ac = this.info.arenaCenter;
          let tx = p.pos.x + p.vel.x * 0.3, tz = p.pos.z + p.vel.z * 0.3;
          const dd = Math.hypot(tx - ac.x, tz - ac.z), lim = this.info.arenaRadius - 2.8;
          if (dd > lim) { tx = ac.x + (tx - ac.x) / dd * lim; tz = ac.z + (tz - ac.z) / dd * lim; }
          const hd = Math.hypot(tx - this.pos.x, tz - this.pos.z);
          if (hd > 17) { tx = this.pos.x + (tx - this.pos.x) / hd * 17; tz = this.pos.z + (tz - this.pos.z) / hd * 17; }
          this.leapTo = { x: tx, z: tz };
          game.addHazard(new GroundHazard({ x: tx, y: fy, z: tz, radius: 4.5, warn: wind + 0.95, linger: 0.15, color: 0xff5a1e, onTrigger: () => {} }));
        }
        this.turnTo(Math.atan2(this.leapTo.x - this.pos.x, this.leapTo.z - this.pos.z), dt, 6);
        if (this.t > wind) {
          const T = 0.95;
          this.vel.set((this.leapTo.x - this.pos.x) / T, 0.5 * GRAVITY * T, (this.leapTo.z - this.pos.z) / T);
          this.noSteer = true;
          this.setState('leap');
          SND.play('whoosh', { at: this.pos });
        }
        break;
      }
      case 'leap':
        if (this.t > 0.2 && this.onGround) {
          this.vel.x = 0; this.vel.z = 0;
          this.noSteer = false;
          this.shockwave(this.pos.x, this.pos.y, this.pos.z, 4.5, 13, [0.45, 0.7, 0.25]);
          this.dropCoconuts(c.p, ph2 ? 6 : 4);
          if (ph2 && this.combo === 0) { this.combo = 1; this.setState('leapWind'); }
          else { this.combo = 0; this.setState('recover', ph2 ? 0.7 : 1.0); }
        } else if (this.t > 2.5) { this.noSteer = false; this.setState('recover', 0.5); }
        break;

      // aapjes roepen
      case 'callWind':
        this.turnTo(c.targetYaw, dt, 2);
        if (this.t > 1.0) {
          this.callMonkeys(this.enraged ? 3 : 2);
          this.setState('recover', 0.5);
        }
        break;

      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph2 ? 0.9 + Math.random() * 0.7 : 1.6 + Math.random() * 1.0;
        }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  // Gegrepen door de lianen: schade, naar de reus toe getrokken en vertraagd
  snare() {
    const p = player;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    const before = p.health;
    damagePlayer(this.dmg(10), { x: p.pos.x + dx / d, y: p.pos.y, z: p.pos.z + dz / d }, 'vines', clamp((d - 4.5) / 0.29, 0.5, 12), 4);
    if (p.health < before) {
      p.slow = Math.max(p.slow, 2.2);
      HUD.actionbar('Gegrepen door de lianen!', 1.5);
      for (let i = 0; i < 12; i++) FX.debris.spawn(p.pos.x, p.pos.y + 0.5 + Math.random(), p.pos.z, (Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3, 0.25, 0.6, 0.15, 0.6, 10, 0.5, true);
    }
  }

  throwBoulder(p, k) {
    const fy = this.info.floorY;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const origin = new THREE.Vector3(this.pos.x + fx * 0.6, this.pos.y + 5.2, this.pos.z + fz * 0.6);
    let tx = p.pos.x + p.vel.x * 0.55, tz = p.pos.z + p.vel.z * 0.55;
    if (k === 1) {
      // tweede rotsblok: naast de speler, waar hij naartoe zou kunnen springen
      const a = Math.random() * Math.PI * 2, r = 3.2 + Math.random() * 1.6;
      tx = p.pos.x + Math.cos(a) * r; tz = p.pos.z + Math.sin(a) * r;
    }
    const ty = p.onGround ? Math.floor(p.pos.y + 0.01) : fy;
    const dist = Math.hypot(tx - origin.x, tz - origin.z);
    const T = clamp(0.85 + dist * 0.04, 0.95, 1.45) + k * 0.25;
    const g = 16;
    const vel = new THREE.Vector3((tx - origin.x) / T, (ty + 0.3 - origin.y + 0.5 * g * T * T) / T, (tz - origin.z) / T);
    const hz = new GroundHazard({
      x: tx, y: ty, z: tz, radius: 2.2, warn: T, linger: 0.35, color: 0xff5a1e,
      onTrigger: (h) => {
        SND.play('slam', { at: { x: h.x, y: h.y, z: h.z }, range: 40, vol: 0.8 });
        game.shake = Math.max(game.shake, 0.45);
        FX.ring(h.x, h.y, h.z, 2.0, [0.5, 0.42, 0.3]);
        for (let i = 0; i < 26; i++) {
          const c = Math.random() < 0.4 ? [0.3, 0.55, 0.2] : [0.5, 0.5, 0.48];
          FX.debris.spawn(h.x, h.y + 0.4, h.z, (Math.random() - 0.5) * 7, 3 + Math.random() * 5, (Math.random() - 0.5) * 7, c[0], c[1], c[2], 0.9, 16, 0.4, true);
        }
        if (h.playerInside()) damagePlayer(this.dmg(12), { x: h.x, y: h.y, z: h.z }, 'boulder', 7, 6);
      },
    });
    game.addHazard(hz);
    game.addProjectile(new Projectile({
      pos: origin, vel, owner: 'boss', type: 'boulder', dmg: this.dmg(12), radius: 0.6, knock: 6, gravity: g, life: T + 0.05,
      mesh: new THREE.Mesh(G.rock, G.rockMat),
      trail: (pr) => { if (Math.random() < 0.3) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, 0, 0, 0.35, 0.55, 0.2, 0.5, 6, 0, false); },
      explodeFx: (pr) => {
        // tegen een pilaar gebotst? dan geen inslag meer bij de cirkel
        if (Math.hypot(pr.pos.x - tx, pr.pos.z - tz) > 2.6 && !hz.fired) hz.dead = true;
        for (let i = 0; i < 12; i++) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5, 0.5, 0.5, 0.48, 0.7, 14, 0.4, true);
      },
    }));
    SND.play('whoosh', { at: origin, range: 40 });
  }

  dropCoconuts(p, n) {
    const fy = this.info.floorY;
    const ac = this.info.arenaCenter;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = i === 0 ? 0.3 : 1.8 + Math.random() * 3.5;
      let x = p.pos.x + Math.cos(a) * r, z = p.pos.z + Math.sin(a) * r;
      const dd = Math.hypot(x - ac.x, z - ac.z), lim = this.info.arenaRadius - 1;
      if (dd > lim) { x = ac.x + (x - ac.x) / dd * lim; z = ac.z + (z - ac.z) / dd * lim; }
      const warn = 1.0 + i * 0.12 + Math.random() * 0.25;
      const h0 = 11;
      const hz = new GroundHazard({
        x, y: fy, z, radius: 0.95, warn, linger: 0.25, color: 0xffa030,
        onTrigger: (h) => {
          SND.play('hit', { at: { x: h.x, y: h.y, z: h.z }, range: 24, vol: 0.6 });
          for (let k = 0; k < 8; k++) FX.debris.spawn(h.x, h.y + 0.3, h.z, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4, k % 2 ? 0.95 : 0.45, k % 2 ? 0.95 : 0.3, k % 2 ? 0.9 : 0.15, 0.6, 14, 0.4, true);
          if (h.playerInside()) damagePlayer(this.dmg(5), { x: h.x, y: h.y, z: h.z }, 'coconut', 3, 4);
        },
      });
      game.addHazard(hz);
      game.addProjectile(new Projectile({
        pos: new THREE.Vector3(x, fy + h0, z), vel: new THREE.Vector3(0, 0, 0), owner: 'boss', type: 'coconut', dmg: this.dmg(5), radius: 0.3, knock: 3,
        gravity: 2 * (h0 - 0.4) / (warn * warn), life: warn - 0.02, destroyable: true,
        mesh: new THREE.Mesh(G.coco, G.cocoMat),
        // kapotgeslagen of tegen een blok gebotst: dan geen inslag
        explodeFx: (pr) => { if (pr.life > 0.08 && !hz.fired) hz.dead = true; },
      }));
    }
    // bladeren dwarrelen van de bomen
    for (let i = 0; i < 40; i++) {
      FX.debris.spawn(p.pos.x + (Math.random() - 0.5) * 16, fy + 7 + Math.random() * 5, p.pos.z + (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 1.5, -0.5, (Math.random() - 0.5) * 1.5, 0.2 + Math.random() * 0.15, 0.5 + Math.random() * 0.2, 0.12, 3 + Math.random() * 2, 1.2, 0.8, true);
    }
  }

  callMonkeys(n) {
    const want = Math.min(n, 3 - this.liveMonkeys());
    const ac = this.info.arenaCenter, fy = this.info.floorY;
    let made = 0;
    for (let k = 0; k < 20 && made < want; k++) {
      const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 1.5;
      const x = ac.x + Math.cos(a) * r, z = ac.z + Math.sin(a) * r;
      if (Math.hypot(x - player.pos.x, z - player.pos.z) < 4) continue;
      let blocked = false;
      for (let y = fy; y < fy + 7; y++) if (this.world.solidAt(Math.floor(x), y, Math.floor(z))) { blocked = true; break; }
      if (blocked) continue;
      made++;
      game.addMinion(new Minion(this.world, x, fy + 6, z, {
        name: 'Oerwoudaapje', hp: 18, speed: 4.1, dmg: this.dmg(4), hw: 0.3, h: 0.95, life: 32,
        color: [0.5, 0.33, 0.16], model: monkeyModel,
      }));
      for (let i = 0; i < 14; i++) FX.debris.spawn(x, fy + 7, z, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.25, 0.55, 0.15, 1.2, 6, 0.5, true);
    }
    if (made) { SND.play('pop', { vol: 0.8 }); HUD.actionbar('Pas op, aapjes!', 1.6); }
  }

  die() {
    super.die();
    this.model.held.visible = false;
    this.info.witherT = 3.0;
    this.info.witherI = 0;
  }

  animate(dt, speed) {
    const a = this.anim;
    this.walkPhase += dt * speed * 1.7;
    const mv = Math.min(1, speed / 2);
    const sw = Math.sin(this.walkPhase) * mv;
    // knokkellopen: armen ver naar voren, leunend
    let armL = -1.05 + sw * 0.5, armR = -1.05 - sw * 0.5, armZ = 0.12, fore = -0.25, legL = -sw * 0.5, legR = sw * 0.5;
    let lean = 0.5, head = -0.35, crouch = 0, jaw = 0, rate = 10;
    const ph2 = this.enraged;
    switch (this.state) {
      case 'sleep': case 'idle':
        armL = armR = -0.55; armZ = 0.05; fore = -0.9; lean = 0.95; head = 0.2; crouch = 0.55; legL = -0.9; legR = -0.9;
        if (this.state === 'sleep') { lean += Math.sin(game.time * 1.3) * 0.04; head += Math.sin(game.time * 1.3) * 0.06; }
        break;
      case 'roar': armL = armR = -2.7; armZ = 0.8; fore = -0.4; lean = -0.15; head = -0.25; jaw = 0.5; rate = 6; break;
      case 'throwWind': {
        const k = clamp(this.t / 0.5, 0, 1);
        armL = armR = -3.0 * easeOut(k); armZ = 0.15; fore = -0.6; lean = -0.15 * k; head = -0.4; crouch = -0.1; rate = 12;
        break;
      }
      case 'throw': armL = armR = -0.6; armZ = 0.1; fore = 0; lean = 0.6; head = -0.3; jaw = 0.3; rate = 30; break;
      case 'poundWind': {
        // op de borst roffelen
        const beat = Math.sin(this.t * 18);
        armL = -1.6 + beat * 0.45; armR = -1.6 - beat * 0.45; armZ = -0.35; fore = -1.5;
        lean = -0.25; head = -0.6; jaw = 0.35; rate = 22;
        break;
      }
      case 'pound': armL = armR = -2.2; armZ = 1.15; fore = -0.2; lean = -0.1; head = -0.15; jaw = 0.7; rate = 14; break;
      case 'vineWind': {
        const k = clamp(this.t / (ph2 ? 0.75 : 0.95), 0, 1);
        armL = armR = k < 0.75 ? -2.9 : -0.9; armZ = 0.15; fore = -0.3; lean = k < 0.75 ? -0.1 : 0.85; head = -0.5; jaw = 0.3; rate = k < 0.75 ? 9 : 30;
        break;
      }
      case 'vine': armL = armR = -0.9; armZ = 0.2; fore = 0; lean = 0.85; head = -0.6; rate = 10; break;
      case 'leapWind': armL = armR = 0.5; armZ = 0.35; fore = -0.2; lean = 0.9; crouch = 0.65; legL = -0.8; legR = -0.8; head = -0.7; rate = 10; break;
      case 'leap': armL = armR = -2.8; armZ = 0.5; fore = -0.2; lean = 0.1; legL = 0.4; legR = 0.4; head = -0.3; jaw = 0.4; rate = 10; break;
      case 'callWind': {
        const beat = Math.sin(this.t * 12);
        armL = -2.4 + beat * 0.5; armR = -2.4 - beat * 0.5; armZ = 0.5; fore = -0.8; lean = 0; head = -0.75 + Math.sin(this.t * 6) * 0.1; jaw = 0.6; rate = 14;
        break;
      }
      case 'recover': armL = armR = -0.7; armZ = 0.15; fore = -0.4; lean = 0.8; head = 0.1; crouch = 0.15; rate = 6; break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.armL += (armL - a.armL) * k; a.armR += (armR - a.armR) * k;
    a.armZ += (armZ - a.armZ) * k; a.fore += (fore - a.fore) * k;
    a.legL += (legL - a.legL) * Math.min(1, k * 1.5); a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
    a.lean += (lean - a.lean) * k; a.head += (head - a.head) * k;
    a.crouch += (crouch - a.crouch) * k; a.jaw += (jaw - a.jaw) * k;
    const m = this.model;
    m.arms[0].rotation.x = a.armL; m.arms[1].rotation.x = a.armR;
    m.arms[0].rotation.z = -a.armZ; m.arms[1].rotation.z = a.armZ;
    m.fores[0].rotation.x = a.fore; m.fores[1].rotation.x = a.fore;
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head - a.lean * 0.6;
    m.jaw.rotation.x = a.jaw;
    m.inner.position.y = -a.crouch;
    m.crown.rotation.y = ph2 ? game.time * 0.8 : 0;
    const angry = this.state === 'poundWind' || this.state === 'pound' || this.state === 'roar' || this.state === 'callWind';
    m.face.emissiveIntensity = (angry ? 2.4 : 1.3) * (ph2 ? 1.4 : 1);
    if (ph2) m.body.emissiveIntensity = 0.5 + Math.sin(game.time * 4) * 0.2;
  }
}

/* ---------- Aanmelden ---------- */
const DEATHS = {
  boulder: 'Geplet door een rotsblok',
  vines: 'Verstrikt in de lianen',
  coconut: 'Bonk! Een kokosnoot op het hoofd',
  jungleWave: 'Weggeblazen door het gebrul van de Oerwoudreus',
};

registerRealm('jungle', {
  gen: genJungle,
  makeBoss: (world, info) => {
    if (typeof DEATH_REASONS !== 'undefined') Object.assign(DEATH_REASONS, DEATHS);
    return new JungleBoss(world, info);
  },
  atmosphere: { background: 0x8db487, fog: 0x86ad80, near: 12, far: 56, amb: 0xe4ffd8, ambI: 0.82, dir: 0xfff4d0, dirI: 0.5, hand: 0xe6ffdc },
  intro: 'Sssst... De Oerwoudreus slaapt bij de oude tempel. Loop dichterbij als je durft!',
  tip: 'Tip: ren weg uit de cirkels, en spring over de groene golf!',
  treasureTip: 'De doornige lianen zijn weg! Steek de rivier over, volg de gloeiende bloemen en hak de gebarsten schors van de holle reuzenboom open!',
  ruin: [J.MOSS, J.LOG, J.COBBLE, J.LEAVES],
  ambientSound: 0.3,
  ambience(dt, info) {
    const p = player;
    // de doornige lianen verwelken als de reus verslagen is
    if (info.witherT !== undefined && info.witherI < info.gate.length) {
      info.witherT -= dt;
      while (info.witherT <= 0 && info.witherI < info.gate.length) {
        const [x, y, z] = info.gate[info.witherI++];
        info.witherT += 0.07;
        if (info.world.get(x, y, z) === J.THICKET) {
          info.world.set(x, y, z, B.AIR);
          FX.blockBreak(x, y, z, J.THICKET);
          if (info.witherI % 3 === 0) SND.play('break', { at: { x, y, z }, range: 40, vol: 0.6 });
        }
      }
    }
    // vallende blaadjes en vuurvliegjes
    info.leafT = (info.leafT || 0) + dt * 7;
    while (info.leafT > 1) {
      info.leafT -= 1;
      FX.debris.spawn(p.pos.x + (Math.random() - 0.5) * 24, p.pos.y + 5 + Math.random() * 8, p.pos.z + (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 0.8, -0.4, (Math.random() - 0.5) * 0.8, 0.2 + Math.random() * 0.2, 0.45 + Math.random() * 0.25, 0.1, 5, 0.5, 0.8, true);
    }
    info.flyT = (info.flyT || 0) + dt * 4;
    while (info.flyT > 1) {
      info.flyT -= 1;
      FX.glow.spawn(p.pos.x + (Math.random() - 0.5) * 20, p.pos.y + 0.3 + Math.random() * 3, p.pos.z + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 0.6, 0.15, (Math.random() - 0.5) * 0.6, 0.75, 1, 0.35, 2.2, 0, 0);
    }
    // de gebarsten schors glinstert als je de schat zoekt
    if (PROG.phase === 'treasure' && info.bark && Math.random() < dt * 6) {
      const b = info.bark;
      FX.glow.spawn(b.x + Math.random(), b.y + Math.random() * 2, b.z + Math.random() * 2, 0, 0.6, 0, 0.6, 1, 0.4, 1, 0, 0);
    }
  },
});

window.JUNGLE = { gen: genJungle, Boss: JungleBoss, J };
})();
