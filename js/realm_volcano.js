'use strict';
/* Portaaljacht – wereld 12: De Vulkaan met De Magmaslang (duikt door lavapoelen, beet, lavageisers, meteorenregen, vuuradem) */

// Alles in een eigen functie, zodat namen niet botsen met de andere werelden
(() => {
const VF = 12;                       // bovenste blok van de kratervloer
const VTEX = {};                     // textures van de slang
const VG = {};                       // gedeelde geometrie en materialen
const DEG = Math.PI / 180;
const wrapAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* ---------- Eigen blokken: basalt, zwartsteen, vergulde zwartsteen en vulkaanas ---------- */
defineTile('VOLCANO_BASALT', (h) => {
  const col = [];
  for (let i = 0; i < 16; i++) col.push(h.R());
  return (x, y) => {
    const c = col[x];
    if (c < 0.22) return h.vary([44, 43, 49], 4);
    if (c > 0.82) return h.vary([108, 106, 112], 5);
    if ((y + Math.floor(c * 9)) % 8 === 0) return h.vary([60, 59, 65], 4);
    return h.vary(c < 0.5 ? [80, 79, 85] : [92, 90, 96], 5);
  };
});
defineTile('VOLCANO_BASALT_TOP', (h) => (x, y) => {
  const d = Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)));
  if (d === 7) return h.vary([50, 49, 55], 4);
  return h.vary(d % 3 === 1 ? [64, 63, 69] : [92, 90, 97], 5);
});
defineTile('VOLCANO_BLACKSTONE', (h) => {
  const g = [];
  for (let i = 0; i < 64; i++) g.push(h.R());
  return (x, y) => {
    const c = g[(y >> 1) * 8 + (x >> 1)];
    if (h.R() < 0.06) return h.vary([70, 64, 78], 4);
    return h.vary(c < 0.3 ? [24, 21, 28] : c < 0.7 ? [36, 32, 41] : [48, 43, 54], 4);
  };
});
defineTile('VOLCANO_GILDED', (h) => {
  const g = [];
  for (let i = 0; i < 64; i++) g.push(h.R());
  const gold = new Uint8Array(256);
  for (let i = 0; i < 10; i++) {
    let x = Math.floor(h.R() * 16), y = Math.floor(h.R() * 16);
    for (let k = 0; k < 4; k++) {
      gold[(y & 15) * 16 + (x & 15)] = k === 0 ? 2 : 1;
      x += Math.floor(h.R() * 3) - 1; y += Math.floor(h.R() * 3) - 1;
    }
  }
  return (x, y) => {
    const v = gold[y * 16 + x];
    if (v === 2) return h.vary([255, 238, 120], 6);
    if (v === 1) return h.vary([234, 178, 40], 8);
    const c = g[(y >> 1) * 8 + (x >> 1)];
    return h.vary(c < 0.3 ? [26, 22, 28] : c < 0.7 ? [38, 33, 42] : [50, 44, 54], 4);
  };
});
defineTile('VOLCANO_ASH', (h) => () => {
  const r = h.R();
  return h.vary(r < 0.2 ? [92, 86, 84] : r < 0.7 ? [114, 107, 102] : r < 0.96 ? [130, 122, 116] : [176, 92, 40], 5);
});

const BAS = defineBlock('VOLCANO_BASALT', { name: 'Basalt', tiles: { top: T.VOLCANO_BASALT_TOP, bottom: T.VOLCANO_BASALT_TOP, side: T.VOLCANO_BASALT }, hard: 1.2 });
const BLK = defineBlock('VOLCANO_BLACKSTONE', { name: 'Zwartsteen', tiles: all(T.VOLCANO_BLACKSTONE), hard: 1.3 });
const GILD = defineBlock('VOLCANO_GILDED', { name: 'Vergulde zwartsteen', tiles: all(T.VOLCANO_GILDED), hard: 0.9 });
const ASH = defineBlock('VOLCANO_ASH', { name: 'Vulkaanas', tiles: all(T.VOLCANO_ASH), hard: 0.4, sound: 'sand', soft: true });

