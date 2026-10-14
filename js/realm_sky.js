'use strict';
/* Portaaljacht – wereld 4: het Hemelrijk met De Stormdraak (bliksem, duikvlucht, stormadem, windstoot) */

// Alles in een eigen functie, zodat namen niet botsen met de andere werelden
(() => {
const STORM_F = 22; // bovenste blok van de arenavloer
const STORM_TEX = {};
// Effecten van deze wereld: storm in de lucht, bliksemflitsen en de waarschuwingsbaan op de vloer
const STORM_FX = { storm: 0, flash: 0, thunderT: 4, windT: 0, rainT: 0, bolts: [], strip: null, info: null };
const STORM_TMP = window.THREE ? {
  a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0), fog: new THREE.Color(0x56627a), white: new THREE.Color(0xffffff),
} : {};

/* ---------- Wereld: zwevende eilanden boven de wolken ---------- */
function genHemelrijk(seed) {
  const S = 72, H = 40, C = 36, F = STORM_F;
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand), n3 = new Noise2D(rand);
  const set = (x, y, z, id) => w.setRaw(x, y, z, id);

  // Het arena-eiland: kwartsvloer met gloeisteenring, lage rand en een wolkenkraag; eronder steen
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.sqrt(dx * dx + dz * dz);
      const en = n1.noise(x / 5, z / 5);
      if (d > 17.3 + en * 1.5) continue;
      if (d < 16.4) {
        const dep = Math.max(2, Math.round(14 * (1 - Math.pow(d / 16.8, 1.7)) + n2.noise(x / 4, z / 4) * 2.5));
        for (let y = F - dep; y <= F - 2; y++) set(x, y, z, rand() < 0.1 ? B.COBBLE : B.STONE);
        if (dep > 8 && rand() < 0.07) set(x, F - dep - 1, z, B.GLOWSTONE);
      }
      if (d < 15.5) {
        set(x, F - 1, z, B.QUARTZ);
        let id = B.QUARTZ;
        if (d >= 5.6 && d < 6.6) id = B.GLOWSTONE;
        else if ((Math.abs(dx) < 1 && Math.abs(dz) < 2) || (Math.abs(dx) < 2 && Math.abs(dz) < 1)) id = B.GLOWSTONE;
        set(x, F, z, id);
        if (d >= 14.5) set(x, F + 1, z, B.QUARTZ);
      } else {
        set(x, F, z, B.CLOUD);
        set(x, F - 1, z, B.CLOUD);
        if (rand() < 0.5) set(x, F - 2, z, B.CLOUD);
        if (n3.noise(x / 3, z / 3) > 0.3) set(x, F + 1, z, B.CLOUD);
      }
    }
  }

  // Lantaarnpalen op de rand (tussen de bruggen in)
  for (let k = 0; k < 12; k++) {
    const a = (k + 0.5) / 12 * Math.PI * 2;
    const px = Math.floor(C + Math.cos(a) * 15), pz = Math.floor(C + Math.sin(a) * 15);
    set(px, F + 1, pz, B.QUARTZ);
    set(px, F + 2, pz, B.QUARTZ);
    set(px, F + 3, pz, k % 4 === 1 ? B.GOLD : B.GLOWSTONE);
  }

  // Vier zuilen als dekking tegen de stormadem
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) / 4 * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const r = 8.6 + rand() * 1.4;
    const px = Math.floor(C + Math.cos(a) * r - 0.5), pz = Math.floor(C + Math.sin(a) * r - 0.5);
    const h = 4 + Math.floor(rand() * 2);
    for (let y = F + 1; y <= F + h + 1; y++) {
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) set(px + dx, y, pz + dz, y === F + h + 1 ? B.GLOWSTONE : B.QUARTZ);
    }
  }

  // Aankomstportaal aan de zuidkant, kijkend naar het midden
  const pz = C + 13;
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) set(C + dx, F, pz + dz, B.OBSIDIAN);
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      set(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  w.portalAxis = 'x';

  // Drie wolkeneilanden (oost, noord, west), elk met een brug naar de arena
  const islands = [];
  for (const group of [[-30, 0, 30], [240, 270, 300], [150, 180, 210]]) {
    const a = group[Math.floor(rand() * 3)] * Math.PI / 180;
    const D = 24.5 + rand() * 2;
    islands.push({ a, D, x: C + Math.cos(a) * D, z: C + Math.sin(a) * D, r: 5.5 + rand() * 0.8 });
  }
  for (const isl of islands) {
    const R = isl.r;
    for (let z = Math.floor(isl.z - R - 3); z <= isl.z + R + 3; z++) {
      for (let x = Math.floor(isl.x - R - 3); x <= isl.x + R + 3; x++) {
        const dd = Math.hypot(x + 0.5 - isl.x, z + 0.5 - isl.z);
        for (let y = F - 6; y <= F + 1; y++) {
          const nn = n3.noise(x / 3.2 + 40, z / 3.2 + y * 0.37);
          if (y <= F) {
            const k = (F - y) / 5.8;
            if (dd > R * Math.sqrt(1 - k * k) + nn * 1.6) continue;
          } else if (dd > R - 0.3 + nn || dd < R - 2.2 || nn < 0.05) continue;
          set(x, y, z, B.CLOUD);
        }
      }
    }
  }
  // Bruggen: kwartspad met wolkenrandjes, met een gat in de arenarand
  for (const isl of islands) {
    const ux = Math.cos(isl.a), uz = Math.sin(isl.a);
    const t1 = isl.D - isl.r + 1.5;
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const px = x + 0.5 - C, pz2 = z + 0.5 - C;
        const along = px * ux + pz2 * uz, ap = Math.abs(-px * uz + pz2 * ux);
        if (along < 13.5 || along > t1 || ap > 2.5) continue;
        const d = Math.hypot(px, pz2);
        if (ap <= 1.5) {
          if (d < 15.5) { if (w.get(x, F + 1, z) === B.QUARTZ) set(x, F + 1, z, B.AIR); continue; }
          set(x, F, z, B.QUARTZ); set(x, F - 1, z, B.CLOUD);
          set(x, F + 1, z, B.AIR); set(x, F + 2, z, B.AIR);
        } else if (d >= 15.5) {
          set(x, F, z, B.CLOUD); set(x, F + 1, z, B.CLOUD); set(x, F - 1, z, B.CLOUD);
        }
      }
    }
  }

  // Verborgen schatkamer in een van de wolkeneilanden, met een gouden kruis erop
  const ti = Math.floor(rand() * islands.length);
  const tIsl = islands[ti];
  const tx = Math.floor(tIsl.x), tz = Math.floor(tIsl.z);
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) for (let y = F + 1; y <= F + 3; y++) set(tx + dx, y, tz + dz, B.AIR);
  const treasure = buildVault(w, tx, F - 3, tz, B.QUARTZ, B.GLOWSTONE);
  for (const [dx, dz] of [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) set(tx + dx, F, tz + dz, B.GOLD);

  // Op de andere wolkeneilanden een paar kwartsruïnes
  islands.forEach((isl, i) => {
    if (i === ti) return;
    for (let k = 0; k < 2; k++) {
      const a = rand() * Math.PI * 2, r = 1 + rand() * 2.2;
      const x = Math.floor(isl.x + Math.cos(a) * r), z = Math.floor(isl.z + Math.sin(a) * r);
      const h = 1 + Math.floor(rand() * 3);
      for (let y = F + 1; y <= F + h; y++) set(x, y, z, B.QUARTZ);
      if (h >= 2) set(x, F + h + 1, z, B.GLOWSTONE);
    }
  });

  // Ver weg: kleine grasseilandjes en hoge wolken (alleen om naar te kijken)
  const blobs = [];
  for (let tries = 0; tries < 300 && blobs.length < 6; tries++) {
    const x = 5 + rand() * (S - 10), z = 5 + rand() * (S - 10);
    if (Math.hypot(x - C, z - C) < 24) continue;
    if (islands.some((il) => Math.hypot(x - il.x, z - il.z) < il.r + 7)) continue;
    if (blobs.some((b) => Math.hypot(x - b.x, z - b.z) < 9)) continue;
    const r = 2.2 + rand() * 1.6, top = F - 7 + Math.floor(rand() * 15);
    blobs.push({ x, z });
    for (let zz = Math.floor(z - r - 1); zz <= z + r + 1; zz++) {
      for (let xx = Math.floor(x - r - 1); xx <= x + r + 1; xx++) {
        const dd = Math.hypot(xx + 0.5 - x, zz + 0.5 - z);
        if (dd > r) continue;
        const dep = Math.max(1, Math.round((1 - dd / r) * 5 + rand()));
        for (let y = top - dep; y <= top; y++) set(xx, y, zz, y === top ? B.GRASS : y > top - 2 ? B.DIRT : B.STONE);
        if (rand() < 0.12) set(xx, top + 1, zz, rand() < 0.5 ? B.TALLGRASS : B.FLOWER_Y);
      }
    }
    if (rand() < 0.6 && top < H - 9) plantTree(w, Math.floor(x), top + 1, Math.floor(z), rand);
  }
  for (let k = 0; k < 6; k++) {
    const a = rand() * Math.PI * 2, r = 19 + rand() * 14;
    const x = C + Math.cos(a) * r, z = C + Math.sin(a) * r, y0 = H - 6 + Math.floor(rand() * 3);
    const rx = 2.5 + rand() * 2.5, rz = 2 + rand() * 2;
    for (let zz = Math.floor(z - rz - 1); zz <= z + rz + 1; zz++) {
      for (let xx = Math.floor(x - rx - 1); xx <= x + rx + 1; xx++) {
        const q = ((xx + 0.5 - x) / rx) ** 2 + ((zz + 0.5 - z) / rz) ** 2;
        if (q > 1) continue;
        set(xx, y0, zz, B.CLOUD);
        if (q < 0.4) set(xx, y0 + 1, zz, B.CLOUD);
      }
    }
  }

  // Landingsplekken voor de draak: vrije stukken vloer van 7x7
  const perchSpots = [];
  for (let z = C - 12; z <= C + 12; z += 2) {
    for (let x = C - 12; x <= C + 12; x += 2) {
      if (Math.hypot(x + 0.5 - C, z + 0.5 - C) > 11.5) continue;
      if (Math.hypot(x + 0.5 - (C + 1), z + 0.5 - pz) < 6) continue;
      let ok = true;
      for (let zz = z - 3; zz <= z + 3 && ok; zz++) {
        for (let xx = x - 3; xx <= x + 3 && ok; xx++) {
          if (!SOLID[w.get(xx, F, zz)]) ok = false;
          for (let y = F + 1; y <= F + 4 && ok; y++) if (w.get(xx, y, zz) !== B.AIR) ok = false;
        }
      }
      if (ok) perchSpots.push({ x: x + 0.5, z: z + 0.5 });
    }
  }

  w.computeTops();
  return {
    world: w,
    spawn: { x: C + 1, y: F + 1, z: pz - 2.5 },
    spawnYaw: 0,
    bossSpawn: { x: C, y: F + 1, z: C - 1 },
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: 14, floorY: F + 1,
    treasure, perchSpots, islands,
  };
}

