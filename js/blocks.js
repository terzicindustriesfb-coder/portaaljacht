'use strict';
/* Portaaljacht – blokdefinities */

const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG: 5, LEAVES: 6, SAND: 7, WATER: 8, PLANKS: 9,
  OBSIDIAN: 10, PORTAL: 11, NETHERRACK: 12, LAVA: 13, GLOWSTONE: 14, NETHERBRICK: 15, BEDROCK: 16,
  GOLD: 17, MAGMA: 18, FLOWER_R: 19, FLOWER_Y: 20, TALLGRASS: 21, GLASS: 22, BRICKS: 23,
  COAL_ORE: 24, IRON_ORE: 25, DIAMOND_ORE: 26,
  SNOW: 27, ICE: 28, PACKED_ICE: 29, END_STONE: 30, PURPUR: 31, CRYSTAL: 32, CLOUD: 33, QUARTZ: 34,
  CHEST: 35, SCULK: 36, SPRUCE_LEAVES: 37, SNOW_GRASS: 38, BLUE_ICE: 39,
};

// Manieren om een blok te tekenen
const R_NONE = 0, R_CUBE = 1, R_CROSS = 2, R_WATER = 3, R_LAVA = 4, R_PORTAL = 5;

const BLOCKS = [];
const SOLID = new Uint8Array(256);   // botsing
const OPAQUE = new Uint8Array(256);  // verbergt buurvlakken
const AOC = new Uint8Array(256);     // werpt ambient occlusion

function all(t) { return { top: t, bottom: t, side: t }; }

function defBlock(id, o) {
  BLOCKS[id] = Object.assign({
    id, name: '', render: R_CUBE, solid: true, opaque: true, ao: true, cullSame: false,
    tiles: null, hard: 1, glow: false, target: true, replace: false, sound: 'stone',
  }, o);
}

