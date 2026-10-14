'use strict';
/* Portaaljacht – wereld 13: de Kristalgrot met De Kristalgolem (kristalschild met zuilen, prismalasers, kristalpieken, scherfregen) */
(() => {
  /* ---------- Blokken ---------- */
  defineTile('CRYSTAL_SLATE', (h) => (x, y) => {
    const band = y % 5 === 0 ? -12 : 0;
    const r = h.R();
    const c = r < 0.3 ? [56, 50, 70] : r < 0.7 ? [68, 61, 84] : [78, 70, 96];
    return h.vary([c[0] + band, c[1] + band, c[2] + band], 5);
  });
  defineTile('CRYSTAL_CALCITE', (h) => () => {
    const r = h.R();
    if (r < 0.04) return h.vary([226, 210, 246], 4);
    return h.vary(r < 0.14 ? [214, 216, 224] : r < 0.55 ? [240, 240, 246] : [252, 252, 255], 3);
  });
  defineTile('CRYSTAL_AMETHYST', (h) => {
    const pts = [];
    for (let i = 0; i < 6; i++) pts.push([h.R() * 16, h.R() * 16]);
    const shade = [0.78, 1.0, 1.16, 0.9, 1.08, 0.95];
    return (x, y) => {
      const v = h.voronoi(pts, x, y, 16);
      if (v.edge < 0.7) return h.vary([226, 192, 255], 6);
      if (h.R() < 0.04) return [255, 246, 255];
      const k = shade[v.i % 6];
      return h.vary([138 * k, 84 * k, 204 * k], 6);
    };
  });
  defineTile('CRYSTAL_PRISM', (h) => (x, y) => {
    if (x === 0 || y === 0) return h.vary([255, 255, 255], 3);
    if (x === 15 || y === 15) return h.vary([170, 150, 230], 5);
    const cols = [[255, 178, 232], [206, 176, 255], [156, 222, 255], [176, 255, 226]];
    return h.vary(cols[((x + y) >> 2) % 4], 7);
  });
  defineTile('CRYSTAL_CLUSTER', (h) => (x, y) => {
    for (const [cx, ty, hw] of [[4.5, 6, 2], [8.5, 1, 2.6], [12.5, 7, 2]]) {
      if (y < ty) continue;
      const wd = Math.min(hw, (y - ty) * 0.55 + 0.5);
      if (Math.abs(x + 0.5 - cx) <= wd) return x + 0.5 < cx ? [244, 214, 255] : h.vary(y < ty + 3 ? [214, 160, 255] : [160, 96, 226], 8);
    }
    return null;
  });

  defineBlock('CRYSTAL_SLATE', { name: 'Grotsteen', tiles: all(T.CRYSTAL_SLATE), hard: 1.2 });
  defineBlock('CRYSTAL_CALCITE', { name: 'Calciet', tiles: all(T.CRYSTAL_CALCITE), hard: 0.7 });
  defineBlock('CRYSTAL_AMETHYST', { name: 'Amethist', tiles: all(T.CRYSTAL_AMETHYST), hard: 0.5, glow: true, sound: 'glass' });
  defineBlock('CRYSTAL_PRISM', { name: 'Prismakristal', tiles: all(T.CRYSTAL_PRISM), hard: 0.6, glow: true, sound: 'glass' });
  defineBlock('CRYSTAL_CLUSTER', { name: 'Kristalcluster', render: R_CROSS, tiles: all(T.CRYSTAL_CLUSTER), solid: false, opaque: false, ao: false, hard: 0.1, glow: true, replace: true, sound: 'glass' });

  const SLATE = B.CRYSTAL_SLATE, CALC = B.CRYSTAL_CALCITE, AME = B.CRYSTAL_AMETHYST, PRISM = B.CRYSTAL_PRISM, CLUS = B.CRYSTAL_CLUSTER;
  // regenboogkleuren voor deeltjes en lasers
  const PRISMA = [[1, 0.55, 0.85], [0.78, 0.6, 1], [0.55, 0.85, 1], [0.6, 1, 0.85], [1, 0.9, 0.6]];
  const LASER_HEX = [0xff5ad2, 0xb070ff, 0x5ac8ff, 0x5affb4, 0xffd25a];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const sparkle = (x, y, z, s, up, life) => {
    const c = pick(PRISMA);
    FX.glow.spawn(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s, z + (Math.random() - 0.5) * s,
      (Math.random() - 0.5) * 0.6, up, (Math.random() - 0.5) * 0.6, c[0], c[1], c[2], life || 0.8, 0, 0.6);
  };

  /* ---------- De grot ---------- */
  const S = 72, H = 44, C = 36, F = 12, AR = 17, GD = 25, GR = 4.4;

  function gen(seed) {
    const w = new World('realm', S, H, S);
    w.skyShade = true;
    const rand = mulberry32(seed);
    const n1 = new Noise2D(rand), n2 = new Noise2D(rand), n3 = new Noise2D(rand);

    // De geode met de schat ligt west, oost of noord; het portaal zuid
    const ga = [Math.PI, 0, -Math.PI / 2][Math.floor(rand() * 3)] + (rand() - 0.5) * 0.6;
    const gdx = Math.cos(ga), gdz = Math.sin(ga);
    const gx = Math.round(C + gdx * GD), gz = Math.round(C + gdz * GD);
    const GY = F + 3;

    const arena = new Uint8Array(S * S), heights = new Int16Array(S * S), ceil = new Int16Array(S * S);
    const corridor = new Uint8Array(S * S);
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const i = z * S + x;
        const dx = x + 0.5 - C, dz = z + 0.5 - C, d = Math.hypot(dx, dz);
        const cb = F + 16 + Math.round(n3.fbm(x / 8, z / 8, 2) * 6) - Math.round(Math.max(0, d - 24) * 0.3);
        ceil[i] = cb;
        if (d <= AR + n1.noise(x / 5, z / 5) * 0.9) { arena[i] = 1; heights[i] = F; continue; }
        let h = F + 3 + Math.floor((n2.fbm(x / 9, z / 9, 3) + 0.5) * 5);
        const edge = Math.min(x, z, S - 1 - x, S - 1 - z);
        if (edge < 7) h += (7 - edge) * 3;
        // gang en kamer naar de geode
        const along = dx * gdx + dz * gdz, across = Math.abs(-dx * gdz + dz * gdx);
        if (along > 12 && along < GD && across < 2.6) { h = F; corridor[i] = 1; }
        if (Math.hypot(x - gx, z - gz) < 6.8) { h = F; corridor[i] = 2; }
        if (h >= cb - 2) h = H - 1;
        heights[i] = h;
      }
    }

    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const i = z * S + x, h = heights[i];
        const dx = x + 0.5 - C, dz = z + 0.5 - C, d = Math.hypot(dx, dz);
        for (let y = 0; y <= h; y++) w.setRaw(x, y, z, y === 0 ? B.BEDROCK : SLATE);
        if (h < H - 1) {
          let top = SLATE;
          if (arena[i]) {
            const ray = Math.abs(Math.sin(Math.atan2(dz, dx) * 4)) < 2.4 / Math.max(1, d);
            if (d < 2.2) top = PRISM;
            else if (d < 3.3) top = CALC;
            else if (d >= 6 && d < 7) top = AME;
            else if (d >= 7 && d < 15 && ray) top = CALC;
            else if (d >= 15.3) top = CALC;
            else if (rand() < 0.035) top = AME;
          } else if (corridor[i]) {
            top = rand() < 0.3 ? CALC : SLATE;
          } else if (n1.noise(x / 4, z / 4) > 0.28) top = CALC;
          else if (rand() < 0.03) top = AME;
          w.setRaw(x, h, z, top);
          // plafond met hier en daar een gloeiende ster
          for (let y = ceil[i]; y < H; y++) w.setRaw(x, y, z, SLATE);
          if (rand() < 0.09) w.setRaw(x, ceil[i], z, rand() < 0.3 ? PRISM : AME);
        }
      }
    }

    // Rotswanden: gloeiende amethist en calciet in de zichtbare kanten
    for (let z = 1; z < S - 1; z++) {
      for (let x = 1; x < S - 1; x++) {
        const h = heights[z * S + x];
        if (arena[z * S + x] || h <= F) continue;
        const lo = Math.min(heights[z * S + x - 1], heights[z * S + x + 1], heights[(z - 1) * S + x], heights[(z + 1) * S + x]);
        for (let y = Math.max(F + 1, lo + 1); y < Math.min(h, H - 1); y++) {
          const r = rand();
          if (r < 0.06) w.setRaw(x, y, z, AME);
          else if (r < 0.13) w.setRaw(x, y, z, CALC);
        }
        if (h < H - 2 && h + 1 < ceil[z * S + x] && rand() < 0.07) w.setRaw(x, h + 1, z, CLUS);
      }
    }

    // Gloeiend spoor door de gang
    for (let k = 18; k < GD - 5; k += 2) {
      const x = Math.floor(C + gdx * k), z = Math.floor(C + gdz * k);
      w.setRaw(x, F, z, AME);
    }

    // Grote kristallen op de rotsen
    for (let n = 0, tries = 0; n < 14 && tries < 300; tries++) {
      const x = 3 + Math.floor(rand() * (S - 6)), z = 3 + Math.floor(rand() * (S - 6));
      const i = z * S + x, h = heights[i];
      if (arena[i] || corridor[i] || h >= H - 3 || Math.hypot(x - gx, z - gz) < 8) continue;
      const top = Math.min(ceil[i] - 1, h + 3 + Math.floor(rand() * 6));
      const tx = rand() < 0.5 ? 1 : 0, tz = tx ? 0 : 1, wide = rand() < 0.4;
      for (let y = h + 1, s = 0; y <= top; y++, s++) {
        const ox = Math.floor(s / 3) * tx, oz = Math.floor(s / 3) * tz;
        const id = y === top ? PRISM : AME;
        w.setRaw(x + ox, y, z + oz, id);
        if (wide && y < top - 1) { w.setRaw(x + ox + 1, y, z + oz, id); w.setRaw(x + ox, y, z + oz + 1, id); }
      }
      n++;
    }

    // Vier kristalzuilen in de arena als dekking (houden lasers tegen)
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = Math.floor(C + sx * 7.8) - (sx < 0 ? 1 : 0), pz = Math.floor(C + sz * 7.8) - (sz < 0 ? 1 : 0);
      for (let dz = 0; dz < 2; dz++) {
        for (let dx = 0; dx < 2; dx++) {
          for (let y = F + 1; y <= F + 4; y++) w.setRaw(px + dx, y, pz + dz, y <= F + 2 ? CALC : AME);
        }
      }
      w.setRaw(px, F + 5, pz, PRISM); w.setRaw(px + 1, F + 5, pz + 1, PRISM); w.setRaw(px, F + 6, pz, PRISM);
    }

    // Druipstenen van kristal aan het plafond
    for (let n = 0; n < 90; n++) {
      const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
      const i = z * S + x;
      if (heights[i] >= H - 2) continue;
      const cy = ceil[i];
      const minY = arena[i] ? F + 11 : heights[i] + 4;
      const len = 1 + Math.floor(rand() * 4);
      for (let k = 1; k <= len; k++) {
        const y = cy - k;
        if (y < minY) break;
        w.setRaw(x, y, z, k === len ? (rand() < 0.5 ? AME : PRISM) : SLATE);
      }
    }

    // De geode: wit calciet met gloeiende amethist, van binnen hol
    for (let dy = -5; dy <= 5; dy++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let dx = -5; dx <= 5; dx++) {
          const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (r >= GR) continue;
          const y = GY + dy;
          let id;
          if (r < 2.7) id = y <= F ? AME : B.AIR;
          else if (r < 3.5) id = AME;
          else id = rand() < 0.22 ? AME : CALC;
          w.setRaw(gx + dx, y, gz + dz, id);
        }
      }
    }
    // clusters binnenin en bovenop
    for (let dz = -4; dz <= 4; dz++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = gx + dx, z = gz + dz;
        if (w.get(x, F + 1, z) === B.AIR && (dx || dz) && Math.hypot(dx, dz) < 2.5 && rand() < 0.5) {
          const wall = SOLID[w.get(x + 1, F + 1, z)] || SOLID[w.get(x - 1, F + 1, z)] || SOLID[w.get(x, F + 1, z + 1)] || SOLID[w.get(x, F + 1, z - 1)];
          if (wall) w.setRaw(x, F + 1, z, CLUS);
        }
        for (let y = GY + 5; y > GY; y--) {
          const id = w.get(x, y, z);
          if (id === CALC || id === AME) { if (w.get(x, y + 1, z) === B.AIR && rand() < 0.35) w.setRaw(x, y + 1, z, CLUS); break; }
        }
      }
    }
    w.setRaw(gx, GY + 2, gz, PRISM);
    w.setRaw(gx, F + 1, gz, B.CHEST);

    // Aankomstportaal aan de zuidkant
    const pz = C + 15;
    for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
    for (let i = -1; i <= 2; i++) {
      for (let y = F + 1; y <= F + 5; y++) {
        const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
        w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
      }
      for (let y = F + 1; y <= F + 5; y++) for (const dz of [-1, 1]) if (w.get(C + i, y, pz + dz) === CLUS) w.setRaw(C + i, y, pz + dz, B.AIR);
    }
    w.setRaw(C - 1, F + 6, pz, AME); w.setRaw(C + 2, F + 6, pz, AME);
    w.portalAxis = 'x';

    w.computeTops();
    return {
      world: w,
      spawn: { x: C + 1, y: F + 1, z: pz - 2.5 },
      spawnYaw: 0,
      bossSpawn: { x: C + 0.5, y: F + 1, z: C - 1.5 },
      portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
      portalAxis: 'x',
      arenaCenter: { x: C, z: C }, arenaRadius: AR, floorY: F + 1,
      treasure: { x: gx, y: F + 1, z: gz },
      geode: { x: gx + 0.5, y: GY + 0.5, z: gz + 0.5, dx: gdx, dz: gdz },
    };
  }

  /* ---------- Texturen van de golem ---------- */
  const TX = {};
  const CACHE = {};
  function buildTextures() {
    const R = mulberry32(1313131);
    const v = (c, k) => { const d = (R() - 0.5) * 2 * k; return [c[0] + d, c[1] + d, c[2] + d]; };
    const cells = [];
    for (let i = 0; i < 7; i++) cells.push([R() * 16, R() * 16]);
    const facet = new Uint8Array(256), fid = new Uint8Array(256);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const vo = voronoi(cells, x, y, 16);
        facet[y * 16 + x] = vo.edge < 0.75 ? 1 : 0;
        fid[y * 16 + x] = vo.i;
      }
    }
    const sh = [0.75, 1, 1.15, 0.88, 1.05, 0.95, 1.1];
    const body = (x, y) => {
      if (facet[y * 16 + x]) return v([180, 146, 236], 6);
      const k = sh[fid[y * 16 + x] % 7];
      return v([104 * k, 62 * k, 172 * k], 6);
    };
    TX.body = pixelTexture(16, 16, body);
    TX.bodyGlow = pixelTexture(16, 16, (x, y) => (facet[y * 16 + x] ? [130, 90, 200] : [22, 10, 40]));
    const vein = (x, y) => (x + y * 3) % 11 === 0 || (x * 2 + y) % 13 === 0;
    TX.rock = pixelTexture(16, 16, (x, y) => (vein(x, y) ? [200, 140, 255] : v(R() < 0.4 ? [52, 46, 66] : [66, 58, 82], 6)));
    TX.rockGlow = pixelTexture(16, 16, (x, y) => (vein(x, y) ? [180, 110, 255] : [0, 0, 0]));
    TX.shard = pixelTexture(4, 16, (x, y) => {
      const cols = [[255, 255, 255], [255, 190, 236], [214, 180, 255], [160, 214, 255], [170, 255, 226]];
      const c = cols[Math.min(4, Math.floor(y / 3.4))];
      return x === 0 ? [255, 255, 255] : v(c, 6);
    });
    const eye = (x, y) => ((x >= 3 && x <= 5) || (x >= 10 && x <= 12)) && (y === 6 || y === 7);
    const socket = (x, y) => ((x >= 2 && x <= 6) || (x >= 9 && x <= 13)) && y >= 4 && y <= 8;
    TX.face = pixelTexture(16, 16, (x, y) => {
      if (eye(x, y)) return [210, 255, 255];
      if (socket(x, y)) return [22, 12, 40];
      if (y === 11 && x >= 4 && x <= 11) return [24, 14, 40];
      if (y === 12 && (x === 5 || x === 8 || x === 10)) return [24, 14, 40];
      return body(x, y);
    });
    TX.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [255, 255, 255] : socket(x, y) ? [0, 0, 0] : facet[y * 16 + x] ? [110, 70, 170] : [0, 0, 0]));
    TX.core = pixelTexture(8, 8, (x, y) => {
      const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
      return d < 1.5 ? [255, 255, 255] : d < 2.5 ? [255, 190, 250] : [210, 120, 255];
    });
  }

  function shared() {
    if (CACHE.spikeGeo) return CACHE;
    if (!TX.body) buildTextures();
    CACHE.spikeGeo = new THREE.BoxGeometry(0.45, 2.0, 0.45).translate(0, 1.0, 0);
    CACHE.spikeGeo.userShared = true;
    CACHE.spikeMat = new THREE.MeshLambertMaterial({ map: TX.shard, emissive: 0xffffff, emissiveMap: TX.shard, emissiveIntensity: 0.55 });
    CACHE.shardGeo = new THREE.BoxGeometry(0.35, 1.3, 0.35);
    CACHE.shardGeo.userShared = true;
    CACHE.boltGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    CACHE.boltMat = new THREE.MeshBasicMaterial({ map: TX.shard });
    CACHE.beamMats = LASER_HEX.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, depthWrite: false }));
    CACHE.beamCore = new THREE.MeshBasicMaterial({ color: 0xffffff });
    CACHE.pylonBase = new THREE.BoxGeometry(1.0, 0.45, 1.0).translate(0, 0.22, 0);
    CACHE.pylonShaft = new THREE.BoxGeometry(0.6, 1.8, 0.6).translate(0, 1.35, 0);
    CACHE.pylonTop = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    for (const g of [CACHE.boltGeo, CACHE.pylonBase, CACHE.pylonShaft, CACHE.pylonTop]) g.userShared = true;
    CACHE.rockMat = new THREE.MeshLambertMaterial({ map: TX.rock, emissive: 0xffffff, emissiveMap: TX.rockGlow, emissiveIntensity: 0.8 });
    CACHE.topMat = new THREE.MeshBasicMaterial({ map: TX.core });
    return CACHE;
  }

  /* ---------- Kristalzuil (handlanger die het schild voedt) ---------- */
  function pylonModel() {
    const K = shared();
    const shaftMat = new THREE.MeshLambertMaterial({ map: TX.shard, emissive: 0xffffff, emissiveMap: TX.shard, emissiveIntensity: 0.7 });
    const group = new THREE.Group(), inner = new THREE.Group();
    group.add(inner);
    inner.add(new THREE.Mesh(K.pylonBase, K.rockMat));
    inner.add(new THREE.Mesh(K.pylonShaft, shaftMat));
    const top = new THREE.Mesh(K.pylonTop, K.topMat);
    top.rotation.set(Math.PI / 4, 0, Math.PI / 4);
    inner.add(top);
    inner.scale.set(1, 0.05, 1);
    let grow = 0;
    return {
      group, mats: [shaftMat],
      animate(m, dt) {
        grow = Math.min(1, grow + dt * 2.2);
        inner.scale.y = Math.max(0.05, grow);
        top.position.y = 2.6 + Math.sin(game.time * 3 + m.pos.x) * 0.12;
        top.rotation.y += dt * 2.5;
        if (Math.random() < dt * 6) sparkle(m.pos.x, m.pos.y + 2.6, m.pos.z, 0.6, 0.6, 0.6);
      },
    };
  }

  function pylonHurt(amount) { return Minion.prototype.hurt.call(this, amount, null); }
  function pylonDie(quiet) {
    if (this.dead) return;
    Minion.prototype.die.call(this, quiet);
    if (quiet) return;
    SND.play('shatter', { at: this.pos, range: 40 });
    for (let i = 0; i < 16; i++) {
      const c = pick(PRISMA);
      FX.debris.spawn(this.pos.x, this.pos.y + 0.5 + Math.random() * 2, this.pos.z, (Math.random() - 0.5) * 5, 2 + Math.random() * 4, (Math.random() - 0.5) * 5, c[0], c[1], c[2], 0.9, 14, 0.4, true);
    }
    const b = game.boss;
    if (b && b.pylons) {
      const left = b.pylons.filter((m) => !m.dead).length;
      if (left > 0) HUD.actionbar('Kristalzuil kapot! Nog ' + left + (left === 1 ? ' zuil' : ' zuilen'), 1.8);
    }
  }

  /* ---------- Vallende scherf: waarschuwingscirkel, dan valt er een kristal uit het plafond ---------- */
  class FallingShard extends GroundHazard {
    constructor(o) {
      super(o);
      this.shard = new THREE.Mesh(CACHE.shardGeo, CACHE.spikeMat);
      this.shard.scale.set(2, 1.6, 2);
      this.shard.visible = false;
      this.shard.rotation.set(0.15, Math.random() * 3, 0.1);
      this.mesh.add(this.shard);
    }
    update(dt) {
      super.update(dt);
      const fall = 0.42;
      if (!this.fired) {
        const k = (this.t - (this.warn - fall)) / fall;
        if (k > 0) { this.shard.visible = true; this.shard.position.y = 1 + 12 * (1 - k * k); }
      } else {
        const k = (this.t - this.warn) / Math.max(0.01, this.linger);
        this.shard.position.y = 1 - k * 1.2;
      }
    }
  }

  /* ---------- De Kristalgolem ---------- */
  class CrystalGolem extends BossBase {
    constructor(world, info) {
      super(world, info, { name: 'De Kristalgolem', ref: 'de Kristalgolem', hp: 1000, hw: 1.4, h: 5.2, deathTiles: [T.CRYSTAL_AMETHYST, T.CRYSTAL_CALCITE, T.CRYSTAL_PRISM] });
      this.anim = { armL: 0.2, armR: 0.2, armZ: 0.1, legL: 0, legR: 0, lean: 0.3, head: 0.5, crouch: 0.6, glow: 0.3 };
      this.shield = false; this.shieldT = 0; this.shieldAge = 0; this.shieldK = 0; this.shieldHitT = 0;
      this.pylons = []; this.hintCD = 0; this.lastAtk = ''; this.firstShield = true;
    }

    buildModel() {
      const K = shared();
      const body = new THREE.MeshLambertMaterial({ map: TX.body, emissive: 0xffffff, emissiveMap: TX.bodyGlow, emissiveIntensity: 0.6 });
      const rock = new THREE.MeshLambertMaterial({ map: TX.rock, emissive: 0xffffff, emissiveMap: TX.rockGlow, emissiveIntensity: 0.7 });
      const shard = new THREE.MeshLambertMaterial({ map: TX.shard, emissive: 0xffffff, emissiveMap: TX.shard, emissiveIntensity: 0.5 });
      const face = new THREE.MeshLambertMaterial({ map: TX.face, emissive: 0xffffff, emissiveMap: TX.faceGlow, emissiveIntensity: 1 });
      const core = new THREE.MeshBasicMaterial({ map: TX.core });
      const group = new THREE.Group(), inner = new THREE.Group();
      group.add(inner);
      const spike = (parent, x, y, z, rx, rz, s) => {
        const m = new THREE.Mesh(K.shardGeo, shard);
        m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.scale.setScalar(s || 1);
        parent.add(m);
        return m;
      };
      const legs = [];
      for (const sx of [-1, 1]) {
        const p = new THREE.Group();
        p.position.set(sx * 0.78, 1.7, 0);
        p.add(bossBox(1.0, 1.7, 1.0, rock, -0.85));
        p.add(bossBox(1.25, 0.45, 1.4, body, -1.48, 0, 0.12));
        inner.add(p);
        legs.push(p);
      }
      const torso = new THREE.Group();
      torso.position.y = 1.7;
      inner.add(torso);
      torso.add(bossBox(2.9, 2.2, 1.6, body, 1.1));
      const coreM = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), core);
      coreM.position.set(0, 1.2, 0.78);
      coreM.rotation.z = Math.PI / 4;
      torso.add(coreM);
      // kristalpunten op schouders en rug
      spike(torso, -1.3, 2.35, 0.1, 0.1, 0.55, 1.1); spike(torso, -1.0, 2.45, -0.35, -0.3, 0.25, 0.9);
      spike(torso, 1.3, 2.35, 0.1, 0.1, -0.55, 1.1); spike(torso, 1.0, 2.45, -0.35, -0.3, -0.25, 0.9);
      spike(torso, 0, 2.0, -0.9, -0.75, 0, 1.2); spike(torso, -0.6, 1.4, -0.9, -0.9, 0.3, 0.9); spike(torso, 0.6, 1.4, -0.9, -0.9, -0.3, 0.9);
      const arms = [];
      for (const sx of [-1, 1]) {
        const p = new THREE.Group();
        p.position.set(sx * 1.95, 1.85, 0);
        p.add(bossBox(0.9, 1.6, 0.9, rock, -0.75));
        p.add(bossBox(1.25, 1.25, 1.25, body, -2.05));
        spike(p, sx * 0.45, -2.2, 0.35, 0.6, -sx * 0.7, 0.7);
        spike(p, sx * 0.1, -2.35, -0.5, -0.7, -sx * 0.2, 0.6);
        torso.add(p);
        arms.push(p);
      }
      const head = new THREE.Group();
      head.position.set(0, 2.2, 0.15);
      torso.add(head);
      head.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 1.2).translate(0, 0.57, 0), [body, body, body, body, face, body]));
      spike(head, -0.4, 1.35, 0, 0, 0.35, 0.6); spike(head, 0, 1.5, 0, 0, 0, 0.75); spike(head, 0.4, 1.35, 0, 0, -0.35, 0.6);
      // schild (gefacetteerde bol met regenboogvlakken)
      const sg = new THREE.IcosahedronGeometry(3.5, 0);
      const cols = [];
      const n = sg.attributes.position.count;
      for (let i = 0; i < n; i += 3) {
        const c = PRISMA[(i / 3) % PRISMA.length];
        for (let k = 0; k < 3; k++) cols.push(c[0], c[1], c[2]);
      }
      sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const shieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
      const shieldM = new THREE.Mesh(sg, shieldMat);
      shieldM.position.y = 2.6;
      shieldM.visible = false;
      shieldM.renderOrder = 5;
      group.add(shieldM);
      // zwevende scherven in fase 2
      const orbit = new THREE.Group();
      orbit.position.y = 3.2;
      orbit.visible = false;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        spike(orbit, Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5, 0.3, 0.3, 1.2);
      }
      group.add(orbit);
      return { group, inner, legs, torso, arms, head, core: coreM, coreMat: core, shield: shieldM, shieldMat, orbit, body, rock, shard, face, mats: [body, rock, shard, face] };
    }

    // Schade: met schild alleen een teruggekaatste kristalbol
    hurt(amount, kind) {
      if (this.shield && this.alive()) {
        if (kind === 'fireball') { this.breakShield(); return super.hurt(amount, kind); }
        if (kind !== 'burn') {
          this.shieldHitT = 0.25;
          SND.play('deflect');
          const c = this.center();
          FX.crit(c.x + (player.pos.x - c.x) * 0.4, c.y, c.z + (player.pos.z - c.z) * 0.4);
          if (this.hintCD <= 0) {
            HUD.actionbar('Het schild houdt je tegen! Sla de kristalzuilen kapot of kaats een kristalbol terug!', 2.6);
            this.hintCD = 3;
          }
        }
        return false;
      }
      return super.hurt(amount, kind);
    }

    onWake() { this.shieldT = 0; }
    onReflectHit() { if (this.state !== 'stunned' && this.alive()) this.setState('stagger'); }
    onGoHome() {
      this.shield = false; this.shieldK = 0; this.pylons = []; this.shieldT = 0;
      this.model.shield.visible = false;
    }
    onEnrage() {
      const m = this.model;
      m.body.emissiveIntensity = 1.1; m.shard.emissiveIntensity = 1.0;
      m.face.emissive.setHex(0xff80ff);
      m.orbit.visible = true;
      this.shieldT = Math.min(this.shieldT, 3);
      for (let i = 0; i < 40; i++) sparkle(this.pos.x, this.pos.y + 2.5, this.pos.z, 4, 2, 1.2);
    }
    enragedFx() {
      sparkle(this.pos.x, this.pos.y + 1 + Math.random() * 4, this.pos.z, 3.2, 0.6, 0.7);
    }

    raiseShield() {
      this.shield = true; this.shieldAge = 0;
      this.spawnPylons(this.enraged ? 4 : 3);
      SND.play('freeze', { at: this.pos, range: 50 });
      SND.play('zap', { at: this.pos, range: 50, vol: 0.6 });
      for (let i = 0; i < 40; i++) sparkle(this.pos.x, this.pos.y + 2.6, this.pos.z, 6, 0.5, 1);
      HUD.actionbar('Kristalschild! Sla de kristalzuilen kapot!', 3);
      if (this.firstShield) {
        this.firstShield = false;
        HUD.chat('Het schild wordt gevoed door de kristalzuilen. Sla ze allemaal kapot!');
        HUD.chat('Of sla een kristalbol terug naar de golem.');
      }
    }

    breakShield() {
      if (!this.shield) return;
      this.shield = false;
      this.shieldT = this.enraged ? 8 : 14;
      for (const m of this.pylons) if (!m.dead) m.die(false);
      this.pylons = [];
      const c = this.center();
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2, col = pick(PRISMA);
        FX.debris.spawn(c.x + Math.cos(a) * 3, c.y + e, c.z + Math.sin(a) * 3, Math.cos(a) * 5, 2 + Math.random() * 4, Math.sin(a) * 5, col[0], col[1], col[2], 1.2, 14, 0.4, true);
      }
      SND.play('shatter', { vol: 1 });
      SND.play('explode', { vol: 0.5 });
      game.shake = Math.max(game.shake, 0.6);
      HUD.title('', 'Het schild is kapot! Sla nu!', 2);
      if (this.alive()) this.setState('stunned');
    }

    spawnPylons(n) {
      const ac = this.info.arenaCenter, y = this.info.floorY, w = this.world;
      const a0 = Math.random() * Math.PI * 2;
      for (const m of this.pylons) m.die(true);
      this.pylons = [];
      for (let i = 0; i < n; i++) {
        let spot = null;
        for (let k = 0; k < 24 && !spot; k++) {
          const ang = a0 + i * Math.PI * 2 / n + (k >> 1) * 0.22 * (k % 2 ? 1 : -1);
          const r = 10.5 - (k % 3) * 1.2;
          const x = ac.x + Math.cos(ang) * r, z = ac.z + Math.sin(ang) * r;
          let free = !SOLID[w.get(Math.floor(x), y - 1, Math.floor(z))] ? false : true;
          for (let dy = 0; dy < 3 && free; dy++) {
            for (const [ox, oz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) if (w.solidAt(Math.floor(x + ox), y + dy, Math.floor(z + oz))) free = false;
          }
          if (!free) continue;
          if (Math.hypot(x - this.pos.x, z - this.pos.z) < 4 || Math.hypot(x - player.pos.x, z - player.pos.z) < 2) continue;
          spot = { x, z };
        }
        if (!spot) continue;
        const m = new Minion(w, spot.x, y, spot.z, { name: 'Kristalzuil', hp: 60, hw: 0.5, h: 2.9, model: pylonModel, color: [0.85, 0.6, 1] });
        m.speed = 0; m.dmgAmount = 0; m.life = 1e9;
        m.hurt = pylonHurt; m.die = pylonDie;
        game.addMinion(m);
        this.pylons.push(m);
        FX.ring(spot.x, y, spot.z, 1.5, [0.8, 0.6, 1]);
      }
      if (!this.pylons.length) this.shieldAge = 99;
    }

    updateShield(dt) {
      this.hintCD -= dt;
      if (this.shieldHitT > 0) this.shieldHitT -= dt;
      if (!this.shield) return;
      this.shieldAge += dt;
      let alive = 0;
      const c = this.center();
      for (const m of this.pylons) {
        if (m.dead) continue;
        alive++;
        // energiestraal van zuil naar golem
        if (Math.random() < dt * 30) {
          const k = Math.random(), col = pick(PRISMA);
          FX.glow.spawn(m.pos.x + (c.x - m.pos.x) * k, m.pos.y + 2.6 + (c.y + 0.4 - m.pos.y - 2.6) * k, m.pos.z + (c.z - m.pos.z) * k,
            0, 0, 0, col[0], col[1], col[2], 0.35, 0, 0);
        }
      }
      if (alive === 0) this.breakShield();
      else if (this.shieldAge > 32) {
        // nooit eindeloos: na een halve minuut zakt het schild vanzelf
        this.shield = false; this.shieldT = this.enraged ? 8 : 12;
        for (const m of this.pylons) m.die(true);
        this.pylons = [];
        HUD.actionbar('Het schild zakt weg...', 2);
      }
    }

    think(dt, c) {
      const ph2 = this.enraged;
      this.updateShield(dt);
      let speed = 0;
      switch (this.state) {
        case 'chase':
          this.turnTo(c.targetYaw, dt, ph2 ? 3.2 : 2.4);
          if (c.dist > 3.8) speed = ph2 ? 2.6 : 2.0;
          this.attackCD -= dt;
          if (!this.shield) this.shieldT -= dt;
          if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
          break;
        case 'shieldWind':
          if (Math.random() < dt * 40) sparkle(this.pos.x, this.pos.y + 3, this.pos.z, 3, 0.8, 0.6);
          if (this.t > 1.0) { this.raiseShield(); this.setState('recover', 0.5); }
          break;
        case 'slamWind':
          if (this.t > this.windT) { this.setState('recover', ph2 ? 0.6 : 0.85); this.lastAtk = 'slam'; }
          break;
        case 'laserWind':
          this.turnTo(this.aimYaw, dt, 6);
          if (Math.random() < dt * 30) {
            const cc = this.center();
            sparkle(cc.x + Math.sin(this.yaw) * 0.9, cc.y + 0.2, cc.z + Math.cos(this.yaw) * 0.9, 1.4, 0, 0.4);
          }
          if (this.t > this.windT) this.setState('laserFire');
          break;
        case 'laserFire':
          if (this.t > 0.5) this.setState('recover', ph2 ? 0.4 : 0.7);
          break;
        case 'spikeWind':
          this.turnTo(c.targetYaw, dt, 3);
          if (!this.didHit && this.t > 0.6) { this.didHit = true; this.castSpikeLines(c.p); }
          if (this.t > 0.95) this.setState('recover', ph2 ? 0.4 : 0.7);
          break;
        case 'rainWind':
          if (!this.didHit && this.t > 0.55) { this.didHit = true; this.castRain(c.p); }
          if (this.t > 1.2) this.setState('recover', 0.5);
          break;
        case 'boltWind':
          this.turnTo(c.targetYaw, dt, 4);
          if (this.t > (ph2 ? 0.55 : 0.7)) { this.throwBolts(c.p); this.setState('recover', 0.6); }
          break;
        case 'recover':
          if (this.t > this.recoverTime) {
            this.setState('chase');
            this.attackCD = ph2 ? 0.9 + Math.random() * 0.7 : 1.5 + Math.random() * 1.0;
          }
          break;
        case 'stunned':
          if (Math.random() < dt * 12) sparkle(this.pos.x, this.pos.y + 4.6, this.pos.z, 1.5, 0.3, 0.6);
          if (this.t > (ph2 ? 2.6 : 3.2)) { this.setState('chase'); this.attackCD = 1.0; }
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
      if (!this.shield && this.shieldT <= 0) {
        this.setState('shieldWind');
        SND.play('roar', { vol: 0.5 });
        return;
      }
      if (c.dist < 4.6 && c.p.pos.y < this.pos.y + 2.5) { this.startSlam(); return; }
      const opts = [['laser', 0.3], ['spike', 0.25], ['rain', 0.2], ['bolt', this.shield ? 0.45 : 0.18]];
      let total = 0;
      for (const o of opts) if (o[0] !== this.lastAtk) total += o[1];
      let r = Math.random() * total, a = 'bolt';
      for (const o of opts) {
        if (o[0] === this.lastAtk) continue;
        r -= o[1];
        if (r <= 0) { a = o[0]; break; }
      }
      this.lastAtk = a;
      if (a === 'laser') this.startLasers(c.p);
      else if (a === 'spike') this.setState('spikeWind');
      else if (a === 'rain') { this.setState('rainWind'); SND.play('roar', { vol: 0.4 }); }
      else this.setState('boltWind');
    }

    // (1) Grondslag: kristalpieken in een kring om de golem heen
    startSlam() {
      const ph2 = this.enraged, K = CACHE;
      this.windT = ph2 ? 0.8 : 0.95;
      this.setState('slamWind');
      game.addHazard(new GroundHazard({
        x: this.pos.x, y: this.info.floorY, z: this.pos.z, radius: 4.6, warn: this.windT, linger: 0.7, color: 0xff70d8,
        dmg: this.dmg(17), type: 'crystal', knock: 9, up: 7,
        onTrigger: (h) => {
          const g = new THREE.Group();
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * Math.PI * 2, r = 2 + (i % 3) * 0.9;
            const m = new THREE.Mesh(K.spikeGeo, K.spikeMat);
            m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
            m.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
            g.add(m);
          }
          g.scale.y = 0.05;
          h.mesh.add(g); h.spikes = g;
          SND.play('slam', { at: h, range: 40 });
          SND.play('shatter', { at: h, range: 40, vol: 0.7 });
          game.shake = Math.max(game.shake, 0.6);
          FX.ring(h.x, h.y, h.z, 4.4, [0.85, 0.6, 1]);
          if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, h.type, h.knock, h.up);
        },
        onLinger: (h) => {
          const k = h.t - h.warn;
          if (h.spikes) h.spikes.scale.y = k < 0.12 ? Math.max(0.05, k / 0.12) : Math.max(0.05, 1 - Math.max(0, k - h.linger + 0.3) / 0.3);
        },
      }));
    }

    // (2) Prismalasers: 3 (fase 2: 5) banen in een waaier
    startLasers(p) {
      const ph2 = this.enraged;
      const n = ph2 ? 5 : 3, spread = ph2 ? 0.36 : 0.44;
      this.aimYaw = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      this.windT = ph2 ? 0.95 : 1.15;
      this.setState('laserWind');
      const y = this.info.floorY;
      for (let k = 0; k < n; k++) {
        const ang = this.aimYaw + (k - (n - 1) / 2) * spread;
        const ax = Math.sin(ang), az = Math.cos(ang);
        const sx = this.pos.x + ax * (this.hw + 0.3), sz = this.pos.z + az * (this.hw + 0.3);
        let L = 0;
        while (L < 24) {
          const x = Math.floor(sx + ax * (L + 0.5)), z = Math.floor(sz + az * (L + 0.5));
          if (this.world.solidAt(x, y, z) || this.world.solidAt(x, y + 1, z)) break;
          L += 0.5;
        }
        L = Math.max(1.5, L);
        const ci = (k + (ph2 ? 0 : 1)) % LASER_HEX.length;
        game.addHazard(new LaneHazard({
          x0: sx, z0: sz, x1: sx + ax * L, z1: sz + az * L, y, width: 1.5, warn: this.windT, linger: 0.45,
          color: LASER_HEX[ci], dmg: this.dmg(16), type: 'laser', knock: 6, up: 4,
          onTrigger: (h) => {
            const outer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, h.len), CACHE.beamMats[ci]);
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, h.len), CACHE.beamCore);
            outer.position.y = core.position.y = 1.3;
            h.mesh.add(outer, core);
            h.beam = [outer, core];
            if (k === 0) { SND.play('zap', { at: this.pos, range: 50 }); SND.play('shoot', { at: this.pos, range: 50, vol: 0.6 }); }
            for (let i = 0; i < 6; i++) sparkle(h.x0 + h.dirX * h.len * Math.random(), y + 1.3, h.z0 + h.dirZ * h.len * Math.random(), 0.4, 1, 0.5);
            this.laserHit(h);
          },
          onLinger: (h) => {
            if (h.beam) {
              const k2 = 1 - clamp((h.t - h.warn) / h.linger, 0, 1);
              const s = (0.6 + 0.4 * Math.sin(h.t * 60)) * k2 + 0.05;
              h.beam[0].scale.set(s, s, 1); h.beam[1].scale.set(k2 + 0.05, k2 + 0.05, 1);
            }
            if (h.t - h.warn < 0.25) this.laserHit(h);
          },
        }));
      }
    }

    laserHit(h) {
      if (h.hitDone || !h.playerInside()) return;
      h.hitDone = true;
      damagePlayer(h.dmg, { x: player.pos.x - h.dirZ, y: h.y, z: player.pos.z + h.dirX }, 'laser', h.knock, h.up);
    }

    // (3) Kristalpieken die in lijnen uit de grond schieten
    castSpikeLines(p) {
      const ph2 = this.enraged, K = CACHE;
      const lines = ph2 ? 3 : 1, per = ph2 ? 6 : 8;
      const base = Math.atan2(p.pos.x - this.pos.x, p.pos.z - this.pos.z);
      const y = this.info.floorY, ac = this.info.arenaCenter;
      SND.play('slam', { at: this.pos, range: 40, vol: 0.7 });
      game.shake = Math.max(game.shake, 0.35);
      for (let l = 0; l < lines; l++) {
        const ang = base + (l - (lines - 1) / 2) * 0.5;
        const ax = Math.sin(ang), az = Math.cos(ang);
        for (let i = 0; i < per; i++) {
          const d = 2.4 + i * 1.75;
          const x = this.pos.x + ax * d, z = this.pos.z + az * d;
          if (Math.hypot(x - ac.x, z - ac.z) > AR - 0.6 || this.world.solidAt(Math.floor(x), y, Math.floor(z))) break;
          game.addHazard(new GroundHazard({
            x, y, z, radius: 1.0, warn: 0.6 + i * 0.09, linger: 0.7, color: 0xc060ff,
            dmg: this.dmg(15), type: 'crystal', knock: 3, up: 9,
            onTrigger: (h) => {
              const m = new THREE.Mesh(K.spikeGeo, K.spikeMat);
              m.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 3, (Math.random() - 0.5) * 0.4);
              m.scale.set(1.6, 0.05, 1.6);
              h.mesh.add(m); h.spike = m;
              if (i % 2 === 0) SND.play('shatter', { at: h, range: 30, vol: 0.5 });
              for (let j = 0; j < 5; j++) sparkle(h.x, h.y + 0.3, h.z, 1, 2.5, 0.5);
              if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, h.type, h.knock, h.up);
            },
            onLinger: (h) => {
              if (!h.spike) return;
              const k = h.t - h.warn;
              h.spike.scale.y = k < 0.1 ? Math.max(0.05, k / 0.1) * 1.1 : Math.max(0.05, 1.1 - Math.max(0, k - h.linger + 0.3) / 0.3 * 1.1);
            },
          }));
        }
      }
    }

    // (4) Scherfregen uit het plafond
    castRain(p) {
      const n = this.enraged ? 10 : 7;
      const y = this.info.floorY, ac = this.info.arenaCenter;
      const spots = [{ x: p.pos.x + p.vel.x * 0.3, z: p.pos.z + p.vel.z * 0.3 }];
      for (let tries = 0; spots.length < n && tries < 60; tries++) {
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
        const s = { x: p.pos.x + Math.cos(a) * r, z: p.pos.z + Math.sin(a) * r };
        if (spots.some((o) => Math.hypot(o.x - s.x, o.z - s.z) < 2.2)) continue;
        spots.push(s);
      }
      let i = 0;
      for (const s of spots) {
        const d = Math.hypot(s.x - ac.x, s.z - ac.z);
        if (d > AR - 1.5) { s.x = ac.x + (s.x - ac.x) * (AR - 1.5) / d; s.z = ac.z + (s.z - ac.z) * (AR - 1.5) / d; }
        if (this.world.solidAt(Math.floor(s.x), y, Math.floor(s.z))) continue;
        game.addHazard(new FallingShard({
          x: s.x, y, z: s.z, radius: 1.3, warn: 1.25 + i * 0.12, linger: 0.4, color: 0x60d0ff,
          dmg: this.dmg(14), type: 'shard', knock: 3, up: 5,
          onTrigger: (h) => {
            SND.play('shatter', { at: h, range: 30, vol: 0.6 });
            for (let j = 0; j < 10; j++) {
              const col = pick(PRISMA);
              FX.debris.spawn(h.x, h.y + 0.3, h.z, (Math.random() - 0.5) * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 5, col[0], col[1], col[2], 0.6, 14, 0.5, true);
            }
            if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, h.type, h.knock, h.up);
          },
        }));
        i++;
      }
      SND.play('wind', { vol: 0.5 });
    }

    // Kristalbollen: terug te slaan met het zwaard (breekt het schild!)
    throwBolts(p) {
      const n = this.enraged ? 2 : 1;
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
      const origin = new THREE.Vector3(this.pos.x + fx * 1.6 + rx * 1.6, this.pos.y + 3.6, this.pos.z + fz * 1.6 + rz * 1.6);
      const base = new THREE.Vector3(p.pos.x, p.pos.y + 1.1, p.pos.z).sub(origin).normalize();
      for (let i = 0; i < n; i++) {
        const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), n > 1 ? (i - 0.5) * 0.3 : 0);
        game.addProjectile(new Projectile({
          pos: origin.clone().addScaledVector(dir, 0.5), vel: dir.multiplyScalar(this.enraged ? 10 : 9),
          owner: 'boss', type: 'crystalbolt', dmg: this.dmg(14), radius: 0.4, reflectable: true, reflectDmg: 45,
          homing: 0.5, life: 5.5, knock: 5, mesh: new THREE.Mesh(CACHE.boltGeo, CACHE.boltMat),
          trail: (pr) => { if (Math.random() < 0.7) sparkle(pr.pos.x, pr.pos.y, pr.pos.z, 0.3, 0, 0.4); },
          explodeFx: (pr) => {
            for (let j = 0; j < 12; j++) {
              const col = pick(PRISMA);
              FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5, col[0], col[1], col[2], 0.6, 12, 0.5, true);
            }
            SND.play('shatter', { at: pr.pos, range: 30, vol: 0.6 });
          },
        }));
      }
      SND.play('shoot', { at: origin, range: 40, vol: 0.7 });
      if (this.shield && this.hintCD <= 0) { HUD.actionbar('Sla de kristalbol terug!', 1.8); this.hintCD = 2; }
    }

    die() {
      super.die();
      this.shield = false;
      this.pylons = [];
    }

    // Uit elkaar vallen in fonkelende scherven (geen vuur)
    updateDying(dt) {
      const c = this.center();
      this.model.inner.position.set((Math.random() - 0.5) * 0.3, -this.t * 0.3, (Math.random() - 0.5) * 0.3);
      this.model.inner.rotation.x = this.t * 0.12;
      this.model.shield.visible = false;
      if (Math.random() < dt * 50) sparkle(c.x, c.y, c.z, 3.5, 1.5, 1);
      if (Math.random() < dt * 6) { SND.play('shatter', { vol: 0.5 }); FX.explosion(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 2, 0.4); }
      this.flash = Math.sin(this.t * 30) > 0 ? 0.1 : 0;
      this.applyTint();
      if (this.t > 2.6) {
        for (let i = 0; i < 70; i++) {
          const col = sampleTileColor(this.deathTiles[i % this.deathTiles.length]);
          FX.debris.spawn(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 12, col[0], col[1], col[2], 1.5 + Math.random(), 18, 0.5, true);
        }
        for (let i = 0; i < 40; i++) sparkle(c.x, c.y, c.z, 5, 3, 1.5);
        FX.xpOrbs(c.x, c.y, c.z);
        SND.play('shatter', { vol: 1 });
        SND.play('explode', { vol: 0.8 });
        game.shake = 1.2;
        this.mesh.visible = false;
        this.state = 'dead';
        game.onBossDefeated(this);
      }
    }

    animate(dt, speed) {
      const a = this.anim, ph2 = this.enraged;
      this.walkPhase += dt * speed * 1.7;
      const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.5;
      let armL = sw * 0.6, armR = -sw * 0.6, armZ = 0.12, legL = sw, legR = -sw, lean = 0.05, head = 0, crouch = 0, glow = 0.8, rate = 9;
      const st = this.state, t = this.t;
      switch (st) {
        case 'sleep': case 'idle':
          armL = armR = 0.35; armZ = 0.05; lean = 0.35; head = 0.55; crouch = 0.6; legL = -0.5; legR = -0.5; glow = 0.25; rate = 4;
          break;
        case 'roar': armL = armR = -2.5; armZ = 0.7; lean = -0.2; head = -0.5; glow = 1.4; rate = 6; break;
        case 'shieldWind': armL = armR = -1.5; armZ = -0.55; lean = 0.1; head = 0.2; crouch = 0.15; glow = 1 + t; rate = 8; break;
        case 'slamWind': {
          const k = clamp(t / this.windT, 0, 1);
          armL = armR = -2.9 * easeOut(k); armZ = 0.25; lean = -0.2 * k; crouch = -0.15 * k; head = -0.3; glow = 1.2; rate = 12;
          break;
        }
        case 'laserWind': armL = armR = -0.4; armZ = 1.25; lean = -0.25; head = -0.15; glow = 1.2 + Math.sin(t * 25) * 0.4 + t; rate = 8; break;
        case 'laserFire': armL = armR = -0.3; armZ = 1.35; lean = -0.35; head = -0.2; glow = 2.6; rate = 14; break;
        case 'spikeWind':
          armL = 0.2; armR = t < 0.55 ? -2.8 : 0.5; armZ = 0.2; crouch = t < 0.55 ? 0.1 : 0.45; lean = t < 0.55 ? -0.1 : 0.45; glow = 1.2; rate = t < 0.55 ? 8 : 22;
          break;
        case 'rainWind': armL = armR = -3.0; armZ = 0.45; head = -0.7; lean = -0.15; glow = 1.5; rate = 8; break;
        case 'boltWind': {
          const k = clamp(t / 0.7, 0, 1);
          armL = 0.2; armR = -0.6 - 1.6 * k; armZ = 0.25; lean = -0.1 * k; head = -0.1; glow = 1 + k; rate = 10;
          break;
        }
        case 'recover':
          if (this.lastAtk === 'slam' && t < 0.4) { armL = armR = 0.6; lean = 0.4; crouch = 0.3; rate = 25; } else { armL = armR = 0.3; lean = 0.25; head = 0.2; rate = 6; }
          break;
        case 'stunned':
          armL = armR = 0.6 + Math.sin(t * 5) * 0.15; armZ = 0.4; lean = 0.55; head = 0.6 + Math.sin(t * 4) * 0.2; crouch = 0.7; legL = legR = -0.6; glow = 0.3 + (Math.sin(t * 20) > 0 ? 0.4 : 0); rate = 7;
          break;
        case 'stagger': armL = armR = 0.5 + Math.sin(t * 9) * 0.3; armZ = 0.5; lean = -0.3; head = 0.3; rate = 9; break;
        default: break;
      }
      const k = 1 - Math.exp(-dt * rate);
      for (const [key, val] of [['armL', armL], ['armR', armR], ['armZ', armZ], ['lean', lean], ['head', head], ['crouch', crouch], ['glow', glow]]) a[key] += (val - a[key]) * k;
      a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
      a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
      const m = this.model;
      m.arms[0].rotation.x = a.armL; m.arms[1].rotation.x = a.armR;
      m.arms[0].rotation.z = -a.armZ; m.arms[1].rotation.z = a.armZ;
      m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
      m.torso.rotation.x = a.lean;
      m.head.rotation.x = a.head;
      m.inner.position.y = -a.crouch;
      // gloeiende kern
      m.core.rotation.y += dt * (1.5 + a.glow * 2);
      const pulse = 0.75 + 0.25 * Math.sin(game.time * 4);
      const g = clamp(a.glow * pulse, 0.25, 1);
      if (ph2) m.coreMat.color.setRGB(1, 0.45 + 0.4 * g, 0.75 + 0.25 * g); else m.coreMat.color.setRGB(g, g, 1);
      m.body.emissiveIntensity = (ph2 ? 0.9 : 0.45) + a.glow * 0.25;
      // schild
      this.shieldK += ((this.shield ? 1 : 0) - this.shieldK) * Math.min(1, dt * 6);
      m.shield.visible = this.shieldK > 0.03;
      if (m.shield.visible) {
        m.shield.scale.setScalar(this.shieldK * (1 + Math.sin(game.time * 3) * 0.03 + (this.shieldHitT > 0 ? 0.06 : 0)));
        m.shield.rotation.y += dt * 0.6; m.shield.rotation.x = Math.sin(game.time * 0.7) * 0.3;
        m.shieldMat.opacity = 0.26 + (this.shieldHitT > 0 ? 0.3 : 0) + Math.sin(game.time * 5) * 0.05;
      }
      if (m.orbit.visible) { m.orbit.rotation.y += dt * 2.2; m.orbit.position.y = 3.2 + Math.sin(game.time * 2) * 0.3; }
    }
  }

  /* ---------- Aanmelden ---------- */
  registerRealm('crystal', {
    gen,
    makeBoss: (world, info) => {
      if (typeof DEATH_REASONS !== 'undefined') {
        Object.assign(DEATH_REASONS, {
          laser: 'Geraakt door een prismalaser', crystal: 'Gespietst door kristalpieken',
          shard: 'Geraakt door een vallende kristalscherf', crystalbolt: 'Geraakt door een kristalbol',
        });
      }
      return new CrystalGolem(world, info);
    },
    atmosphere: { background: 0x140b24, fog: 0x231338, near: 12, far: 50, amb: 0xd8c8ff, ambI: 0.85, dir: 0xffe6ff, dirI: 0.5, hand: 0xe2d4ff },
    intro: 'Wat glinstert het hier... Midden in de grot slaapt De Kristalgolem.',
    tip: 'Tip: sla eerst zijn kristalschild kapot! Sla de zuilen stuk of kaats een kristalbol terug.',
    treasureTip: 'De schat zit in een geode: een witte bol van calciet met gloeiende paarse amethist. Volg de paarse stenen door de gang en hak de witte steen open!',
    ambientSound: 0.3,
    ruin: [B.CRYSTAL_CALCITE, B.CRYSTAL_AMETHYST, B.CRYSTAL_SLATE, B.CRYSTAL_CLUSTER],
    ambience(dt, info) {
      const p = player;
      // fonkelingen in de lucht
      game.ashT += dt * 16;
      while (game.ashT > 1) {
        game.ashT -= 1;
        const c = pick(PRISMA);
        FX.glow.spawn(p.pos.x + (Math.random() - 0.5) * 28, p.pos.y + Math.random() * 10, p.pos.z + (Math.random() - 0.5) * 28,
          (Math.random() - 0.5) * 0.3, 0.15 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3, c[0], c[1], c[2], 1.6 + Math.random() * 1.4, 0, 0);
      }
      // na het gevecht fonkelt de geode extra
      if (PROG.phase === 'treasure' && info.geode && Math.random() < dt * 10) {
        const g = info.geode, a = Math.random() * Math.PI * 2;
        FX.glow.spawn(g.x + Math.cos(a) * 4.7, g.y + (Math.random() - 0.5) * 6, g.z + Math.sin(a) * 4.7, 0, 0.6, 0, 0.85, 0.55, 1, 1.2, 0, 0);
      }
    },
  });

  window.CRYSTAL = { gen, Boss: CrystalGolem };
})();