/* ---------- De wereld: een krater met lavapoelen, een trap langs de wand en een kluis ---------- */
function genVolcano(seed) {
  const S = 72, H = 44, C = 36, F = VF;
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand);

  // De kluis zit in de kraterwand (noord, oost of west); het portaal staat in het zuiden (+z)
  const vdirs = [[0, -1], [1, 0], [-1, 0]];
  const vd = vdirs[Math.floor(rand() * 3)];
  const vAng = Math.atan2(vd[1], vd[0]);
  // de trap loopt altijd weg van het portaal
  const rs = vd[0] === 1 ? 1 : vd[0] === -1 ? -1 : (rand() < 0.5 ? 1 : -1);
  const rampA = (ang) => wrapAng(ang - vAng) * -rs / DEG;   // 0 bij de kluis, 78 bij het begin van de trap

  // Lavapoelen: één in het midden, vier eromheen
  const jit = () => (rand() - 0.5) * 1.4;
  const pools = [
    { x: C + 0.5, z: C - 0.5, r: 2.6 },
    { x: C - 7.5 + jit(), z: C - 7 + jit(), r: 2.35 },
    { x: C + 8.5 + jit(), z: C - 7 + jit(), r: 2.35 },
    { x: C - 8 + jit(), z: C + 5.5 + jit(), r: 2.35 },
    { x: C + 9 + jit(), z: C + 5.5 + jit(), r: 2.35 },
  ];
  const homePool = rand() < 0.5 ? 1 : 2;

  // Hoogtekaart: 0 = vloer, 1 = kraterwand, 2 = trap
  const heights = new Int16Array(S * S), kind = new Uint8Array(S * S);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - C, dz = z + 0.5 - C, r = Math.hypot(dx, dz);
      let h = F, k = 0;
      if (r > 17.2) {
        k = 1;
        if (r < 22.5) h = F + 1 + Math.floor(Math.min(14, (r - 17.2) * 3) + n1.noise(x / 4, z / 4) * 1.6);
        else h = Math.round(F + 15 - (r - 22.5) * 0.85 + n2.fbm(x / 9, z / 9, 3) * 5);
        h = clamp(h, F + 1, H - 8);
        if (r >= 17.3 && r <= 19.9) {
          const a = rampA(Math.atan2(dz, dx));
          if (a >= -11 && a <= 78) { h = a <= 8 ? F + 6 : F + clamp(Math.round((78 - a) / 70 * 6), 0, 6); k = 2; }
        }
      }
      heights[z * S + x] = h; kind[z * S + x] = k;
    }
  }

  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const i = z * S + x, h = heights[i], k = kind[i];
      const band = Math.floor(n1.noise(x / 6 + 30, z / 6) * 3);
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = B.BEDROCK;
        else if (y < h) id = (y + band + 8) % 4 === 0 ? BLK : BAS;            // lagen basalt en zwartsteen
        else if (k === 0) {
          const nn = n2.noise(x / 5 + 20, z / 5 + 20);
          id = rand() < 0.025 ? B.MAGMA : nn > 0.32 ? ASH : nn < -0.3 ? BAS : BLK;
        } else if (k === 2) id = rand() < 0.09 ? B.GOLD : BLK;               // goud op de trap als spoor
        else if (h >= F + 14) id = rand() < 0.05 ? B.MAGMA : ASH;
        else id = rand() < 0.2 ? BLK : BAS;
        w.setRaw(x, y, z, id);
      }
      // lavaplasjes buiten de krater
      const r = Math.hypot(x + 0.5 - C, z + 0.5 - C);
      if (r > 25 && n2.noise(x / 7 + 40, z / 7) > 0.42) w.setRaw(x, h, z, B.LAVA);
    }
  }

  // Lavapoelen met een gloeiende magmarand
  for (const pl of pools) {
    for (let z = Math.floor(pl.z - pl.r - 2); z <= pl.z + pl.r + 2; z++) {
      for (let x = Math.floor(pl.x - pl.r - 2); x <= pl.x + pl.r + 2; x++) {
        const d = Math.hypot(x + 0.5 - pl.x, z + 0.5 - pl.z);
        if (d <= pl.r) { w.setRaw(x, F, z, B.LAVA); w.setRaw(x, F - 1, z, B.MAGMA); }
        else if (d <= pl.r + 0.9) w.setRaw(x, F, z, B.MAGMA);
      }
    }
  }

  // Basaltzuilen als dekking (niet in het zuiden bij het portaal)
  for (const [cx, cz] of [[C + 0.5, C - 11.5], [C - 11.5, C + 0.5], [C + 12.5, C + 0.5]]) {
    for (let k = 0; k < 5; k++) {
      const x = Math.floor(cx + (rand() - 0.5) * 2.8), z = Math.floor(cz + (rand() - 0.5) * 2.8);
      if (pools.some((pl) => Math.hypot(x + 0.5 - pl.x, z + 0.5 - pl.z) < pl.r + 2)) continue;
      const hh = 2 + Math.floor(rand() * 5);
      for (let y = F + 1; y <= F + hh; y++) w.setRaw(x, y, z, BAS);
      if (rand() < 0.45) w.setRaw(x, F + hh + 1, z, B.MAGMA);
    }
  }

  // Lavavallen langs de kraterwand (niet bij het portaal of de trap)
  const falls = [];
  for (let tries = 0; tries < 60 && falls.length < 3; tries++) {
    const ang = rand() * Math.PI * 2;
    if (Math.abs(wrapAng(ang - Math.PI / 2)) < 40 * DEG) continue;
    const a = rampA(ang);
    if (a > -28 && a < 92) continue;
    if (falls.some((o) => Math.abs(wrapAng(o - ang)) < 45 * DEG)) continue;
    falls.push(ang);
    for (let rr = 17.6; rr <= 21.6; rr += 0.5) {
      const x = Math.floor(C + Math.cos(ang) * rr), z = Math.floor(C + Math.sin(ang) * rr);
      for (let y = F + 1; y <= heights[z * S + x]; y++) w.setRaw(x, y, z, B.LAVA);
    }
    w.setRaw(Math.floor(C + Math.cos(ang) * 16.6), F, Math.floor(C + Math.sin(ang) * 16.6), B.LAVA);
  }

  // Aankomstportaal in het zuiden, kijkend naar het midden
  const pz = C + 15;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
  w.portalAxis = 'x';

  // De schatkluis van obsidiaan in de wand, achter een deur van vergulde zwartsteen
  const cellAt = (k, lat) => (vd[0] !== 0 ? [vd[0] > 0 ? C + k : C - k - 1, C + lat] : [C + lat, vd[1] > 0 ? C + k : C - k - 1]);
  const y0 = F + 7;
  const [vx, vz] = cellAt(23, 0);
  const treasure = buildVault(w, vx, y0, vz, B.OBSIDIAN, B.GLOWSTONE);
  for (let k = 17; k <= 20; k++) {
    const [x, z] = cellAt(k, 0);
    w.setRaw(x, y0 - 1, z, BLK); w.setRaw(x, y0, z, B.AIR); w.setRaw(x, y0 + 1, z, B.AIR);
  }
  const door = [];
  {
    const [x, z] = cellAt(21, 0);
    w.setRaw(x, y0, z, GILD); w.setRaw(x, y0 + 1, z, GILD);
    door.push([x, y0, z], [x, y0 + 1, z]);
    // gouden lijst rond de ingang, zichtbaar vanuit de arena
    for (const lat of [-1, 1]) {
      const [gx, gz] = cellAt(20, lat);
      for (let y = y0; y <= y0 + 2; y++) w.setRaw(gx, y, gz, B.GOLD);
      const [tx, tz] = cellAt(19, lat);
      w.setRaw(tx, y0, tz, B.TORCH);
    }
    const [cx2, cz2] = cellAt(20, 0);
    w.setRaw(cx2, y0 + 2, cz2, B.GOLD);
  }

  // Rookpluimen op de kraterrand
  const vents = [];
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3 + rand() * 0.2) * Math.PI * 2;
    const x = Math.floor(C + Math.cos(ang) * 24), z = Math.floor(C + Math.sin(ang) * 24);
    w.setRaw(x, heights[z * S + x], z, B.MAGMA);
    vents.push({ x: x + 0.5, y: heights[z * S + x] + 1, z: z + 0.5 });
  }

  w.computeTops();
  const spawn = { x: C + 1, y: F + 1, z: pz - 2.5 };
  // De slang slaapt met zijn kop op de rand van zijn poel, naar de speler gericht
  const hp = pools[homePool];
  let hx = spawn.x - hp.x, hz = spawn.z - hp.z;
  const hd = Math.hypot(hx, hz);
  hx /= hd; hz /= hd;
  return {
    world: w,
    spawn,
    spawnYaw: 0,
    bossSpawn: { x: hp.x + hx * (hp.r + 0.9), y: F + 1, z: hp.z + hz * (hp.r + 0.9) },
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: 17, floorY: F + 1,
    treasure,
    pools, homePool, restYaw: Math.atan2(hx, hz), vents, door,
  };
}