defBlock(B.AIR, { name: 'Lucht', render: R_NONE, solid: false, opaque: false, ao: false, target: false, replace: true });
defBlock(B.GRASS, { name: 'Grasblok', tiles: { top: T.GRASS_TOP, bottom: T.DIRT, side: T.GRASS_SIDE }, hard: 0.45, sound: 'grass' });
defBlock(B.DIRT, { name: 'Aarde', tiles: all(T.DIRT), hard: 0.4, sound: 'grass' });
defBlock(B.STONE, { name: 'Steen', tiles: all(T.STONE), hard: 1.1 });
defBlock(B.COBBLE, { name: 'Keien', tiles: all(T.COBBLE), hard: 1.2 });
defBlock(B.LOG, { name: 'Eikenhout', tiles: { top: T.LOG_TOP, bottom: T.LOG_TOP, side: T.LOG_SIDE }, hard: 0.9, sound: 'wood' });
defBlock(B.LEAVES, { name: 'Bladeren', tiles: all(T.LEAVES), opaque: false, cullSame: true, hard: 0.2, sound: 'grass' });
defBlock(B.SAND, { name: 'Zand', tiles: all(T.SAND), hard: 0.4, sound: 'sand' });
defBlock(B.WATER, { name: 'Water', render: R_WATER, tiles: all(T.WATER), solid: false, opaque: false, ao: false, target: false, replace: true });
defBlock(B.PLANKS, { name: 'Eikenhouten planken', tiles: all(T.PLANKS), hard: 0.8, sound: 'wood' });
defBlock(B.OBSIDIAN, { name: 'Obsidiaan', tiles: all(T.OBSIDIAN), hard: Infinity });
defBlock(B.PORTAL, { name: 'Portaal', render: R_PORTAL, tiles: all(T.PORTAL), solid: false, opaque: false, ao: false, target: false, hard: Infinity, glow: true });
defBlock(B.NETHERRACK, { name: 'Netherrack', tiles: all(T.NETHERRACK), hard: 0.35 });
defBlock(B.LAVA, { name: 'Lava', render: R_LAVA, tiles: all(T.LAVA), solid: false, opaque: false, ao: false, target: false, replace: true, glow: true });
defBlock(B.GLOWSTONE, { name: 'Gloeisteen', tiles: all(T.GLOWSTONE), hard: 0.3, glow: true, sound: 'glass' });
defBlock(B.NETHERBRICK, { name: 'Netherbakstenen', tiles: all(T.NETHERBRICK), hard: 1.4 });
defBlock(B.BEDROCK, { name: 'Bodemsteen', tiles: all(T.BEDROCK), hard: Infinity });
defBlock(B.GOLD, { name: 'Goudblok', tiles: all(T.GOLD), hard: 1.8 });
defBlock(B.MAGMA, { name: 'Magmablok', tiles: all(T.MAGMA), hard: 0.5, glow: true });
defBlock(B.FLOWER_R, { name: 'Klaproos', render: R_CROSS, tiles: all(T.FLOWER_R), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });
defBlock(B.FLOWER_Y, { name: 'Paardenbloem', render: R_CROSS, tiles: all(T.FLOWER_Y), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });
defBlock(B.TALLGRASS, { name: 'Hoog gras', render: R_CROSS, tiles: all(T.TALLGRASS), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });
defBlock(B.GLASS, { name: 'Glas', tiles: all(T.GLASS), opaque: false, ao: false, cullSame: true, hard: 0.3, sound: 'glass' });
defBlock(B.BRICKS, { name: 'Bakstenen', tiles: all(T.BRICKS), hard: 1.4 });
defBlock(B.COAL_ORE, { name: 'Steenkoolerts', tiles: all(T.COAL_ORE), hard: 1.3 });
defBlock(B.IRON_ORE, { name: 'IJzererts', tiles: all(T.IRON_ORE), hard: 1.4 });
defBlock(B.DIAMOND_ORE, { name: 'Diamanterts', tiles: all(T.DIAMOND_ORE), hard: 1.6 });
// Blokken van de andere werelden. slip = glad ijs, soft = geen valschade
defBlock(B.SNOW, { name: 'Sneeuw', tiles: all(T.SNOW), hard: 0.3, sound: 'snow', soft: true });
defBlock(B.ICE, { name: 'IJs', tiles: all(T.ICE), hard: 0.4, sound: 'glass', slip: true });
defBlock(B.PACKED_ICE, { name: 'Pakijs', tiles: all(T.PACKED_ICE), hard: 0.6, sound: 'glass', slip: true });
defBlock(B.BLUE_ICE, { name: 'Blauw ijs', tiles: all(T.BLUE_ICE), hard: 0.7, sound: 'glass', slip: true });
defBlock(B.END_STONE, { name: 'Endsteen', tiles: all(T.END_STONE), hard: 0.9 });
defBlock(B.PURPUR, { name: 'Purpurblok', tiles: all(T.PURPUR), hard: 1.0 });
defBlock(B.CRYSTAL, { name: 'Schaduwkristal', tiles: all(T.CRYSTAL), hard: 0.4, glow: true, sound: 'glass' });
defBlock(B.CLOUD, { name: 'Wolk', tiles: all(T.CLOUD), hard: 0.2, sound: 'snow', soft: true });
defBlock(B.QUARTZ, { name: 'Kwarts', tiles: { top: T.QUARTZ_TOP, bottom: T.QUARTZ_TOP, side: T.QUARTZ }, hard: 1.0 });
defBlock(B.CHEST, { name: 'Schatkist', tiles: { top: T.CHEST_TOP, bottom: T.CHEST_TOP, side: T.CHEST_FRONT }, hard: Infinity, sound: 'wood', chest: true });
defBlock(B.SCULK, { name: 'Sculk', tiles: all(T.SCULK), hard: 0.4, sound: 'snow' });
defBlock(B.SPRUCE_LEAVES, { name: 'Sparrennaalden', tiles: all(T.SPRUCE_LEAVES), opaque: false, cullSame: true, hard: 0.2, sound: 'grass' });
defBlock(B.SNOW_GRASS, { name: 'Besneeuwd gras', tiles: { top: T.SNOW, bottom: T.DIRT, side: T.GRASS_SNOW_SIDE }, hard: 0.45, sound: 'snow' });

