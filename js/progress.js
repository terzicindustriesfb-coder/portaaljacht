'use strict';
/* Portaaljacht – voortgang: welke schurk is aan de beurt, munten, diamanten, gekochte spullen, opslaan */

// De werelden achter de portalen, in volgorde. De wereldbestanden vullen gen/Boss/atmosfeer in via registerRealm().
const REALMS = [
  { key: 'nether', name: 'De Nether', boss: 'De Lavareus', bossRef: 'de Lavareus', puzzle: 'sequence',
    tip: 'Tip: sla zijn vuurballen met je zwaard terug!', treasureTip: 'Zie je de gouden X op de vloer? Graaf daar naar beneden!', loot: { coins: 60, diamonds: 2 }, bossCoins: 20,
    portal: { a: [70, 8, 150], b: [220, 80, 255] } },
  { key: 'frost', name: 'Het IJsrijk', boss: 'De Vorstreus', bossRef: 'de Vorstreus', puzzle: 'lights',
    tip: 'Tip: ontwijk de blauwe cirkels, en laat hem tegen een pilaar glijden!', treasureTip: 'De blauwe ijspoort is gesmolten. De schat ligt in de iglo!', loot: { coins: 100, diamonds: 4 }, bossCoins: 30,
    portal: { a: [20, 90, 170], b: [150, 240, 255] } },
  { key: 'shadow', name: 'De Schaduwwereld', boss: 'De Schaduwkoning', bossRef: 'de Schaduwkoning', puzzle: 'memory',
    tip: 'Tip: sla zijn schaduwballen kapot!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 150, diamonds: 6 }, bossCoins: 40,
    portal: { a: [20, 70, 40], b: [80, 255, 140] } },
  { key: 'sky', name: 'Het Hemelrijk', boss: 'De Stormdraak', bossRef: 'de Stormdraak', puzzle: 'slide',
    tip: 'Tip: sla hem als hij landt, of schiet met een boog!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 250, diamonds: 10 }, bossCoins: 60,
    portal: { a: [150, 90, 0], b: [255, 240, 120] } },
  // De tien nieuwe werelden (de wereldbestanden vullen ze verder in)
  { key: 'desert', name: 'De Zandpiramide', boss: 'De Zandfarao', bossRef: 'de Zandfarao', puzzle: 'pairs',
    tip: 'Tip: blijf uit het drijfzand!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 300, diamonds: 10 }, bossCoins: 70,
    portal: { a: [150, 110, 30], b: [255, 222, 120] } },
  { key: 'jungle', name: 'Het Oerwoud', boss: 'De Oerwoudreus', bossRef: 'de Oerwoudreus', puzzle: 'sequence',
    tip: 'Tip: duik weg voor de rotsblokken!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 340, diamonds: 11 }, bossCoins: 75,
    portal: { a: [20, 90, 20], b: [150, 255, 90] } },
  { key: 'ocean', name: 'De Diepe Zee', boss: 'De Kraak', bossRef: 'de Kraak', puzzle: 'lights',
    tip: 'Tip: let op de bubbels in het water!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 380, diamonds: 12 }, bossCoins: 80,
    portal: { a: [0, 60, 120], b: [60, 220, 230] } },
  { key: 'spider', name: 'De Spinnengrot', boss: 'De Spinnenkoningin', bossRef: 'de Spinnenkoningin', puzzle: 'memory',
    tip: 'Tip: sla de spinnetjes snel weg!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 420, diamonds: 13 }, bossCoins: 85,
    portal: { a: [70, 0, 20], b: [230, 50, 70] } },
  { key: 'factory', name: 'De Fabriek', boss: 'De IJzeren Titan', bossRef: 'de IJzeren Titan', puzzle: 'slide',
    tip: 'Tip: spring opzij voor de laserstralen!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 470, diamonds: 14 }, bossCoins: 90,
    portal: { a: [90, 30, 0], b: [255, 130, 40] } },
  { key: 'mushroom', name: 'Het Paddenstoeleiland', boss: 'De Sporenreus', bossRef: 'de Sporenreus', puzzle: 'pairs',
    tip: 'Tip: adem niet in de sporenwolken!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 520, diamonds: 15 }, bossCoins: 100,
    portal: { a: [120, 0, 80], b: [255, 110, 210] } },
  { key: 'haunted', name: 'Het Spookkasteel', boss: 'De Spookridder', bossRef: 'de Spookridder', puzzle: 'sequence',
    tip: 'Tip: alleen de echte ridder heeft een gloeiend zwaard!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 570, diamonds: 16 }, bossCoins: 110,
    portal: { a: [30, 60, 60], b: [170, 255, 230] } },
  { key: 'volcano', name: 'De Vulkaan', boss: 'De Magmaslang', bossRef: 'de Magmaslang', puzzle: 'lights',
    tip: 'Tip: kijk omhoog voor vallende meteoren!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 620, diamonds: 17 }, bossCoins: 120,
    portal: { a: [140, 20, 0], b: [255, 180, 0] } },
  { key: 'crystal', name: 'De Kristalgrot', boss: 'De Kristalgolem', bossRef: 'de Kristalgolem', puzzle: 'memory',
    tip: 'Tip: sla eerst zijn kristalschild kapot!', treasureTip: 'Volg het kompas naar de verborgen schat!', loot: { coins: 680, diamonds: 18 }, bossCoins: 130,
    portal: { a: [110, 90, 170], b: [255, 255, 255] } },
  { key: 'void', name: 'De Leegte', boss: 'De Leegtekoning', bossRef: 'de Leegtekoning', puzzle: 'slide',
    tip: 'Tip: blijf uit de buurt van de zwarte gaten!', treasureTip: 'Volg het kompas naar de allerlaatste schat!', loot: { coins: 1000, diamonds: 30 }, bossCoins: 200,
    portal: { a: [8, 8, 12], b: [130, 120, 160] } },
];

