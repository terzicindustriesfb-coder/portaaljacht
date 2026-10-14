'use strict';
/* Portaaljacht – alle textures worden met code getekend (16x16 pixel art) */

const TILE = 16;
const ATLAS_TILES = 16;                 // 16 x 16 tegels in de atlas
const ATLAS_PX = TILE * ATLAS_TILES;    // 256 px

// Tegel-indexen in de atlas
const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG_SIDE: 5, LOG_TOP: 6, LEAVES: 7,
  SAND: 8, PLANKS: 9, OBSIDIAN: 10, NETHERRACK: 11, GLOWSTONE: 12, NETHERBRICK: 13, BEDROCK: 14, GOLD: 15,
  MAGMA: 16, FLOWER_R: 17, FLOWER_Y: 18, TALLGRASS: 19, GLASS: 20, BRICKS: 21, COAL_ORE: 22, IRON_ORE: 23,
  DIAMOND_ORE: 24, WATER: 25, LAVA: 26, PORTAL: 27,
  SNOW: 28, ICE: 29, PACKED_ICE: 30, END_STONE: 31, PURPUR: 32, CRYSTAL: 33, CLOUD: 34, QUARTZ: 35,
  QUARTZ_TOP: 36, CHEST_SIDE: 37, CHEST_TOP: 38, SCULK: 39, SPRUCE_LEAVES: 40, GRASS_SNOW_SIDE: 41, BLUE_ICE: 42,
  CHEST_FRONT: 43,
};

const Tex = {};
let TILE_UV = [];

// Extra tegels: elk wereldbestand kan eigen pixel art toevoegen.
// defineTile('NAAM', (h) => (x, y) => [r,g,b] | [r,g,b,a] | null) geeft het tegelnummer terug (ook als T.NAAM).
// h bevat hulpjes: R (random), vary(kleur, spreiding), stonePx(), dirtPx(), voronoi.
const TILE_DEFS = [];
let NEXT_TILE = 44;
function defineTile(key, make) {
  if (T[key] !== undefined) return T[key];
  const tile = NEXT_TILE++;
  if (tile >= ATLAS_TILES * ATLAS_TILES) throw new Error('Atlas vol bij tegel ' + key);
  T[key] = tile;
  TILE_DEFS.push({ tile, make });
  return tile;
}

// Diamanten zwaard als pixel art (k = rand, w = licht, d = blad, g = greep-kruis, h = handvat)
const SWORD_ART = [
  '.............kkk',
  '............kwwk',
  '...........kwwdk',
  '..........kwwdk.',
  '.........kwwdk..',
  '........kwwdk...',
  '.......kwwdk....',
  '..kk..kwwdk.....',
  '..kgkkwwdk......',
  '...kgwwdk.......',
  '....kgdk........',
  '....khgk........',
  '...khkkgk.......',
  '..khk..kk.......',
  '.kkk............',
  '................',
];

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function nearestTex(tex) {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Tekent een canvas pixel voor pixel; fn(x, y) geeft [r,g,b,(a)] of null (doorzichtig)
function pixelCanvas(w, h, fn) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = fn(x, y);
      const i = (y * w + x) * 4;
      if (!col) { d[i + 3] = 0; continue; }
      d[i] = clamp(Math.round(col[0]), 0, 255);
      d[i + 1] = clamp(Math.round(col[1]), 0, 255);
      d[i + 2] = clamp(Math.round(col[2]), 0, 255);
      d[i + 3] = col[3] === undefined ? 255 : col[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function pixelTexture(w, h, fn) {
  return nearestTex(new THREE.CanvasTexture(pixelCanvas(w, h, fn)));
}

// Voronoi-hulp voor keien, magma en baas-scheuren (naadloos)
function voronoi(pts, x, y, size) {
  let d1 = 1e9, d2 = 1e9, i1 = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let oy = -size; oy <= size; oy += size) {
      for (let ox = -size; ox <= size; ox += size) {
        const dx = x + 0.5 - pts[i][0] - ox, dy = y + 0.5 - pts[i][1] - oy;
        const d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; i1 = i; } else if (d < d2) d2 = d;
      }
    }
  }
  return { i: i1, edge: Math.sqrt(d2) - Math.sqrt(d1) };
}