/* ---------- Textures van de Magmaslang ---------- */
function buildVolcanoTextures() {
  const R = mulberry32(4242);
  const cells = [];
  for (let i = 0; i < 9; i++) cells.push([R() * 16, R() * 16]);
  const crack = new Uint8Array(256);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const e = voronoi(cells, x, y, 16).edge;
      crack[y * 16 + x] = e < 0.5 ? 2 : e < 1.1 ? 1 : 0;
    }
  }
  const base = (x, y) => {
    const c = crack[(y & 15) * 16 + (x & 15)];
    if (c === 2) return R() < 0.5 ? [255, 214, 90] : [255, 170, 50];
    if (c === 1) return R() < 0.5 ? [250, 110, 20] : [214, 70, 14];
    const r = R();
    return r < 0.3 ? [34, 18, 16] : r < 0.65 ? [56, 28, 20] : r < 0.9 ? [46, 24, 20] : [74, 38, 24];
  };
  const glow = (x, y) => {
    const c = crack[(y & 15) * 16 + (x & 15)];
    return c === 2 ? [255, 210, 110] : c === 1 ? [240, 100, 20] : [0, 0, 0];
  };
  VTEX.body = pixelTexture(16, 16, base);
  VTEX.bodyGlow = pixelTexture(16, 16, glow);
  // voorkant van de kop: boze wenkbrauwen, neusgaten en tanden naar beneden
  const upTooth = (x, y) => (y === 12 && x % 4 !== 0) || (y === 13 && (x % 4 === 1 || x % 4 === 2)) || (y === 14 && x % 4 === 1);
  const nose = (x, y) => (y === 5 || y === 6) && (x === 4 || x === 5 || x === 10 || x === 11);
  const brow = (x, y) => (y === 1 && (x <= 5 || x >= 10)) || (y === 2 && (x === 5 || x === 6 || x === 9 || x === 10));
  VTEX.face = pixelTexture(16, 16, (x, y) => {
    if (y >= 12) return upTooth(x, y) ? [238, 228, 200] : [80, 16, 6];
    if (nose(x, y)) return [14, 6, 4];
    if (brow(x, y)) return [20, 10, 8];
    return base(x, y);
  });
  VTEX.faceGlow = pixelTexture(16, 16, (x, y) => {
    if (y >= 12) return upTooth(x, y) ? [0, 0, 0] : [220, 60, 10];
    if (nose(x, y) || brow(x, y)) return [0, 0, 0];
    return glow(x, y);
  });
  // onderkaak: tanden naar boven
  const dnTooth = (x, y) => (y === 2 && x % 4 !== 0) || (y === 1 && (x % 4 === 1 || x % 4 === 2)) || (y === 0 && x % 4 === 2);
  VTEX.jaw = pixelTexture(16, 8, (x, y) => (y <= 2 ? (dnTooth(x, y) ? [238, 228, 200] : [80, 16, 6]) : base(x, y + 4)));
  VTEX.jawGlow = pixelTexture(16, 8, (x, y) => (y <= 2 ? (dnTooth(x, y) ? [0, 0, 0] : [220, 60, 10]) : glow(x, y + 4)));
  VTEX.horn = pixelTexture(4, 12, (x, y) => {
    if (y < 3) return R() < 0.4 ? [200, 180, 150] : [228, 210, 176];
    const k = R() * 16 - (x === 0 ? 8 : 0);
    return [44 + k, 40 + k, 48 + k];
  });
  // magmablokje (handlanger): gezicht met gele ogen
  const cubeEye = (x, y) => (y === 6 || y === 7) && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12));
  const cubeMouth = (x, y) => y === 11 && x >= 5 && x <= 10;
  VTEX.cube = pixelTexture(16, 16, (x, y) => (cubeEye(x, y) ? [255, 236, 110] : cubeMouth(x, y) ? [30, 8, 4] : base(x, y)));
  VTEX.cubeGlow = pixelTexture(16, 16, (x, y) => (cubeEye(x, y) ? [255, 230, 100] : cubeMouth(x, y) ? [0, 0, 0] : glow(x, y)));
}

function sharedGeo() {
  if (VG.seg) return;
  VG.seg = new THREE.BoxGeometry(1, 1, 1);
  VG.spike = new THREE.BoxGeometry(0.24, 0.55, 0.3).translate(0, 0.27, 0);
  VG.eye = new THREE.BoxGeometry(0.36, 0.2, 0.5);
  VG.geyser = new THREE.BoxGeometry(1.4, 1, 1.4).translate(0, 0.5, 0);
  VG.cube = new THREE.BoxGeometry(0.84, 0.84, 0.84).translate(0, 0.42, 0);
  for (const k of ['seg', 'spike', 'eye', 'geyser', 'cube']) VG[k].userShared = true;
  VG.lavaMat = new THREE.MeshBasicMaterial({ map: Tex.lava });
}