function registerRealm(key, impl) {
  const r = REALMS.find((x) => x.key === key);
  if (r) Object.assign(r, impl);
}

const PROG_VERSION = 2;
const PROG = {
  level: 0,          // welke schurk (0 = Lavareus); na de laatste = REALMS.length
  phase: 'portal',   // portal: zoek het portaal | boss: versla de schurk | treasure: zoek de schat | return: ga naar huis
  round: 1,          // na alle schurken mag je opnieuw, alles wordt dan sterker
  coins: 0, diamonds: 0, apples: 1,
  owned: { sword_stone: true },
  sword: 'sword_stone', armor: null,
  seed: 0,
  stats: { time: 0, hits: 0, reflects: 0, reflectHits: 0, deaths: 0, broken: 0, placed: 0, bosses: 0, treasures: 0 },
  looted: [],        // welke verborgen kisten in de bovenwereld al leeg zijn
};

function resetProgress(seed) {
  PROG.level = 0; PROG.phase = 'portal'; PROG.round = 1;
  PROG.coins = 0; PROG.diamonds = 0; PROG.apples = 1;
  PROG.owned = { sword_stone: true };
  PROG.sword = 'sword_stone'; PROG.armor = null;
  PROG.seed = seed;
  PROG.stats = { time: 0, hits: 0, reflects: 0, reflectHits: 0, deaths: 0, broken: 0, placed: 0, bosses: 0, treasures: 0 };
  PROG.looted = [];
}

function currentRealm() { return REALMS[Math.min(PROG.level, REALMS.length - 1)]; }
function allBossesBeaten() { return PROG.level >= REALMS.length; }
// In een volgende ronde zijn schurken sterker
function roundScale() { return 1 + (PROG.round - 1) * 0.5; }

function saveProgress() {
  try {
    const data = {
      v: PROG_VERSION, level: PROG.level, phase: PROG.phase, round: PROG.round,
      coins: PROG.coins, diamonds: PROG.diamonds, apples: PROG.apples,
      owned: PROG.owned, sword: PROG.sword, armor: PROG.armor, seed: PROG.seed, stats: PROG.stats,
      looted: PROG.looted,
    };
    localStorage.setItem('portaaljacht.save', JSON.stringify(data));
  } catch (e) { /* geen opslag beschikbaar */ }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('portaaljacht.save');
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.v !== PROG_VERSION) return false;
    Object.assign(PROG, {
      level: clamp(d.level | 0, 0, REALMS.length), phase: d.phase || 'portal', round: Math.max(1, d.round | 0),
      coins: Math.max(0, d.coins | 0), diamonds: Math.max(0, d.diamonds | 0), apples: Math.max(0, d.apples | 0),
      owned: d.owned || { sword_stone: true }, sword: d.sword || 'sword_stone', armor: d.armor || null,
      seed: d.seed >>> 0, stats: Object.assign({}, PROG.stats, d.stats || {}),
      looted: Array.isArray(d.looted) ? d.looted.filter((k) => typeof k === 'string') : [],
    });
    if (!ITEM[PROG.sword] || !PROG.owned[PROG.sword]) PROG.sword = 'sword_stone';
    if (PROG.armor && !PROG.owned[PROG.armor]) PROG.armor = null;
    // Opgeslagen midden in een wereld? Schat al gevonden: door naar de volgende schurk.
    // Anders begin je weer bij het portaal van die schurk.
    if (PROG.phase === 'return') PROG.level = Math.min(REALMS.length, PROG.level + 1);
    PROG.phase = PROG.level >= REALMS.length ? 'done' : 'portal';
    return true;
  } catch (e) { return false; }
}

function hasSave() {
  try {
    const raw = localStorage.getItem('portaaljacht.save');
    if (!raw) return false;
    const d = JSON.parse(raw);
    return !!d && d.v === PROG_VERSION && (d.level > 0 || d.coins > 0 || d.stats && d.stats.time > 30);
  } catch (e) { return false; }
}

function armorDefense() { return PROG.armor && ITEM[PROG.armor] ? ITEM[PROG.armor].def : 0; }

function canAfford(it) {
  return PROG.coins >= (it.price.coins || 0) && PROG.diamonds >= (it.price.diamonds || 0);
}

// Koop een voorwerp; geeft een korte melding terug
function buyItem(id) {
  const it = ITEM[id];
  if (!it) return { ok: false, msg: 'Onbekend voorwerp' };
  if (it.kind !== 'apple' && PROG.owned[id]) return { ok: false, msg: 'Heb je al' };
  if (!canAfford(it)) return { ok: false, msg: 'Niet genoeg munten of diamanten' };
  PROG.coins -= it.price.coins || 0;
  PROG.diamonds -= it.price.diamonds || 0;
  if (it.kind === 'apple') PROG.apples++;
  else {
    PROG.owned[id] = true;
    if (it.kind === 'sword' && ITEM[PROG.sword].dmg < it.dmg) PROG.sword = id;
    if (it.kind === 'armor' && (!PROG.armor || ITEM[PROG.armor].def < it.def)) PROG.armor = id;
  }
  saveProgress();
  return { ok: true, msg: it.name + ' gekocht!' };
}

function equipItem(id) {
  const it = ITEM[id];
  if (!it || !PROG.owned[id]) return;
  if (it.kind === 'sword') PROG.sword = id;
  if (it.kind === 'armor') PROG.armor = id;
  saveProgress();
}

function addLoot(coins, diamonds) {
  PROG.coins += coins | 0;
  PROG.diamonds += diamonds | 0;
  saveProgress();
}