function buildAtlas() {
  const canvas = makeCanvas(ATLAS_PX, ATLAS_PX);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(ATLAS_PX, ATLAS_PX);
  const d = img.data;
  const R = mulberry32(20241014);
  const vary = (c, v) => { const k = (R() - 0.5) * 2 * v; return [c[0] + k, c[1] + k, c[2] + k, c[3]]; };
  const paint = (tile, fn) => {
    const ox = (tile % ATLAS_TILES) * TILE, oy = Math.floor(tile / ATLAS_TILES) * TILE;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const c = fn(x, y);
        const i = ((oy + y) * ATLAS_PX + ox + x) * 4;
        if (!c) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
        d[i] = clamp(Math.round(c[0]), 0, 255);
        d[i + 1] = clamp(Math.round(c[1]), 0, 255);
        d[i + 2] = clamp(Math.round(c[2]), 0, 255);
        d[i + 3] = c[3] === undefined ? 255 : c[3];
      }
    }
  };

  const dirtPx = () => {
    const r = R();
    const c = r < 0.15 ? [108, 76, 52] : r < 0.3 ? [150, 109, 76] : r < 0.36 ? [120, 120, 120] : [134, 96, 67];
    return vary(c, 7);
  };
  const stonePx = () => {
    const r = R();
    const v = r < 0.1 ? 104 : r < 0.25 ? 141 : 126;
    return vary([v, v, v], 7);
  };

  paint(T.DIRT, dirtPx);

  paint(T.GRASS_TOP, () => {
    const r = R();
    const c = r < 0.2 ? [86, 140, 50] : r < 0.4 ? [124, 184, 78] : [104, 164, 62];
    return vary(c, 9);
  });

  const depth = [];
  for (let x = 0; x < 16; x++) depth[x] = 2 + Math.floor(R() * 3);
  paint(T.GRASS_SIDE, (x, y) => {
    if (y < depth[x]) { const r = R(); return vary(r < 0.3 ? [86, 140, 50] : [104, 164, 62], 9); }
    if (y === depth[x] && R() < 0.5) return vary([80, 128, 46], 6);
    return dirtPx();
  });

  paint(T.STONE, stonePx);

  const cob = [];
  for (let i = 0; i < 9; i++) cob.push([R() * 16, R() * 16, 98 + R() * 52]);
  paint(T.COBBLE, (x, y) => {
    const v = voronoi(cob, x, y, 16);
    if (v.edge < 1.0) return vary([62, 62, 62], 5);
    const b = cob[v.i][2];
    return vary([b, b, b], 9);
  });

  const bark = [];
  for (let x = 0; x < 16; x++) bark[x] = R();
  paint(T.LOG_SIDE, (x) => {
    const s = bark[x];
    let c = s < 0.3 ? [74, 57, 33] : s < 0.65 ? [104, 82, 50] : [90, 70, 42];
    if (R() < 0.1) c = [58, 45, 26];
    return vary(c, 6);
  });

  paint(T.LOG_TOP, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return vary([92, 72, 44], 6);
    const r = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    return vary(Math.floor(r) % 2 === 0 ? [180, 146, 90] : [152, 120, 72], 5);
  });

  paint(T.LEAVES, () => {
    const r = R();
    if (r < 0.16) return null;
    const c = r < 0.4 ? [38, 94, 26] : r < 0.72 ? [56, 120, 36] : [74, 142, 48];
    return vary(c, 8);
  });

  paint(T.SAND, () => {
    const r = R();
    return vary(r < 0.15 ? [200, 188, 140] : r < 0.25 ? [232, 222, 180] : [219, 207, 163], 6);
  });

  paint(T.PLANKS, (x, y) => {
    const row = y >> 2;
    if (y % 4 === 3) return vary([104, 80, 46], 4);
    const seam = (row % 2 === 0) ? 3 : 11;
    if (x === seam) return vary([116, 90, 54], 4);
    const g = R() < 0.2 ? -14 : 0;
    return vary([162 + g, 130 + g, 78 + g], 5);
  });

  paint(T.OBSIDIAN, () => {
    const r = R();
    if (r < 0.06) return vary([84, 58, 128], 10);
    if (r < 0.2) return vary([44, 28, 70], 6);
    return vary([18, 14, 28], 4);
  });

  paint(T.NETHERRACK, () => {
    const r = R();
    const c = r < 0.25 ? [86, 36, 36] : r < 0.38 ? [140, 72, 68] : [112, 54, 52];
    return vary(c, 8);
  });

  const glowCells = [];
  for (let i = 0; i < 16; i++) glowCells.push(R() < 0.5);
  paint(T.GLOWSTONE, (x, y) => {
    const edge = (x % 4 === 0 || y % 4 === 0) && R() < 0.65;
    const c = edge ? [150, 108, 50] : (glowCells[(y >> 2) * 4 + (x >> 2)] ? [255, 232, 150] : [224, 182, 96]);
    return vary(c, 10);
  });

  const brickPattern = (x, y, brick, mortar, hi) => {
    const row = y >> 2;
    const off = (row % 2) * 4;
    if (y % 4 === 3 || (x + off) % 8 === 7) return vary(mortar, 4);
    return vary(R() < 0.15 ? hi : brick, 7);
  };
  paint(T.NETHERBRICK, (x, y) => brickPattern(x, y, [68, 32, 38], [26, 11, 14], [90, 44, 50]));
  paint(T.BRICKS, (x, y) => brickPattern(x, y, [150, 74, 58], [176, 168, 158], [128, 60, 46]));

  paint(T.BEDROCK, () => {
    const r = R();
    return vary(r < 0.4 ? [40, 40, 40] : r < 0.75 ? [86, 86, 86] : [132, 132, 132], 6);
  });

  paint(T.GOLD, (x, y) => {
    if (x === 0 || y === 0) return [255, 255, 186];
    if (x === 15 || y === 15) return [204, 148, 22];
    const r = R();
    return vary(r < 0.1 ? [255, 250, 160] : r < 0.3 ? [238, 190, 40] : [252, 219, 62], 4);
  });

  const mag = [];
  for (let i = 0; i < 7; i++) mag.push([R() * 16, R() * 16]);
  paint(T.MAGMA, (x, y) => {
    const v = voronoi(mag, x, y, 16);
    if (v.edge < 0.8) return vary([255, 150, 40], 15);
    if (v.edge < 1.6) return vary([200, 70, 20], 10);
    return vary(R() < 0.4 ? [96, 34, 14] : [70, 22, 10], 6);
  });

  paint(T.FLOWER_R, (x, y) => {
    if (x === 7 && y >= 7) return [48, 118, 30];
    if ((y === 11 && (x === 8 || x === 9)) || (y === 12 && x === 6)) return [62, 142, 36];
    const dx = x - 7, dy = y - 5;
    if (dx * dx + dy * dy <= 5) {
      if (dx === 0 && dy === 0) return [40, 22, 12];
      return R() < 0.25 ? [158, 18, 22] : [214, 32, 36];
    }
    return null;
  });

  paint(T.FLOWER_Y, (x, y) => {
    if (x === 7 && y >= 8) return [48, 118, 30];
    if (y === 12 && (x === 8 || x === 9)) return [62, 142, 36];
    const dx = x - 7, dy = y - 6;
    if (dx * dx + dy * dy <= 3) return R() < 0.25 ? [235, 190, 20] : [255, 232, 40];
    return null;
  });

  const blades = [];
  for (let i = 0; i < 8; i++) blades.push({ x: 1 + Math.floor(R() * 14), h: 6 + Math.floor(R() * 9), lean: R() < 0.5 ? -1 : 1 });
  paint(T.TALLGRASS, (x, y) => {
    const t = 15 - y;
    for (const b of blades) {
      if (t < b.h) {
        const bx = b.x + (t > b.h * 0.6 ? b.lean : 0);
        if (bx === x) return vary([74, 136, 46], 14);
      }
    }
    return null;
  });

  paint(T.GLASS, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [196, 224, 232];
    if ((x === 2 && y >= 2 && y <= 4) || (y === 2 && x >= 2 && x <= 4) || (x + y === 13 && x >= 5 && x <= 8)) return [236, 250, 255];
    return null;
  });

  const ore = (tile, color) => {
    const spots = [];
    for (let k = 0; k < 4; k++) spots.push([2 + R() * 12, 2 + R() * 12]);
    paint(tile, (x, y) => {
      for (const s of spots) {
        const dx = x - s[0], dy = y - s[1];
        if (dx * dx + dy * dy < 2.4 && R() < 0.85) return vary(color, 14);
      }
      return stonePx();
    });
  };
  ore(T.COAL_ORE, [32, 32, 32]);
  ore(T.IRON_ORE, [216, 176, 146]);
  ore(T.DIAMOND_ORE, [92, 232, 222]);

  // ---- blokken voor de andere werelden ----
  paint(T.SNOW, () => { const r = R(); return vary(r < 0.15 ? [226, 236, 244] : [246, 250, 252], 4); });
  const snowDepth = [];
  for (let x = 0; x < 16; x++) snowDepth[x] = 3 + Math.floor(R() * 2);
  paint(T.GRASS_SNOW_SIDE, (x, y) => {
    if (y < snowDepth[x]) return vary([244, 248, 252], 4);
    return dirtPx();
  });
  const iceStreak = (x, y) => (x + y * 2) % 11 === 0 || (x * 2 + y) % 13 === 0;
  paint(T.ICE, (x, y) => (iceStreak(x, y) ? vary([210, 236, 255], 6) : vary([128, 176, 240], 7)));
  paint(T.PACKED_ICE, (x, y) => (iceStreak(x, y) && R() < 0.6 ? vary([190, 214, 250], 5) : vary([150, 184, 236], 6)));
  paint(T.BLUE_ICE, (x, y) => (iceStreak(x, y) ? vary([140, 200, 255], 6) : vary([70, 130, 220], 7)));
  paint(T.END_STONE, () => { const r = R(); return vary(r < 0.2 ? [206, 206, 150] : r < 0.35 ? [236, 238, 182] : [221, 223, 165], 6); });
  paint(T.PURPUR, (x, y) => {
    if (x % 8 === 0 || y % 8 === 0) return vary([120, 80, 120], 4);
    return vary(R() < 0.25 ? [180, 128, 180] : [166, 120, 166], 6);
  });
  paint(T.CRYSTAL, (x, y) => {
    const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
    if (d < 4) return vary([250, 220, 255], 8);
    if (d < 7) return vary([206, 120, 255], 10);
    return vary([140, 60, 200], 10);
  });
  paint(T.CLOUD, () => vary(R() < 0.15 ? [232, 236, 244] : [252, 252, 255], 3));
  paint(T.QUARTZ, () => vary(R() < 0.1 ? [226, 218, 208] : [240, 234, 226], 4));
  paint(T.QUARTZ_TOP, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return vary([214, 206, 196], 3);
    return vary([244, 238, 230], 3);
  });
  paint(T.SCULK, () => {
    const r = R();
    if (r < 0.05) return vary([60, 220, 230], 10);
    return vary(r < 0.3 ? [12, 44, 52] : [8, 30, 38], 5);
  });
  paint(T.SPRUCE_LEAVES, (x, y) => {
    const r = R();
    if (r < 0.12) return null;
    if (y < 4 && R() < 0.55) return vary([238, 244, 250], 5);
    return vary(r < 0.5 ? [36, 70, 44] : [48, 88, 56], 6);
  });
  const chestWood = (x, y) => {
    if (x === 0 || x === 15 || y === 15) return vary([72, 46, 20], 4);
    if (y === 5 || y === 6) return vary([60, 38, 16], 4);
    return vary(R() < 0.2 ? [140, 92, 40] : [160, 108, 48], 5);
  };
  paint(T.CHEST_SIDE, chestWood);
  paint(T.CHEST_FRONT, (x, y) => {
    if (x >= 7 && x <= 8 && y >= 4 && y <= 7) return y === 7 ? [120, 120, 120] : [200, 200, 200];
    return chestWood(x, y);
  });
  paint(T.CHEST_TOP, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return vary([72, 46, 20], 4);
    return vary(R() < 0.2 ? [140, 92, 40] : [160, 108, 48], 5);
  });

  // tegels uit defineTile()
  const helpers = { R, vary, stonePx, dirtPx, voronoi };
  for (const def of TILE_DEFS) paint(def.tile, def.make(helpers));

  paint(T.WATER, () => vary([48, 88, 210, 200], 12));
  paint(T.LAVA, () => { const r = R(); return r < 0.3 ? [255, 200, 60] : vary([226, 100, 22], 12); });
  paint(T.PORTAL, () => vary([120, 40, 210, 220], 30));

  ctx.putImageData(img, 0, 0);
  Tex.atlasCanvas = canvas;
  Tex.atlasData = d;
  Tex.atlas = nearestTex(new THREE.CanvasTexture(canvas));

  TILE_UV = [];
  const s = 1 / ATLAS_TILES, e = 0.0004;
  for (let t = 0; t < ATLAS_TILES * ATLAS_TILES; t++) {
    const col = t % ATLAS_TILES, row = Math.floor(t / ATLAS_TILES);
    TILE_UV.push([col * s + e, 1 - (row + 1) * s + e, (col + 1) * s - e, 1 - row * s - e]);
  }
}