/* ---------- Texturen van de draak ---------- */
function buildStormTextures() {
  const R = mulberry32(31337);
  const vary = (c, v) => { const k = (R() - 0.5) * 2 * v; return [c[0] + k, c[1] + k, c[2] + k]; };
  const cells = [];
  for (let i = 0; i < 11; i++) cells.push([R() * 16, R() * 16]);
  const edge = new Uint8Array(256), vein = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) edge[y * 16 + x] = voronoi(cells, x, y, 16).edge < 0.85 ? 1 : 0;
  // een zigzaggende bliksemader
  let vx = 5;
  for (let y = 0; y < 16; y++) {
    vein[y * 16 + vx] = 1;
    if (y % 3 === 2) {
      const st = R() < 0.5 ? 15 : 1;
      for (let i = 0; i < 2; i++) { vx = (vx + st) % 16; vein[y * 16 + vx] = 1; }
    }
  }
  const scale = (x, y) => {
    if (vein[y * 16 + x]) return [150, 132, 70];
    if (edge[y * 16 + x]) return vary([26, 32, 52], 4);
    const r = R();
    return vary(r < 0.3 ? [40, 50, 78] : r < 0.65 ? [50, 63, 96] : [58, 73, 108], 5);
  };
  STORM_TEX.scale = pixelTexture(16, 16, scale);
  STORM_TEX.scaleGlow = pixelTexture(16, 16, (x, y) => (vein[y * 16 + x] ? [255, 210, 60] : [0, 0, 0]));
  STORM_TEX.belly = pixelTexture(16, 16, (x, y) => (y % 4 === 3 ? vary([70, 82, 108], 4) : vary([106, 120, 148], 6)));
  const wv = (x, y) => x % 5 === 1 || (x + y * 2) % 11 === 0;
  STORM_TEX.wing = pixelTexture(16, 16, (x, y) => {
    if (y === 15 || (y === 14 && x % 4 === 0)) return vary([20, 24, 42], 3);
    if (wv(x, y)) return vary([74, 90, 130], 5);
    return vary([34, 42, 70], 5);
  });
  STORM_TEX.wingGlow = pixelTexture(16, 16, (x, y) => (wv(x, y) && y < 14 ? [255, 214, 80] : [0, 0, 0]));
  STORM_TEX.horn = pixelTexture(8, 8, (x, y) => vary([232 - y * 10, 224 - y * 10, 190 - y * 10], 6));
  STORM_TEX.accent = pixelTexture(8, 8, () => { const r = R(); return r < 0.25 ? [255, 246, 160] : r < 0.75 ? [255, 218, 60] : [226, 168, 30]; });
  STORM_TEX.mouth = pixelTexture(16, 16, (x, y) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return (x + y) % 2 === 0 ? [242, 238, 224] : [198, 192, 178];
    return vary([116, 28, 54], 8);
  });
  // kop van voren: boze wenkbrauwen boven de ogen
  STORM_TEX.face = pixelTexture(16, 16, (x, y) => {
    const ix = x < 8 ? x : 15 - x;
    if (ix >= 1 && ix <= 6 && y === 2 + Math.floor(ix / 2)) return [14, 16, 28];
    if (ix >= 1 && ix <= 6 && y === 3 + Math.floor(ix / 2)) return [30, 36, 58];
    return scale(x, y);
  });
  STORM_TEX.snout = pixelTexture(16, 16, (x, y) => {
    if (y >= 4 && y <= 7 && (x === 3 || x === 4 || x === 11 || x === 12)) return [12, 14, 24];
    if (y >= 12 && x % 3 !== 1) return y === 15 && x % 3 === 2 ? [180, 176, 166] : [240, 236, 222];
    return scale(x, y);
  });
  STORM_TEX.jaw = pixelTexture(16, 16, (x, y) => {
    if (y <= 3 && x % 3 !== 1) return y === 0 && x % 3 === 2 ? [180, 176, 166] : [240, 236, 222];
    return scale(x, y);
  });
  STORM_TEX.eye = pixelTexture(4, 4, (x, y) => ((x === 1 || x === 2) && (y === 1 || y === 2) ? [255, 255, 255] : [255, 238, 176]));
  STORM_TEX.ball = pixelTexture(8, 8, (x, y) => {
    const d = Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
    const r = R();
    if (d < 1) return [255, 255, 240];
    if (d < 2) return r < 0.5 ? [255, 244, 130] : [255, 222, 70];
    return r < 0.35 ? [130, 226, 255] : r < 0.65 ? [255, 230, 90] : [70, 110, 230];
  });
  // pijlen voor de waarschuwingsbaan
  STORM_TEX.strip = pixelTexture(16, 16, (x, y) => {
    const d = Math.abs(x - 7.5);
    const v = ((y + Math.floor(d) + 16) % 16);
    if (x === 0 || x === 15) return [255, 255, 255, 210];
    if (v >= 4 && v < 8 && d < 6.5) return [255, 255, 255, 235];
    return [255, 255, 255, 70];
  });
  STORM_TEX.strip.wrapS = STORM_TEX.strip.wrapT = THREE.RepeatWrapping;
}

function stormMats() {
  const X = STORM_TEX;
  if (!X.mats) {
    const lam = (map, o) => new THREE.MeshLambertMaterial(Object.assign({ map }, o || {}));
    X.mats = {
      scale: lam(X.scale, { emissive: 0xffffff, emissiveMap: X.scaleGlow }),
      face: lam(X.face, { emissive: 0xffffff, emissiveMap: X.scaleGlow }),
      snout: lam(X.snout),
      jawF: lam(X.jaw),
      belly: lam(X.belly),
      wing: lam(X.wing, { emissive: 0xffffff, emissiveMap: X.wingGlow, side: THREE.DoubleSide }),
      horn: lam(X.horn),
      accent: lam(X.accent, { emissive: 0xffc830 }),
      mouth: lam(X.mouth, { emissive: 0xffb830 }),
      eye: new THREE.MeshBasicMaterial({ map: X.eye, color: 0xffe860 }),
    };
  }
  const M = X.mats;
  M.scale.emissiveIntensity = 0.5; M.face.emissiveIntensity = 0.5; M.wing.emissiveIntensity = 0.12;
  M.accent.emissiveIntensity = 0.45; M.mouth.emissiveIntensity = 0;
  M.eye.color.setRGB(0.15, 0.13, 0.05);
  return M;
}

/* ---------- Gedeelde effecten: bliksems, waarschuwingsbaan, stormlucht, wolkenzee ---------- */
function stormFxBuild(info) {
  const F = STORM_FX, g = game.realmGroup;
  F.info = info; F.storm = 0; F.flash = 0; F.thunderT = 3 + Math.random() * 3;
  if (!F.boltMat) {
    F.boltMat = new THREE.MeshBasicMaterial({ color: 0xfffbe6, fog: false });
    F.stripMat = new THREE.MeshBasicMaterial({ map: STORM_TEX.strip, transparent: true, opacity: 0.75, depthWrite: false,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    F.domeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false });
    F.darkMat = new THREE.MeshBasicMaterial({ map: Tex.clouds, color: 0x2e3444, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
    F.seaMat = new THREE.MeshBasicMaterial({ map: Tex.clouds, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
  }
  const C = info.arenaCenter, fy = info.floorY;
  const segGeo = new THREE.BoxGeometry(1, 1, 1);
  F.bolts = [];
  for (let b = 0; b < 3; b++) {
    const grp = new THREE.Group();
    grp.visible = false;
    const segs = [];
    for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(segGeo, F.boltMat); grp.add(s); segs.push(s); }
    g.add(grp);
    F.bolts.push({ group: grp, segs, life: 0, max: 0.3 });
  }
  F.strip = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), F.stripMat);
  F.strip.rotation.order = 'YXZ';
  F.strip.visible = false;
  F.strip.renderOrder = 4;
  g.add(F.strip);
  // donkere stormkoepel over de blauwe lucht
  const dg = new THREE.SphereGeometry(150, 16, 10);
  const pos = dg.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i++) {
    const k = clamp(pos.getY(i) / 150, -1, 1);
    const v = k > 0 ? lerp(0.44, 0.15, Math.min(1, k * 1.6)) : lerp(0.44, 0.3, -k);
    cols.push(v * 0.9, v * 0.95, v * 1.12);
  }
  dg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  F.dome = new THREE.Mesh(dg, F.domeMat);
  F.dome.position.set(C.x, fy, C.z);
  F.dome.renderOrder = -8;
  g.add(F.dome);
  F.dark = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), F.darkMat);
  F.dark.rotation.x = -Math.PI / 2;
  F.dark.position.set(C.x, fy + 22, C.z);
  F.dark.renderOrder = 3;
  g.add(F.dark);
  F.sea = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), F.seaMat);
  F.sea.rotation.x = -Math.PI / 2;
  F.sea.position.set(C.x, -14, C.z);
  F.sea.renderOrder = 3;
  g.add(F.sea);
}