function refreshBlockFlags(i) {
  const b = BLOCKS[i];
  if (!b) return;
  SOLID[i] = b.solid ? 1 : 0;
  OPAQUE[i] = b.opaque ? 1 : 0;
  AOC[i] = (b.ao && b.solid) ? 1 : 0;
}
for (let i = 0; i < BLOCKS.length; i++) refreshBlockFlags(i);

// Extra blokken: elk wereldbestand kan eigen blokken toevoegen.
// defineBlock('NAAM', { name, tiles, hard, solid, opaque, render, glow, slip, soft, slow, hurt, ... }) -> id (ook als B.NAAM)
//   slow: snelheidsfactor als je erin staat (spinnenweb 0.25), hurt: schade per seconde bij aanraken (cactus)
let NEXT_BLOCK = 40;
function defineBlock(key, props) {
  if (B[key] !== undefined) return B[key];
  const id = NEXT_BLOCK++;
  if (id > 255) throw new Error('Te veel blokken bij ' + key);
  B[key] = id;
  defBlock(id, props);
  refreshBlockFlags(id);
  return id;
}

/* ---------- Blokken voor de grote bovenwereld ---------- */
defineTile('SANDSTONE', (h) => (x, y) => (y % 5 === 4 ? h.vary([196, 180, 128], 5) : h.vary(h.R() < 0.2 ? [222, 208, 156] : [214, 198, 146], 5)));
defineTile('SANDSTONE_TOP', (h) => () => h.vary(h.R() < 0.15 ? [226, 214, 166] : [218, 204, 152], 4));
defineTile('CACTUS', (h) => (x, y) => {
  if (x === 0 || x === 15) return [40, 80, 30];
  if ((x === 3 || x === 12) && y % 4 === 1) return [230, 230, 200];
  return h.vary(x % 4 === 2 ? [70, 130, 50] : [88, 150, 62], 6);
});
defineTile('CACTUS_TOP', (h) => (x, y) => (x === 0 || y === 0 || x === 15 || y === 15 ? [40, 80, 30] : h.vary([96, 160, 70], 6)));
defineTile('DEAD_BUSH', (h) => {
  const pts = [];
  for (let i = 0; i < 14; i++) pts.push([Math.floor(2 + h.R() * 12), Math.floor(3 + h.R() * 10)]);
  return (x, y) => {
    if (x === 7 && y > 8) return [120, 84, 40];
    for (const [px, py] of pts) if (Math.abs(px - x) + Math.abs(py - y) === 0 || (Math.abs(px - x) === Math.abs(py - y) && Math.abs(px - x) < 2 && y < py)) return [136, 96, 48];
    return null;
  };
});
defineTile('BIRCH_LOG', (h) => (x, y) => {
  const dark = (y * 7 + x * 3) % 11 === 0 || ((y + 3) % 9 === 0 && x > 3 && x < 11);
  return dark ? h.vary([50, 46, 40], 6) : h.vary([222, 220, 210], 6);
});
defineTile('BIRCH_TOP', (h) => (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return h.vary([222, 220, 210], 5);
  return h.vary(Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))) % 2 ? [200, 180, 130] : [182, 160, 110], 5);
});
defineTile('BIRCH_LEAVES', (h) => () => { const r = h.R(); if (r < 0.16) return null; return h.vary(r < 0.5 ? [100, 150, 60] : [124, 170, 76], 8); });
defineTile('GRAVEL', (h) => () => { const r = h.R(); return h.vary(r < 0.3 ? [100, 96, 94] : r < 0.6 ? [150, 144, 140] : [126, 122, 120], 8); });
defineTile('STONE_BRICKS', (h) => (x, y) => {
  const row = y >> 3, off = (row % 2) * 4;
  if (y % 8 === 7 || (x + off) % 8 === 7) return h.vary([84, 84, 84], 4);
  if (y % 8 === 0 || (x + off) % 8 === 0) return h.vary([140, 140, 140], 4);
  return h.vary([122, 122, 122], 6);
});
defineTile('MOSSY_STONE_BRICKS', (h) => (x, y) => {
  const row = y >> 3, off = (row % 2) * 4;
  if (h.R() < 0.3) return h.vary([84, 112, 56], 10);
  if (y % 8 === 7 || (x + off) % 8 === 7) return h.vary([84, 84, 84], 4);
  return h.vary([118, 120, 116], 6);
});
defineTile('TORCH', () => (x, y) => {
  if (x < 7 || x > 8) return null;
  if (y >= 6 && y <= 15) return y > 11 ? [90, 60, 30] : [120, 84, 40];
  if (y === 5 || y === 4) return [255, 220, 90];
  if (y === 3) return [255, 255, 200];
  return null;
});
defineTile('HAY', (h) => (x, y) => (y === 3 || y === 12 ? h.vary([140, 100, 30], 6) : h.vary(x % 3 ? [214, 170, 50] : [190, 150, 40], 8)));
defineTile('HAY_TOP', (h) => () => h.vary(h.R() < 0.3 ? [180, 140, 40] : [210, 166, 52], 8));
defineTile('BOOKSHELF', (h) => (x, y) => {
  if (y === 0 || y === 15 || y === 7 || y === 8) return h.vary([162, 130, 78], 5);
  const book = Math.floor(x / 2) % 5;
  const cols = [[150, 40, 40], [40, 80, 150], [60, 120, 50], [160, 120, 40], [110, 50, 120]];
  return x % 2 === 0 ? h.vary(cols[(book + (y > 8 ? 2 : 0)) % 5], 8) : h.vary([60, 40, 26], 4);
});