// Kies een willekeurige (niet-doorzichtige) pixelkleur van een tegel, voor brokjes.
function sampleTileColor(tile) {
  const d = Tex.atlasData;
  const ox = (tile % ATLAS_TILES) * TILE, oy = Math.floor(tile / ATLAS_TILES) * TILE;
  for (let k = 0; k < 16; k++) {
    const x = ox + Math.floor(Math.random() * 16), y = oy + Math.floor(Math.random() * 16);
    const i = (y * ATLAS_PX + x) * 4;
    if (d[i + 3] > 128) return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
  }
  return [0.5, 0.5, 0.5];
}

// Geanimeerde texture: frames onder elkaar in één canvas, wisselen via offset.
function makeStrip(frames, fn) {
  const c = pixelCanvas(16, 16 * frames, (x, y) => fn(Math.floor(y / 16), x, y % 16));
  const tex = nearestTex(new THREE.CanvasTexture(c));
  tex.repeat.set(1, 1 / frames);
  tex.stripFrames = frames;
  setStripFrame(tex, 0);
  return tex;
}
function setStripFrame(tex, f) {
  const n = tex.stripFrames;
  tex.offset.y = 1 - ((f % n) + 1) / n;
}

function buildAnimated() {
  const R = mulberry32(777);
  const n1 = tileableNoise(R, 16, 2), n2 = tileableNoise(R, 16, 2);
  Tex.water = makeStrip(16, (f, x, y) => {
    const a = n1[((y + f) & 15) * 16 + ((x + f) & 15)];
    const b = n2[(y & 15) * 16 + ((x - f) & 15)];
    const v = (a + b) * 0.5;
    return [36 + v * 46, 72 + v * 70, 186 + v * 56, 190];
  });

  const l1 = tileableNoise(R, 16, 2), l2 = tileableNoise(R, 16, 3);
  Tex.lava = makeStrip(16, (f, x, y) => {
    const a = l1[((y + f) & 15) * 16 + x];
    const b = l2[y * 16 + ((x + (f >> 1)) & 15)];
    const v = a * 0.6 + b * 0.4;
    if (v > 0.66) return [255, 234, 96];
    if (v > 0.5) return [252, 164, 36];
    if (v > 0.32) return [226, 100, 20];
    return [188, 58, 12];
  });

  Tex.portal = makePortalStrip([70, 8, 150], [220, 80, 255]);
  Tex.portals = [];

  // Breek-scheuren in 5 stappen
  const order = new Int16Array(256).fill(-1);
  const CR = mulberry32(99);
  for (let b = 0; b < 6; b++) {
    let x = 7 + CR() * 1.5, y = 7 + CR() * 1.5;
    const ang = b / 6 * Math.PI * 2 + CR() * 0.6;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    for (let s = 0; s < 10; s++) {
      const px = Math.round(x), py = Math.round(y);
      if (px >= 0 && py >= 0 && px < 16 && py < 16) {
        const i = py * 16 + px;
        if (order[i] < 0 || order[i] > s) order[i] = s;
      }
      x += dx + (CR() - 0.5) * 0.9; y += dy + (CR() - 0.5) * 0.9;
    }
  }
  Tex.crack = makeStrip(5, (f, x, y) => {
    const o = order[y * 16 + x];
    return (o >= 0 && o < (f + 1) * 2) ? [0, 0, 0, 175] : [0, 0, 0, 0];
  });
}