// Magmablokje: klein springend handlangertje
function magmaCubeModel() {
  sharedGeo();
  const side = new THREE.MeshLambertMaterial({ map: VTEX.body, emissive: 0xffffff, emissiveMap: VTEX.bodyGlow, emissiveIntensity: 0.8 });
  const face = new THREE.MeshLambertMaterial({ map: VTEX.cube, emissive: 0xffffff, emissiveMap: VTEX.cubeGlow, emissiveIntensity: 0.9 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(VG.cube, [side, side, side, side, face, side]);
  group.add(body);
  return {
    group, mats: [side, face],
    animate(mn) {
      const k = Math.abs(Math.sin(mn.walk * 1.1));
      body.position.y = k * 0.3;
      body.scale.set(1.08 - k * 0.12, 0.84 + k * 0.28, 1.08 - k * 0.12);
    },
  };
}

// Bovenkant van de grond onder (x, z), van hoogte fromY naar beneden (lava telt mee)
function groundAt(w, x, fromY, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  for (let y = Math.floor(fromY); y > 0; y--) {
    const id = w.get(ix, y, iz);
    if (SOLID[id] || id === B.LAVA) return y + 1;
  }
  return VF + 1;
}

// Staten waarin de kop buiten de lava is (dan helpt het richten op een telefoon)
const OUT = { hover: 1, retract: 1, stuck: 1, stagger: 1, biteWind: 1, breathWind: 1, breath: 1, geyserWind: 1, meteorWind: 1, meteors: 1 };

/* ---------- De Magmaslang ---------- */
class MagmaSnake extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Magmaslang', ref: 'de Magmaslang', hp: 940, hw: 1.05, h: 1.25,
      deathTiles: [T.MAGMA, T.VOLCANO_BASALT, T.VOLCANO_BLACKSTONE] });
    this.flying = true;
    this.pools = info.pools;
    this.pool = info.homePool;
    this.head = this.pos.clone();          // onderkant-midden van de kop
    this.hyaw = info.restYaw; this.hpitch = 0;
    this.restYaw = info.restYaw;
    this.anim = { jaw: 0, pitch: 0 };
    this.box = [0, 0, 0, 0, 0, 0];
    this.tgt = new THREE.Vector3(); this.from = new THREE.Vector3(); this.biteTo = new THREE.Vector3();
    this.v = { p0: new THREE.Vector3(), p3: new THREE.Vector3(), q1: new THREE.Vector3(), q2: new THREE.Vector3(), prev: new THREE.Vector3(), tmp: new THREE.Vector3() };
    this.spine = [];
    for (let i = 0; i <= 24; i++) this.spine.push(new THREE.Vector3());
    this.spineLen = new Float32Array(25);
    this.hidden = false; this.waveT = 0; this.wiggle = 1;
    this.here = 0; this.maxHere = 2; this.lastAtk = ''; this.meteorCD = 4; this.W = 0.8;
    this.pendingEnrage = false; this.eyeBase = 0xffd23a;
    this.bdx = 0; this.bdz = 1; this.shots = 0; this.shotT = 0; this.popT = 0;
    this.animate(0.016);
  }

  buildModel() {
    if (!VTEX.body) buildVolcanoTextures();
    sharedGeo();
    const body = new THREE.MeshLambertMaterial({ map: VTEX.body, emissive: 0xffffff, emissiveMap: VTEX.bodyGlow, emissiveIntensity: 0.9 });
    const face = new THREE.MeshLambertMaterial({ map: VTEX.face, emissive: 0xffffff, emissiveMap: VTEX.faceGlow, emissiveIntensity: 1 });
    const jawF = new THREE.MeshLambertMaterial({ map: VTEX.jaw, emissive: 0xffffff, emissiveMap: VTEX.jawGlow, emissiveIntensity: 1 });
    const horn = new THREE.MeshLambertMaterial({ map: VTEX.horn, emissive: 0xff5a10, emissiveIntensity: 0 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffd23a });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xff8a1a });
    const group = new THREE.Group();
    const root = new THREE.Group();          // in wereldcoördinaten (zie animate)
    group.add(root);
    const head = new THREE.Group();
    head.rotation.order = 'YXZ';
    root.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.7).translate(0, 0.12, 0.1), [body, body, body, body, face, body]));
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.3, -0.6);
    head.add(jawPivot);
    jawPivot.add(new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.34, 1.55).translate(0, -0.1, 0.78), [body, body, body, body, jawF, body]));
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.4), mouthMat);
    mouth.position.set(0, -0.3, 0.2);
    head.add(mouth);
    const eyes = [];
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(VG.eye, eye);
      e.position.set(sx * 0.6, 0.38, 0.78);
      head.add(e);
      eyes.push(e);
      // gebogen hoorns naar achteren
      const hg = new THREE.Group();
      hg.position.set(sx * 0.52, 0.5, -0.35);
      hg.rotation.set(-0.95, 0, -sx * 0.4);
      head.add(hg);
      hg.add(bossBox(0.34, 0.75, 0.34, horn, 0.37));
      const tip = bossBox(0.22, 0.6, 0.22, horn, 0.3);
      tip.position.y = 0.7; tip.rotation.x = -0.45;
      hg.add(tip);
    }
    // tien gloeiende magmabrokken als lijf, met stekels op de rug
    const segs = [];
    for (let i = 0; i < 10; i++) {
      const s = 1.22 - i * 0.068;
      const g = new THREE.Mesh(VG.seg, body);
      g.scale.set(s, s * 0.9, s * 1.12);
      g.rotation.order = 'YXZ';
      if (i % 2 === 0 && i < 9) {
        const sp = new THREE.Mesh(VG.spike, horn);
        sp.position.y = 0.45;
        g.add(sp);
      }
      root.add(g);
      segs.push(g);
    }
    return { group, root, head, jawPivot, mouth, eyes, segs, eye, body, face, jawF, horn, mats: [body, face, jawF, horn] };
  }

  // Raakdoos: alleen de kop, en alleen als die boven de lava is
  aabb() {
    const b = this.box, p = this.pos;
    if (this.hidden || p.y < VF + 0.3) { b[0] = b[3] = p.x; b[2] = b[5] = p.z; b[1] = b[4] = -100; return b; }
    b[0] = p.x - 1.05; b[3] = p.x + 1.05; b[2] = p.z - 1.05; b[5] = p.z + 1.05;
    b[1] = p.y - 0.1; b[4] = p.y + 1.35;
    return b;
  }
  center() { return new THREE.Vector3(this.pos.x, this.pos.y + 0.6, this.pos.z); }

  // De basis draait 'yaw'; wij draaien alleen de kop
  turnTo(target, dt, rate) { this.hyaw += clamp(angleDiff(this.hyaw, target), -rate * dt, rate * dt); }
  faceTo(x, z, dt, rate) { this.turnTo(Math.atan2(x - this.head.x, z - this.head.z), dt, rate); }
  headTo(t, dt, rate) { this.head.lerp(t, 1 - Math.exp(-rate * dt)); }
  forward(out) {
    const cp = Math.cos(this.hpitch);
    return out.set(Math.sin(this.hyaw) * cp, Math.sin(this.hpitch), Math.cos(this.hyaw) * cp);
  }
  mouthPos() {
    const f = this.forward(new THREE.Vector3());
    return new THREE.Vector3(this.head.x + f.x * 1.15, this.head.y + 0.4 + f.y * 1.15, this.head.z + f.z * 1.15);
  }

  onWake(quiet) {
    if (quiet) return;
    const c = this.center();
    FX.explosion(c.x, c.y, c.z, 0.8);
    for (let i = 0; i < 20; i++) FX.flame(c.x + (Math.random() - 0.5) * 3, c.y + Math.random() * 2, c.z + (Math.random() - 0.5) * 3, 0.6);
  }

  onEnrage() {
    const m = this.model;
    m.body.emissiveIntensity = 1.75; m.face.emissiveIntensity = 1.5; m.jawF.emissiveIntensity = 1.5;
    m.horn.emissiveIntensity = 1.1;
    this.eyeBase = 0xff3a1a; this.wiggle = 1.5;
    this.pendingEnrage = true;
  }
  enragedFx() {
    if (this.hidden) return;
    const s = this.model.segs[Math.floor(Math.random() * 7)];
    if (s.position.y > VF + 0.9) FX.flame(s.position.x, s.position.y + 0.55, s.position.z, 0.6);
  }

  // Eigen vuurbal terug gekregen: hij is even duizelig en zijn kop zakt op de grond
  onReflectHit() {
    if (!this.alive() || this.hidden) return;
    if (!['hover', 'retract', 'breath', 'breathWind', 'geyserWind', 'meteorWind', 'meteors'].includes(this.state)) return;
    this.setState('stagger');
    HUD.actionbar('Raak! De Magmaslang is duizelig. Sla zijn kop!', 2);
  }

  onGoHome() {
    this.head.copy(this.home);
    this.pool = this.info.homePool;
    this.hidden = false; this.flying = true;
    this.hyaw = this.restYaw; this.here = 0; this.pendingEnrage = false;
  }

  die() {
    super.die();
    // stierf hij onder de lava (brandend zwaard)? dan komt hij nog even boven
    if (this.hidden || this.head.y < VF + 0.5) {
      const q = this.pools[this.pool];
      this.head.set(q.x, VF + 3, q.z);
      this.hidden = false;
      this.pos.copy(this.head);
      this.placeModel();
    }
  }

  hoverTarget(out) {
    const q = this.pools[this.pool], p = player;
    let dx = p.pos.x - q.x, dz = p.pos.z - q.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    const reach = clamp(d - 2.3, 0.6, q.r + 1.4);
    const sw = Math.sin(this.waveT * 1.3) * 0.6;
    return out.set(q.x + dx * reach - dz * sw, VF + 2.7 + Math.sin(this.waveT * 2.1) * 0.25, q.z + dz * reach + dx * sw);
  }

  endAttack() {
    this.here++;
    this.setState('hover');
    this.attackCD = this.enraged ? 0.45 + Math.random() * 0.4 : 0.85 + Math.random() * 0.6;
  }

  startDive() { this.from.copy(this.head); this.setState('dive'); }

  pickAttack() {
    const p = player, q = this.pools[this.pool];
    const d = Math.hypot(p.pos.x - q.x, p.pos.z - q.z);
    const opts = [];
    if (d > q.r + 0.8 && d < 11.5) opts.push(['bite', 3]);
    opts.push(['breath', d > 4.5 ? 2.2 : 0.8]);
    opts.push(['geyser', 2]);
    if (this.meteorCD <= 0) opts.push(['meteor', this.enraged ? 2.4 : 1.6]);
    let sum = 0;
    for (const o of opts) { if (o[0] === this.lastAtk) o[1] *= 0.25; sum += o[1]; }
    let r = Math.random() * sum;
    for (const o of opts) { r -= o[1]; if (r <= 0) return o[0]; }
    return opts[0][0];
  }

  startAttack(name) {
    const ph2 = this.enraged, p = player, q = this.pools[this.pool];
    this.lastAtk = name;
    if (name === 'bite') {
      // beet: waarschuwingsbaan van de poel naar de speler, dan schiet de kop eroverheen
      this.W = ph2 ? 0.6 : 0.85;
      let tx = p.pos.x + p.vel.x * 0.2, tz = p.pos.z + p.vel.z * 0.2;
      let dx = tx - q.x, dz = tz - q.z;
      const d = Math.hypot(dx, dz) || 1;
      dx /= d; dz /= d;
      const dd = clamp(d, q.r + 1.5, 10.5);
      tx = q.x + dx * dd; tz = q.z + dz * dd;
      const ty = groundAt(this.world, tx, p.pos.y + 0.5, tz);
      this.bdx = dx; this.bdz = dz;
      this.biteTo.set(tx, ty, tz);
      game.addHazard(new LaneHazard({
        x0: q.x + dx * q.r * 0.6, z0: q.z + dz * q.r * 0.6, x1: tx + dx * 1.1, z1: tz + dz * 1.1, y: ty,
        width: 2.6, warn: this.W + 0.16, linger: 0.35, color: 0xff3300, dmg: this.dmg(16), type: 'bite', knock: 10, up: 6,
      }));
      SND.play('lavapop', { at: this.head, range: 40, vol: 0.8 });
      this.setState('biteWind');
    } else if (name === 'breath') {
      this.W = ph2 ? 0.55 : 0.75;
      this.setState('breathWind');
    } else if (name === 'geyser') {
      this.setState('geyserWind');
    } else {
      this.W = ph2 ? 0.6 : 0.8;
      this.setState('meteorWind');
    }
  }

  think(dt, c) {
    const ph2 = this.enraged, p = c.p, q = this.pools[this.pool];
    this.meteorCD -= dt;
    switch (this.state) {
      case 'chase':
        this.setState('hover');
        this.attackCD = 0.7; this.here = 0;
        break;
      case 'hover': {
        this.headTo(this.hoverTarget(this.tgt), dt, 3.2);
        this.faceTo(p.pos.x, p.pos.z, dt, 4);
        this.attackCD -= dt;
        if (this.pendingEnrage) { this.pendingEnrage = false; this.setState('enrage'); break; }
        if (this.attackCD <= 0 && !p.dead) {
          const far = Math.hypot(p.pos.x - q.x, p.pos.z - q.z) > 12.5;
          if (this.here >= this.maxHere || (far && this.here >= 1)) this.startDive();
          else this.startAttack(this.pickAttack());
        }
        break;
      }
      case 'biteWind':
        this.tgt.set(q.x - this.bdx * 0.6, VF + 5.6, q.z - this.bdz * 0.6);
        this.headTo(this.tgt, dt, 5);
        this.turnTo(Math.atan2(this.bdx, this.bdz), dt, 6);
        if (Math.random() < dt * 20) { const m = this.mouthPos(); FX.flame(m.x, m.y, m.z, 0.5); }
        if (this.t >= this.W) {
          this.from.copy(this.head);
          this.setState('bite');
          SND.play('whoosh', { at: this.head, range: 40 });
        }
        break;
      case 'bite': {
        const k = clamp(this.t / 0.16, 0, 1);
        this.head.lerpVectors(this.from, this.biteTo, k * k);
        if (k >= 1) {
          const b = this.biteTo;
          FX.ring(b.x, b.y, b.z, 2, [1, 0.45, 0.1]);
          FX.explosion(b.x, b.y + 0.3, b.z, 0.5);
          SND.play('slam', { at: b, range: 40 });
          game.shake = Math.max(game.shake, 0.5);
          this.setState('stuck');
        }
        break;
      }
      case 'stuck':
        // kop vast in de grond: dit is je kans!
        this.head.copy(this.biteTo);
        this.dizzy(dt);
        if (Math.random() < dt * 6) FX.smoke(this.head.x + (Math.random() - 0.5), this.head.y + 0.4, this.head.z + (Math.random() - 0.5));
        if (this.t > (ph2 ? 1.0 : 1.45)) this.setState('retract');
        break;
      case 'stagger': {
        let dx = p.pos.x - q.x, dz = p.pos.z - q.z;
        const d = Math.hypot(dx, dz) || 1;
        dx /= d; dz /= d;
        this.tgt.set(q.x + dx * (q.r + 1.5), VF + 1, q.z + dz * (q.r + 1.5));
        this.headTo(this.tgt, dt, 5);
        this.dizzy(dt);
        if (this.t > 1.8) this.setState('retract');
        break;
      }
      case 'retract':
        this.headTo(this.hoverTarget(this.tgt), dt, 4.5);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (this.t > 0.6) this.endAttack();
        break;
      case 'breathWind':
      case 'breath': {
        let dx = p.pos.x - q.x, dz = p.pos.z - q.z;
        const d = Math.hypot(dx, dz) || 1;
        this.tgt.set(q.x + dx / d * 1.0, VF + 4.4, q.z + dz / d * 1.0);
        this.headTo(this.tgt, dt, 4);
        this.faceTo(p.pos.x, p.pos.z, dt, this.state === 'breath' ? 2.5 : 5);
        if (this.state === 'breathWind') {
          if (Math.random() < dt * 30) { const m = this.mouthPos(); FX.flame(m.x, m.y, m.z, 0.5); }
          if (this.t >= this.W) { this.setState('breath'); this.shots = ph2 ? 7 : 5; this.shotT = 0; }
        } else {
          this.shotT -= dt;
          if (this.shots > 0 && this.shotT <= 0) {
            this.shootFireball(p);
            this.shots--;
            this.shotT = ph2 ? 0.14 : 0.17;
          }
          if (this.shots === 0 && this.shotT < -0.35) this.endAttack();
        }
        break;
      }
      case 'geyserWind':
        this.tgt.set(q.x, VF + 6.6, q.z);
        this.headTo(this.tgt, dt, 4);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (!this.didHit) {
          this.didHit = true; this.wave2 = false;
          SND.play('roar', { vol: 0.7 });
          this.geyserWave(ph2 ? 3 : 2, ph2 ? 1.0 : 1.2);
        }
        if (ph2 && !this.wave2 && this.t > 0.9) { this.wave2 = true; this.geyserWave(2, 0.95); }
        if (this.t > (ph2 ? 2.1 : 1.6)) this.endAttack();
        break;
      case 'meteorWind':
      case 'meteors':
        this.tgt.set(q.x, VF + 7.2, q.z);
        this.headTo(this.tgt, dt, 4);
        this.faceTo(p.pos.x, p.pos.z, dt, 2);
        if (this.state === 'meteorWind') {
          if (!this.didHit) { this.didHit = true; SND.play('roar', { vol: 0.8 }); }
          if (Math.random() < dt * 30) {
            const m = this.mouthPos();
            FX.glow.spawn(m.x, m.y, m.z, (Math.random() - 0.5) * 2, 8 + Math.random() * 4, (Math.random() - 0.5) * 2, 1, 0.5 + Math.random() * 0.3, 0.1, 0.8, 0, 0);
          }
          if (this.t >= this.W) { this.meteorRain(); this.setState('meteors'); this.meteorCD = ph2 ? 7 : 10; }
        } else if (this.t > 1.2) this.endAttack();
        break;
      case 'enrage':
        this.tgt.set(q.x, VF + 7.5, q.z);
        this.headTo(this.tgt, dt, 3);
        this.faceTo(p.pos.x, p.pos.z, dt, 3);
        if (!this.didHit) { this.didHit = true; this.spawned = false; SND.play('roar', { vol: 1 }); game.shake = Math.max(game.shake, 0.6); }
        if (Math.random() < dt * 30) { const m = this.mouthPos(); FX.flame(m.x, m.y + 0.5, m.z, 1.2); }
        if (!this.spawned && this.t > 0.7) {
          this.spawned = true;
          for (const s of [-1, 1]) this.spawnCube(q, s * 0.9);
        }
        if (this.t > 1.6) this.startDive();
        break;
      case 'dive': {
        // kop omhoog en dan met een boog de lava in
        const k = clamp(this.t / 0.65, 0, 1);
        this.head.set(lerp(this.from.x, q.x, k), lerp(this.from.y, VF - 1.8, k * k) + Math.sin(k * Math.PI) * 1.4, lerp(this.from.z, q.z, k));
        if (k >= 1) {
          this.splash(q, 0.7);
          this.hidden = true;
          this.setState('under');
        }
        break;
      }
      case 'under':
        if (!this.didHit) {
          this.didHit = true;
          // de volgende poel: meestal die het dichtst bij de speler
          let best = -1, bs = 1e9;
          for (let i = 0; i < this.pools.length; i++) {
            if (i === this.pool) continue;
            const o = this.pools[i];
            const s = Math.hypot(p.pos.x - o.x, p.pos.z - o.z) + Math.random() * 4;
            if (s < bs) { bs = s; best = i; }
          }
          this.pool = best;
          const o = this.pools[best];
          this.head.set(o.x, VF - 1.8, o.z);
          this.hyaw = Math.atan2(p.pos.x - o.x, p.pos.z - o.z);
        }
        if (this.t > (ph2 ? 0.45 : 0.95)) this.setState('bubble');
        break;
      case 'bubble':
        // borrelende poel = waarschuwing: hier komt hij uit!
        if (!this.didHit) {
          this.didHit = true;
          this.bubbleWarn = ph2 ? 0.8 : 1.15;
          game.addHazard(new GroundHazard({
            x: q.x, y: VF + 1, z: q.z, radius: q.r + 1.1, warn: this.bubbleWarn, linger: 0.4, color: 0xff6a00,
            dmg: this.dmg(14), type: 'emerge', knock: 9, up: 9,
          }));
        }
        if (Math.random() < dt * 40) {
          const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * q.r;
          const x = q.x + Math.cos(a) * rr, z = q.z + Math.sin(a) * rr;
          FX.flame(x, VF + 0.95, z, 0.3);
          FX.debris.spawn(x, VF + 0.95, z, (Math.random() - 0.5) * 1.5, 3 + Math.random() * 3, (Math.random() - 0.5) * 1.5, 1, 0.4 + Math.random() * 0.3, 0.05, 0.6, 14, 0.2, true);
        }
        this.popT -= dt;
        if (this.popT <= 0) { this.popT = 0.22; SND.play('lavapop', { at: { x: q.x, y: VF + 1, z: q.z }, range: 40, vol: 0.8 }); }
        if (this.t >= this.bubbleWarn) {
          this.hidden = false;
          this.splash(q, 1.2);
          SND.play('explode', { at: this.head, range: 40, vol: 0.6 });
          game.shake = Math.max(game.shake, 0.4);
          if (ph2 && Math.random() < 0.35) this.spawnCube(q, 0);
          this.setState('rise');
        }
        break;
      case 'rise': {
        const k = clamp(this.t / 0.4, 0, 1);
        this.head.set(q.x, lerp(VF - 1.8, VF + 6.5, easeOut(k)), q.z);
        this.faceTo(p.pos.x, p.pos.z, dt, 6);
        if (k >= 1) {
          this.setState('hover');
          this.attackCD = ph2 ? 0.5 : 0.9;
          this.here = 0;
          this.maxHere = ph2 && Math.random() < 0.5 ? 3 : 2;
        }
        break;
      }
      default:
        this.setState('hover');
        break;
    }
    return 0;
  }

  dizzy(dt) {
    if (Math.random() < dt * 14) {
      const a = this.t * 7 + Math.random() * 0.4;
      FX.glow.spawn(this.head.x + Math.cos(a) * 0.9, this.head.y + 1.6, this.head.z + Math.sin(a) * 0.9, 0, 0.2, 0, 1, 1, 0.5, 0.4, 0, 0);
    }
  }

  splash(q, s) {
    for (let i = 0; i < 26 * s; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * q.r;
      FX.debris.spawn(q.x + Math.cos(a) * rr, VF + 1, q.z + Math.sin(a) * rr, Math.cos(a) * 3 * s, 4 + Math.random() * 5 * s, Math.sin(a) * 3 * s,
        1, 0.35 + Math.random() * 0.4, 0.05, 0.9, 16, 0.2, true);
    }
    FX.explosion(q.x, VF + 1.2, q.z, 0.6 * s);
    SND.play('lavapop', { at: { x: q.x, y: VF + 1, z: q.z }, range: 40, vol: 1 });
  }

  // Vuuradem: een rij vuurballen achter elkaar (terug te slaan!)
  shootFireball(p) {
    const o = this.mouthPos();
    const dir = new THREE.Vector3(p.pos.x - o.x, p.pos.y + 1.1 - o.y, p.pos.z - o.z).normalize();
    if (this.enraged) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(this.shots * 1.1) * 0.1);
    game.addProjectile(makeFireball(o, dir, this.enraged ? 13 : 12, this.dmg(13)));
    SND.play('shoot', { at: o, range: 40, vol: 0.8 });
  }

  // Plekjes rond de speler op de kratervloer (niet in een zuil)
  freeSpots(n, minR, maxR, list) {
    const p = player, ac = this.info.arenaCenter;
    for (let tries = 0; tries < 60 && n > 0; tries++) {
      const a = Math.random() * Math.PI * 2, r = minR + Math.random() * (maxR - minR);
      const x = p.pos.x + Math.cos(a) * r, z = p.pos.z + Math.sin(a) * r;
      if (Math.hypot(x - ac.x, z - ac.z) > 16) continue;
      if (this.world.solidAt(Math.floor(x), VF + 1, Math.floor(z))) continue;
      if (list.some((s) => Math.hypot(s.x - x, s.z - z) < 2.6)) continue;
      list.push({ x, y: VF + 1, z });
      n--;
    }
    return list;
  }

  playerSpot() {
    const p = player;
    let x = p.pos.x + p.vel.x * 0.35, z = p.pos.z + p.vel.z * 0.35;
    if (this.world.solidAt(Math.floor(x), Math.floor(p.pos.y + 0.5), Math.floor(z))) { x = p.pos.x; z = p.pos.z; }
    return { x, y: groundAt(this.world, x, p.pos.y + 0.5, z), z };
  }

  // Lavageisers: eerst een cirkel, dan spuit er een zuil lava omhoog
  geyserWave(extra, warn) {
    const spots = this.freeSpots(extra, 2.5, 5.5, [this.playerSpot()]);
    spots.forEach((s, i) => this.spawnGeyser(s.x, s.y, s.z, warn + i * 0.08));
    SND.play('lavapop', { at: player.pos, range: 40, vol: 0.9 });
  }

  spawnGeyser(x, y, z, warn) {
    sharedGeo();
    game.addHazard(new GroundHazard({
      x, y, z, radius: 1.5, warn, linger: 1.0, color: 0xff4a00, dmg: this.dmg(14), type: 'geyser', knock: 3, up: 10,
      onTrigger: (h) => {
        const col = new THREE.Mesh(VG.geyser, VG.lavaMat);
        col.scale.y = 0.05;
        h.mesh.add(col);
        h.col = col;
        SND.play('explode', { at: { x, y, z }, range: 34, vol: 0.45 });
        for (let i = 0; i < 14; i++) {
          FX.debris.spawn(x, y + 0.5, z, (Math.random() - 0.5) * 5, 6 + Math.random() * 6, (Math.random() - 0.5) * 5, 1, 0.4 + Math.random() * 0.3, 0.05, 1, 16, 0.3, true);
        }
        if (h.playerInside()) {
          damagePlayer(h.dmg, { x, y, z }, 'geyser', h.knock, h.up);
          player.fire = Math.max(player.fire, 2);
        }
      },
      onLinger: (h) => {
        if (!h.col) return;
        const k = h.t - h.warn;
        h.col.scale.y = k < 0.15 ? Math.max(0.05, k / 0.15) * 7 : Math.max(0.05, 7 * (1 - Math.max(0, k - 0.45) / 0.55));
        if (Math.random() < 0.5) FX.flame(x + (Math.random() - 0.5) * 1.2, y + Math.random() * h.col.scale.y, z + (Math.random() - 0.5) * 1.2, 0.5);
      },
    }));
  }

  // Meteorenregen: waarschuwingscirkels, dan vallen er brandende brokken uit de lucht
  meteorRain() {
    const ph2 = this.enraged, n = ph2 ? 9 : 5, ac = this.info.arenaCenter;
    const spots = this.freeSpots(n - 1, 2.2, 7.5, [this.playerSpot()]);
    if (!VG.meteorMat) VG.meteorMat = new THREE.MeshLambertMaterial({ map: VTEX.body, emissive: 0xffffff, emissiveMap: VTEX.bodyGlow, emissiveIntensity: 1.3 });
    spots.forEach((s, i) => {
      const warn = (ph2 ? 1.25 : 1.45) + i * (ph2 ? 0.14 : 0.2);
      game.addHazard(new GroundHazard({
        x: s.x, y: s.y, z: s.z, radius: 1.6, warn, linger: 0.4, color: 0xff2200, dmg: this.dmg(14), type: 'meteor', knock: 7, up: 7,
        onTrigger: (h) => {
          if (h.playerInside()) damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'meteor', h.knock, h.up);
          FX.ring(h.x, h.y, h.z, 1.8, [1, 0.5, 0.1]);
          const d = Math.hypot(player.pos.x - h.x, player.pos.z - h.z);
          game.shake = Math.max(game.shake, clamp(0.5 - d * 0.03, 0.1, 0.5));
        },
      }));
      // de meteoor komt schuin uit de lucht, vanaf de kant van het midden
      let ox = ac.x - s.x, oz = ac.z - s.z;
      const od = Math.hypot(ox, oz) || 1;
      ox = ox / od * 3; oz = oz / od * 3;
      const start = new THREE.Vector3(s.x + ox, s.y + 20, s.z + oz);
      const vel = new THREE.Vector3(-ox / warn, (0.2 - 20) / warn, -oz / warn);
      game.addProjectile(new Projectile({
        pos: start, vel, owner: 'boss', type: 'meteor', dmg: this.dmg(14), radius: 0.5, knock: 6, life: warn + 0.6,
        mesh: cachedBoxMesh('volcano_meteor', 0.95, () => VG.meteorMat),
        trail: (pr) => {
          FX.flame(pr.pos.x, pr.pos.y + 0.3, pr.pos.z, 0.7);
          if (Math.random() < 0.5) FX.smoke(pr.pos.x, pr.pos.y + 0.7, pr.pos.z);
        },
        explodeFx: (pr) => {
          FX.explosion(pr.pos.x, pr.pos.y + 0.3, pr.pos.z, 0.9);
          SND.play('explode', { at: pr.pos, range: 36, vol: 0.55 });
        },
      }));
    });
  }

  spawnCube(q, side) {
    if (game.minions.filter((m) => !m.dead).length >= 3) return;
    const p = player;
    let dx = p.pos.x - q.x, dz = p.pos.z - q.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    const x = q.x + (dx - dz * side) * (q.r + 1.3), z = q.z + (dz + dx * side) * (q.r + 1.3);
    if (this.world.solidAt(Math.floor(x), VF + 1, Math.floor(z)) || this.world.solidAt(Math.floor(x), VF + 2, Math.floor(z))) return;
    game.addMinion(new Minion(this.world, x, VF + 1.2, z, {
      name: 'Magmablokje', hp: 45, speed: 2.7, dmg: this.dmg(9), hw: 0.42, h: 0.85, life: 28, color: [1, 0.45, 0.1], model: magmaCubeModel,
    }));
    FX.explosion(x, VF + 1.5, z, 0.4);
  }

  animate(dt) {
    const st = this.state, p = player, a = this.anim, m = this.model;
    this.waveT += dt;
    // slapen, rusten en brullen krijgen geen think(): de kop hier bewegen
    if (st === 'sleep' || st === 'idle') {
      this.hidden = false;
      this.head.lerp(this.home, 1 - Math.exp(-dt * 3));
      this.hyaw += angleDiff(this.hyaw, this.restYaw) * Math.min(1, dt * 2);
      if (Math.random() < dt * 1.5) { const n = this.mouthPos(); FX.smoke(n.x, n.y + 0.2, n.z); }
    } else if (st === 'roar') {
      const q = this.pools[this.pool];
      this.tgt.set(q.x + Math.sin(this.hyaw) * 1.2, VF + 7, q.z + Math.cos(this.hyaw) * 1.2);
      this.headTo(this.tgt, dt, 3);
      if (Math.random() < dt * 30) { const n = this.mouthPos(); FX.flame(n.x, n.y, n.z, 0.8); }
    }
    this.pos.copy(this.head);
    this.vel.set(0, 0, 0);
    this.flying = !OUT[st];   // met de kop buiten de lava telt hij als 'op de grond' (richthulp)

    // kaak en kijkrichting per staat
    const hx = p.pos.x - this.head.x, hz = p.pos.z - this.head.z;
    const look = clamp(Math.atan2(p.pos.y + 1.0 - this.head.y - 0.55, Math.max(0.5, Math.hypot(hx, hz))), -0.8, 0.8);
    let jaw = 0.08, pitch = look, eyeK = 1, rate = 8;
    const k01 = clamp(this.t / Math.max(0.1, this.W), 0, 1);
    switch (st) {
      case 'sleep': case 'idle': jaw = 0; pitch = -0.08; eyeK = 0.15; rate = 3; break;
      case 'roar': case 'enrage': jaw = 0.95 + Math.sin(this.t * 30) * 0.05; pitch = 0.6; break;
      case 'hover': case 'retract': jaw = 0.12 + Math.sin(this.waveT * 2) * 0.08; break;
      case 'biteWind': jaw = 0.95 * k01; pitch = 0.15 + look * 0.4; rate = 10; break;
      case 'bite': jaw = 1; pitch = -0.25; rate = 20; break;
      case 'stuck': jaw = 0.25; pitch = -0.12; eyeK = 0.55; break;
      case 'stagger': jaw = 0.35; pitch = -0.15; eyeK = 0.55; break;
      case 'breathWind': jaw = 0.85 * k01; break;
      case 'breath': jaw = 0.95; break;
      case 'geyserWind': jaw = 0.9; pitch = 0.5; break;
      case 'meteorWind': case 'meteors': jaw = 0.85; pitch = 1.1; break;
      case 'dive': jaw = 0.1; pitch = -1.2; rate = 6; break;
      case 'rise': jaw = 0.6; pitch = 0.8; rate = 10; break;
      default: break;
    }
    const kk = 1 - Math.exp(-dt * rate);
    a.jaw += (jaw - a.jaw) * kk;
    a.pitch += (pitch - a.pitch) * kk;
    this.hpitch = a.pitch;
    m.jawPivot.rotation.x = a.jaw * 0.75;
    m.mouth.visible = a.jaw > 0.15;
    // ogen: knipperen bij het inademen, rood in fase 2
    const warn = (st === 'biteWind' || st === 'breathWind' || st === 'meteorWind' || st === 'geyserWind') && Math.sin(this.t * 40) > 0;
    m.eye.color.setHex(warn ? 0xffffff : this.eyeBase);
    for (const e of m.eyes) e.scale.y = eyeK;
    this.placeModel();
  }

  placeModel() {
    const m = this.model;
    m.root.position.set(-this.pos.x, -this.pos.y, -this.pos.z);
    m.root.visible = !this.hidden;
    m.head.position.set(this.head.x, this.head.y + 0.55, this.head.z);
    m.head.rotation.set(-this.hpitch, this.hyaw, 0);
    this.layoutBody();
  }

  // Het lijf: een kromme van achter de kop tot diep in de poel; de brokken liggen op vaste afstanden
  layoutBody() {
    const m = this.model, q = this.pools[this.pool], V = this.v, pts = this.spine, lens = this.spineLen;
    const f = this.forward(V.tmp);
    const fx = f.x, fy = f.y, fz = f.z;
    const P0 = V.p0.set(this.head.x - fx * 0.8, this.head.y + 0.5 - fy * 0.8, this.head.z - fz * 0.8);
    const P3 = V.p3.set(q.x, VF - 1.8, q.z);
    const hd = Math.hypot(P0.x - P3.x, P0.z - P3.z);
    const Q1 = V.q1.set(P0.x - fx * 1.8, P0.y - fy * 1.8 + clamp((hd - 3) * 0.3, 0, 2.5), P0.z - fz * 1.8);
    const Q2 = V.q2.set(P3.x, VF + 0.6 + clamp(hd * 0.45, 0, 4.2), P3.z);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, u = 1 - t;
      const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
      pts[i].set(b0 * P0.x + b1 * Q1.x + b2 * Q2.x + b3 * P3.x, b0 * P0.y + b1 * Q1.y + b2 * Q2.y + b3 * P3.y, b0 * P0.z + b1 * Q1.z + b2 * Q2.z + b3 * P3.z);
      lens[i] = i ? lens[i - 1] + pts[i].distanceTo(pts[i - 1]) : 0;
    }
    const L = lens[24], segs = m.segs, N = segs.length;
    const gap = Math.max(0.92, (L - 0.2) / (N - 0.4));
    const prev = V.prev.set(P0.x + fx * 0.6, P0.y + fy * 0.6, P0.z + fz * 0.6);
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = 0.2 + i * gap, seg = segs[i], o = seg.position;
      if (s >= L) o.set(P3.x, P3.y - (s - L), P3.z);
      else {
        while (j < 23 && lens[j + 1] < s) j++;
        const k = (s - lens[j]) / Math.max(1e-6, lens[j + 1] - lens[j]);
        o.lerpVectors(pts[j], pts[j + 1], k);
        // zijwaarts kronkelen
        const env = Math.min(1, s / 1.5) * clamp((L - s) / 2, 0, 1);
        const tx = pts[j + 1].x - pts[j].x, tz = pts[j + 1].z - pts[j].z, tl = Math.hypot(tx, tz);
        if (env > 0 && tl > 1e-4) {
          const wv = Math.sin(this.waveT * 3.2 - s * 1.4) * 0.32 * env * this.wiggle;
          o.x += -tz / tl * wv; o.z += tx / tl * wv;
        }
      }
      const dx = prev.x - o.x, dy = prev.y - o.y, dz = prev.z - o.z;
      seg.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0);
      prev.copy(o);
    }
    // lava druipt van het lijf
    if (!this.hidden && this.state !== 'sleep' && Math.random() < 0.1) {
      const sg = segs[1 + Math.floor(Math.random() * 6)].position;
      if (sg.y > VF + 1.5) FX.debris.spawn(sg.x, sg.y - 0.4, sg.z, 0, -1, 0, 1, 0.45, 0.08, 1.2, 14, 0, true);
    }
  }
}

