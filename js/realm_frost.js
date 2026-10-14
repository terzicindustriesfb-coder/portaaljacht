'use strict';
/* Portaaljacht – wereld 2: het IJsrijk met De Vorstreus (ijspegels, ijsscherven, sneeuwstorm met glij-aanval, vriesstamp) */

/* ---------- De wereld ---------- */
function genFrost(seed) {
  const S = 64, H = 40, C = 32, F = 12;
  const w = new World('realm', S, H, S);
  w.skyShade = true;
  const rand = mulberry32(seed);
  const n1 = new Noise2D(rand), n2 = new Noise2D(rand);

  // De iglo met de schat ligt achter een bevroren poort; het portaal aan de overkant
  const side = rand() < 0.5 ? 1 : -1;
  const gateAng = side * Math.PI / 2 + (rand() - 0.5) * 1.3;
  const gdx = Math.cos(gateAng), gdz = Math.sin(gateAng);
  const ix = clamp(Math.round(C + gdx * 23), 6, S - 7), iz = clamp(Math.round(C + gdz * 23), 6, S - 7);

  const arena = new Uint8Array(S * S);
  const heights = new Int16Array(S * S);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - C, dz = z + 0.5 - C;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= 17 + n1.noise(x / 6, z / 6) * 1.2) arena[z * S + x] = 1;
      let h = 7 + Math.floor((n2.fbm(x / 11, z / 11, 3) + 0.5) * 6);
      // pad van de poort naar de iglo
      const along = dx * gdx + dz * gdz, across = Math.abs(-dx * gdz + dz * gdx);
      if (along > 15 && along < 30 && across < 3.4) h = F;
      if (Math.hypot(x + 0.5 - ix, z + 0.5 - iz) < 5.5) h = F;
      heights[z * S + x] = arena[z * S + x] ? F : clamp(h, 4, 16);
    }
  }

  const LAKE = 8;
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const h = heights[z * S + x];
      const inA = arena[z * S + x];
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = B.BEDROCK;
        else if (y < h - 2) id = rand() < 0.3 ? B.PACKED_ICE : B.STONE;
        else if (y < h) id = inA ? B.PACKED_ICE : B.SNOW;
        else id = B.SNOW;
        w.setRaw(x, y, z, id);
      }
      // bevroren meer
      if (h < LAKE) {
        for (let y = h + 1; y < LAKE; y++) w.setRaw(x, y, z, B.WATER);
        w.setRaw(x, LAKE, z, B.ICE);
      }
      if (inA) {
        const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
        let top = B.SNOW;
        if (d < 6.5) top = rand() < 0.15 ? B.BLUE_ICE : B.ICE;             // glad ijs in het midden
        else if (rand() < 0.06) top = B.PACKED_ICE;
        w.setRaw(x, F, z, top);
      }
    }
  }

  // IJsmuur rond de arena, met een blauwe ijspoort richting de iglo
  const gate = [];
  for (let z = 1; z < S - 1; z++) {
    for (let x = 1; x < S - 1; x++) {
      if (arena[z * S + x]) continue;
      let near = false;
      for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1; dx++) if (arena[(z + dz) * S + x + dx]) { near = true; break; }
      if (!near) continue;
      for (let y = 1; y <= F; y++) if (!SOLID[w.get(x, y, z)]) w.setRaw(x, y, z, B.PACKED_ICE);
      const ddx = x + 0.5 - C, ddz = z + 0.5 - C;
      const along = ddx * gdx + ddz * gdz, across = Math.abs(-ddx * gdz + ddz * gdx);
      const isGate = along > 10 && across < 2.2;
      for (let y = F + 1; y <= F + 2; y++) {
        w.setRaw(x, y, z, isGate ? B.BLUE_ICE : B.PACKED_ICE);
        if (isGate) gate.push([x, y, z]);
      }
      if (!isGate && (x * 7 + z * 13) % 9 === 0) {
        w.setRaw(x, F + 3, z, B.BLUE_ICE);
        w.setRaw(x, F + 4, z, B.GLOWSTONE);
      }
    }
  }

  // Vier ijspilaren als dekking
  for (const [px, pz] of [[C - 10, C - 10], [C + 9, C - 10], [C - 10, C + 9], [C + 9, C + 9]]) {
    for (let y = F + 1; y <= F + 5; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.setRaw(px + dx, y, pz + dz, B.PACKED_ICE);
    w.setRaw(px, F + 6, pz, B.BLUE_ICE); w.setRaw(px + 1, F + 6, pz + 1, B.BLUE_ICE);
    w.setRaw(px, F + 7, pz, B.BLUE_ICE);
  }

  // Sparren en ijspieken buiten de arena
  for (let i = 0; i < 400; i++) {
    const x = 2 + Math.floor(rand() * (S - 4)), z = 2 + Math.floor(rand() * (S - 4));
    if (arena[z * S + x]) continue;
    const dC = Math.hypot(x + 0.5 - C, z + 0.5 - C);
    if (dC < 20.5 || Math.hypot(x + 0.5 - ix, z + 0.5 - iz) < 7) continue;
    const ddx = x + 0.5 - C, ddz = z + 0.5 - C;
    if (ddx * gdx + ddz * gdz > 14 && Math.abs(-ddx * gdz + ddz * gdx) < 4.5) continue;
    const h = heights[z * S + x];
    if (h < LAKE) {
      if (rand() < 0.05) iceSpike(w, x, LAKE + 1, z, 5 + Math.floor(rand() * 7));
      continue;
    }
    if (rand() < 0.12) spruce(w, x, h + 1, z, rand);
    else if (rand() < 0.03) iceSpike(w, x, h + 1, z, 4 + Math.floor(rand() * 6));
  }

  // De iglo (met de schatkist), ingang naar de arena gericht
  const iy = F + 1;
  for (let dy = 0; dy <= 4; dy++) {
    for (let dz = -4; dz <= 4; dz++) {
      for (let dx = -4; dx <= 4; dx++) {
        const r = Math.sqrt(dx * dx + dz * dz + dy * dy * 1.2);
        if (r < 3.7) w.setRaw(ix + dx, iy + dy, iz + dz, r > 2.75 ? B.SNOW : B.AIR);
      }
    }
  }
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dz * dz <= 6) w.setRaw(ix + dx, F, iz + dz, B.PACKED_ICE);
  for (let k = 2; k <= 5; k++) {
    const tx = Math.round(ix - gdx * k), tz = Math.round(iz - gdz * k);
    w.setRaw(tx, iy, tz, B.AIR); w.setRaw(tx, iy + 1, tz, B.AIR);
  }
  w.setRaw(ix, iy + 2, iz, B.GLOWSTONE);
  w.setRaw(ix, iy, iz, B.CHEST);
  // sneeuwpop als hint bij de ingang
  const sx = Math.round(ix - gdx * 4 + gdz * 2), sz = Math.round(iz - gdz * 4 - gdx * 2);
  w.setRaw(sx, iy, sz, B.SNOW); w.setRaw(sx, iy + 1, sz, B.SNOW); w.setRaw(sx, iy + 2, sz, B.GOLD);

  // Aankomstportaal aan de andere kant
  const pz = side > 0 ? C - 15 : C + 15;
  for (let i = -1; i <= 2; i++) {
    for (let y = F + 1; y <= F + 5; y++) {
      const frame = i === -1 || i === 2 || y === F + 1 || y === F + 5;
      w.setRaw(C + i, y, pz, frame ? B.OBSIDIAN : B.PORTAL);
    }
  }
  for (let dx = -2; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) w.setRaw(C + dx, F, pz + dz, B.OBSIDIAN);
  w.portalAxis = 'x';

  w.computeTops();
  const spawnZ = side > 0 ? pz + 3 : pz - 2;
  return {
    world: w,
    spawn: { x: C + 1, y: F + 1, z: spawnZ },
    spawnYaw: side > 0 ? Math.PI : 0,
    bossSpawn: { x: C + 0.5, y: F + 1, z: C + 0.5 + side * 2 },
    portal: { x: C + 1, y: F + 3.5, z: pz + 0.5 },
    portalAxis: 'x',
    arenaCenter: { x: C, z: C }, arenaRadius: 17, floorY: F + 1,
    treasure: { x: ix, y: iy, z: iz },
    gate,
  };
}