// Bliksemschicht van boven (x, yTop, z) naar beneden (x2, yBot, z2)
function stormBolt(x, yTop, z, x2, yBot, z2, life) {
  const F = STORM_FX;
  if (!F.bolts.length) return;
  let bo = F.bolts[0];
  for (const b of F.bolts) if (b.life < bo.life) bo = b;
  bo.life = bo.max = life || 0.3;
  bo.group.visible = true;
  const P = STORM_TMP.a, Q = STORM_TMP.b, D = STORM_TMP.c;
  P.set(x, yTop, z);
  const n = bo.segs.length;
  for (let i = 0; i < n; i++) {
    const k = (i + 1) / n;
    const j = i === n - 1 ? 0 : 1.1;
    Q.set(lerp(x, x2, k) + (Math.random() - 0.5) * j, lerp(yTop, yBot, k), lerp(z, z2, k) + (Math.random() - 0.5) * j);
    const s = bo.segs[i];
    D.subVectors(Q, P);
    const len = D.length();
    s.position.copy(P).addScaledVector(D, 0.5);
    s.scale.set(i < 2 ? 0.32 : 0.24, len + 0.15, i < 2 ? 0.32 : 0.24);
    s.quaternion.setFromUnitVectors(STORM_TMP.up, D.multiplyScalar(1 / Math.max(len, 1e-4)));
    P.copy(Q);
  }
}

function stormSparks(x, y, z, n, spread) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * (spread || 5);
    const c = Math.random();
    FX.glow.spawn(x, y + 0.2, z, Math.cos(a) * sp, 1 + Math.random() * 4, Math.sin(a) * sp,
      c < 0.5 ? 1 : 0.6, c < 0.5 ? 0.95 : 0.85, c < 0.5 ? 0.45 : 1, 0.35 + Math.random() * 0.3, 6, 2);
  }
}

// Eigen geluiden (de geluidsmotor heeft geen draak)
function stormSnd(kind, at, vol) {
  if (!SND.ctx || SND.muted) return;
  let v = vol === undefined ? 1 : vol;
  if (at) {
    const d = Math.hypot(at.x - player.pos.x, at.y - player.pos.y, at.z - player.pos.z);
    v *= clamp(1 - d / 60, 0.12, 1);
  }
  try {
    switch (kind) {
      case 'screech':
        SND.tone({ type: 'sawtooth', f0: 520, f1: 170, dur: 1.1, vol: 0.16 * v, lp: 2400, vib: 13, vibAmt: 45, a: 0.05 });
        SND.tone({ type: 'square', f0: 760, f1: 260, dur: 0.9, vol: 0.04 * v, lp: 1800, vib: 11, vibAmt: 30, a: 0.05 });
        SND.noiseBurst({ dur: 0.9, vol: 0.16 * v, filter: 'bandpass', f0: 2000, f1: 500, q: 1.3, a: 0.05 });
        break;
      case 'thunder':
        SND.noiseBurst({ dur: 2.4, vol: 0.36 * v, f0: 380, f1: 50, a: 0.03, t: at ? 0 : 0.35 });
        SND.tone({ type: 'sine', f0: 58, f1: 28, dur: 1.8, vol: 0.28 * v, a: 0.05, t: at ? 0 : 0.35 });
        break;
      case 'crackle':
        for (let i = 0; i < 5; i++) SND.noiseBurst({ dur: 0.06, vol: 0.14 * v, filter: 'highpass', f0: 2500 + Math.random() * 2000, t: i * 0.11 + Math.random() * 0.05 });
        SND.tone({ type: 'sawtooth', f0: 110, f1: 240, dur: 0.7, vol: 0.05 * v, lp: 900, vib: 30, vibAmt: 20 });
        break;
      case 'flap':
        SND.noiseBurst({ dur: 0.32, vol: 0.13 * v, f0: 520, f1: 110, a: 0.03 });
        break;
      case 'snap':
        SND.noiseBurst({ dur: 0.12, vol: 0.3 * v, filter: 'bandpass', f0: 1800, f1: 600, q: 1.2 });
        SND.tone({ type: 'square', f0: 240, f1: 90, dur: 0.12, vol: 0.08 * v });
        break;
      case 'growl':
        SND.tone({ type: 'sawtooth', f0: 95, f1: 70, dur: 0.8, vol: 0.18 * v, lp: 600, vib: 18, vibAmt: 10, a: 0.06 });
        break;
      default: break;
    }
  } catch (e) { /* geen geluid */ }
}

/* ---------- Bliksembal van de stormadem (terug te slaan) ---------- */
function makeStormBall(origin, dir, speed, dmg) {
  return new Projectile({
    pos: origin, vel: dir.clone().normalize().multiplyScalar(speed), owner: 'boss', type: 'lightning',
    dmg, reflectable: true, reflectDmg: 14, radius: 0.32, knock: 4,
    mesh: cachedBoxMesh('stormball', 0.5, () => new THREE.MeshBasicMaterial({ map: STORM_TEX.ball })),
    trail: (pr) => {
      const c = Math.random();
      FX.glow.spawn(pr.pos.x + (Math.random() - 0.5) * 0.4, pr.pos.y + (Math.random() - 0.5) * 0.4, pr.pos.z + (Math.random() - 0.5) * 0.4,
        0, 0, 0, c < 0.5 ? 1 : 0.55, c < 0.5 ? 0.92 : 0.85, c < 0.5 ? 0.4 : 1, 0.25, 0, 0);
    },
    explodeFx: (pr) => stormSparks(pr.pos.x, pr.pos.y, pr.pos.z, 18, 4),
  });
}

