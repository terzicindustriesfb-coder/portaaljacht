'use strict';
/* Portaaljacht – voorwerpen: zwaarden, boog, harnassen, gouden appel, munten en diamanten (pixel art + winkelcatalogus) */

// Kleuren per zwaardsoort (sleutels uit SWORD_ART: k rand, w licht, d blad, g kruis, h handvat)
const SWORD_PALETTES = {
  stone: { k: [34, 34, 34], w: [176, 176, 176], d: [124, 124, 124], g: [92, 70, 44], h: [107, 74, 38] },
  iron: { k: [44, 44, 44], w: [255, 255, 255], d: [206, 206, 206], g: [120, 120, 120], h: [107, 74, 38] },
  diamond: { k: [14, 52, 47], w: [170, 255, 242], d: [44, 205, 178], g: [26, 112, 98], h: [107, 74, 38] },
  netherite: { k: [16, 12, 16], w: [128, 112, 122], d: [78, 66, 74], g: [48, 40, 46], h: [70, 46, 32] },
  fire: { k: [84, 12, 0], w: [255, 236, 130], d: [255, 128, 24], g: [190, 44, 0], h: [96, 32, 12] },
  star: { k: [70, 52, 0], w: [255, 255, 226], d: [255, 222, 70], g: [136, 98, 255], h: [74, 42, 150] },
  crystal: { k: [70, 40, 110], w: [255, 255, 255], d: [210, 170, 255], g: [130, 90, 200], h: [90, 60, 140] },
  dragon: { k: [70, 0, 0], w: [255, 210, 120], d: [220, 40, 30], g: [255, 190, 40], h: [60, 30, 20] },
  void: { k: [0, 0, 0], w: [200, 120, 255], d: [40, 20, 60], g: [140, 60, 255], h: [20, 10, 30] },
};

// De winkel: steeds betere spullen. Prijs in munten en diamanten.
const SHOP_ITEMS = [
  { id: 'sword_stone', kind: 'sword', name: 'Stenen zwaard', dmg: 6, mat: 'stone', price: { coins: 0, diamonds: 0 }, info: 'Je eerste zwaard' },
  { id: 'sword_iron', kind: 'sword', name: 'IJzeren zwaard', dmg: 8, mat: 'iron', price: { coins: 40, diamonds: 0 }, info: 'Stevig en scherp' },
  { id: 'sword_diamond', kind: 'sword', name: 'Diamanten zwaard', dmg: 10, mat: 'diamond', price: { coins: 70, diamonds: 2 }, info: 'Een echte klassieker' },
  { id: 'sword_netherite', kind: 'sword', name: 'Netherietzwaard', dmg: 13, mat: 'netherite', price: { coins: 120, diamonds: 4 }, info: 'Het sterkste metaal' },
  { id: 'sword_fire', kind: 'sword', name: 'Vuurzwaard', dmg: 15, mat: 'fire', fire: true, price: { coins: 170, diamonds: 6 }, info: 'Zet vijanden in brand' },
  { id: 'sword_star', kind: 'sword', name: 'Sterrenzwaard', dmg: 19, mat: 'star', star: true, price: { coins: 260, diamonds: 10 }, info: 'Laat sterren regenen bij een voltreffer' },
  { id: 'sword_crystal', kind: 'sword', name: 'Kristalzwaard', dmg: 23, mat: 'crystal', star: true, price: { coins: 340, diamonds: 14 }, info: 'Fonkelt bij elke voltreffer' },
  { id: 'sword_dragon', kind: 'sword', name: 'Drakenzwaard', dmg: 28, mat: 'dragon', fire: true, price: { coins: 480, diamonds: 18 }, info: 'Heet als drakenvuur' },
  { id: 'sword_void', kind: 'sword', name: 'Leegtezwaard', dmg: 34, mat: 'void', star: true, fire: true, price: { coins: 650, diamonds: 24 }, info: 'Het allersterkste zwaard' },
  { id: 'bow', kind: 'bow', name: 'Boog', dmg: 9, price: { coins: 35, diamonds: 0 }, info: 'Schiet pijlen: houd vast en laat los' },
  { id: 'armor_leather', kind: 'armor', name: 'Leren harnas', def: 0.15, mat: 'leather', price: { coins: 25, diamonds: 0 }, info: '15% minder schade' },
  { id: 'armor_iron', kind: 'armor', name: 'IJzeren harnas', def: 0.3, mat: 'iron', price: { coins: 70, diamonds: 1 }, info: '30% minder schade' },
  { id: 'armor_diamond', kind: 'armor', name: 'Diamanten harnas', def: 0.45, mat: 'diamond', price: { coins: 130, diamonds: 4 }, info: '45% minder schade' },
  { id: 'armor_netherite', kind: 'armor', name: 'Netheriet harnas', def: 0.6, mat: 'netherite', price: { coins: 200, diamonds: 8 }, info: '60% minder schade' },
  { id: 'armor_crystal', kind: 'armor', name: 'Kristalharnas', def: 0.68, mat: 'crystal', price: { coins: 320, diamonds: 12 }, info: '68% minder schade' },
  { id: 'armor_dragon', kind: 'armor', name: 'Drakenharnas', def: 0.75, mat: 'dragon', price: { coins: 460, diamonds: 16 }, info: '75% minder schade' },
  { id: 'apple', kind: 'apple', name: 'Gouden appel', heal: 10, price: { coins: 12, diamonds: 0 }, info: 'Geneest 5 hartjes' },
];
const ITEM = {};
for (const it of SHOP_ITEMS) ITEM[it.id] = it;