function spruce(w, x, y, z, rand) {
  const th = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < th; i++) w.setRaw(x, y + i, z, B.LOG);
  for (let ly = y + 2; ly <= y + th + 1; ly++) {
    const r = ly >= y + th ? 0 : ((y + th - ly) % 2 === 0 ? 1 : 2);
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        if (w.get(x + dx, ly, z + dz) === B.AIR) w.setRaw(x + dx, ly, z + dz, B.SPRUCE_LEAVES);
      }
    }
  }
}

function iceSpike(w, x, y, z, h) {
  for (let i = 0; i < h; i++) {
    const id = i > h - 3 ? B.BLUE_ICE : B.PACKED_ICE;
    w.setRaw(x, y + i, z, id);
    if (i < h / 2) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.get(x + dx, y + i, z + dz) === B.AIR) w.setRaw(x + dx, y + i, z + dz, B.PACKED_ICE);
  }
}

/* ---------- De Vorstreus ---------- */
const FROST_TEX = {};
function buildFrostTextures() {
  const R = mulberry32(1717);
  const cells = [];
  for (let i = 0; i < 9; i++) cells.push([R() * 16, R() * 16]);
  const crack = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) crack[y * 16 + x] = voronoi(cells, x, y, 16).edge < 0.8 ? 1 : 0;
  const base = (x, y) => {
    if (crack[y * 16 + x]) return R() < 0.5 ? [200, 250, 255] : [140, 230, 255];
    const r = R();
    if (r < 0.08) return [240, 250, 255];
    return r < 0.4 ? [60, 110, 180] : r < 0.75 ? [80, 140, 210] : [100, 160, 225];
  };
  FROST_TEX.body = pixelTexture(16, 16, base);
  FROST_TEX.glow = pixelTexture(16, 16, (x, y) => (crack[y * 16 + x] ? [90, 200, 255] : [0, 0, 0]));
  const eye = (x, y) => ((x >= 3 && x <= 5) || (x >= 10 && x <= 12)) && (y === 5 || y === 6);
  FROST_TEX.face = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return [200, 255, 255];
    if (y === 4 && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13))) return [30, 50, 90];      // boze wenkbrauwen
    if (y >= 9) return R() < 0.2 ? [210, 225, 240] : [240, 248, 255];                        // baard
    if (y === 8 && x >= 5 && x <= 10) return [30, 40, 70];                                   // mond
    return base(x, y);
  });
  FROST_TEX.faceGlow = pixelTexture(16, 16, (x, y) => (eye(x, y) ? [150, 255, 255] : crack[y * 16 + x] && y < 9 ? [90, 200, 255] : [0, 0, 0]));
  FROST_TEX.beard = pixelTexture(8, 8, () => (R() < 0.25 ? [206, 222, 238] : [240, 248, 255]));
  FROST_TEX.spike = pixelTexture(4, 8, (x, y) => (y < 2 ? [230, 250, 255] : x === 0 ? [180, 230, 255] : [120, 190, 240]));
}

