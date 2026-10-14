'use strict';
/* Portaaljacht – wereld 11: het Spookkasteel met De Spookridder (spookklonen, onzichtbare sprint, zwaardgolf, spookhanden) */
(() => {
  const S = 80, H = 34, C = 40, F = 10, IN = 16;   // wereldmaat, midden, vloer, halve binnenplaats

  /* ---------- Blokken ---------- */
  const JACK_ART = [
    '................',
    '................',
    '................',
    '....#......#....',
    '...###....###...',
    '..#####..#####..',
    '..#####..#####..',
    '................',
    '.......##.......',
    '................',
    '..##.######.##..',
    '..############..',
    '...##########...',
    '....#.####.#....',
    '................',
    '................',
  ];
  defineTile('HAUNTED_BRICKS', (h) => (x, y) => {
    const off = ((y >> 3) % 2) * 4;
    if (y % 8 === 7 || (x + off) % 8 === 7) return h.vary([38, 42, 50], 4);
    if (y % 8 === 0 || (x + off) % 8 === 0) return h.vary([98, 104, 114], 5);
    return h.vary(h.R() < 0.15 ? [64, 70, 80] : [78, 84, 94], 5);
  });
  defineTile('HAUNTED_MOSSY', (h) => (x, y) => {
    const off = ((y >> 3) % 2) * 4;
    if ((y < 3 + ((x * 7) % 5) && h.R() < 0.75) || h.R() < 0.12) return h.vary(h.R() < 0.5 ? [48, 84, 60] : [62, 100, 70], 8);
    if (y % 8 === 7 || (x + off) % 8 === 7) return h.vary([36, 42, 44], 4);
    return h.vary([74, 82, 86], 5);
  });
  defineTile('HAUNTED_FLOOR', (h) => {
    const cols = [[72, 76, 82], [62, 66, 72], [80, 82, 86], [68, 70, 78]];
    return (x, y) => {
      const top = y < 8;
      if (y === 7 || y === 15 || (top && x === 9) || (!top && x === 4)) return h.vary([30, 32, 38], 3);
      const slab = top ? (x < 9 ? 0 : 1) : (x < 4 ? 2 : 3);
      return h.vary(h.R() < 0.1 ? [52, 56, 62] : cols[slab], 5);
    };
  });
  defineTile('HAUNTED_GRASS_TOP', (h) => () => {
    const r = h.R();
    return h.vary(r < 0.08 ? [74, 70, 48] : r < 0.5 ? [34, 58, 46] : [44, 70, 54], 6);
  });
  defineTile('HAUNTED_GRASS_SIDE', (h) => (x, y) => {
    if (y < 2 + ((x * 5) % 3 === 0 ? 1 : 0)) return h.vary([40, 66, 50], 6);
    return h.vary(h.R() < 0.4 ? [46, 34, 28] : [58, 44, 36], 5);
  });
  defineTile('HAUNTED_DIRT', (h) => () => {
    const r = h.R();
    return h.vary(r < 0.05 ? [92, 88, 82] : r < 0.5 ? [50, 38, 30] : [62, 48, 38], 5);
  });
  defineTile('HAUNTED_WOOD', (h) => (x) => h.vary(x % 4 === 0 ? [40, 36, 34] : (x % 4 === 2 ? [66, 60, 54] : [78, 70, 62]), 5));
  defineTile('HAUNTED_WOOD_TOP', (h) => (x, y) => {
    const r = Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)));
    return h.vary(r === 7 ? [62, 56, 50] : r % 2 ? [96, 86, 74] : [80, 70, 60], 4);
  });
  defineTile('HAUNTED_JACK', (h) => (x, y) => {
    if (JACK_ART[y][x] === '#') return h.vary(y >= 10 ? [255, 190, 60] : [255, 214, 90], 8);
    return h.vary(x % 4 === 0 ? [166, 82, 14] : [214, 118, 22], 7);
  });
  defineTile('HAUNTED_JACK_TOP', (h) => (x, y) => {
    if (x >= 7 && x <= 8 && y >= 6 && y <= 9) return h.vary([86, 100, 40], 6);
    return h.vary(x % 4 === 0 || y % 4 === 0 ? [166, 82, 14] : [206, 112, 20], 6);
  });
  defineTile('HAUNTED_BARS', () => (x, y) => {
    const bar = x === 1 || x === 2 || x === 7 || x === 8 || x === 13 || x === 14;
    const band = y === 1 || y === 2 || y === 13 || y === 14;
    if (!bar && !band) return null;
    return (x === 1 || x === 7 || x === 13) ? [104, 108, 112] : [56, 60, 64];
  });
  defineTile('HAUNTED_WINDOW', (h) => (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15 || x === 7 || x === 8 || y === 7 || y === 8) return h.vary([46, 34, 26], 4);
    return h.vary(h.R() < 0.2 ? [255, 236, 150] : [250, 196, 90], 8);
  });
  defineTile('HAUNTED_CANDLE', () => (x, y) => {
    if (y >= 9 && x >= 6 && x <= 9) return x === 6 ? [204, 196, 176] : (y === 9 && x === 9 ? [250, 248, 236] : [236, 230, 210]);
    if (y === 8 && (x === 7 || x === 8)) return [40, 30, 20];
    if (y === 3 && (x === 7 || x === 8)) return [255, 250, 210];
    if ((y === 4 || y === 5 || y === 6) && x >= 6 && x <= 9) return x === 6 || x === 9 ? [255, 160, 40] : [255, 220, 90];
    if (y === 7 && (x === 7 || x === 8)) return [255, 140, 30];
    return null;
  });
  defineTile('HAUNTED_WEB', () => (x, y) => {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (x === y || x === 15 - y || x === 7 || y === 8 || Math.abs(d - 3) < 0.5 || Math.abs(d - 6.4) < 0.5) return [226, 230, 236];
    return null;
  });
  // geheime boekenkast: tussen de boeken schijnt goudgeel licht
  defineTile('HAUNTED_SHELF', (h) => (x, y) => {
    if (y === 0 || y === 15 || y === 7 || y === 8) return h.vary([150, 118, 70], 5);
    const book = Math.floor(x / 2) % 5;
    const cols = [[140, 40, 40], [40, 76, 140], [56, 110, 48], [150, 112, 40], [104, 48, 112]];
    if (x % 2 === 0) return h.vary(cols[(book + (y > 8 ? 2 : 0)) % 5], 8);
    return (x + y) % 3 === 0 ? h.vary([255, 220, 120], 10) : h.vary([120, 84, 40], 6);
  });
  defineTile('HAUNTED_GRAVE', (h) => (x, y) => {
    if ((x <= 1 || x >= 14) && y <= 1) return h.vary([58, 62, 68], 3);
    if ((x === 7 || x === 8) && y >= 3 && y <= 11) return h.vary([46, 48, 54], 3);
    if (y >= 5 && y <= 6 && x >= 5 && x <= 10) return h.vary([46, 48, 54], 3);
    return h.vary(h.R() < 0.2 ? [84, 98, 80] : [100, 104, 110], 6);
  });
  defineTile('HAUNTED_CARPET', (h) => (x, y) => {
    if (x === 1 || x === 14 || y === 1 || y === 14) return h.vary([206, 164, 64], 6);
    if ((x + y) % 6 === 0 || Math.abs(x - y) % 6 === 0) return h.vary([90, 14, 22], 4);
    return h.vary([126, 26, 32], 6);
  });
  defineTile('HAUNTED_PLANKS', (h) => (x, y) => {
    if (y % 4 === 3) return h.vary([34, 24, 16], 3);
    if ((x + (y >> 2) * 5) % 16 === 0) return h.vary([40, 28, 18], 3);
    return h.vary(h.R() < 0.3 ? [56, 40, 28] : [66, 48, 32], 5);
  });
  defineTile('HAUNTED_SLATE', (h) => (x, y) => {
    if (y % 4 === 3 || (x + (y >> 2) * 3) % 6 === 0) return h.vary([26, 26, 40], 3);
    return h.vary(h.R() < 0.3 ? [46, 48, 70] : [56, 58, 80], 5);
  });

  const all = (t) => ({ top: t, bottom: t, side: t });
  defineBlock('HAUNTED_BRICKS', { name: 'Kasteelstenen', tiles: all(T.HAUNTED_BRICKS), hard: 1.3 });
  defineBlock('HAUNTED_MOSSY', { name: 'Bemoste kasteelstenen', tiles: all(T.HAUNTED_MOSSY), hard: 1.3 });
  defineBlock('HAUNTED_FLOOR', { name: 'Oude plavuizen', tiles: { top: T.HAUNTED_FLOOR, bottom: T.HAUNTED_FLOOR, side: T.HAUNTED_BRICKS }, hard: 1.2 });
  defineBlock('HAUNTED_GRASS', { name: 'Nachtgras', tiles: { top: T.HAUNTED_GRASS_TOP, bottom: T.HAUNTED_DIRT, side: T.HAUNTED_GRASS_SIDE }, hard: 0.45, sound: 'grass' });
  defineBlock('HAUNTED_DIRT', { name: 'Grafaarde', tiles: all(T.HAUNTED_DIRT), hard: 0.4, sound: 'grass' });
  defineBlock('HAUNTED_WOOD', { name: 'Dood hout', tiles: { top: T.HAUNTED_WOOD_TOP, bottom: T.HAUNTED_WOOD_TOP, side: T.HAUNTED_WOOD }, hard: 0.9, sound: 'wood' });
  defineBlock('HAUNTED_JACK', { name: 'Pompoenlamp', tiles: { top: T.HAUNTED_JACK_TOP, bottom: T.HAUNTED_JACK_TOP, side: T.HAUNTED_JACK }, hard: 0.5, glow: true, sound: 'wood' });
  defineBlock('HAUNTED_BARS', { name: 'Tralies', tiles: all(T.HAUNTED_BARS), opaque: false, ao: false, hard: 2.5 });
  defineBlock('HAUNTED_WINDOW', { name: 'Verlicht raam', tiles: all(T.HAUNTED_WINDOW), hard: 0.4, glow: true, sound: 'glass' });
  defineBlock('HAUNTED_CANDLE', { name: 'Kaars', render: R_CROSS, tiles: all(T.HAUNTED_CANDLE), solid: false, opaque: false, ao: false, hard: 0, glow: true, sound: 'wood' });
  defineBlock('HAUNTED_WEB', { name: 'Spinrag', render: R_CROSS, tiles: all(T.HAUNTED_WEB), solid: false, opaque: false, ao: false, hard: 0.2, slow: 0.3, sound: 'grass' });
  defineBlock('HAUNTED_SHELF', { name: 'Vreemde boekenkast', tiles: { top: T.HAUNTED_PLANKS, bottom: T.HAUNTED_PLANKS, side: T.HAUNTED_SHELF }, hard: 0.5, glow: true, sound: 'wood' });
  defineBlock('HAUNTED_GRAVE', { name: 'Grafsteen', tiles: { top: T.HAUNTED_BRICKS, bottom: T.HAUNTED_BRICKS, side: T.HAUNTED_GRAVE }, hard: 1.0 });
  defineBlock('HAUNTED_CARPET', { name: 'Rood tapijt', tiles: { top: T.HAUNTED_CARPET, bottom: T.HAUNTED_PLANKS, side: T.HAUNTED_PLANKS }, hard: 0.6, sound: 'wood' });
  defineBlock('HAUNTED_PLANKS', { name: 'Donkere planken', tiles: all(T.HAUNTED_PLANKS), hard: 0.8, sound: 'wood' });
  defineBlock('HAUNTED_SLATE', { name: 'Leisteen', tiles: all(T.HAUNTED_SLATE), hard: 1.0 });

  /* ---------- De wereld: kasteelbinnenplaats bij nacht ---------- */
  function deadTree(w, x, y, z, rand) {
    const th = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < th; i++) w.setRaw(x, y + i, z, B.HAUNTED_WOOD);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const nb = 2 + Math.floor(rand() * 2);
    for (let b = 0; b < nb; b++) {
      const [dx, dz] = dirs[Math.floor(rand() * 4)];
      let bx = x, by = y + th - 2 - Math.floor(rand() * 2), bz = z;
      const len = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < len; k++) { bx += dx; bz += dz; if (k % 2 === 1) by++; w.setRaw(bx, by, bz, B.HAUNTED_WOOD); }
    }
  }

  function gen(seed) {
    const w = new World('realm', S, H, S);
    w.skyShade = true;
    const rand = mulberry32(seed);
    const n1 = new Noise2D(rand), n2 = new Noise2D(rand);
    const side = rand() < 0.5 ? 1 : -1;                 // bibliotheek oost of west
    const X = (u) => (side > 0 ? u : 2 * C - u);        // spiegelen naar die kant
    const cheb = (x, z) => Math.max(Math.abs(x - C), Math.abs(z - C));
    const brick = () => (rand() < 0.28 ? B.HAUNTED_MOSSY : B.HAUNTED_BRICKS);
    const LIB0 = C + IN + 1, LIBB = C + IN + 16, SEC1 = LIBB + 5;   // muur, achterwand, eind geheime kamer
    const reserved = (x, z) => { const u = side > 0 ? x : 2 * C - x; return u >= LIB0 - 1 && u <= SEC1 + 1 && Math.abs(z - C) <= 8; };
    const heights = new Int16Array(S * S);

    // grond: binnenplaats met plavuizen en paden, buiten nachtgras
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const court = cheb(x, z) <= IN;
        const h = court ? F : F + (n1.noise(x / 7, z / 7) > 0.42 ? 1 : 0);
        heights[z * S + x] = h;
        let top;
        if (court) {
          const dx = x - C, dz = z - C, d = Math.hypot(dx, dz);
          const nn = n2.noise(x / 6, z / 6);
          top = nn > 0.32 ? B.GRAVEL : nn < -0.38 ? B.HAUNTED_MOSSY : B.HAUNTED_FLOOR;
          if ((Math.abs(dx) <= 1 || Math.abs(dz) <= 1) && d > 6) top = B.HAUNTED_BRICKS;
          if (d > 4.5 && d < 5.6) top = B.HAUNTED_BRICKS;
          else if (rand() < 0.035) top = B.COBBLE;
        } else top = rand() < 0.1 ? B.HAUNTED_DIRT : B.HAUNTED_GRASS;
        for (let y = 0; y <= h; y++) w.setRaw(x, y, z, y === 0 ? B.BEDROCK : y < h - 2 ? B.STONE : y < h ? B.HAUNTED_DIRT : top);
      }
    }

    // muren met kantelen
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const c = cheb(x, z);
        if (c !== IN + 1 && c !== IN + 2) continue;
        for (let y = F + 1; y <= F + 6; y++) w.setRaw(x, y, z, brick());
        if (c === IN + 2 && ((x + z) & 1) === 0) w.setRaw(x, F + 7, z, B.HAUNTED_BRICKS);
      }
    }
    // tralievensters en pompoenlampen aan de binnenkant
    for (let k = -IN + 2; k <= IN - 2; k++) {
      const along = ((k % 6) + 6) % 6;
      for (const [x, z, ox, oz] of [[C + k, C - IN - 1, 0, -1], [C + k, C + IN + 1, 0, 1], [C - IN - 1, C + k, -1, 0], [C + IN + 1, C + k, 1, 0]]) {
        if (along === 3) {
          for (let y = F + 3; y <= F + 4; y++) { w.setRaw(x, y, z, B.AIR); w.setRaw(x + ox, y, z + oz, B.HAUNTED_BARS); }
        } else if (along === 0) w.setRaw(x, F + 4, z, B.HAUNTED_JACK);
      }
    }

    // vier hoektorens met verlichte ramen en spitse daken
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const tx = C + sx * (IN + 2), tz = C + sz * (IN + 2);
        for (let dz = -3; dz <= 3; dz++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (Math.abs(dx) === 3 && Math.abs(dz) === 3) continue;
            for (let y = F + 1; y <= F + 13; y++) w.setRaw(tx + dx, y, tz + dz, brick());
            if (Math.max(Math.abs(dx), Math.abs(dz)) === 3 && ((dx + dz) & 1) === 0) w.setRaw(tx + dx, F + 14, tz + dz, B.HAUNTED_BRICKS);
          }
        }
        for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) {
          w.setRaw(tx + dx, F + 9, tz + dz, B.HAUNTED_WINDOW);
          w.setRaw(tx + dx, F + 10, tz + dz, B.HAUNTED_WINDOW);
        }
        for (const [y, r] of [[F + 14, 2], [F + 15, 2], [F + 16, 1], [F + 17, 1], [F + 18, 0]]) {
          for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) w.setRaw(tx + dx, y, tz + dz, B.HAUNTED_SLATE);
        }
        w.setRaw(tx, F + 19, tz, B.HAUNTED_JACK);
      }
    }

    // poortgebouw met valhek achter het portaal (zuid)
    for (let z = C + IN + 1; z <= C + IN + 3; z++) {
      for (let x = C - 4; x <= C + 5; x++) {
        for (let y = F + 1; y <= F + 10; y++) w.setRaw(x, y, z, brick());
        const edge = x === C - 4 || x === C + 5 || z === C + IN + 1 || z === C + IN + 3;
        if (edge && ((x + z) & 1) === 0) w.setRaw(x, F + 11, z, B.HAUNTED_BRICKS);
      }
    }
    for (let x = C - 1; x <= C + 2; x++) {
      for (let y = F + 1; y <= F + 4; y++) {
        w.setRaw(x, y, C + IN + 1, B.AIR); w.setRaw(x, y, C + IN + 2, B.HAUNTED_BARS); w.setRaw(x, y, C + IN + 3, B.AIR);
      }
    }
    w.setRaw(C - 3, F + 5, C + IN + 1, B.HAUNTED_JACK); w.setRaw(C + 4, F + 5, C + IN + 1, B.HAUNTED_JACK);
    w.setRaw(C, F + 8, C + IN + 1, B.HAUNTED_WINDOW); w.setRaw(C + 1, F + 8, C + IN + 1, B.HAUNTED_WINDOW);

    // de bibliotheek naast de binnenplaats
    for (let u = LIB0; u <= LIBB; u++) {
      for (let z = C - 6; z <= C + 6; z++) {
        const x = X(u);
        const wall = u <= LIB0 + 1 || u === LIBB || Math.abs(z - C) === 6;
        w.setRaw(x, F, z, Math.abs(z - C) <= 1 && u < LIBB ? B.HAUNTED_CARPET : B.HAUNTED_PLANKS);
        for (let y = F + 1; y <= F + 6; y++) w.setRaw(x, y, z, wall ? brick() : B.AIR);
        w.setRaw(x, F + 7, z, B.HAUNTED_PLANKS);
      }
    }
    // zadeldak van leisteen, met een gevel naar de binnenplaats
    for (let k = 0; k <= 7; k++) {
      const y = F + 8 + k;
      for (let u = LIB0; u <= LIBB + 1; u++) for (let z = C - 7 + k; z <= C + 7 - k; z++) w.setRaw(X(u), y, z, B.HAUNTED_SLATE);
      for (let z = C - 6 + k; z <= C + 6 - k; z++) w.setRaw(X(LIB0), y, z, brick());
    }
    w.setRaw(X(LIB0), F + 10, C, B.HAUNTED_WINDOW); w.setRaw(X(LIB0), F + 11, C, B.HAUNTED_WINDOW);
    // deur, lampen, ramen
    for (let u = LIB0; u <= LIB0 + 1; u++) for (let z = C - 1; z <= C + 1; z++) for (let y = F + 1; y <= F + 3; y++) w.setRaw(X(u), y, z, B.AIR);
    w.setRaw(X(LIB0), F + 3, C - 2, B.HAUNTED_JACK); w.setRaw(X(LIB0), F + 3, C + 2, B.HAUNTED_JACK);
    for (const u of [LIB0 + 4, LIB0 + 8, LIB0 + 12]) for (const z of [C - 6, C + 6]) for (let y = F + 3; y <= F + 4; y++) w.setRaw(X(u), y, z, B.HAUNTED_BARS);
    // rijen boekenkasten met een gangpad in het midden
    for (const u of [LIB0 + 4, LIB0 + 7, LIB0 + 10]) {
      for (let z = C - 5; z <= C + 5; z++) {
        if (Math.abs(z - C) <= 1) continue;
        for (let y = F + 1; y <= F + 3; y++) w.setRaw(X(u), y, z, B.BOOKSHELF);
      }
    }
    // achterwand vol boeken; in het midden de geheime kast waar licht door schijnt
    const secret = [];
    for (let z = C - 5; z <= C + 5; z++) {
      for (let y = F + 1; y <= F + 4; y++) {
        const sec = Math.abs(z - C) <= 1 && y <= F + 3;
        w.setRaw(X(LIBB), y, z, sec ? B.HAUNTED_SHELF : B.BOOKSHELF);
        if (sec) secret.push([X(LIBB), y, z]);
      }
    }
    const candles = [];
    const candle = (x, y, z) => { w.setRaw(x, y, z, B.HAUNTED_CANDLE); candles.push({ x: x + 0.5, y: y + 0.6, z: z + 0.5 }); };
    candle(X(LIBB - 1), F + 1, C - 2); candle(X(LIBB - 1), F + 1, C + 2);
    candle(X(LIB0 + 4), F + 4, C - 3); candle(X(LIB0 + 7), F + 4, C + 4); candle(X(LIB0 + 10), F + 4, C - 4);
    w.setRaw(X(LIB0 + 2), F + 1, C - 5, B.HAUNTED_JACK); w.setRaw(X(LIB0 + 2), F + 1, C + 5, B.HAUNTED_JACK);
    for (const [u, z] of [[LIB0 + 2, C - 5], [LIB0 + 2, C + 5], [LIBB - 1, C - 5], [LIBB - 1, C + 5], [LIB0 + 8, C + 5], [LIB0 + 5, C - 5]]) w.setRaw(X(u), F + 6, z, B.HAUNTED_WEB);

    // de geheime schatkamer achter de boekenkast
    for (let u = LIBB + 1; u <= SEC1; u++) {
      for (let z = C - 3; z <= C + 3; z++) {
        const x = X(u);
        const wall = u === SEC1 || Math.abs(z - C) === 3;
        w.setRaw(x, F, z, wall ? B.HAUNTED_BRICKS : B.HAUNTED_CARPET);
        for (let y = F + 1; y <= F + 3; y++) w.setRaw(x, y, z, wall ? brick() : B.AIR);
        w.setRaw(x, F + 4, z, B.HAUNTED_BRICKS);
      }
    }
    const tx = X(LIBB + 3);
    w.setRaw(tx, F + 4, C, B.GLOWSTONE);
    w.setRaw(tx, F + 1, C, B.CHEST);
    w.setRaw(X(LIBB + 4), F + 1, C - 1, B.GOLD); w.setRaw(X(LIBB + 4), F + 1, C + 1, B.GOLD);
    w.setRaw(X(LIBB + 4), F + 1, C - 2, B.HAUNTED_JACK); w.setRaw(X(LIBB + 4), F + 1, C + 2, B.HAUNTED_JACK);
    candle(X(LIBB + 1), F + 1, C - 2); candle(X(LIBB + 1), F + 1, C + 2);

    // pilaren met pompoenlampen (dekking tegen zwaardgolven)
    const pillars = [[C - 9, C - 9], [C + 8, C - 9], [C - 9, C + 8], [C + 8, C + 8]];
    for (const [px, pz] of pillars) {
      for (let y = F + 1; y <= F + 5; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, y, pz + dz, brick());
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, F + 6, pz + dz, B.HAUNTED_BRICKS);
      w.setRaw(px + (px < C ? 1 : 0), F + 7, pz + (pz < C ? 1 : 0), B.HAUNTED_JACK);
    }

    // graven op de binnenplaats (hier komen de spookhanden uit)
    const graves = [];
    for (let tries = 0; tries < 500 && graves.length < 14; tries++) {
      const x = C - 14 + Math.floor(rand() * 29), z = C - 14 + Math.floor(rand() * 29);
      const dx = x - C, dz = z - C, d = Math.hypot(dx, dz);
      if (d < 9.5 || d > 14) continue;
      if (z > C + 6 && Math.abs(dx) < 6) continue;               // portaal en start vrij
      if (dx * side > 6 && Math.abs(dz) < 4) continue;             // pad naar de bibliotheek vrij
      if (pillars.some(([px, pz]) => Math.abs(x - px - 0.5) < 3 && Math.abs(z - pz - 0.5) < 3)) continue;
      if (graves.some((g) => Math.abs(g.hx - x) < 3 && Math.abs(g.hz - z) < 3)) continue;
      let ox = 0, oz = 0;
      if (Math.abs(dx) > Math.abs(dz)) ox = -Math.sign(dx); else oz = -Math.sign(dz);
      w.setRaw(x, F + 1, z, B.HAUNTED_GRAVE);
      w.setRaw(x + ox, F, z + oz, B.HAUNTED_DIRT); w.setRaw(x + 2 * ox, F, z + 2 * oz, B.HAUNTED_DIRT);
      if (rand() < 0.3) candle(x, F + 2, z);
      graves.push({ hx: x, hz: z, x: x + 0.5 + ox * 1.5, z: z + 0.5 + oz * 1.5 });
    }
    // dode bomen in de hoeken van de binnenplaats
    for (const [x, z] of [[C - 13, C - 13], [C + 13, C - 13], [C - 13, C + 13], [C + 13, C + 13]]) if (rand() < 0.8) deadTree(w, x, F + 1, z, rand);

    // buiten de muren: kerkhof met dode bomen en pompoenen
    const trees = [];
    for (let i = 0; i < 700; i++) {
      const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
      if (cheb(x, z) < IN + 6 || reserved(x, z)) continue;
      const y = heights[z * S + x] + 1;
      const r = rand();
      if (r < 0.07) {
        if (trees.some((t) => Math.abs(t[0] - x) < 5 && Math.abs(t[1] - z) < 5)) continue;
        deadTree(w, x, y, z, rand);
        trees.push([x, z]);
      } else if (r < 0.12) {
        w.setRaw(x, y, z, B.HAUNTED_GRAVE);
        w.setRaw(x, y - 1, z + 1, B.HAUNTED_DIRT);
      } else if (r < 0.135) w.setRaw(x, y, z, B.HAUNTED_JACK);
    }

    // aankomstportaal bij het poortgebouw
    const pz = C + 14;
    for (let i = -1; i <= 2; i++) {
      for (let y = F + 1; y <= F + 5; y++) {
        const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
        w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
      }
    }
    for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
    w.portalAxis = 'x';

    w.computeTops();
    return {
      world: w,
      spawn: { x: C + 1, y: F + 1, z: pz - 2.5 },
      spawnYaw: 0,
      bossSpawn: { x: C + 0.5, y: F + 1, z: C - 3.5 },
      portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
      portalAxis: 'x',
      arenaCenter: { x: C + 0.5, z: C + 0.5 }, arenaRadius: 16, floorY: F + 1,
      treasure: { x: tx, y: F + 1, z: C },
      graves, candles, secret, side,
    };
  }

  /* ---------- Gedeelde vormen (blijven bestaan tussen bezoeken) ---------- */
  const GEO = {};
  function geo(w, h, d, oy, ox, oz) {
    const k = w + ',' + h + ',' + d + ',' + (oy || 0) + ',' + (ox || 0) + ',' + (oz || 0);
    let g = GEO[k];
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      if (oy || ox || oz) g.translate(ox || 0, oy || 0, oz || 0);
      g.userShared = true;
      GEO[k] = g;
    }
    return g;
  }
  const box = (w, h, d, mat, oy, ox, oz) => new THREE.Mesh(geo(w, h, d, oy, ox, oz), mat);

  const KT = {};
  function buildKnightTextures() {
    const R = mulberry32(1031);
    const v = (c, k) => { const d = (R() - 0.5) * 2 * k; return [c[0] + d, c[1] + d, c[2] + d]; };
    const rivet = (x, y) => (x === 2 || x === 13) && (y === 2 || y === 13);
    const seam = (x, y) => y === 5 || y === 10 || x === 0 || x === 15;
    KT.armor = pixelTexture(16, 16, (x, y) => (rivet(x, y) ? [210, 245, 240] : seam(x, y) ? v([62, 92, 96], 4) : y < 2 ? v([170, 205, 205], 5) : v(R() < 0.25 ? [118, 156, 160] : [132, 170, 172], 5)));
    KT.armorGlow = pixelTexture(16, 16, (x, y) => (rivet(x, y) ? [160, 255, 235] : seam(x, y) ? [40, 170, 150] : [16, 52, 50]));
    KT.dark = pixelTexture(16, 16, (x, y) => (y % 5 === 0 ? v([30, 38, 42], 3) : v([52, 64, 68], 5)));
    const slit = (x, y) => (y === 6 || y === 7) && x >= 2 && x <= 13;
    const face = (eye) => (x, y) => {
      if (slit(x, y)) return eye;
      if (x <= 1 || x >= 14 || y <= 2) return v([120, 158, 160], 5);
      if (y >= 10 && y <= 12 && x >= 4 && x <= 11 && x % 2 === 0) return [12, 18, 20];
      if (y === 4) return v([140, 178, 178], 4);
      return v([34, 48, 52], 4);
    };
    KT.face = pixelTexture(16, 16, face([235, 255, 250]));
    KT.faceP2 = pixelTexture(16, 16, face([255, 110, 70]));   // fase 2: rode ogen
    KT.faceGlow = pixelTexture(16, 16, (x, y) => (slit(x, y) ? [255, 255, 255] : [0, 0, 0]));
    KT.cape = pixelTexture(16, 16, (x, y) => {
      if (y > 11 + ((x * 7 + 3) % 5)) return null;
      return v(x % 4 === 1 ? [16, 40, 42] : [26, 62, 64], 4);
    });
    KT.moon = pixelTexture(16, 16, (x, y) => {
      if ((x === 0 || x === 15) && (y === 0 || y === 15)) return null;
      if ((Math.hypot(x - 5, y - 6) < 2) || (Math.hypot(x - 11, y - 10) < 1.6) || (x === 9 && y === 4)) return [196, 212, 212];
      return v([236, 246, 240], 4);
    });
  }

  // Materialen voor een ridder; real = met gloeiend zwaard
  function knightMats(real, ph2) {
    if (!KT.armor) buildKnightTextures();
    const armor = new THREE.MeshLambertMaterial({ map: KT.armor, emissive: 0xffffff, emissiveMap: KT.armorGlow, emissiveIntensity: ph2 ? 0.9 : 0.45, transparent: true, opacity: 0.86 });
    const dark = new THREE.MeshLambertMaterial({ map: KT.dark, emissive: 0x0c3a36, transparent: true, opacity: 0.9 });
    const face = new THREE.MeshLambertMaterial({ map: ph2 ? KT.faceP2 : KT.face, emissive: ph2 ? 0xff5a3c : 0x7fffe8, emissiveMap: KT.faceGlow, emissiveIntensity: 1.2, transparent: true, opacity: 0.95 });
    const cape = new THREE.MeshLambertMaterial({ map: KT.cape, emissive: 0x08302c, transparent: true, opacity: 0.8, alphaTest: 0.25, side: THREE.DoubleSide });
    const plume = new THREE.MeshBasicMaterial({ color: ph2 ? 0xff7a4a : 0x7fffe0, transparent: true, opacity: 0.85 });
    const blade = real ? new THREE.MeshBasicMaterial({ color: 0xdcfff8, transparent: true, opacity: 1 })
      : new THREE.MeshLambertMaterial({ color: 0x5c6468, transparent: true, opacity: 1 });
    const aura = real ? new THREE.MeshBasicMaterial({ color: 0x4dffd8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }) : null;
    plume.userBase = plume.color.clone(); blade.userBase = blade.color.clone();
    const list = [armor, dark, face, cape, plume, blade];
    for (const m of list) m.baseOpacity = m.opacity;
    return { armor, dark, face, cape, plume, blade, aura, list };
  }
  function setFade(mats, k) { for (const m of mats.list) m.opacity = m.baseOpacity * k; }

  // Het ridder-model (21 meshes, 22 met gloed)
  function buildKnight(M) {
    const group = new THREE.Group(), inner = new THREE.Group();
    group.add(inner);
    const legs = [];
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(sx * 0.38, 1.5, 0);
      g.add(box(0.58, 1.25, 0.62, M.armor, -0.62));
      g.add(box(0.66, 0.32, 0.82, M.dark, -1.34, 0, 0.08));
      inner.add(g); legs.push(g);
    }
    const torso = new THREE.Group();
    torso.position.y = 1.5;
    inner.add(torso);
    torso.add(box(1.5, 0.45, 1.0, M.dark, 0.1));
    torso.add(box(1.45, 1.25, 0.9, M.armor, 0.9));
    for (const sx of [-1, 1]) {
      const p = box(0.75, 0.45, 1.05, M.armor);
      p.position.set(sx * 0.95, 1.5, 0); p.rotation.z = -sx * 0.25;
      torso.add(p);
    }
    const head = new THREE.Group();
    head.position.set(0, 1.55, 0.05);
    torso.add(head);
    head.add(new THREE.Mesh(geo(0.95, 1.0, 0.95, 0.5), [M.armor, M.armor, M.armor, M.armor, M.face, M.armor]));
    const plume = box(0.16, 0.5, 0.95, M.plume, 0.25);
    plume.position.set(0, 1.0, -0.1);
    head.add(plume);
    const cape = new THREE.Group();
    cape.position.set(0, 1.45, -0.5);
    torso.add(cape);
    [2.2, 2.6, 2.3].forEach((L, i) => cape.add(box(0.5, L, 0.08, M.cape, -L / 2, (i - 1) * 0.48, 0)));
    const armR = new THREE.Group();
    armR.position.set(0.98, 1.2, 0);
    armR.add(box(0.48, 1.2, 0.52, M.armor, -0.55));
    armR.add(box(0.56, 0.38, 0.6, M.dark, -1.25));
    torso.add(armR);
    const sword = new THREE.Group();
    sword.position.set(0, -1.3, 0.05);
    sword.rotation.x = Math.PI / 2;
    armR.add(sword);
    sword.add(box(0.12, 0.55, 0.12, M.dark, -0.15));
    sword.add(box(0.75, 0.12, 0.2, M.dark, 0.15));
    sword.add(box(0.22, 2.3, 0.08, M.blade, 1.35));
    let aura = null;
    if (M.aura) { aura = box(0.42, 2.45, 0.26, M.aura, 1.35); sword.add(aura); }
    const armL = new THREE.Group();
    armL.position.set(-0.98, 1.2, 0);
    armL.add(box(0.48, 1.2, 0.52, M.armor, -0.55));
    armL.add(box(0.56, 0.38, 0.6, M.dark, -1.25));
    torso.add(armL);
    return { group, inner, legs, torso, head, plume, cape, armR, armL, sword, aura };
  }

  // Een spookkloon: ziet eruit als de ridder, maar zijn zwaard gloeit niet
  function cloneModel(ph2) {
    const M = knightMats(false, ph2);
    const k = buildKnight(M);
    return {
      group: k.group,
      mats: M.list,
      animate(m, dt) {
        m.age = (m.age || 0) + dt;
        setFade(M, Math.min(1, m.age / 0.5) * Math.min(1, m.life / 0.8));
        const sp = Math.hypot(m.vel.x, m.vel.z);
        const sw = Math.sin(m.walk * 0.35) * Math.min(1, sp / 2) * 0.6;
        k.legs[0].rotation.x = sw; k.legs[1].rotation.x = -sw;
        const near = Math.hypot(player.pos.x - m.pos.x, player.pos.z - m.pos.z) < 3.2;
        k.armR.rotation.x = near ? -1.6 + Math.sin(m.age * 7) * 1.1 : -0.45 + sw * 0.2;
        k.armL.rotation.x = -sw * 0.6;
        k.cape.rotation.x = 0.15 + Math.sin(m.age * 2.6) * 0.07 + Math.min(sp, 4) * 0.06;
        k.inner.position.y = Math.sin(m.age * 2.2) * 0.06;
        if (Math.random() < dt * 5) FX.glow.spawn(m.pos.x + (Math.random() - 0.5), m.pos.y + 0.2, m.pos.z + (Math.random() - 0.5), 0, 0.6, 0, 0.45, 1, 0.85, 0.7, -0.3, 0.5);
      },
    };
  }

  // Zwaardgolf: een sikkel van licht
  let WAVE_MAT = null;
  function waveMesh() {
    if (!WAVE_MAT) WAVE_MAT = new THREE.MeshBasicMaterial({ color: 0xb8fff4, transparent: true, opacity: 0.9 });
    const g = new THREE.Group();
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.3;
      const m = new THREE.Mesh(geo(0.45, 0.5, 0.2), WAVE_MAT);
      m.position.set(Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3 - 1.3);
      m.rotation.y = a;
      m.scale.setScalar(1 - Math.abs(i) * 0.12);
      g.add(m);
    }
    return g;
  }

  // Spookhand die uit de grond omhoog komt
  let HAND_MAT = null;
  function handMesh() {
    if (!HAND_MAT) HAND_MAT = new THREE.MeshBasicMaterial({ color: 0xc8fff0, transparent: true, opacity: 0.85 });
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo(0.34, 1.0, 0.24, 0.5), HAND_MAT));
    g.add(new THREE.Mesh(geo(0.5, 0.5, 0.22, 1.25), HAND_MAT));
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(geo(0.1, 0.42, 0.12, 0.21), HAND_MAT);
      f.position.set(-0.19 + i * 0.127, 1.5, 0); f.rotation.z = (i - 1.5) * 0.1;
      g.add(f);
    }
    const th = new THREE.Mesh(geo(0.1, 0.3, 0.12, 0.15), HAND_MAT);
    th.position.set(0.27, 1.15, 0); th.rotation.z = -0.7;
    g.add(th);
    return g;
  }
  function handTrigger(h) {
    const hand = handMesh();
    hand.rotation.y = Math.random() * Math.PI * 2;
    hand.position.y = -2;
    h.mesh.add(hand);
    h.hand = hand;
    SND.play('whoosh', { at: { x: h.x, y: h.y, z: h.z }, range: 28, vol: 0.6 });
    for (let i = 0; i < 10; i++) {
      FX.glow.spawn(h.x + (Math.random() - 0.5) * 1.6, h.y + 0.1, h.z + (Math.random() - 0.5) * 1.6, 0, 2 + Math.random() * 2, 0, 0.6, 1, 0.5, 0.7, -0.5, 1);
      FX.debris.spawn(h.x, h.y + 0.2, h.z, (Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.3, 0.22, 0.16, 0.6, 14, 0.5, true);
    }
    if (h.playerInside()) {
      damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'ghosthand', h.knock, h.up);
      player.slow = Math.max(player.slow, 1.4);
    }
  }
  function handLinger(h) {
    if (!h.hand) return;
    const k = h.t - h.warn;
    const out = h.linger - 0.3;
    h.hand.position.y = k < 0.15 ? -2 + 2 * (k / 0.15) : k > out ? -2 * Math.min(1, (k - out) / 0.3) : 0;
    h.hand.rotation.z = Math.sin(k * 18) * 0.12;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- De Spookridder ---------- */
  class GhostKnight extends BossBase {
    constructor(world, info) {
      super(world, info, { name: 'De Spookridder', ref: 'de Spookridder', hp: 880, hw: 0.95, h: 4.3, deathTiles: [T.HAUNTED_JACK, T.HAUNTED_BRICKS, T.HAUNTED_WINDOW] });
      this.anim = { armR: -0.3, armRz: 0.1, armL: -0.3, armLz: -0.1, sword: Math.PI, twist: 0, lean: 0.2, head: 0.45, crouch: 0, legL: 0, legR: 0, glow: 1 };
      this.fadeK = 1; this.fadeTarget = 1;
      this.bag = []; this.waveN = 0; this.dashN = 0; this.cloneCD = 3; this.windT = 0.8; this.holdT = 1;
      this.lane = null; this.dashDir = { x: 0, z: 1 }; this.dashLen = 0; this.dashDone = 0; this.dashYaw = 0; this.dashHit = false;
      this.toldClones = false;
    }

    buildModel() {
      const M = knightMats(true, false);
      const k = buildKnight(M);
      k.mats = M.list; k.M = M;
      return k;
    }

    applyFade() { setFade(this.model.M, this.fadeK); }
    liveClones() { let n = 0; for (const m of game.minions) if (m.ghostClone && !m.dead) n++; return n; }

    // Past de ridder (ongeveer) op deze plek?
    freeAt(x, z, r) {
      const w = this.world, y0 = this.info.floorY;
      for (let y = y0; y < y0 + 4; y++) {
        for (const ox of [-r, 0, r]) for (const oz of [-r, 0, r]) if (w.solidAt(Math.floor(x + ox), y, Math.floor(z + oz))) return false;
      }
      return SOLID[w.get(Math.floor(x), y0 - 1, Math.floor(z))] === 1;
    }

    // Niet de binnenplaats uit lopen
    leash(speed) {
      const ac = this.info.arenaCenter;
      const ox = this.pos.x - ac.x, oz = this.pos.z - ac.z;
      if (Math.hypot(ox, oz) > this.info.arenaRadius - 1.5 && Math.sin(this.yaw) * ox + Math.cos(this.yaw) * oz > 0) return 0;
      return speed;
    }

    onEnrage() {
      this.stopDash();
      const M = this.model.M;
      M.armor.emissiveIntensity = 0.9;
      M.face.emissive.setHex(0xff5a3c); M.face.map = KT.faceP2; M.face.needsUpdate = true;
      M.plume.color.setHex(0xff7a4a); M.plume.userBase = M.plume.color.clone();
      this.bag = []; this.cloneCD = 0;
      this.setState('p2roar');
      const c = this.center();
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        FX.glow.spawn(c.x, c.y, c.z, Math.cos(a) * 6, (Math.random() - 0.3) * 5, Math.sin(a) * 6, 0.5, 1, 0.85, 0.9, 0, 2);
      }
    }
    enragedFx() {
      const sx = Math.random() < 0.5 ? -1 : 1;
      const fx = Math.cos(this.yaw), fz = -Math.sin(this.yaw);
      const hot = Math.random() < 0.5;
      FX.glow.spawn(this.pos.x + fx * sx * 0.95 + (Math.random() - 0.5) * 0.4, this.pos.y + 3.1 + Math.random() * 0.3, this.pos.z + fz * sx * 0.95 + (Math.random() - 0.5) * 0.4,
        0, 1.4, 0, hot ? 1 : 0.5, hot ? 0.5 : 1, hot ? 0.3 : 0.85, 0.5, -0.5, 0.5);
    }
    onReflectHit() {
      this.stopDash();
      this.setState('stagger');
    }
    onGoHome() {
      this.stopDash();
      this.fadeK = this.fadeTarget = 1;
      this.applyFade();
      this.bag = []; this.waveN = 0; this.dashN = 0; this.cloneCD = 3;
    }
    die() {
      this.stopDash();
      this.fadeK = this.fadeTarget = 1;
      this.applyFade();
      super.die();
    }

    stopDash() {
      if (this.flying) { this.flying = false; this.pos.y = this.info.floorY; this.vel.set(0, 0, 0); }
      this.fadeTarget = 1;
      this.lane = null;
    }

    think(dt, c) {
      const ph2 = this.enraged;
      let speed = 0;
      this.cloneCD -= dt;
      switch (this.state) {
        case 'chase':
          this.turnTo(c.targetYaw, dt, ph2 ? 4 : 3);
          if (c.dist > 3.0) speed = this.leash(ph2 ? 3.1 : 2.5);
          this.attackCD -= dt;
          if (this.attackCD <= 0 && !c.p.dead) this.pickAttack(c);
          break;
        case 'sweepWind':
          this.turnTo(c.targetYaw, dt, 1.2);
          if (this.t > this.windT) {
            this.setState('sweep');
            SND.play('whoosh', { at: this.pos, range: 30 });
            FX.ring(this.pos.x, this.pos.y, this.pos.z, 4.2, [0.6, 1, 0.9]);
          }
          break;
        case 'sweep':
          if (this.t > 0.4) this.setState('recover', ph2 ? 0.5 : 0.8);
          break;
        case 'waveWind':
          this.turnTo(c.targetYaw, dt, 3.5);
          if (this.t > this.windT) { this.fireWave(c.p); this.setState('waveSwing'); }
          break;
        case 'waveSwing':
          if (this.t > 0.35) {
            if (ph2 && this.waveN < 2) { this.windT = 0.5; this.setState('waveWind'); }
            else this.setState('recover', ph2 ? 0.5 : 0.8);
          }
          break;
        case 'dashWind':
          this.turnTo(this.dashYaw, dt, 8);
          if (Math.random() < 0.6) FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 1.6, this.pos.y + Math.random() * 4, this.pos.z + (Math.random() - 0.5) * 1.6, 0, 0.8, 0, 0.45, 1, 0.9, 0.5, 0, 1);
          if (this.t > this.windT) this.startDash();
          break;
        case 'dash':
          this.updateDash(dt, c.p);
          break;
        case 'dashEnd':
          if (this.t > 0.35) {
            if (ph2 && this.dashN < 2 && !c.p.dead && c.dist > 4) this.beginDash(c, 0.6);
            else this.setState('recover', ph2 ? 0.7 : 1.0);
          }
          break;
        case 'handsWind':
          this.turnTo(c.targetYaw, dt, 2);
          if (this.t > this.windT) { this.raiseHands(c.p); this.setState('handsHold'); }
          break;
        case 'handsHold':
          if (this.t > this.holdT) this.setState('recover', 0.4);
          break;
        case 'clonesWind': {
          const a = this.t * 9;
          for (let i = 0; i < 2; i++) {
            const b = a + i * Math.PI;
            FX.glow.spawn(this.pos.x + Math.cos(b) * 1.8, this.pos.y + 0.3 + this.t * 2.5, this.pos.z + Math.sin(b) * 1.8, 0, 0.5, 0, 0.5, 1, 0.85, 0.6, 0, 1);
          }
          if (this.t > 1.1) { this.summonClones(c.p); this.setState('recover', 0.6); }
          break;
        }
        case 'p2roar':
          if (this.t > 1.4) { this.windT = 1.1; this.setState('clonesWind'); SND.play('teleport', { vol: 0.7 }); }
          break;
        case 'stagger':
          if (this.t > 1.3) { this.setState('chase'); this.attackCD = 0.8; }
          break;
        case 'recover':
          if (this.t > this.recoverTime) {
            this.setState('chase');
            this.attackCD = ph2 ? 0.8 + Math.random() * 0.6 : 1.4 + Math.random() * 0.9;
          }
          break;
        default:
          this.setState('chase');
          break;
      }
      return speed;
    }

    pickAttack(c) {
      const ph2 = this.enraged;
      if (c.dist < 4.2 && Math.random() < 0.65) { this.beginSweep(); return; }
      if (!this.bag.length) this.bag = shuffle(ph2 ? ['wave', 'dash', 'hands', 'clones', 'wave', 'dash'] : ['wave', 'dash', 'hands', 'clones', 'wave']);
      let a = this.bag.shift();
      if (a === 'clones' && (this.cloneCD > 0 || this.liveClones() > 0)) a = 'hands';
      if (a === 'dash' && c.dist < 4.5) a = 'wave';
      if (a === 'wave') { this.waveN = 0; this.windT = ph2 ? 0.55 : 0.75; this.setState('waveWind'); SND.play('zap', { at: this.pos, range: 30, vol: 0.5 }); }
      else if (a === 'dash') { this.dashN = 0; if (!this.beginDash(c, ph2 ? 0.65 : 0.85)) { this.waveN = 0; this.windT = 0.75; this.setState('waveWind'); } }
      else if (a === 'hands') { this.windT = ph2 ? 0.65 : 0.8; this.setState('handsWind'); }
      else { this.windT = 1.1; this.setState('clonesWind'); SND.play('teleport', { vol: 0.7 }); }
    }

    // Draaiende zwaardslag rond zichzelf (cirkel op de grond = wegwezen)
    beginSweep() {
      this.windT = this.enraged ? 0.6 : 0.8;
      this.setState('sweepWind');
      game.addHazard(new GroundHazard({
        x: this.pos.x, y: this.info.floorY, z: this.pos.z, radius: 4.3, warn: this.windT, linger: 0.35, color: 0x8ffff0,
        dmg: this.dmg(15), type: 'boss', knock: 10, up: 5,
      }));
    }

    // Zwaardgolf (terug te slaan met je zwaard)
    fireWave(p) {
      this.waveN++;
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const origin = new THREE.Vector3(this.pos.x + fx * 1.6, this.pos.y + 1.1, this.pos.z + fz * 1.6);
      const dir = new THREE.Vector3(p.pos.x - origin.x, 0, p.pos.z - origin.z);
      if (dir.lengthSq() < 0.01) dir.set(fx, 0, fz);
      dir.normalize();
      const speed = this.enraged ? 12.5 : 11;
      game.addProjectile(new Projectile({
        pos: origin, vel: dir.multiplyScalar(speed), owner: 'boss', type: 'ghostwave',
        dmg: this.dmg(14), radius: 0.6, knock: 7, reflectable: true, reflectDmg: 40, spin: false, life: 3.5, mesh: waveMesh(),
        trail: (pr) => {
          pr.mesh.lookAt(pr.pos.x + pr.vel.x, pr.pos.y + pr.vel.y, pr.pos.z + pr.vel.z);
          if (Math.random() < 0.7) FX.glow.spawn(pr.pos.x + (Math.random() - 0.5) * 1.6, pr.pos.y + (Math.random() - 0.5) * 0.4, pr.pos.z + (Math.random() - 0.5) * 1.6, 0, 0.3, 0, 0.6, 1, 0.92, 0.35, 0, 0);
        },
        explodeFx: (pr) => {
          for (let i = 0; i < 18; i++) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6, 0.6, 1, 0.9, 0.5, 2, 1.5);
        },
      }));
      SND.play('shoot', { at: origin, range: 40, vol: 0.8 });
      SND.play('whoosh', { at: origin, range: 30, vol: 0.6 });
    }

    // Onzichtbare sprint langs een baan; geeft false als er geen plek is
    beginDash(c, warn) {
      const p = c.p;
      let dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      dx /= d; dz /= d;
      const ac = this.info.arenaCenter, R = this.info.arenaRadius - 2;
      let len = clamp(d + 5, 8, 22);
      while (len > 4) {
        const ex = this.pos.x + dx * len, ez = this.pos.z + dz * len;
        if (Math.hypot(ex - ac.x, ez - ac.z) <= R && this.freeAt(ex, ez, 1.0)) break;
        len -= 0.5;
      }
      if (len <= 4) return false;
      this.dashN++;
      this.dashDir = { x: dx, z: dz }; this.dashLen = len; this.dashYaw = Math.atan2(dx, dz);
      this.windT = warn;
      this.lane = new LaneHazard({
        x0: this.pos.x, z0: this.pos.z, x1: this.pos.x + dx * len, z1: this.pos.z + dz * len, y: this.info.floorY,
        width: 2.6, warn, linger: 0.35, color: 0x40e8ff, onTrigger: () => {},
      });
      game.addHazard(this.lane);
      this.fadeTarget = 0.12;
      this.setState('dashWind');
      SND.play('teleport', { at: this.pos, range: 36, vol: 0.6 });
      return true;
    }

    startDash() {
      this.flying = true;
      this.vel.set(0, 0, 0);
      this.dashDone = 0; this.dashHit = false;
      this.setState('dash');
      SND.play('whoosh', { vol: 0.9 });
    }

    updateDash(dt, p) {
      const sp = this.enraged ? 30 : 24;
      const step = Math.min(sp * dt, this.dashLen - this.dashDone);
      const px0 = this.pos.x, pz0 = this.pos.z;
      this.pos.x += this.dashDir.x * step; this.pos.z += this.dashDir.z * step;
      this.dashDone += step;
      this.yaw = this.dashYaw;
      for (let i = 0; i < 3; i++) FX.glow.spawn(this.pos.x + (Math.random() - 0.5), this.pos.y + Math.random() * 3.5, this.pos.z + (Math.random() - 0.5), 0, 0.3, 0, 0.5, 1, 0.9, 0.45, 0, 0);
      if (!this.dashHit && !p.dead && Math.abs(p.pos.y - this.pos.y) < 2.5) {
        // afstand van de speler tot het stuk dat de ridder net aflegde
        const sx = this.pos.x - px0, sz = this.pos.z - pz0, L2 = sx * sx + sz * sz || 1;
        const t = clamp(((p.pos.x - px0) * sx + (p.pos.z - pz0) * sz) / L2, 0, 1);
        const qx = px0 + sx * t, qz = pz0 + sz * t;
        if (Math.hypot(p.pos.x - qx, p.pos.z - qz) < this.hw + 0.55) {
          this.dashHit = true;
          damagePlayer(this.dmg(16), { x: qx - this.dashDir.x, y: this.pos.y, z: qz - this.dashDir.z }, 'boss', 11, 6);
        }
      }
      if (this.dashDone >= this.dashLen - 0.01) {
        this.stopDash();
        game.shake = Math.max(game.shake, 0.3);
        this.setState('dashEnd');
      }
    }

    // Spookhanden uit de graven en onder de speler
    raiseHands(p) {
      const ph2 = this.enraged;
      const n = ph2 ? 6 : 4, warn = ph2 ? 0.95 : 1.15;
      const spots = [{ x: p.pos.x + clamp(p.vel.x, -5, 5) * 0.45, z: p.pos.z + clamp(p.vel.z, -5, 5) * 0.45 }];
      const near = this.info.graves.map((g) => ({ g, d: Math.hypot(g.x - p.pos.x, g.z - p.pos.z) })).filter((o) => o.d < 11 && o.d > 1.5).sort((a, b) => a.d - b.d);
      for (const o of near) { if (spots.length >= n - 1) break; spots.push({ x: o.g.x, z: o.g.z }); }
      while (spots.length < n) {
        const a = Math.random() * Math.PI * 2, r = 2.4 + Math.random() * 2.8;
        spots.push({ x: p.pos.x + Math.cos(a) * r, z: p.pos.z + Math.sin(a) * r });
      }
      for (const s of spots) {
        game.addHazard(new GroundHazard({
          x: s.x, y: this.info.floorY, z: s.z, radius: 1.35, warn, linger: 0.9, color: 0x9cff3c,
          dmg: this.dmg(13), type: 'ghosthand', knock: 2, up: 8, onTrigger: handTrigger, onLinger: handLinger,
        }));
      }
      this.holdT = warn + 0.45;
      SND.play('slam', { at: this.pos, range: 40 });
      game.shake = Math.max(game.shake, 0.4);
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      FX.ring(this.pos.x + fx * 1.5, this.pos.y, this.pos.z + fz * 1.5, 2.5, [0.6, 1, 0.4]);
    }

    // Poef! De ridder en zijn klonen verschijnen in een kring rond de speler
    summonClones(p) {
      const ph2 = this.enraged;
      const total = (ph2 ? 3 : 2) + 1;
      const base = Math.random() * Math.PI * 2;
      const ac = this.info.arenaCenter, R = this.info.arenaRadius - 2;
      const spots = [];
      for (let i = 0; i < total; i++) {
        for (let tries = 0; tries < 12; tries++) {
          const a = base + i * Math.PI * 2 / total + (tries % 3 - 1) * 0.25;
          const r = 6.5 - Math.floor(tries / 3) * 0.9;
          let x = p.pos.x + Math.cos(a) * r, z = p.pos.z + Math.sin(a) * r;
          const ox = x - ac.x, oz = z - ac.z, od = Math.hypot(ox, oz);
          if (od > R) { x = ac.x + ox / od * R; z = ac.z + oz / od * R; }
          if (this.freeAt(x, z, 0.8) && Math.hypot(x - p.pos.x, z - p.pos.z) > 3.2 && !spots.some((s) => Math.hypot(s.x - x, s.z - z) < 2.2)) { spots.push({ x, z }); break; }
        }
      }
      const poof = (x, y, z) => {
        for (let i = 0; i < 24; i++) FX.glow.spawn(x + (Math.random() - 0.5) * 1.5, y + Math.random() * 4, z + (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 0.55, 1, 0.9, 0.8, -0.3, 1.5);
        FX.smoke(x, y + 1, z);
      };
      poof(this.pos.x, this.pos.y, this.pos.z);
      // oude klonen verdwijnen eerst
      for (const m of game.minions) if (m.ghostClone && !m.dead) { poof(m.pos.x, m.pos.y, m.pos.z); m.die(true); }
      SND.play('teleport', { vol: 0.9 });
      shuffle(spots);
      spots.forEach((s, i) => {
        poof(s.x, this.info.floorY, s.z);
        if (i === 0) {
          this.pos.set(s.x, this.info.floorY, s.z);
          this.vel.set(0, 0, 0);
          this.yaw = Math.atan2(p.pos.x - s.x, p.pos.z - s.z);
          return;
        }
        const m = new Minion(this.world, s.x, this.info.floorY, s.z, {
          name: 'Spookkloon', hp: 50, speed: ph2 ? 3.0 : 2.6, dmg: this.dmg(8), hw: 0.6, h: 3.9, life: ph2 ? 14 : 12,
          color: [0.4, 1, 0.85], model: () => cloneModel(ph2),
        });
        m.ghostClone = true;
        m.yaw = Math.atan2(p.pos.x - s.x, p.pos.z - s.z);
        game.addMinion(m);
      });
      this.cloneCD = ph2 ? 9 : 12;
      if (!this.toldClones) {
        this.toldClones = true;
        HUD.actionbar('Alleen de echte heeft een gloeiend zwaard!', 3.5);
      }
    }

    animate(dt, speed) {
      const a = this.anim, M = this.model, ph2 = this.enraged;
      this.walkPhase += dt * speed * 2.2;
      const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.6;
      let armR = -0.45 + sw * 0.2, armRz = 0.1, armL = -sw * 0.6, armLz = -0.1, sword = Math.PI / 2;
      let twist = 0, lean = 0.08, head = 0, crouch = 0, legL = sw, legR = -sw, rate = 10, glow = 1;
      let spin = 0;
      switch (this.state) {
        case 'sleep': case 'idle':
          armR = -0.3; armL = -0.3; armLz = 0.35; armRz = -0.3; sword = Math.PI + 0.3; lean = 0.2; head = 0.45; legL = 0; legR = 0; glow = 0.5;
          break;
        case 'roar': case 'p2roar':
          armR = -2.9; sword = 2.9; armL = -0.6; armLz = -0.7; head = -0.45; lean = -0.2; legL = 0; legR = 0; rate = 7; glow = 2.2;
          break;
        case 'sweepWind': {
          const k = clamp(this.t / this.windT, 0, 1);
          twist = 1.2 * k; armR = -1.5; armRz = 0.7; sword = Math.PI / 2; crouch = 0.2 * k; lean = 0.1; legL = 0.35; legR = -0.35; glow = 1.5 + k;
          break;
        }
        case 'sweep':
          spin = -clamp(this.t / 0.35, 0, 1) * Math.PI * 2; twist = -0.3; armR = -1.5; armRz = 1.2; crouch = 0.25; rate = 25; glow = 2.5;
          break;
        case 'waveWind':
          armR = -3.0; sword = 3.6; lean = -0.12; head = -0.2; legL = 0.3; legR = -0.2; rate = 12; glow = 2.4;
          break;
        case 'waveSwing':
          armR = -0.25; sword = Math.PI / 2; lean = 0.35; crouch = 0.15; legL = 0.4; legR = -0.3; rate = 28; glow = 1.6;
          break;
        case 'dashWind':
          crouch = 0.35; lean = 0.45; armR = -1.4; sword = Math.PI / 2 + 1.4; legL = 0.5; legR = -0.4; head = -0.3; glow = 2;
          break;
        case 'dash':
          lean = 0.75; armR = -1.5; sword = Math.PI / 2 + 1.5; legL = 0.8; legR = -0.8; crouch = 0.2; rate = 20; glow = 2;
          break;
        case 'dashEnd':
          lean = 0.3; armR = -0.6; crouch = 0.1;
          break;
        case 'handsWind':
          armR = -2.8; armL = -2.8; sword = 2.8; lean = -0.15; head = -0.35; legL = 0; legR = 0; rate = 8; glow = 2.2;
          break;
        case 'handsHold':
          armR = -0.95; armL = -0.95; armLz = 0.35; armRz = -0.25; sword = Math.PI - 0.15 + 0.95; crouch = 0.45; lean = 0.45; head = 0.2; legL = 0.5; legR = -0.3; rate = 25; glow = 1.6;
          break;
        case 'clonesWind':
          armR = -2.8; sword = 2.8; armL = -1.2; armLz = -0.8; lean = -0.1; head = -0.3; legL = 0; legR = 0; glow = 2;
          spin = this.t * this.t * 14;
          break;
        case 'stagger':
          lean = 0.45 + Math.sin(this.t * 8) * 0.12; armR = 0.1; armL = 0.1; head = 0.4 + Math.sin(this.t * 6) * 0.2; rate = 8; glow = 0.6;
          if (Math.random() < 0.3) FX.glow.spawn(this.pos.x + Math.cos(this.t * 8) * 0.7, this.pos.y + 4.4, this.pos.z + Math.sin(this.t * 8) * 0.7, 0, 0.2, 0, 1, 1, 0.6, 0.4, 0, 0);
          break;
        case 'recover':
          lean = 0.25; armR = -0.3; head = 0.2; rate = 6;
          break;
        default: break;
      }
      const k = 1 - Math.exp(-dt * rate);
      for (const [key, v] of [['armR', armR], ['armRz', armRz], ['armL', armL], ['armLz', armLz], ['sword', sword], ['twist', twist], ['lean', lean], ['head', head], ['crouch', crouch], ['glow', glow]]) a[key] += (v - a[key]) * k;
      a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
      a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
      M.armR.rotation.x = a.armR; M.armR.rotation.z = a.armRz;
      M.armL.rotation.x = a.armL; M.armL.rotation.z = a.armLz;
      M.sword.rotation.x = a.sword;
      M.torso.rotation.y = a.twist; M.torso.rotation.x = a.lean;
      M.head.rotation.x = a.head;
      M.legs[0].rotation.x = a.legL; M.legs[1].rotation.x = a.legR;
      M.inner.rotation.y = spin;
      const time = game.time || 0;
      M.inner.position.y = -a.crouch + (this.state === 'sleep' ? 0 : Math.sin(time * 2.2) * 0.06);
      M.cape.rotation.x = 0.12 + Math.sin(time * 2.6) * 0.07 + Math.min(speed, 4) * 0.08 + (this.state === 'dash' ? 0.9 : 0);
      // zwaardgloed en ogen
      const pulse = 0.85 + Math.sin(time * 6) * 0.15;
      M.aura.material.opacity = Math.min(0.9, 0.3 * a.glow * pulse) * this.fadeK;
      M.aura.scale.set(1 + a.glow * 0.15, 1 + a.glow * 0.03, 1 + a.glow * 0.15);
      M.M.face.emissiveIntensity = this.state === 'sleep' ? 0.35 + Math.sin(time * 1.5) * 0.15 : (ph2 ? 1.6 : 1.2);
      // vervagen (onzichtbare sprint)
      this.fadeK += (this.fadeTarget - this.fadeK) * (1 - Math.exp(-dt * 7));
      this.applyFade();
      if (this.state !== 'sleep' && this.fadeK > 0.5 && Math.random() < dt * 8) {
        FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 1.4, this.pos.y + 0.15, this.pos.z + (Math.random() - 0.5) * 1.4, 0, 0.7, 0, 0.45, 1, 0.85, 0.8, -0.4, 0.5);
      }
    }
  }

  /* ---------- Sfeer ---------- */
  let MOON = null;

  registerRealm('haunted', {
    gen,
    makeBoss: (world, info) => new GhostKnight(world, info),
    atmosphere: { background: 0x0b1d22, fog: 0x17383c, near: 10, far: 48, amb: 0x9fd0c8, ambI: 0.7, dir: 0xb8d8ff, dirI: 0.4, hand: 0xb0d8d0 },
    intro: 'Hoe-hoe... Welkom in het Spookkasteel! De Spookridder bewaakt de binnenplaats.',
    treasureTip: 'De schat ligt in de bibliotheek! Volg de kaarsjes en sla de gloeiende boekenkast kapot.',
    ruin: [B.STONE_BRICKS, B.MOSSY_STONE_BRICKS, B.HAUNTED_JACK, B.HAUNTED_JACK],
    ambientSound: 0.4,
    onEnter(info) {
      DEATH_REASONS.ghosthand = 'Gegrepen door een spookhand';
      DEATH_REASONS.ghostwave = 'Geraakt door een spookgolf';
      if (!MOON) {
        if (!KT.moon) buildKnightTextures();
        MOON = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: KT.moon, fog: false, transparent: true, depthWrite: false }));
        MOON.geometry.userShared = true;
      }
      info.moon = MOON;
      game.realmGroup.add(MOON);
      info.wispT = 0; info.wailT = 6; info.candleT = 0;
    },
    ambience(dt, info) {
      const p = player;
      if (info.moon) {
        info.moon.position.set(p.pos.x + 60, p.pos.y + 72, p.pos.z - 85);
        info.moon.lookAt(game.camera.position);
      }
      // zwevende spooklichtjes
      info.wispT = (info.wispT || 0) + dt * 6;
      while (info.wispT > 1) {
        info.wispT -= 1;
        FX.glow.spawn(p.pos.x + (Math.random() - 0.5) * 26, p.pos.y + Math.random() * 5, p.pos.z + (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 0.4, 0.25 + Math.random() * 0.35, (Math.random() - 0.5) * 0.4, 0.45, 1, 0.85, 2.5, -0.1, 0.3);
      }
      // flakkerende kaarsjes vlakbij
      info.candleT = (info.candleT || 0) + dt * 5;
      while (info.candleT > 1) {
        info.candleT -= 1;
        const cd = info.candles[Math.floor(Math.random() * info.candles.length)];
        if (cd && Math.abs(cd.x - p.pos.x) < 18 && Math.abs(cd.z - p.pos.z) < 18) FX.glow.spawn(cd.x, cd.y + 0.15, cd.z, 0, 0.6, 0, 1, 0.8, 0.35, 0.5, -0.2, 0.5);
      }
      // licht dat door de geheime boekenkast schijnt
      if (PROG.phase === 'treasure' && Math.random() < dt * 14) {
        const s = info.secret[Math.floor(Math.random() * info.secret.length)];
        if (s && game.world.get(s[0], s[1], s[2]) === B.HAUNTED_SHELF) {
          FX.glow.spawn(s[0] + 0.5 - info.side * 0.62, s[1] + Math.random(), s[2] + Math.random(), -info.side * 0.5, 0.3, 0, 1, 0.85, 0.4, 0.9, -0.2, 0.5);
        }
      }
      // spookgeluid in de verte
      info.wailT -= dt;
      if (info.wailT <= 0) { info.wailT = 9 + Math.random() * 10; SND.play('wind', { vol: 0.35 }); }
    },
  });
})();