const ARMOR_COLORS = {
  leather: [[120, 72, 40], [158, 100, 58], [92, 54, 30]],
  iron: [[200, 200, 200], [240, 240, 240], [150, 150, 150]],
  diamond: [[60, 214, 200], [170, 255, 242], [30, 150, 140]],
  netherite: [[70, 60, 68], [118, 104, 114], [44, 38, 44]],
  crystal: [[200, 170, 255], [255, 255, 255], [140, 100, 210]],
  dragon: [[190, 30, 30], [255, 190, 60], [110, 10, 10]],
};

// Pixel art uit een vorm-functie: rand wordt automatisch donker getekend
function maskArt(inMask, colorAt, outline) {
  const m = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) m[y * 16 + x] = inMask(x, y) ? 1 : 0;
  const at = (x, y) => (x >= 0 && y >= 0 && x < 16 && y < 16 ? m[y * 16 + x] : 0);
  return (x, y) => {
    if (!at(x, y)) return null;
    if (!at(x + 1, y) || !at(x - 1, y) || !at(x, y + 1) || !at(x, y - 1)) return outline;
    return colorAt(x, y);
  };
}

const ITEM_ART = {
  sword(mat) {
    const pal = SWORD_PALETTES[mat] || SWORD_PALETTES.diamond;
    return (x, y) => {
      const ch = SWORD_ART[y][x];
      return ch === '.' ? null : pal[ch];
    };
  },
  bow() {
    return (x, y) => {
      const d = Math.hypot(x + 0.5 - 15.5, y + 0.5 - 15.5);
      const onArc = d > 12.6 && d < 14.4 && x < 15 && y < 15;
      const onString = Math.abs((x + 0.5) + (y + 0.5) - 16.5) < 0.75 && x >= 2 && y >= 2 && x <= 13 && y <= 13;
      if (onArc) return d > 13.6 ? [60, 38, 18] : (x + y) % 3 === 0 ? [150, 100, 52] : [120, 78, 38];
      if (onString) return [220, 220, 220];
      if ((x === 14 && y === 1) || (x === 1 && y === 14)) return [90, 90, 90];
      return null;
    };
  },
  arrow() {
    return (x, y) => {
      if (x + y === 15 && x >= 3 && x <= 12) return [110, 80, 40];
      if (x + y === 15 && x > 12) return [190, 190, 190];
      if (x + y === 14 && x >= 12) return [120, 120, 120];
      if ((x + y === 15 || x + y === 16 || x + y === 14) && x <= 3) return [235, 235, 235];
      return null;
    };
  },
  armor(mat) {
    const c = ARMOR_COLORS[mat] || ARMOR_COLORS.iron;
    return maskArt(
      (x, y) => {
        if (y < 1 || y > 14 || x < 1 || x > 14) return false;
        if (y <= 3 && x >= 5 && x <= 10) return false;      // hals
        if (y >= 5 && (x <= 2 || x >= 13)) return false;    // onder de schouders
        if (y >= 13 && (x <= 3 || x >= 12)) return false;
        return true;
      },
      (x, y) => (x <= 4 ? c[1] : x >= 11 ? c[2] : (y === 6 && x > 5 && x < 10 ? c[2] : c[0])),
      [24, 24, 24]);
  },
  apple() {
    return maskArt(
      (x, y) => (Math.hypot(x + 0.5 - 8, y + 0.5 - 9.5) < 5.8) || (x === 8 && y >= 2 && y <= 4) || ((x === 9 || x === 10) && y === 3),
      (x, y) => {
        if (x === 8 && y <= 4) return [96, 64, 30];
        if ((x === 9 || x === 10) && y === 3) return [60, 170, 50];
        if (Math.hypot(x - 5.5, y - 7.5) < 1.6) return [255, 255, 200];
        return y > 11 ? [212, 160, 20] : [255, 214, 40];
      },
      [92, 60, 6]);
  },
  coin() {
    return maskArt(
      (x, y) => Math.hypot(x + 0.5 - 8, y + 0.5 - 8) < 6.6,
      (x, y) => {
        const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
        if (d > 5.0) return [214, 150, 18];
        if ((x === 7 || x === 8) && y >= 5 && y <= 10) return [255, 246, 160];
        if (x + y < 12 && d > 3.4) return [255, 240, 140];
        return [250, 200, 40];
      },
      [110, 70, 0]);
  },
  diamond() {
    return maskArt(
      (x, y) => {
        const cy = 7;
        if (y < 3 || y > 13) return false;
        const w = y <= cy ? 2 + (y - 3) * 1.2 : 6.8 - (y - cy) * 1.1;
        return Math.abs(x + 0.5 - 8) < w;
      },
      (x, y) => (y <= 5 ? [190, 255, 250] : (x < 7 ? [110, 240, 230] : [40, 196, 186])),
      [12, 64, 70]);
  },
};