defineTile('FARMLAND', (h) => (x, y) => (y % 4 === 0 ? h.vary([70, 46, 26], 5) : h.vary(h.R() < 0.3 ? [104, 70, 40] : [120, 82, 48], 6)));
defineTile('WHEAT', (h) => (x, y) => {
  const col = [1, 4, 7, 10, 13].indexOf(x);
  if (col < 0) return null;
  if (y >= 6) return h.vary(y > 12 ? [96, 140, 40] : [150, 160, 50], 8);
  if (y >= 1 + (col % 2)) return h.vary([214, 180, 70], 10);
  return null;
});
defineTile('SUGAR_CANE', (h) => (x, y) => {
  const col = [3, 8, 12].indexOf(x);
  if (col < 0) return x === 9 && y % 6 === 2 ? [120, 190, 90] : null;
  return (y + col * 3) % 6 === 0 ? [90, 140, 60] : h.vary([140, 200, 100], 8);
});
defineTile('PUMPKIN', (h) => (x) => (x % 4 === 0 ? h.vary([190, 100, 10], 5) : h.vary([226, 134, 24], 6)));
defineTile('PUMPKIN_TOP', (h) => (x, y) => {
  if (x >= 7 && x <= 8 && y >= 7 && y <= 8) return [90, 70, 30];
  return (x % 4 === 0 || y % 4 === 0) ? h.vary([200, 110, 14], 5) : h.vary([226, 134, 24], 6);
});
defineTile('FLOWER_B', () => (x, y) => {
  if (x === 7 && y > 7) return [60, 120, 40];
  if ((x === 6 || x === 9) && y === 11) return [70, 140, 50];
  if (Math.abs(x - 7.5) + Math.abs(y - 4.5) < 3.2) return (x + y) % 3 ? [70, 110, 230] : [40, 70, 200];
  return null;
});