let SPIKE_GEO = null, SPIKE_MAT = null, SHARD_GEO = null, SHARD_MAT = null;

class FrostBoss extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Vorstreus', ref: 'de Vorstreus', hp: 240, hw: 1.3, h: 4.6, deathTiles: [T.ICE, T.SNOW, T.BLUE_ICE] });
    this.anim = { armX: 0.2, armZ: 0.1, armL: 0, legL: 0, legR: 0, lean: 0.3, head: 0.4, crouch: 0 };
    this.blizzard = 0;
    this.combo = 0;
    this.chargeHit = false;
  }

  buildModel() {
    if (!FROST_TEX.body) buildFrostTextures();
    const body = new THREE.MeshLambertMaterial({ map: FROST_TEX.body, emissive: 0xffffff, emissiveMap: FROST_TEX.glow, emissiveIntensity: 0.7 });
    const face = new THREE.MeshLambertMaterial({ map: FROST_TEX.face, emissive: 0xffffff, emissiveMap: FROST_TEX.faceGlow, emissiveIntensity: 1 });
    const beard = new THREE.MeshLambertMaterial({ map: FROST_TEX.beard });
    const spike = new THREE.MeshLambertMaterial({ map: FROST_TEX.spike, emissive: 0x3388bb, emissiveIntensity: 0.4 });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const legs = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.66, 1.55, 0);
      p.add(bossBox(0.95, 1.55, 0.95, body, -0.78));
      p.add(bossBox(1.05, 0.35, 1.2, body, -1.38, 0, 0.1));
      inner.add(p);
      legs.push(p);
    }
    const torso = new THREE.Group();
    torso.position.y = 1.55;
    inner.add(torso);
    torso.add(bossBox(2.6, 1.9, 1.45, body, 0.95));
    // ijspieken op de schouders en rug
    for (const [x, y, z, rz, rx] of [[-1.25, 1.95, 0, 0.5, 0], [1.25, 1.95, 0, -0.5, 0], [-0.5, 1.7, -0.75, 0.2, -0.6], [0.5, 1.7, -0.75, -0.2, -0.6], [0, 1.4, -0.8, 0, -0.7]]) {
      const s = bossBox(0.3, 0.95, 0.3, spike, 0.45);
      s.position.set(x, y, z); s.rotation.set(rx, 0, rz);
      torso.add(s);
    }
    const arms = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 1.75, 1.65, 0);
      p.add(bossBox(0.85, 2.3, 0.85, body, -1.0));
      p.add(bossBox(1.15, 0.8, 1.15, body, -2.35));
      torso.add(p);
      arms.push(p);
    }
    const head = new THREE.Group();
    head.position.set(0, 1.9, 0.12);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.25, 1.2).translate(0, 0.62, 0), [body, body, body, body, face, body]));
    const bd = bossBox(1.0, 0.7, 0.35, beard, -0.15, 0, 0.55);
    head.add(bd);
    // ijskroon
    for (let i = -2; i <= 2; i++) {
      const s = bossBox(0.18, 0.45 + (2 - Math.abs(i)) * 0.18, 0.18, spike, 0.2);
      s.position.set(i * 0.28, 1.25, 0.1);
      head.add(s);
    }
    return { group, inner, legs, torso, arms, head, mats: [body, face, beard, spike], body, face };
  }

  onEnrage() {
    this.model.body.emissiveIntensity = 1.4;
    this.model.face.emissiveIntensity = 1.6;
  }
  enragedFx() {
    FX.glow.spawn(this.pos.x + (Math.random() - 0.5) * 2.6, this.pos.y + 1 + Math.random() * 3.5, this.pos.z + (Math.random() - 0.5) * 2.6,
      (Math.random() - 0.5) * 0.4, 0.8, (Math.random() - 0.5) * 0.4, 0.7, 0.95, 1, 0.8, -0.2, 0.5);
  }
  onGoHome() { this.noSteer = false; this.blizzard = 0; }

  think(dt, c) {
    const ph2 = this.enraged;
    let speed = 0;
    if (this.blizzard > 0) this.blizzard -= dt;
    switch (this.state) {
      case 'chase': {
        this.turnTo(c.targetYaw, dt, ph2 ? 4 : 3);
        if (c.dist > 3.4) speed = ph2 ? 2.9 : 2.2;
        this.attackCD -= dt;
        if (this.attackCD <= 0 && !c.p.dead) {
          const r = Math.random();
          if (c.dist < 4.5) this.setState('stompWind');
          else if (c.dist > 7 && r < 0.3) this.setState('chargeWind');
          else if (r < 0.65) this.setState('spikesWind');
          else this.setState('shardsWind');
        }
        break;
      }
      case 'stompWind':
        this.turnTo(c.targetYaw, dt, 2);
        if (this.t > (ph2 ? 0.55 : 0.75)) {
          this.shockwave(this.pos.x, this.pos.y, this.pos.z, 4.2, ph2 ? 7 : 6, [0.85, 0.95, 1]);
          if (Math.hypot(c.p.pos.x - this.pos.x, c.p.pos.z - this.pos.z) < 5) { c.p.slow = Math.max(c.p.slow, 2); SND.play('freeze', { vol: 0.6 }); }
          this.setState('recover', ph2 ? 0.6 : 0.9);
        }
        break;
      case 'spikesWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t > 0.7) {
          this.castSpikes(c.p);
          this.setState('recover', ph2 ? 0.5 : 0.8);
        }
        break;
      case 'shardsWind':
        this.turnTo(c.targetYaw, dt, 4);
        if (this.t > (ph2 ? 0.55 : 0.75)) {
          this.throwShards(ph2 ? 7 : 5);
          this.setState('recover', 0.6);
        }
        break;
      case 'chargeWind':
        // stampen en sneeuwstorm oproepen, dan in een rechte lijn over het ijs glijden
        this.turnTo(c.targetYaw, dt, 5);
        if (this.t < dt * 1.5) {
          this.blizzard = Math.max(this.blizzard, ph2 ? 7 : 5);
          SND.play('wind', { vol: 0.8 });
          SND.play('roar', { vol: 0.6 });
        }
        if (Math.random() < 0.5) {
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          const k = Math.random() * 10;
          FX.glow.spawn(this.pos.x + fx * k, this.pos.y + 0.1, this.pos.z + fz * k, 0, 0.6, 0, 0.75, 0.95, 1, 0.6, 0, 0);
        }
        if (this.t > (ph2 ? 0.75 : 1.0)) {
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          this.noSteer = true;
          this.vel.x = fx * (ph2 ? 15 : 13); this.vel.z = fz * (ph2 ? 15 : 13);
          this.chargeHit = false;
          this.setState('charge');
          SND.play('whoosh');
        }
        break;
      case 'charge': {
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        const sp = ph2 ? 15 : 13;
        this.vel.x = fx * sp; this.vel.z = fz * sp;
        if (Math.random() < 0.8) FX.debris.spawn(this.pos.x, this.pos.y + 0.2, this.pos.z, (Math.random() - 0.5) * 3, 2, (Math.random() - 0.5) * 3, 0.9, 0.97, 1, 0.5, 10, 0.5, true);
        if (!this.chargeHit && Math.hypot(c.p.pos.x - this.pos.x, c.p.pos.z - this.pos.z) < this.hw + 0.7 && Math.abs(c.p.pos.y - this.pos.y) < 2.5) {
          this.chargeHit = true;
          damagePlayer(this.dmg(8), this.pos, 'boss', 13, 7);
        }
        const done = this.t > 1.3 || this.hitWall;
        if (done) {
          this.noSteer = false;
          this.vel.x *= 0.2; this.vel.z *= 0.2;
          if (this.hitWall) {
            game.shake = Math.max(game.shake, 0.6);
            SND.play('slam', { at: this.pos });
            FX.ring(this.pos.x, this.pos.y, this.pos.z, 2.5, [0.85, 0.95, 1]);
            this.setState('stagger');
          } else if (ph2 && this.combo === 0) {
            this.combo = 1;
            this.setState('chargeWind');
            this.t = 0.4;
          } else {
            this.combo = 0;
            this.setState('recover', 1.0);
          }
        }
        break;
      }
      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph2 ? 1.0 + Math.random() * 0.8 : 1.8 + Math.random() * 1.2;
        }
        break;
      case 'stagger':
        if (this.t > 1.8) { this.setState('chase'); this.attackCD = 1.0; }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  // IJspegels: waarschuwingscirkels onder en vlak voor de speler, dan schieten de pegels omhoog
  castSpikes(p) {
    if (!SPIKE_GEO) {
      SPIKE_GEO = new THREE.BoxGeometry(0.7, 2.4, 0.7).translate(0, 1.2, 0);
      SPIKE_MAT = new THREE.MeshLambertMaterial({ map: FROST_TEX.spike, emissive: 0x2266aa, emissiveIntensity: 0.5 });
    }
    const n = this.enraged ? 5 : 3;
    const lead = 0.9;
    const spots = [{ x: p.pos.x + p.vel.x * lead * 0.5, z: p.pos.z + p.vel.z * lead * 0.5 }];
    for (let i = 1; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 2.5;
      spots.push({ x: p.pos.x + p.vel.x * lead + Math.cos(a) * r, z: p.pos.z + p.vel.z * lead + Math.sin(a) * r });
    }
    const y = this.info.floorY;
    for (const s of spots) {
      const hz = new GroundHazard({
        x: s.x, y, z: s.z, radius: 1.3, warn: this.enraged ? 0.85 : 1.05, linger: 0.9, color: 0x0b2fd6,
        dmg: this.dmg(7), type: 'spike', knock: 2, up: 9,
        onTrigger: (h) => {
          const sp = new THREE.Group();
          for (const [ox, oz, sc] of [[0, 0, 1], [0.45, 0.2, 0.7], [-0.4, 0.3, 0.6], [0.1, -0.45, 0.75]]) {
            const m = new THREE.Mesh(SPIKE_GEO, SPIKE_MAT);
            m.position.set(ox, 0, oz); m.scale.set(sc, sc, sc);
            m.rotation.set((Math.random() - 0.5) * 0.3, Math.random(), (Math.random() - 0.5) * 0.3);
            sp.add(m);
          }
          sp.scale.y = 0.05;
          h.mesh.add(sp);
          h.spike = sp;
          SND.play('shatter', { at: { x: h.x, y: h.y, z: h.z }, range: 30 });
          for (let i = 0; i < 10; i++) FX.debris.spawn(h.x, h.y + 0.2, h.z, (Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.8, 0.95, 1, 0.6, 14, 0.5, true);
          if (h.playerInside()) {
            damagePlayer(h.dmg, { x: h.x, y: h.y, z: h.z }, 'spike', h.knock, h.up);
            player.slow = Math.max(player.slow, 1.5);
          }
        },
        onLinger: (h) => {
          if (!h.spike) return;
          const k = h.t - h.warn;
          h.spike.scale.y = k < 0.12 ? Math.max(0.05, k / 0.12) : Math.max(0.05, 1 - Math.max(0, k - h.linger + 0.3) / 0.3);
        },
      });
      game.addHazard(hz);
    }
    SND.play('freeze', { at: this.pos, range: 40, vol: 0.8 });
  }

  // IJsscherven in een waaier; raken = vertraagd
  throwShards(n) {
    if (!SHARD_GEO) {
      SHARD_GEO = new THREE.BoxGeometry(0.18, 0.18, 0.75);
      SHARD_MAT = new THREE.MeshLambertMaterial({ map: FROST_TEX.spike, emissive: 0x3399dd, emissiveIntensity: 0.7 });
    }
    const p = player;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const origin = new THREE.Vector3(this.pos.x + fx * 1.2 + Math.cos(this.yaw) * 1.6, this.pos.y + 3.4, this.pos.z + fz * 1.2 - Math.sin(this.yaw) * 1.6);
    const base = new THREE.Vector3(p.pos.x, p.pos.y + 1.0, p.pos.z).sub(origin).normalize();
    const speed = this.enraged ? 14 : 12.5;
    for (let i = 0; i < n; i++) {
      const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (n - 1) / 2) * 0.2);
      const mesh = new THREE.Mesh(SHARD_GEO, SHARD_MAT);
      game.addProjectile(new Projectile({
        pos: origin.clone().addScaledVector(dir, 0.6), vel: dir.multiplyScalar(speed), owner: 'boss', type: 'ice',
        dmg: this.dmg(3), radius: 0.22, knock: 2, spin: false, mesh, life: 4,
        trail: (pr) => {
          pr.mesh.lookAt(pr.pos.x + pr.vel.x, pr.pos.y + pr.vel.y, pr.pos.z + pr.vel.z);
          if (Math.random() < 0.5) FX.glow.spawn(pr.pos.x, pr.pos.y, pr.pos.z, 0, 0, 0, 0.8, 0.95, 1, 0.3, 0, 0);
        },
        onHitPlayer: () => { player.slow = Math.max(player.slow, 2.5); SND.play('freeze', { vol: 0.7 }); },
        explodeFx: (pr) => {
          for (let i = 0; i < 8; i++) FX.debris.spawn(pr.pos.x, pr.pos.y, pr.pos.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, 0.8, 0.95, 1, 0.5, 12, 0.5, true);
          SND.play('shatter', { at: pr.pos, range: 24, vol: 0.5 });
        },
      }));
    }
    SND.play('shoot', { at: origin, range: 40, vol: 0.7 });
  }

  // De poort naar de iglo smelt als de Vorstreus verslagen is (in speltijd, zie ambience)
  die() {
    super.die();
    this.blizzard = 0;
    this.info.meltT = 3.2;
    this.info.meltI = 0;
  }

  animate(dt, speed) {
    const a = this.anim;
    this.walkPhase += dt * speed * 1.9;
    const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.55;
    let armX = -sw * 0.7, armZ = 0.15, armL = 0, legL = sw, legR = -sw, lean = 0.05, head = 0, crouch = 0, rate = 10;
    const ph2 = this.enraged;
    switch (this.state) {
      case 'sleep': case 'idle':
        armX = 0.3; armZ = 0.08; lean = 0.4; head = 0.5; legL = 0; legR = 0;
        if (this.state === 'sleep') head += Math.sin(game.time * 1.2) * 0.05;
        break;
      case 'roar': armX = -0.8; armZ = 1.0; lean = -0.2; head = -0.55; rate = 6; break;
      case 'stompWind': {
        const k = clamp(this.t / (ph2 ? 0.55 : 0.75), 0, 1);
        armX = -2.6 * easeOut(k); armZ = 0.35; lean = -0.15 * k; crouch = -0.3 * k; legL = -0.5 * k; rate = 14;
        break;
      }
      case 'spikesWind': armX = -2.4; armZ = 0.6; lean = -0.25; head = -0.4; rate = 8; break;
      case 'shardsWind': {
        const k = clamp(this.t / 0.75, 0, 1);
        armX = 0.2; armL = -2.5 * k + (k > 0.9 ? 2.5 : 0); armZ = 0.2; lean = -0.1; head = -0.15; rate = 12;
        break;
      }
      case 'chargeWind':
        armX = 0.9; armZ = 0.35; lean = 0.55; crouch = 0.3; legL = Math.sin(this.t * 14) * 0.4; legR = -legL; head = -0.3; rate = 10;
        break;
      case 'charge': armX = 1.2; armZ = 0.5; lean = 0.75; head = -0.4; legL = 0.6; legR = -0.6; rate = 14; break;
      case 'recover': armX = 0.4; armZ = 0.2; lean = 0.3; head = 0.25; rate = 6; break;
      case 'stagger':
        armX = 0.5 + Math.sin(this.t * 8) * 0.25; armZ = 0.6; lean = 0.5; head = 0.5 + Math.sin(this.t * 6) * 0.3; rate = 8;
        if (Math.random() < 0.3) FX.glow.spawn(this.pos.x + Math.cos(this.t * 8) * 0.8, this.pos.y + 4.8, this.pos.z + Math.sin(this.t * 8) * 0.8, 0, 0.2, 0, 1, 1, 0.6, 0.4, 0, 0);
        break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.armX += (armX - a.armX) * k;
    a.armZ += (armZ - a.armZ) * k;
    a.armL += (armL - a.armL) * k;
    a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
    a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
    a.lean += (lean - a.lean) * k;
    a.head += (head - a.head) * k;
    a.crouch += (crouch - a.crouch) * k;
    const m = this.model;
    m.arms[0].rotation.x = a.armX + a.armL * 0; m.arms[1].rotation.x = a.armX + a.armL;
    m.arms[0].rotation.z = -a.armZ; m.arms[1].rotation.z = a.armZ;
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head;
    m.inner.position.y = -a.crouch;
    m.face.emissiveIntensity = (this.state === 'spikesWind' || this.state === 'chargeWind' ? 2.2 : 1) * (ph2 ? 1.4 : 1);
  }
}