function itemArt(id) {
  const it = ITEM[id];
  if (id === 'coin') return ITEM_ART.coin();
  if (id === 'diamond') return ITEM_ART.diamond();
  if (id === 'arrow') return ITEM_ART.arrow();
  if (!it) return ITEM_ART.sword('diamond');
  if (it.kind === 'sword') return ITEM_ART.sword(it.mat);
  if (it.kind === 'bow') return ITEM_ART.bow();
  if (it.kind === 'armor') return ITEM_ART.armor(it.mat);
  return ITEM_ART.apple();
}

const _iconCache = {};
function itemIconURL(id) {
  if (!_iconCache[id]) _iconCache[id] = pixelCanvas(16, 16, itemArt(id)).toDataURL();
  return _iconCache[id];
}

function drawItemIcon(canvas, id) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pixelCanvas(16, 16, itemArt(id)), 0, 0, canvas.width, canvas.height);
}

// Een plat 16x16 plaatje als 3D "uitgesneden" voorwerp (zoals voorwerpen in je hand in Minecraft)
function buildSpriteMesh(art, origin) {
  const pos = [], nor = [], col = [];
  const px = 1 / 16, z0 = -px / 2, z1 = px / 2;
  const ox = origin ? origin[0] : 2.5, oy = origin ? origin[1] : 2.5;
  const colors = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) colors[y * 16 + x] = art(x, y);
  const filled = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && !!colors[y * 16 + x];
  const quad = (a, b, c, d, n, color) => {
    for (const v of [a, b, c, a, c, d]) { pos.push(v[0], v[1], v[2]); nor.push(n[0], n[1], n[2]); col.push(color[0], color[1], color[2]); }
  };
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!filled(x, y)) continue;
      const c = colors[y * 16 + x].map((v) => v / 255);
      const x0 = (x - ox) * px, x1 = x0 + px;
      const y0 = (15 - y - oy) * px, y1 = y0 + px;
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], c);
      quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], c);
      if (!filled(x + 1, y)) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], c);
      if (!filled(x - 1, y)) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], c);
      if (!filled(x, y - 1)) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], c);
      if (!filled(x, y + 1)) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
}