defineBlock('SANDSTONE', { name: 'Zandsteen', tiles: { top: T.SANDSTONE_TOP, bottom: T.SANDSTONE_TOP, side: T.SANDSTONE }, hard: 0.8 });
defineBlock('CACTUS', { name: 'Cactus', tiles: { top: T.CACTUS_TOP, bottom: T.CACTUS_TOP, side: T.CACTUS }, hard: 0.3, sound: 'grass', hurt: 1 });
defineBlock('DEAD_BUSH', { name: 'Dode struik', render: R_CROSS, tiles: all(T.DEAD_BUSH), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });
defineBlock('BIRCH_LOG', { name: 'Berkenhout', tiles: { top: T.BIRCH_TOP, bottom: T.BIRCH_TOP, side: T.BIRCH_LOG }, hard: 0.9, sound: 'wood' });
defineBlock('BIRCH_LEAVES', { name: 'Berkenbladeren', tiles: all(T.BIRCH_LEAVES), opaque: false, cullSame: true, hard: 0.2, sound: 'grass' });
defineBlock('GRAVEL', { name: 'Grind', tiles: all(T.GRAVEL), hard: 0.5, sound: 'sand' });
defineBlock('STONE_BRICKS', { name: 'Stenen bakstenen', tiles: all(T.STONE_BRICKS), hard: 1.3 });
defineBlock('MOSSY_STONE_BRICKS', { name: 'Bemoste bakstenen', tiles: all(T.MOSSY_STONE_BRICKS), hard: 1.3 });
defineBlock('TORCH', { name: 'Fakkel', render: R_CROSS, tiles: all(T.TORCH), solid: false, opaque: false, ao: false, hard: 0, glow: true, replace: false, sound: 'wood' });
defineBlock('HAY', { name: 'Hooibaal', tiles: { top: T.HAY_TOP, bottom: T.HAY_TOP, side: T.HAY }, hard: 0.3, sound: 'grass', soft: true });
defineBlock('BOOKSHELF', { name: 'Boekenkast', tiles: { top: T.PLANKS, bottom: T.PLANKS, side: T.BOOKSHELF }, hard: 0.8, sound: 'wood' });
defineBlock('FARMLAND', { name: 'Akkergrond', tiles: { top: T.FARMLAND, bottom: T.DIRT, side: T.DIRT }, hard: 0.4, sound: 'grass' });
defineBlock('WHEAT', { name: 'Tarwe', render: R_CROSS, tiles: all(T.WHEAT), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });
defineBlock('SUGAR_CANE', { name: 'Suikerriet', render: R_CROSS, tiles: all(T.SUGAR_CANE), solid: false, opaque: false, ao: false, hard: 0, sound: 'grass' });
defineBlock('PUMPKIN', { name: 'Pompoen', tiles: { top: T.PUMPKIN_TOP, bottom: T.PUMPKIN_TOP, side: T.PUMPKIN }, hard: 0.5, sound: 'wood' });
defineBlock('FLOWER_B', { name: 'Korenbloem', render: R_CROSS, tiles: all(T.FLOWER_B), solid: false, opaque: false, ao: false, hard: 0, replace: true, sound: 'grass' });

// De itembalk: zwaard, boog, gouden appels en daarna bouwblokken
const HOTBAR = [
  { type: 'sword' },
  { type: 'bow' },
  { type: 'apple' },
  { type: 'block', id: B.GRASS },
  { type: 'block', id: B.COBBLE },
  { type: 'block', id: B.PLANKS },
  { type: 'block', id: B.GLASS },
  { type: 'block', id: B.BRICKS },
  { type: 'block', id: B.GLOWSTONE },
];
for (const it of HOTBAR) if (it.type === 'block') it.name = BLOCKS[it.id].name;

// Naam van een slot (zwaard en boog hangen af van wat je gekocht hebt)
function slotName(i) {
  const it = HOTBAR[i];
  if (it.type === 'sword') return ITEM[PROG.sword].name;
  if (it.type === 'bow') return PROG.owned.bow ? 'Boog' : 'Boog (koop bij de handelaar)';
  if (it.type === 'apple') return 'Gouden appel (' + PROG.apples + ')';
  return it.name;
}