registerRealm('frost', {
  gen: genFrost,
  makeBoss: (world, info) => new FrostBoss(world, info),
  atmosphere: { background: 0xb8d4ec, fog: 0xc8def0, near: 16, far: 60, amb: 0xdfeeff, ambI: 0.85, dir: 0xffffff, dirI: 0.5, hand: 0xe8f2ff },
  intro: 'Brrr... Daar slaapt de Vorstreus. Pas op: het ijs is glad!',
  ambientSound: 0.35,
  ambience(dt, info) {
    const p = player;
    if (info.meltT !== undefined && info.meltI < info.gate.length) {
      info.meltT -= dt;
      while (info.meltT <= 0 && info.meltI < info.gate.length) {
        const [x, y, z] = info.gate[info.meltI++];
        info.meltT += 0.06;
        if (info.world.get(x, y, z) === B.BLUE_ICE) {
          info.world.set(x, y, z, B.AIR);
          FX.blockBreak(x, y, z, B.BLUE_ICE);
          if (info.meltI % 3 === 0) SND.play('shatter', { at: { x, y, z }, range: 40, vol: 0.6 });
        }
      }
    }
    const boss = game.boss;
    const storm = boss && boss.blizzard > 0 && boss.alive() ? 1 : 0;
    // sneeuwvlokken (meer tijdens de storm)
    game.ashT += dt * (storm ? 70 : 18);
    while (game.ashT > 1) {
      game.ashT -= 1;
      const x = p.pos.x + (Math.random() - 0.5) * 26, y = p.pos.y + 2 + Math.random() * 10, z = p.pos.z + (Math.random() - 0.5) * 26;
      FX.debris.spawn(x, y, z, (Math.random() - 0.5) * 0.6 + storm * 5, -1.2 - Math.random() - storm * 2, (Math.random() - 0.5) * 0.6 + storm * 2, 0.96, 0.98, 1, 5, 0, 0);
    }
    // dichte mist en wind tijdens de sneeuwstorm
    if (game.fogNormal) {
      if (!info.fogBase) info.fogBase = { near: game.fogNormal.near, far: game.fogNormal.far };
      const tNear = storm ? 2 : info.fogBase.near, tFar = storm ? 20 : info.fogBase.far;
      const k = Math.min(1, dt * 2);
      game.fogNormal.near += (tNear - game.fogNormal.near) * k;
      game.fogNormal.far += (tFar - game.fogNormal.far) * k;
    }
    if (storm && !p.dead && game.state === 'playing') {
      p.kbx += 2.6 * dt; p.kbz += 1.0 * dt;
      if (Math.random() < dt * 0.6) SND.play('wind', { vol: 0.5 });
    }
  },
});