// Draaiend portaal in twee kleuren (donker a naar licht b)
function makePortalStrip(a, b) {
  return makeStrip(16, (f, x, y) => {
    const dx = x - 7.5, dy = y - 7.5;
    const r = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx);
    const t = f / 16 * Math.PI * 2;
    const v = Math.sin(ang * 2 + r * 0.8 - t) * 0.5 + 0.5;
    const w = Math.sin(ang * 3 - r * 0.55 + t * 2) * 0.5 + 0.5;
    const k = v * 0.7 + w * 0.3;
    return [a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1]), a[2] + k * (b[2] - a[2]), 205];
  });
}

// Het portaal voor schurk nummer `level` (eigen kleur per wereld)
function portalTexture(level) {
  if (!Tex.portals[level]) {
    const r = REALMS[level % REALMS.length];
    Tex.portals[level] = level === 0 ? Tex.portal : makePortalStrip(r.portal.a, r.portal.b);
  }
  return Tex.portals[level];
}

function buildSkyTextures() {
  Tex.sun = pixelTexture(16, 16, (x, y) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d < 4) return [255, 255, 226, 255];
    if (d < 5) return [255, 244, 160, 230];
    if (d < 6.5) return [255, 226, 120, 110];
    return [255, 220, 120, 30];
  });

  const R = mulberry32(4242);
  const n = tileableNoise(R, 64, 2);
  const c = pixelCanvas(64, 64, (x, y) => (n[y * 64 + x] > 0.56 ? [255, 255, 255, 235] : null));
  Tex.clouds = nearestTex(new THREE.CanvasTexture(c));
  Tex.clouds.wrapS = Tex.clouds.wrapT = THREE.RepeatWrapping;
  Tex.clouds.repeat.set(2, 2);

  // Vuurbal
  const FR = mulberry32(55);
  Tex.fire = pixelTexture(8, 8, () => {
    const r = FR();
    return r < 0.3 ? [255, 240, 120] : r < 0.7 ? [255, 160, 30] : [220, 70, 10];
  });
}