/* ---------- Sfeer: asregen, rookpluimen en borrelende lava ---------- */
function volcanoAmbience(dt, info) {
  const p = player;
  game.ashT += dt * 22;
  while (game.ashT > 1) { game.ashT -= 1; FX.ash(p.pos.x, p.pos.y + 4, p.pos.z); }
  for (const v of info.vents) {
    v.t = (v.t || 0) + dt * 16;
    while (v.t > 1) {
      v.t -= 1;
      const g = 0.14 + Math.random() * 0.16;
      FX.glow.spawn(v.x + (Math.random() - 0.5) * 1.8, v.y, v.z + (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 0.6 + 0.3, 2.4 + Math.random() * 1.4, (Math.random() - 0.5) * 0.6, g, g * 0.92, g * 0.9, 3.5 + Math.random(), -0.3, 0.15);
    }
    if (Math.random() < dt * 3) FX.flame(v.x, v.y + 0.3, v.z, 0.8);
  }
  game.popT -= dt;
  if (game.popT <= 0) {
    game.popT = 0.5 + Math.random() * 1.6;
    const q = info.pools[Math.floor(Math.random() * info.pools.length)];
    const a = Math.random() * Math.PI * 2, r = Math.random() * q.r * 0.8;
    for (let i = 0; i < 5; i++) FX.flame(q.x + Math.cos(a) * r, VF + 0.95, q.z + Math.sin(a) * r, 0.4);
    if (Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < 18) SND.play('lavapop', { vol: 0.35 });
  }
}

registerRealm('volcano', {
  gen: genVolcano,
  makeBoss: (world, info) => new MagmaSnake(world, info),
  atmosphere: { background: 0x3c0d05, fog: 0x8a2c0c, near: 12, far: 58, amb: 0xffc4a4, ambI: 0.85, dir: 0xff9a5a, dirI: 0.5, hand: 0xffd2bc },
  intro: 'Pfoe, wat is het hier heet! In een van de lavapoelen slaapt de Magmaslang...',
  tip: 'Tip: sla zijn kop als die laag is, en kijk omhoog voor meteoren!',
  treasureTip: 'Volg de trap met goud langs de kraterwand omhoog en sla de gouden deur kapot!',
  ambience: volcanoAmbience,
  ambientSound: 0.9,
  ruin: [BAS, BLK, B.MAGMA, BLK],
  onEnter() {
    Object.assign(DEATH_REASONS, {
      bite: 'Gebeten door de Magmaslang',
      emerge: 'Verrast door de Magmaslang uit de lava',
      geyser: 'Gelanceerd door een lavageiser',
      meteor: 'Geraakt door een meteoor',
    });
  },
});

window.VOLCANO = { gen: genVolcano, Boss: MagmaSnake };
})();