/* ---------- De Stormdraak ---------- */
class StormDragon extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Stormdraak', ref: 'de Stormdraak', hp: 460, hw: 1.6, h: 2.6,
      deathTiles: [T.OBSIDIAN, T.BLUE_ICE, T.GOLD], wakeRange: 8 });
    this.fv = new THREE.Vector3();        // vliegsnelheid
    this.from = new THREE.Vector3();      // doelpunt / startpunt van een aanval
    this.aim = new THREE.Vector3();
    this.dir = new THREE.Vector3(0, 0, 1); // vaste richting (duikvlucht, windstoot)
    this.headPos = new THREE.Vector3(this.pos.x, this.pos.y + 0.6, this.pos.z + 4);
    this.mouthPos = this.headPos.clone();
    this.box = [0, 0, 0, 0, 0, 0];
    this.circleAng = 0; this.circleDir = Math.random() < 0.5 ? 1 : -1;
    this.sinceLand = 0; this.landAfter = 2; this.lastAttack = ''; this.plan = ['bolt', 'swoop'];
    this.perchTime = 6.5; this.perchLeft = 0; this.perches = 0; this.bitUsed = false;
    this.stunUsed = false; this.forceNext = null;
    this.waves = 0; this.waveT = 0; this.flaps = 0;
    this.swoopS = 0; this.swoopDist = 10; this.secondSwoop = false; this.diveSlope = 0;
    this.prevYaw = this.yaw; this.yawRate = 0; this.prevFlap = 0;
    this.landX0 = 0; this.landY0 = 0; this.landZ0 = 0;
    this.anim = { phase: 0, spread: 0, amp: 0, wingUp: 0, n0: 0.15, n1: 0.2, n2: 0.15, hd: -0.45, jaw: 0, legF: -1.3, legB: 1.3,
      pitch: 0, roll: 0, crouch: 0.5, tail0: -0.3, tailX: 0.1, curl: 0.45, sway: 0.05, glow: 0, eye: 0.15, look: 0 };
    stormFxBuild(info);
  }

  buildModel() {
    if (!STORM_TEX.scale) buildStormTextures();
    const M = stormMats();
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const body = new THREE.Group();
    body.position.y = 1.5;
    inner.add(body);
    body.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 3.4), [M.scale, M.scale, M.scale, M.belly, M.scale, M.scale]));
    for (let i = 0; i < 4; i++) {
      const s = bossBox(0.16, 0.55 - i * 0.07, 0.5, M.accent, 0.22);
      s.position.set(0, 0.68, 1.1 - i * 0.8);
      s.rotation.x = -0.35;
      body.add(s);
    }
    // nek van drie stukken, dan de kop
    const nsz = [[0.9, 0.85, 1.15], [0.78, 0.74, 1.05], [0.68, 0.66, 1.0]];
    const neck = [];
    let parent = body;
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      if (i === 0) g.position.set(0, 0.3, 1.55);
      else g.position.z = nsz[i - 1][2] - 0.12;
      g.add(bossBox(nsz[i][0], nsz[i][1], nsz[i][2], M.scale, 0, 0, nsz[i][2] / 2 - 0.1));
      const sp = bossBox(0.12, 0.38, 0.4, M.accent, 0.18);
      sp.position.set(0, nsz[i][1] / 2 - 0.05, nsz[i][2] / 2 - 0.1);
      sp.rotation.x = -0.4;
      g.add(sp);
      parent.add(g);
      neck.push(g);
      parent = g;
    }
    const head = new THREE.Group();
    head.position.z = nsz[2][2] - 0.1;
    parent.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 1.25).translate(0, 0.05, 0.5), [M.scale, M.scale, M.scale, M.belly, M.face, M.scale]));
    head.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 1.05).translate(0, -0.1, 1.62), [M.scale, M.scale, M.scale, M.mouth, M.snout, M.scale]));
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.3, 1.0);
    jaw.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.26, 1.15).translate(0, -0.08, 0.6), [M.scale, M.scale, M.mouth, M.belly, M.jawF, M.scale]));
    head.add(jaw);
    for (const sx of [-1, 1]) {
      const hn = bossBox(0.2, 0.2, 1.05, M.horn, 0, 0, -0.45);
      hn.position.set(sx * 0.38, 0.45, 0.2);
      hn.rotation.set(0.5, sx * 0.25, 0);
      head.add(hn);
      const eye = bossBox(0.4, 0.16, 0.08, M.eye);
      eye.position.set(sx * 0.33, 0.25, 1.14);
      eye.rotation.z = sx * 0.25;
      head.add(eye);
    }
    const mouth = new THREE.Object3D();
    mouth.position.set(0, -0.25, 2.2);
    head.add(mouth);
    // vleugels: binnenstuk en buitenstuk, elk met bot en vlies
    const wings = [], outer = [];
    for (const sx of [1, -1]) {
      const wg = new THREE.Group();
      wg.rotation.order = 'YXZ';
      wg.position.set(sx * 0.8, 0.5, 0.45);
      wg.add(bossBox(2.7, 0.24, 0.26, M.scale, 0, sx * 1.35, 0));
      wg.add(bossBox(2.7, 0.06, 2.3, M.wing, 0, sx * 1.35, -1.2));
      const og = new THREE.Group();
      og.rotation.order = 'YXZ';
      og.position.x = sx * 2.7;
      og.add(bossBox(2.5, 0.2, 0.2, M.scale, 0, sx * 1.25, 0));
      og.add(bossBox(2.5, 0.05, 1.7, M.wing, 0, sx * 1.25, -0.9));
      wg.add(og);
      body.add(wg);
      wings.push(wg);
      outer.push(og);
    }
    // staart van vier stukken met een bliksemvin
    const tsz = [[0.85, 0.75, 1.25], [0.66, 0.58, 1.2], [0.5, 0.44, 1.15], [0.36, 0.32, 1.1]];
    const tail = [];
    let tp = body;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      if (i === 0) g.position.set(0, 0.05, -1.6);
      else g.position.z = -(tsz[i - 1][2] - 0.12);
      g.add(bossBox(tsz[i][0], tsz[i][1], tsz[i][2], M.scale, 0, 0, -(tsz[i][2] / 2 - 0.08)));
      tp.add(g);
      tail.push(g);
      tp = g;
    }
    const f1 = bossBox(0.1, 0.75, 0.5, M.accent, 0.3, 0, -1.0);
    f1.rotation.x = 0.5;
    const f2 = bossBox(0.1, 0.6, 0.45, M.accent, -0.2, 0, -1.25);
    f2.rotation.x = -0.6;
    tp.add(f1, f2);
    // poten
    const legs = [];
    for (const [lx, lz] of [[0.7, 1.0], [-0.7, 1.0], [0.75, -1.0], [-0.75, -1.0]]) {
      const g = new THREE.Group();
      g.position.set(lx, -0.5, lz);
      g.add(bossBox(0.42, 1.05, 0.5, M.scale, -0.48));
      body.add(g);
      legs.push(g);
    }
    return { group, inner, body, neck, head, jaw, mouth, wings, outer, tail, legs, M,
      mats: [M.scale, M.face, M.snout, M.jawF, M.belly, M.wing, M.horn, M.accent, M.mouth] };
  }

  // Raakdoos: lijf plus kop (de kop steekt ver naar voren)
  aabb() {
    const b = this.box, p = this.pos, h = this.headPos;
    b[0] = Math.min(p.x - 1.5, h.x - 0.75); b[3] = Math.max(p.x + 1.5, h.x + 0.75);
    b[2] = Math.min(p.z - 1.5, h.z - 0.75); b[5] = Math.max(p.z + 1.5, h.z + 0.75);
    b[1] = Math.min(p.y + 0.3, h.y - 0.6); b[4] = Math.max(p.y + 2.5, h.y + 0.7);
    return b;
  }
  center() { return new THREE.Vector3(this.pos.x, this.pos.y + 1.5 - this.anim.crouch, this.pos.z); }

  // Geland is zijn kop een zwakke plek: daar doet een klap meer pijn
  hurt(amount, kind) {
    let a = amount;
    if (kind === 'melee' && !this.flying && (this.state === 'perch' || this.state === 'bite') && this.headNear(2.8)) {
      a *= 1.5;
      if (this.iframe <= 0) {
        FX.crit(this.headPos.x, this.headPos.y + 0.3, this.headPos.z);
        HUD.actionbar('Raak op zijn kop!', 0.8);
      }
    }
    return super.hurt(a, kind);
  }

  onWake(quiet) {
    if (!quiet) { stormSnd('screech', this.pos, 1); STORM_FX.flash = 0.8; }
  }

  onEnrage() {
    STORM_FX.flash = 1;
    stormSnd('screech', this.pos, 1);
    this.forceNext = 'bolt';
    if (this.state === 'perch' || this.state === 'bite') this.perchLeft = Math.min(this.perchLeft, 0.8);
    else if (this.flying && this.state !== 'swoop' && this.state !== 'landing') { this.hideStrip(); this.setState('enrageRoar'); }
  }

  // Zijn eigen bliksembal terug gekregen: hij tuimelt en moet landen
  onReflectHit() {
    if (!this.flying || this.stunUsed || !this.alive()) return;
    if (this.state === 'landing' || this.state === 'swoop' || this.state === 'takeoff') return;
    this.stunUsed = true;
    this.hideStrip();
    this.setState('stagger');
    stormSnd('growl', this.pos, 1);
  }

  enragedFx() {
    const r = Math.random, p = this.pos;
    const c = r();
    FX.glow.spawn(p.x + (r() - 0.5) * 3.4, p.y + 0.8 + r() * 1.8 - this.anim.crouch, p.z + (r() - 0.5) * 3.4,
      (r() - 0.5) * 3, (r() - 0.5) * 3, (r() - 0.5) * 3, 1, c < 0.6 ? 0.95 : 0.6, c < 0.6 ? 0.45 : 1, 0.22, 0, 1);
  }

  onGoHome() {
    this.flying = false;
    this.fv.set(0, 0, 0);
    this.yaw = 0;
    this.hideStrip();
    this.sinceLand = 0; this.landAfter = 2; this.plan = this.enraged ? [] : ['bolt'];
    this.stunUsed = false; this.forceNext = null;
  }

  die() {
    super.die();
    this.hideStrip();
  }

  // Valt (als hij vloog) naar de vloer en spat dan uit elkaar
  updateDying(dt) {
    const I = this.info, C = I.arenaCenter;
    if (this.pos.y > I.floorY) {
      const dx = C.x - this.pos.x, dz = C.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > I.arenaRadius - 4) { this.pos.x += dx / d * dt * 6; this.pos.z += dz / d * dt * 6; }
      this.pos.y = Math.max(I.floorY, this.pos.y - dt * (3 + this.t * 9));
    }
    if (Math.random() < dt * 14) { const c = this.center(); stormSparks(c.x + (Math.random() - 0.5) * 3, c.y, c.z + (Math.random() - 0.5) * 3, 6, 4); }
    this.animate(dt, 0);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    super.updateDying(dt);
  }

  /* --- hulpjes voor het vliegen --- */
  flyTo(tx, ty, tz, maxSpeed, dt, accel) {
    const dx = tx - this.pos.x, dy = ty - this.pos.y, dz = tz - this.pos.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const sp = Math.min(maxSpeed, d * 2.2);
    const inv = d > 1e-4 ? sp / d : 0;
    const k = 1 - Math.exp(-dt * (accel || 3));
    this.fv.x += (dx * inv - this.fv.x) * k;
    this.fv.y += (dy * inv - this.fv.y) * k;
    this.fv.z += (dz * inv - this.fv.z) * k;
    this.pos.addScaledVector(this.fv, dt);
    return d;
  }
  faceTo(x, z, dt, rate) { this.turnTo(Math.atan2(x - this.pos.x, z - this.pos.z), dt, rate); }
  faceVel(dt, rate) { if (this.fv.x * this.fv.x + this.fv.z * this.fv.z > 1) this.turnTo(Math.atan2(this.fv.x, this.fv.z), dt, rate); }

  // Binnen het luchtruim boven de arena blijven
  clampAir() {
    const C = this.info.arenaCenter;
    const dx = this.pos.x - C.x, dz = this.pos.z - C.z, d = Math.hypot(dx, dz);
    if (d > 23) { this.pos.x = C.x + dx / d * 23; this.pos.z = C.z + dz / d * 23; }
    if (this.pos.y < this.info.floorY + 1.2) this.pos.y = this.info.floorY + 1.2;
  }

  // Hoogte waar je op staat onder (x, z)
  groundY(x, z, fromY) {
    const bx = Math.floor(x), bz = Math.floor(z);
    for (let y = Math.floor(fromY); y > fromY - 14; y--) if (SOLID[this.world.get(bx, y, bz)]) return y + 1;
    return null;
  }

  showStrip(x, z, dir, len, width, color) {
    const s = STORM_FX.strip;
    if (!s) return;
    s.visible = true;
    s.material.color.setHex(color);
    s.position.set(x + dir.x * len * 0.5, this.info.floorY + 0.06, z + dir.z * len * 0.5);
    s.rotation.set(-Math.PI / 2, Math.atan2(dir.x, dir.z) + Math.PI, 0);
    s.scale.set(width, len, 1);
    s.material.map.repeat.set(1, len / width);
  }
  hideStrip() { if (STORM_FX.strip) STORM_FX.strip.visible = false; }

  toCircle(cd) {
    this.hideStrip();
    const C = this.info.arenaCenter;
    this.circleAng = Math.atan2(this.pos.z - C.z, this.pos.x - C.x);
    this.setState('circle');
    this.attackCD = cd !== undefined ? cd : (this.enraged ? 0.6 + Math.random() * 0.4 : 1.1 + Math.random() * 0.6);
  }

  startTakeoff() {
    this.flying = true;
    this.vel.set(0, 0, 0);
    this.fv.set(0, 3, 0);
    this.stunUsed = false;
    const p = player, dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 4 && d > 0.01 && !p.dead) { p.kbx += dx / d * 7; p.kbz += dz / d * 7; p.vel.y = Math.max(p.vel.y, 4); }
    FX.ring(this.pos.x, this.pos.y, this.pos.z, 3, [0.92, 0.95, 1]);
    SND.play('whoosh', { at: this.pos, range: 40 });
    this.setState('takeoff');
  }

  pickAttack() {
    if (this.forceNext) { const f = this.forceNext; this.forceNext = null; return f; }
    if (this.sinceLand >= this.landAfter) return 'land';
    if (this.plan.length) return this.plan.shift();
    const p = player, I = this.info, C = I.arenaCenter;
    const pr = Math.hypot(p.pos.x - C.x, p.pos.z - C.z);
    const opts = ['bolt', 'breath'];
    if (pr < 20) opts.push('swoop');
    if (pr < I.arenaRadius + 0.5) opts.push('gust');
    let list = opts.filter((o) => o !== this.lastAttack);
    if (!list.length) list = opts;
    return list[Math.floor(Math.random() * list.length)];
  }

  startAttack(kind) {
    if (kind === 'land') { this.startLand(this.enraged ? 4.5 : (this.perches === 0 ? 6.5 : 6)); return; }
    this.lastAttack = kind;
    this.sinceLand++;
    if (kind === 'bolt') { this.setState('boltWind'); stormSnd('screech', this.pos, 0.7); }
    else if (kind === 'swoop') this.startSwoop();
    else if (kind === 'breath') this.startBreath();
    else this.startGust();
  }

  /* --- bliksem --- */
  strikeAt(x, z, warn) {
    const p = player;
    const gy = this.groundY(x, z, p.pos.y + 1.5);
    if (gy === null) return; // boven de leegte: geen inslag
    game.addHazard(new GroundHazard({ x, y: gy, z, radius: 1.6, warn, linger: 0.35, color: 0xff9400,
      onTrigger: (h) => this.boltHit(h) }));
  }

  boltHit(h) {
    const w = this.world, I = this.info, C = I.arenaCenter;
    const bx = Math.floor(h.x), bz = Math.floor(h.z), by = Math.floor(h.y);
    // een dak boven de cirkel vangt de bliksem op
    let roof = -1;
    for (let y = by + 2; y <= by + 8; y++) if (SOLID[w.get(bx, y, bz)]) { roof = y; break; }
    const endY = roof >= 0 ? roof + 1 : h.y;
    stormBolt(h.x + (Math.random() - 0.5) * 2, h.y + 28, h.z + (Math.random() - 0.5) * 2, h.x, endY, h.z, 0.3);
    stormSparks(h.x, endY, h.z, 26, 6);
    FX.ring(h.x, endY, h.z, 1.4, [1, 0.92, 0.45]);
    // heldere zuil van licht
    for (let i = 0; i < 40; i++) {
      const c = Math.random();
      FX.glow.spawn(h.x + (Math.random() - 0.5) * 0.5, endY + Math.random() * 22, h.z + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5,
        c < 0.6 ? 1 : 0.7, c < 0.6 ? 1 : 0.9, c < 0.6 ? 0.85 : 1, 0.25 + Math.random() * 0.2, 0, 0);
    }
    SND.play('zap', { at: { x: h.x, y: endY, z: h.z }, range: 50 });
    game.shake = Math.max(game.shake, 0.35);
    STORM_FX.flash = Math.max(STORM_FX.flash, 0.75);
    if (roof >= 0) {
      const id = w.get(bx, roof, bz);
      if (BLOCKS[id].hard !== Infinity && !BLOCKS[id].chest && Math.hypot(bx + 0.5 - C.x, bz + 0.5 - C.z) < I.arenaRadius + 3) {
        w.set(bx, roof, bz, B.AIR);
        FX.blockBreak(bx, roof, bz, id);
      }
      return;
    }
    if (h.playerInside()) damagePlayer(this.dmg(this.enraged ? 7 : 6), { x: h.x, y: h.y, z: h.z }, 'lightning', 3, 8.5);
  }

  boltWave(ph2) {
    const p = player, warn = ph2 ? 1.1 : 1.3;
    this.strikeAt(p.pos.x, p.pos.z, warn);
    if (ph2) {
      // tweede inslag waar je naartoe rent
      let ox = p.vel.x, oz = p.vel.z;
      const l = Math.hypot(ox, oz);
      if (l < 2.4) { const a = Math.random() * Math.PI * 2; ox = Math.cos(a) * 3.2; oz = Math.sin(a) * 3.2; }
      else if (l > 4.5) { ox *= 4.5 / l; oz *= 4.5 / l; }
      this.strikeAt(p.pos.x + ox, p.pos.z + oz, warn);
    }
    stormSnd('crackle', this.pos, 0.6);
  }

  /* --- duikvlucht --- */
  startSwoop() {
    const p = player, C = this.info.arenaCenter;
    let dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z;
    let l = Math.hypot(dx, dz);
    if (l < 0.5) { dx = 1; dz = 0; l = 1; }
    let fx = p.pos.x + dx / l * 12, fz = p.pos.z + dz / l * 12;
    const ex = fx - C.x, ez = fz - C.z, el = Math.hypot(ex, ez);
    if (el > 21) { fx = C.x + ex / el * 21; fz = C.z + ez / el * 21; }
    this.from.set(fx, this.info.floorY + 5, fz);
    this.setState('swoopAim');
  }

  beginSwoopWind() {
    const p = player;
    this.from.copy(this.pos);
    this.dir.set(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z);
    let l = this.dir.length();
    if (l < 4) { this.dir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); l = 4; } else this.dir.multiplyScalar(1 / l);
    this.swoopDist = l;
    this.showStrip(this.from.x, this.from.z, this.dir, l + 9, 3.4, 0xff3020);
    this.setState('swoopWind');
    stormSnd('screech', this.pos, 0.9);
  }

  swoopContact(ph2) {
    const p = player;
    if (this.didHit || p.dead) return;
    const fx = this.dir.x, fz = this.dir.z;
    const rx = p.pos.x - this.pos.x, rz = p.pos.z - this.pos.z;
    const along = rx * fx + rz * fz, perp = Math.abs(-rx * fz + rz * fx);
    if (along < -2.2 || along > 4.6 || perp > 1.35 + p.hw) return;
    if (p.pos.y + p.h < this.pos.y + 0.3 || p.pos.y > this.pos.y + 2.6) return;
    this.didHit = true;
    damagePlayer(this.dmg(ph2 ? 9 : 8), { x: this.pos.x - fx * 2, y: this.pos.y, z: this.pos.z - fz * 2 }, 'boss', 10, 7);
  }

  // Wat in de weg staat binnen de arena gaat kapot (de vloer en de rand niet)
  swoopSmash() {
    const w = this.world, I = this.info, C = I.arenaCenter;
    let broke = 0;
    for (let k = 0; k <= 1; k++) {
      const cx = this.pos.x + this.dir.x * k * 2.6, cz = this.pos.z + this.dir.z * k * 2.6;
      const hw = k === 0 ? 1.2 : 0.8;
      const y0 = Math.max(I.floorY, Math.floor(this.pos.y + 0.3)), y1 = Math.floor(this.pos.y + 2.4);
      for (let y = y0; y <= y1; y++) {
        for (let z = Math.floor(cz - hw); z <= Math.floor(cz + hw); z++) {
          for (let x = Math.floor(cx - hw); x <= Math.floor(cx + hw); x++) {
            const id = w.get(x, y, z);
            if (!SOLID[id] || BLOCKS[id].hard === Infinity || BLOCKS[id].chest) continue;
            if (Math.hypot(x + 0.5 - C.x, z + 0.5 - C.z) > I.arenaRadius - 0.8) continue;
            w.set(x, y, z, B.AIR);
            FX.blockBreak(x, y, z, id);
            broke++;
          }
        }
      }
    }
    if (broke) { SND.play('break', { at: this.pos }); game.shake = Math.max(game.shake, 0.3); }
  }

  /* --- stormadem --- */
  startBreath() {
    const p = player, C = this.info.arenaCenter;
    let dx = this.pos.x - p.pos.x, dz = this.pos.z - p.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    let hx = p.pos.x + dx * 9, hz = p.pos.z + dz * 9;
    const ex = hx - C.x, ez = hz - C.z, el = Math.hypot(ex, ez);
    if (el > 21) { hx = C.x + ex / el * 21; hz = C.z + ez / el * 21; }
    this.from.set(hx, this.info.floorY + 5.5, hz);
    this.setState('breathMove');
  }

  breathVolley(ph2) {
    const p = player, n = ph2 ? 5 : 3, spread = ph2 ? 0.2 : 0.24, speed = ph2 ? 11 : 9.5;
    const o = this.mouthPos;
    const bx = p.pos.x - o.x, by = p.pos.y + 0.9 - o.y, bz = p.pos.z - o.z;
    const off = ph2 && this.waves % 2 ? spread * 0.5 : 0;
    for (let i = 0; i < n; i++) {
      const ang = (i - (n - 1) / 2) * spread + off;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const dir = new THREE.Vector3(bx * ca + bz * sa, by, -bx * sa + bz * ca).normalize();
      game.addProjectile(makeStormBall(o.clone().addScaledVector(dir, 0.3), dir, speed, this.dmg(5)));
    }
    SND.play('shoot', { at: o, range: 40 });
    stormSparks(o.x, o.y - 0.2, o.z, 8, 3);
  }

  /* --- windstoot --- */
  startGust() {
    const p = player, I = this.info, C = I.arenaCenter;
    // altijd van buiten naar het midden blazen, zodat niemand van het eiland waait
    let ox = p.pos.x - C.x, oz = p.pos.z - C.z;
    let l = Math.hypot(ox, oz);
    if (l < 3) { ox = this.pos.x - p.pos.x; oz = this.pos.z - p.pos.z; l = Math.hypot(ox, oz) || 1; }
    this.from.set(p.pos.x + ox / l * 7, I.floorY + 3.5, p.pos.z + oz / l * 7);
    this.setState('gustMove');
  }

  beginGustWind() {
    const p = player;
    this.dir.set(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z);
    const l = this.dir.length();
    if (l < 0.5) this.dir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); else this.dir.multiplyScalar(1 / l);
    this.showStrip(this.pos.x, this.pos.z, this.dir, 16, 5.2, 0x10a8e0);
    this.setState('gustWind');
    stormSnd('growl', this.pos, 0.8);
  }

  windBlocked() {
    const p = player, o = STORM_TMP.a, d = STORM_TMP.b;
    o.set(this.pos.x, this.pos.y + 1.6, this.pos.z);
    d.set(p.pos.x - o.x, p.pos.y + 1 - o.y, p.pos.z - o.z);
    const len = d.length();
    if (len < 0.5) return false;
    d.multiplyScalar(1 / len);
    const hit = raycastVoxels(this.world, o, d, len);
    return !!hit && hit.dist < len - 0.6;
  }

  gustFlap() {
    const p = player, D = this.dir;
    for (let i = 0; i < 40; i++) {
      const s = (Math.random() - 0.5) * 5, h = Math.random() * 3;
      FX.debris.spawn(this.pos.x - D.z * s, this.pos.y + h, this.pos.z + D.x * s,
        D.x * (13 + Math.random() * 6) - D.z * s * 0.4, -1 + Math.random() * 2, D.z * (13 + Math.random() * 6) + D.x * s * 0.4,
        0.92, 0.96, 1, 0.9 + Math.random() * 0.4, 0, 0.6);
    }
    SND.play('wind', { at: this.pos, range: 40 });
    stormSnd('flap', this.pos, 1.2);
    game.shake = Math.max(game.shake, 0.25);
    const rx = p.pos.x - this.pos.x, rz = p.pos.z - this.pos.z;
    const along = rx * D.x + rz * D.z, perp = Math.abs(-rx * D.z + rz * D.x);
    if (!p.dead && along > -1 && along < 16 && perp < 2.6 + p.hw && p.pos.y < this.pos.y + 3 && !this.windBlocked()) {
      if (this.flaps === 0) damagePlayer(this.dmg(2), null, 'wind', 0, 0);
      p.kbx += D.x * 11; p.kbz += D.z * 11;
      p.vel.y = Math.max(p.vel.y, 4.5);
    }
    this.flaps++;
  }

  /* --- landen --- */
  perchBlocked(x, z) {
    const fy = this.info.floorY;
    return boxSolid(this.world, x - 1.6, fy, z - 1.6, x + 1.6, fy + 2.6, z + 1.6);
  }

  pickPerch() {
    const p = player, spots = this.info.perchSpots;
    let best = null, bestS = Infinity;
    for (const s of spots) {
      const d = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
      if (d < 3.6 || this.perchBlocked(s.x, s.z)) continue;
      const score = Math.abs(d - 4.8) + Math.random() * 0.8;
      if (score < bestS) { bestS = score; best = s; }
    }
    return best || { x: this.home.x, z: this.home.z };
  }

  startLand(perchTime) {
    const s = this.pickPerch();
    this.from.set(s.x, this.info.floorY + 6.5, s.z);
    this.perchTime = perchTime;
    this.hideStrip();
    this.setState('landMove');
  }

  beginLanding() {
    this.aim.set(this.from.x, this.info.floorY, this.from.z);
    this.landX0 = this.pos.x; this.landY0 = this.pos.y; this.landZ0 = this.pos.z;
    game.addHazard(new GroundHazard({ x: this.aim.x, y: this.info.floorY, z: this.aim.z, radius: 2.8, warn: 1.1, linger: 0.3,
      color: 0x3050ff, dmg: this.dmg(5), type: 'boss', knock: 7, up: 6 }));
    this.setState('landing');
  }

  touchDown() {
    this.pos.copy(this.aim);
    this.flying = false;
    this.vel.set(0, 0, 0);
    this.fv.set(0, 0, 0);
    FX.ring(this.pos.x, this.pos.y, this.pos.z, 3, [0.95, 0.95, 0.92]);
    SND.play('slam', { at: this.pos, range: 40 });
    game.shake = Math.max(game.shake, 0.5);
    this.setState('perch');
    this.perchLeft = this.perchTime;
    this.bitUsed = false;
    this.sinceLand = 0;
    this.landAfter = this.enraged ? 2 : 2 + (this.perches % 2 === 0 ? 1 : 0);
    if (this.perches === 0) { this.plan = ['breath', 'gust']; HUD.actionbar('De Stormdraak is moe! Sla hem nu!', 3); }
    this.perches++;
  }

  headNear(r) { return Math.hypot(player.pos.x - this.headPos.x, player.pos.z - this.headPos.z) < r; }

  think(dt, c) {
    const ph2 = this.enraged, I = this.info, p = c.p;
    this.attackCD -= dt;
    switch (this.state) {
      case 'chase':
        this.startTakeoff();
        break;
      case 'takeoff':
        this.flyTo(this.pos.x + Math.sin(this.yaw) * 2, I.floorY + 8, this.pos.z + Math.cos(this.yaw) * 2, 7, dt, 2.5);
        this.faceTo(p.pos.x, p.pos.z, dt, 1.5);
        if (this.t > 1.4) this.toCircle(ph2 ? 0.5 : 0.9);
        break;
      case 'circle': {
        const C = I.arenaCenter;
        this.circleAng += dt * (ph2 ? 0.55 : 0.42) * this.circleDir;
        const a = this.circleAng + 0.5 * this.circleDir;
        this.flyTo(C.x + Math.cos(a) * 10, I.floorY + 8 + Math.sin(game.time * 0.9) * 0.8, C.z + Math.sin(a) * 10, ph2 ? 9 : 7.5, dt, 1.8);
        this.faceVel(dt, 2.5);
        if (this.attackCD <= 0 && !p.dead) this.startAttack(this.pickAttack());
        break;
      }
      case 'boltWind':
      case 'bolts': {
        const C = I.arenaCenter;
        this.flyTo((p.pos.x + C.x) * 0.5, I.floorY + 12, (p.pos.z + C.z) * 0.5, 9, dt, 2.5);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (this.state === 'boltWind') {
          if (Math.random() < dt * 30) stormSparks(this.mouthPos.x, this.mouthPos.y, this.mouthPos.z, 1, 2);
          if (this.t > (ph2 ? 0.7 : 0.9)) { this.setState('bolts'); this.waves = 0; this.waveT = 0; }
          break;
        }
        const nW = ph2 ? 4 : 3, warn = ph2 ? 1.1 : 1.3;
        this.waveT -= dt;
        if (this.waves < nW && this.waveT <= 0 && !p.dead) { this.boltWave(ph2); this.waves++; this.waveT = ph2 ? 0.6 : 0.75; }
        if ((this.waves >= nW || p.dead) && this.waveT <= -(warn + 0.3)) this.toCircle();
        break;
      }
      case 'swoopAim': {
        const d = this.flyTo(this.from.x, this.from.y, this.from.z, 14, dt, 3);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (this.t > 1.8 || d < 1.2) this.beginSwoopWind();
        break;
      }
      case 'swoopWind':
        this.fv.multiplyScalar(Math.exp(-dt * 4));
        this.pos.addScaledVector(this.fv, dt);
        this.turnTo(Math.atan2(this.dir.x, this.dir.z), dt, 5);
        if (this.t > (this.secondSwoop ? 0.65 : ph2 ? 0.8 : 1.0)) {
          this.from.copy(this.pos);
          this.swoopS = 0;
          this.setState('swoop');
          SND.play('whoosh', { at: this.pos, range: 50 });
        }
        break;
      case 'swoop': {
        const sp = ph2 ? 19 : 17;
        this.swoopS += sp * dt;
        const s = this.swoopS, sT = this.swoopDist, low = I.floorY + 0.05;
        let y;
        if (s < sT) { const k = 1 - s / sT; y = low + (this.from.y - low) * k * k; this.diveSlope = -2 * (this.from.y - low) * k / sT; }
        else { const k = (s - sT) / 5; y = low + k * k * 3.5; this.diveSlope = 1.4 * k; }
        this.pos.set(this.from.x + this.dir.x * s, y, this.from.z + this.dir.z * s);
        this.fv.set(this.dir.x * sp, 0, this.dir.z * sp);
        this.yaw = Math.atan2(this.dir.x, this.dir.z);
        this.swoopContact(ph2);
        this.swoopSmash();
        if (s > sT + 2) this.hideStrip();
        if (s > sT + 9) {
          if (ph2 && !this.secondSwoop && !p.dead) { this.secondSwoop = true; this.fv.multiplyScalar(0.3); this.beginSwoopWind(); }
          else { this.secondSwoop = false; this.toCircle(); }
        }
        return 0;
      }
      case 'breathMove': {
        const d = this.flyTo(this.from.x, this.from.y, this.from.z, 13, dt, 3);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (this.t > 1.8 || d < 1.2) { this.setState('breathWind'); stormSnd('crackle', this.pos, 1); }
        break;
      }
      case 'breathWind':
      case 'breath': {
        this.flyTo(this.from.x, this.from.y, this.from.z, 3, dt, 2);
        this.faceTo(p.pos.x, p.pos.z, dt, this.state === 'breath' ? 3 : 4);
        const m = this.mouthPos;
        if (this.state === 'breathWind') {
          // vonken worden de bek in gezogen
          if (Math.random() < dt * 40) {
            const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random();
            FX.glow.spawn(m.x + Math.cos(a) * r, m.y + (Math.random() - 0.5) * 2, m.z + Math.sin(a) * r,
              -Math.cos(a) * r * 3, 0, -Math.sin(a) * r * 3, 1, 0.95, 0.5, 0.3, 0, 0);
          }
          if (this.t > (ph2 ? 0.65 : 0.8)) { this.setState('breath'); this.waves = 0; this.waveT = 0; }
          break;
        }
        const nV = ph2 ? 5 : 3;
        this.waveT -= dt;
        if (this.waves < nV && this.waveT <= 0 && !p.dead) { this.breathVolley(ph2); this.waves++; this.waveT = ph2 ? 0.36 : 0.45; }
        if ((this.waves >= nV || p.dead) && this.waveT <= -0.35) this.toCircle();
        break;
      }
      case 'gustMove': {
        const d = this.flyTo(this.from.x, this.from.y, this.from.z, 13, dt, 3);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (this.t > 1.8 || d < 1.2) this.beginGustWind();
        break;
      }
      case 'gustWind':
      case 'gust': {
        this.fv.multiplyScalar(Math.exp(-dt * 4));
        this.pos.addScaledVector(this.fv, dt);
        this.turnTo(Math.atan2(this.dir.x, this.dir.z), dt, 4);
        if (this.state === 'gustWind') {
          // lucht wordt naar de draak toe gezogen
          if (Math.random() < dt * 30) {
            const s = (Math.random() - 0.5) * 6, f = 4 + Math.random() * 6;
            FX.debris.spawn(this.pos.x + this.dir.x * f - this.dir.z * s, this.pos.y + Math.random() * 3, this.pos.z + this.dir.z * f + this.dir.x * s,
              -this.dir.x * 9, 0, -this.dir.z * 9, 0.9, 0.95, 1, 0.5, 0, 0);
          }
          if (this.t > (ph2 ? 0.7 : 0.9)) { this.setState('gust'); this.flaps = 0; }
          break;
        }
        const nF = ph2 ? 3 : 2;
        if (this.flaps < nF && this.t >= this.flaps * 0.45) this.gustFlap();
        if (this.t > nF * 0.45 + 0.4) {
          this.hideStrip();
          if (ph2) { this.forceNext = 'bolt'; this.toCircle(0.3); } else this.toCircle();
        }
        break;
      }
      case 'landMove': {
        const d = this.flyTo(this.from.x, this.from.y, this.from.z, 12, dt, 3);
        this.faceVel(dt, 3);
        if (this.t > 2.6 || d < 1) this.beginLanding();
        break;
      }
      case 'landing': {
        const k = clamp(this.t / 1.1, 0, 1), kh = Math.min(1, k * 2);
        this.pos.set(lerp(this.landX0, this.aim.x, kh), lerp(this.landY0, this.aim.y, k * k), lerp(this.landZ0, this.aim.z, kh));
        this.fv.set(0, 0, 0);
        this.faceTo(p.pos.x, p.pos.z, dt, 2);
        if (k >= 1) this.touchDown();
        return 0;
      }
      case 'perch':
        this.perchLeft -= dt;
        this.turnTo(c.targetYaw, dt, 0.9);
        if (ph2 && !this.bitUsed && this.t > 1.0 && this.perchLeft > 1 && this.headNear(3.4) && !p.dead) {
          this.bitUsed = true;
          this.setState('bite');
          stormSnd('growl', this.pos, 1);
          break;
        }
        if (this.perchLeft <= 0) this.startTakeoff();
        return 0;
      case 'bite':
        this.perchLeft -= dt;
        this.turnTo(c.targetYaw, dt, 1.2);
        if (!this.didHit && this.t >= 0.75) {
          this.didHit = true;
          stormSnd('snap', this.pos, 1);
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          const bx = this.pos.x + fx * 4.4, bz = this.pos.z + fz * 4.4;
          if (!p.dead && Math.hypot(p.pos.x - bx, p.pos.z - bz) < 2.3 && p.pos.y < this.pos.y + 2.5) {
            damagePlayer(this.dmg(6), { x: this.pos.x, y: this.pos.y, z: this.pos.z }, 'boss', 8, 5);
          }
        }
        if (this.t > 1.2) this.setState('perch');
        return 0;
      case 'stagger':
        this.fv.multiplyScalar(Math.exp(-dt * 3));
        this.pos.addScaledVector(this.fv, dt);
        this.pos.y -= dt * 2;
        if (Math.random() < dt * 20) stormSparks(this.pos.x, this.pos.y + 1.5, this.pos.z, 3, 4);
        if (this.t > 0.9) this.startLand(ph2 ? 3 : 3.5);
        break;
      case 'enrageRoar': {
        this.flyTo(this.pos.x, Math.max(this.pos.y, I.floorY + 8), this.pos.z, 3, dt, 2);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        // bliksems rondom als show (geen schade)
        if ((this.t > 0.3 && this.t - dt <= 0.3) || (this.t > 0.8 && this.t - dt <= 0.8)) {
          const C = I.arenaCenter, a = Math.random() * Math.PI * 2;
          const x = C.x + Math.cos(a) * 15.5, z = C.z + Math.sin(a) * 15.5;
          stormBolt(x, I.floorY + 30, z, x, I.floorY + 1, z, 0.3);
          stormSparks(x, I.floorY + 1, z, 20, 5);
          SND.play('zap', { vol: 0.7 });
          STORM_FX.flash = 1;
        }
        if (this.t > 1.3) this.toCircle(0.2);
        break;
      }
      default:
        this.toCircle();
        break;
    }
    if (this.flying) this.clampAir();
    return 0;
  }

  animate(dt, speed) {
    const a = this.anim, m = this.model, st = this.state, ph2 = this.enraged, t = this.t;
    const yr = dt > 0 ? angleDiff(this.prevYaw, this.yaw) / dt : 0;
    this.prevYaw = this.yaw;
    this.yawRate += (clamp(yr, -4, 4) - this.yawRate) * Math.min(1, dt * 4);
    const dxp = player.pos.x - this.pos.x, dzp = player.pos.z - this.pos.z;
    const lookAt = clamp(angleDiff(this.yaw, Math.atan2(dxp, dzp)), -0.8, 0.8) * 0.6;
    // standaard: vliegen
    let spread = 1, amp = 0.5, rate = 6.5, wingUp = 0, n0 = -0.25, n1 = 0.05, n2 = 0.1, hd = 0.15, jaw = 0.1;
    let legF = 1.1, legB = 1.3, pitch = 0, roll = clamp(-this.yawRate * 0.35, -0.5, 0.5), crouch = 0;
    let tail0 = -0.06, tailX = -0.05, curl = 0, sway = 0.22, glow = 0, eye = 1, look = 0, k = 6;
    switch (st) {
      case 'sleep':
        spread = 0; amp = 0; n0 = 0.15; n1 = 0.2; n2 = 0.15; hd = -0.45; jaw = 0; legF = -1.3; legB = 1.3;
        roll = 0; crouch = 0.5; tail0 = -0.3; tailX = 0.1; curl = 0.45; sway = 0.05; eye = 0.15; k = 4;
        break;
      case 'idle':
        spread = 0; amp = 0; n0 = -0.2; n1 = 0.15; n2 = 0.2; hd = -0.05; jaw = 0.1; legF = 0; legB = 0;
        roll = 0; tail0 = -0.35; tailX = 0.1; curl = 0.15; sway = 0.12; look = lookAt; k = 4;
        break;
      case 'roar':
        spread = 0.8; amp = 0.3; rate = 9; n0 = -0.8; n1 = -0.25; n2 = 0; hd = 0.4; jaw = 1; legF = 0; legB = 0;
        roll = 0; tail0 = -0.2; tailX = 0.05; sway = 0.3; eye = 1.4; glow = 0.8; look = lookAt * 0.5;
        break;
      case 'takeoff': amp = 0.85; rate = 11; n0 = -0.45; pitch = -0.2; legF = 0.6; legB = 0.7; break;
      case 'boltWind': amp = 0.55; rate = 8; n0 = -0.75; n1 = -0.3; n2 = 0; hd = 0.3; jaw = 0.8; glow = 1; eye = 1.3; break;
      case 'bolts': amp = 0.5; rate = 8; n0 = -0.5; n1 = -0.1; n2 = 0.2; hd = 0.35; jaw = 0.5; glow = 0.8; break;
      case 'swoopWind': amp = 0.65; rate = 9.5; n0 = -0.4; n1 = 0; n2 = 0.25; hd = 0.45; jaw = 0.9; pitch = -0.2; eye = 1.5; glow = 0.6; break;
      case 'swoop':
        spread = 0.55; amp = 0.08; rate = 4; n0 = 0.05; n1 = 0.05; n2 = 0.05; hd = 0; jaw = 0.6; legF = 1.3; legB = 1.4;
        pitch = clamp(-Math.atan(this.diveSlope), -0.7, 0.7); roll = 0; eye = 1.4; k = 10;
        break;
      case 'breathWind': amp = 0.45; rate = 8; n0 = -0.8; n1 = -0.35; n2 = 0.25; hd = 0.35; jaw = 0.65; glow = 1; break;
      case 'breath': amp = 0.45; rate = 8; n0 = -0.05; n1 = 0.3; n2 = 0.3; hd = 0.2; jaw = 1; glow = 1; k = 9; break;
      case 'gustWind': amp = 0.12; rate = 3; wingUp = 1.0; n0 = -0.5; hd = 0.2; jaw = 0.5; pitch = -0.35; break;
      case 'gust': amp = 1.1; rate = 14; n0 = -0.3; hd = 0.1; jaw = 0.4; pitch = -0.25; k = 10; break;
      case 'landing': amp = 0.7; rate = 10; n0 = -0.35; pitch = -0.3; legF = 0; legB = 0; break;
      case 'perch':
        spread = 0; amp = 0; n0 = 0.25; n1 = 0.25; n2 = 0.15; hd = -0.55; jaw = 0.25 + Math.sin(game.time * 5) * 0.15;
        legF = -0.95; legB = 0.95; roll = 0; crouch = 0.42; tail0 = -0.35; tailX = 0.12; curl = 0.12; sway = 0.1; eye = 0.75; look = lookAt;
        break;
      case 'bite':
        spread = 0; amp = 0; legF = -0.5; legB = 0.5; roll = 0; crouch = 0.25; tail0 = -0.35; tailX = 0.12; look = lookAt; eye = 1.5;
        if (t < 0.75) { n0 = -0.55; n1 = -0.15; n2 = 0.35; hd = 0.75; jaw = 1; glow = 0.6; k = 5; } else { n0 = 0.45; n1 = 0.3; n2 = 0.1; hd = -0.25; jaw = 0; k = 22; }
        break;
      case 'stagger':
        spread = 0.7; amp = 0.9; rate = 14; roll = Math.sin(t * 14) * 0.45; pitch = 0.3; n0 = 0.2; n1 = 0.2; hd = 0.2; jaw = 0.7; eye = 0.4; k = 10;
        break;
      case 'enrageRoar':
        amp = 0.35; rate = 9; n0 = -0.9; n1 = -0.3; n2 = 0; hd = 0.45; jaw = 1; glow = 1.5; eye = 1.6;
        break;
      case 'dying':
        spread = 1; amp = 0.12; rate = 12; wingUp = -0.55; n0 = 0.45; n1 = 0.35; n2 = 0.25; hd = 0.15; jaw = 0.7; legF = 0.4; legB = 0.4; roll = 0; eye = 0.5; k = 3;
        break;
      default: break;
    }
    const kk = 1 - Math.exp(-dt * k);
    a.spread += (spread - a.spread) * kk; a.amp += (amp - a.amp) * kk; a.wingUp += (wingUp - a.wingUp) * kk;
    a.n0 += (n0 - a.n0) * kk; a.n1 += (n1 - a.n1) * kk; a.n2 += (n2 - a.n2) * kk; a.hd += (hd - a.hd) * kk;
    a.jaw += (jaw - a.jaw) * Math.min(1, kk * 1.5);
    a.legF += (legF - a.legF) * kk; a.legB += (legB - a.legB) * kk;
    a.pitch += (pitch - a.pitch) * kk; a.roll += (roll - a.roll) * kk; a.crouch += (crouch - a.crouch) * kk;
    a.tail0 += (tail0 - a.tail0) * kk; a.tailX += (tailX - a.tailX) * kk; a.curl += (curl - a.curl) * kk; a.sway += (sway - a.sway) * kk;
    a.glow += (glow - a.glow) * kk; a.eye += (eye - a.eye) * Math.min(1, kk * 1.5); a.look += (look - a.look) * kk;
    a.phase += dt * rate;

    const s = a.spread, fl = Math.sin(a.phase);
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? 1 : -1;
      const wg = m.wings[i], og = m.outer[i];
      wg.rotation.x = -1.4 * (1 - s);
      wg.rotation.y = sx * lerp(1.35, 0.12, s);
      wg.rotation.z = sx * (-0.15 * (1 - s) + s * (a.wingUp + a.amp * fl));
      // opgevouwen: buitenstuk omgeklapt terug langs het binnenstuk, vlies naar beneden
      og.rotation.x = Math.PI * (1 - s);
      og.rotation.y = -sx * 2.7 * (1 - s);
      og.rotation.z = sx * s * (a.amp * 0.9 * Math.sin(a.phase - 0.8) + a.wingUp * 0.4);
    }
    const tt = game.time;
    m.inner.position.y = -a.crouch + (this.flying ? -fl * 0.14 * a.amp * s : Math.sin(tt * 2.2) * 0.04);
    m.inner.position.x = 0; m.inner.position.z = 0;
    m.inner.rotation.x = a.pitch; m.inner.rotation.z = a.roll;
    m.neck[0].rotation.x = a.n0; m.neck[0].rotation.y = a.look;
    m.neck[1].rotation.x = a.n1; m.neck[2].rotation.x = a.n2;
    m.head.rotation.x = a.hd;
    m.jaw.rotation.x = a.jaw * 0.75;
    for (let i = 0; i < 4; i++) {
      m.tail[i].rotation.x = i === 0 ? a.tail0 : a.tailX;
      m.tail[i].rotation.y = a.curl + a.sway * Math.sin(tt * 1.7 - i * 0.9);
    }
    m.legs[0].rotation.x = a.legF; m.legs[1].rotation.x = a.legF;
    m.legs[2].rotation.x = a.legB; m.legs[3].rotation.x = a.legB;

    // gloed: in fase 2 knettert hij van de bliksem
    const M = m.M;
    const pulse = 0.5 + 0.5 * Math.sin(tt * (ph2 ? 9 : 3.5));
    const base = ph2 ? 1.0 + pulse * 0.8 : 0.2 + pulse * 0.15;
    M.scale.emissiveIntensity = base + a.glow * 0.9;
    M.face.emissiveIntensity = base + a.glow * 0.9;
    M.wing.emissiveIntensity = ph2 ? 0.5 + pulse * 0.5 : 0.1 + a.glow * 0.25;
    M.accent.emissiveIntensity = (ph2 ? 1.0 : 0.45) + a.glow * 0.6;
    M.mouth.emissiveIntensity = (st === 'breathWind' || st === 'breath') ? 0.45 + pulse * 0.4 : a.glow * 0.2;
    const ek = clamp(a.eye, 0, 1.6);
    if (ph2 && st !== 'sleep') M.eye.color.setRGB(Math.min(1, ek), 0.3 * ek, 0.16 * ek);
    else M.eye.color.setRGB(Math.min(1, ek), Math.min(1, 0.92 * ek), Math.min(1, 0.36 * ek));

    // vleugelslag hoorbaar
    if (this.flying && a.amp > 0.3 && s > 0.5 && this.prevFlap > 0 && fl <= 0) stormSnd('flap', this.pos, 0.5 * a.amp);
    this.prevFlap = fl;

    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    this.mesh.updateMatrixWorld(true);
    m.head.getWorldPosition(this.headPos);
    m.mouth.getWorldPosition(this.mouthPos);
  }
}