// Isometrisch blok-icoontje voor de itembalk
function drawBlockIcon(canvas, id) {
  const ctx = canvas.getContext('2d');
  const S = canvas.width;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  ctx.imageSmoothingEnabled = false;
  const b = BLOCKS[id];
  const src = Tex.atlasCanvas;
  const at = (t) => [(t % ATLAS_TILES) * TILE, Math.floor(t / ATLAS_TILES) * TILE];
  if (b.render === R_CROSS) {
    const s = at(b.tiles.side);
    ctx.drawImage(src, s[0], s[1], 16, 16, S * 0.1, S * 0.1, S * 0.8, S * 0.8);
    return;
  }
  const k = S / 32;
  const top = at(b.tiles.top), side = at(b.tiles.side);
  ctx.setTransform(k, 0.5 * k, -k, 0.5 * k, 16 * k, 0);
  ctx.drawImage(src, top[0], top[1], 16, 16, 0, 0, 16, 16);
  ctx.setTransform(k, 0.5 * k, 0, k, 0, 8 * k);
  ctx.drawImage(src, side[0], side[1], 16, 16, 0, 0, 16, 16);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, 0, 16, 16);
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(k, -0.5 * k, 0, k, 16 * k, 16 * k);
  ctx.drawImage(src, side[0], side[1], 16, 16, 0, 0, 16, 16);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, 16, 16);
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Hartjes (vol, half, leeg) als data-URL
function buildHeartImages() {
  const art = [
    '.kkk.kkk.',
    'kwwrkrrrk',
    'kwrrrrrrk',
    'krrrrrrrk',
    '.krrrrrk.',
    '..krrdk..',
    '...kdk...',
    '....k....',
  ];
  const make = (mode) => pixelCanvas(9, 8, (x, y) => {
    const ch = art[y][x];
    if (ch === '.') return null;
    if (ch === 'k') return [20, 4, 4];
    const full = mode === 'full' || (mode === 'half' && x < 5);
    if (!full) return [58, 14, 14];
    if (ch === 'w') return [255, 190, 190];
    if (ch === 'd') return [168, 14, 14];
    return [226, 28, 28];
  }).toDataURL();
  Tex.heartFull = make('full');
  Tex.heartHalf = make('half');
  Tex.heartEmpty = make('empty');
}

// Achtergronden voor menu's (aarde) en het logo (steen)
function buildCssTextures() {
  const tileURL = (tile, mul) => {
    const d = Tex.atlasData;
    const ox = (tile % ATLAS_TILES) * TILE, oy = Math.floor(tile / ATLAS_TILES) * TILE;
    return pixelCanvas(16, 16, (x, y) => {
      const i = ((oy + y) * ATLAS_PX + ox + x) * 4;
      return [d[i] * mul, d[i + 1] * mul, d[i + 2] * mul];
    }).toDataURL();
  };
  Tex.dirtURL = tileURL(T.DIRT, 0.32);
  Tex.stoneURL = tileURL(T.STONE, 1.15);
  Tex.cobbleURL = tileURL(T.COBBLE, 1.0);
}

function buildAllTextures() {
  buildAtlas();
  buildAnimated();
  buildSkyTextures();
  buildHeartImages();
  buildCssTextures();
}