/* ---------- Sfeer per frame: storm, regen, wind en verre bliksem ---------- */
function stormAmbience(dt, info) {
  const F = STORM_FX, b = game.boss, p = player, A = game.realm.atmosphere;
  const want = b && b.awake() ? (b.enraged ? 1 : 0.7) : (b && b.alive() ? 0.12 : 0);
  F.storm += (want - F.storm) * Math.min(1, dt * 0.5);
  F.flash = Math.max(0, F.flash - dt * 3.2);
  const s = F.storm, fl = F.flash;
  if (F.domeMat) {
    F.domeMat.opacity = clamp(s * 0.88 - fl * 0.3, 0, 1);
    F.darkMat.opacity = s * 0.92;
    const sea = 1 - s * 0.5 + fl * 0.25;
    F.seaMat.color.setRGB(sea, sea, Math.min(1, sea * 1.05));
  }
  const L = game.lights;
  L.amb.intensity = A.ambI * (1 - 0.35 * s) + fl * 0.9;
  L.dir.intensity = A.dirI * (1 - 0.6 * s) + fl * 0.3;
  if (game.fogNormal) {
    const c = game.fogNormal.color;
    c.setHex(A.fog).lerp(STORM_TMP.fog, s * 0.8);
    if (fl > 0) c.lerp(STORM_TMP.white, fl * 0.25);
  }
  // bliksemschichten flikkeren
  for (const bo of F.bolts) {
    if (bo.life <= 0) continue;
    bo.life -= dt;
    const age = bo.max - bo.life;
    bo.group.visible = bo.life > 0 && !(age > 0.07 && age < 0.12);
  }
  if (F.strip && F.strip.visible) F.strip.material.map.offset.y = (F.strip.material.map.offset.y + dt * 2.2) % 1;
  // wind: witte streepjes
  F.windT += dt * (5 + s * 12);
  while (F.windT > 1) {
    F.windT -= 1;
    const g = s > 0.4 ? 0.75 : 0.96;
    FX.debris.spawn(p.pos.x + (Math.random() - 0.5) * 30, p.pos.y + (Math.random() - 0.25) * 10, p.pos.z + (Math.random() - 0.5) * 30,
      6 + s * 6, (Math.random() - 0.5) * 0.6, 2 + Math.random() * 2, g, g, Math.min(1, g + 0.05), 1.3, 0, 0);
  }
  // regen in de storm
  if (s > 0.3) {
    F.rainT += dt * 55 * s;
    while (F.rainT > 1) {
      F.rainT -= 1;
      FX.debris.spawn(p.pos.x + (Math.random() - 0.5) * 26, p.pos.y + 9 + Math.random() * 4, p.pos.z + (Math.random() - 0.5) * 26,
        1.5, -20, 0.6, 0.62, 0.7, 0.9, 1.0, 0, 0, true);
    }
  }
  // verre bliksem met donder
  if (s > 0.45) {
    F.thunderT -= dt;
    if (F.thunderT <= 0) {
      F.thunderT = 2.5 + Math.random() * 6 * (1.4 - s);
      const C = info.arenaCenter, a = Math.random() * Math.PI * 2, r = 42 + Math.random() * 30;
      const x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r;
      stormBolt(x, info.floorY + 30, z, x + (Math.random() - 0.5) * 6, info.floorY - 22, z + (Math.random() - 0.5) * 6, 0.35);
      F.flash = Math.max(F.flash, 0.35);
      stormSnd('thunder', null, 0.4 + Math.random() * 0.4);
    }
  }
}

registerRealm('sky', {
  gen: genHemelrijk,
  makeBoss: (world, info) => new StormDragon(world, info),
  atmosphere: { background: 0x9cc4ff, fog: 0xc0d8ff, near: 40, far: 115, amb: 0xffffff, ambI: 0.82, dir: 0xfff4dc, dirI: 0.6, hand: 0xffffff, sky: true },
  intro: 'De Stormdraak slaapt boven de wolken... maak hem wakker als je durft!',
  tip: 'Tip: sla hem als hij landt, of schiet met een boog!',
  treasureTip: 'Zie je het gouden kruis op een wolkeneiland? Graaf daar naar beneden!',
  ambience: stormAmbience,
  ambientSound: 0.35,
  fallLimit: 4,
});

// Voor testen en ontwikkelen
window.HEMELRIJK = { fx: STORM_FX, gen: genHemelrijk, Boss: StormDragon };
})();
