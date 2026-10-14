'use strict';
/* Portaaljacht – natuurkunde voor wezens en de vriendelijke dieren */

const GRAVITY = 28;
const EPS = 0.001;

// Overlapt een doos met een vast blok?
function boxSolid(world, x0, y0, z0, x1, y1, z1) {
  const ix1 = Math.ceil(x1) - 1, iy1 = Math.ceil(y1) - 1, iz1 = Math.ceil(z1) - 1;
  for (let y = Math.floor(y0); y <= iy1; y++) {
    for (let z = Math.floor(z0); z <= iz1; z++) {
      for (let x = Math.floor(x0); x <= ix1; x++) {
        if (world.solidAt(x, y, z)) return true;
      }
    }
  }
  return false;
}

function entityOverlaps(world, e) {
  return boxSolid(world, e.pos.x - e.hw, e.pos.y, e.pos.z - e.hw, e.pos.x + e.hw, e.pos.y + e.h, e.pos.z + e.hw);
}

// Beweeg langs één as in kleine stapjes en stop tegen blokken.
function moveAxis(world, e, axis, delta) {
  if (delta === 0) return false;
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / 0.4));
  const d = delta / steps;
  const p = e.pos;
  for (let i = 0; i < steps; i++) {
    p[axis] += d;
    if (entityOverlaps(world, e)) {
      if (axis === 'y') p.y = d > 0 ? Math.floor(p.y + e.h) - e.h - EPS : Math.floor(p.y) + 1 + EPS;
      else if (d > 0) p[axis] = Math.floor(p[axis] + e.hw) - e.hw - EPS;
      else p[axis] = Math.floor(p[axis] - e.hw) + 1 + e.hw + EPS;
      return true;
    }
  }
  return false;
}

function physicsStep(world, e, dt) {
  e.hitWall = false;
  e.onGround = false;
  if (moveAxis(world, e, 'y', e.vel.y * dt)) {
    if (e.vel.y < 0) e.onGround = true;
    e.vel.y = 0;
  }
  if (moveAxis(world, e, 'x', e.vel.x * dt)) { e.hitWall = true; e.vel.x = 0; }
  if (moveAxis(world, e, 'z', e.vel.z * dt)) { e.hitWall = true; e.vel.z = 0; }
}

// Kan een wezen hier een blokje op springen? (vrije ruimte 1 blok hoger)
function canStepUp(world, e, dirX, dirZ) {
  const x = e.pos.x + dirX * 0.35, z = e.pos.z + dirZ * 0.35;
  return !boxSolid(world, x - e.hw, e.pos.y + 1.05, z - e.hw, x + e.hw, e.pos.y + 1.05 + e.h, z + e.hw);
}

/* ---------- Dieren ---------- */

function mobTex(w, h, base, vari, extra) {
  const R = mulberry32(w * 31 + h * 7 + base[0] * 3 + base[1]);
  return pixelTexture(w, h, (x, y) => {
    const e = extra ? extra(x, y, R) : null;
    if (e) return e;
    const k = (R() - 0.5) * 2 * vari;
    return [base[0] + k, base[1] + k, base[2] + k];
  });
}

const MOB_TEX = {};
function buildMobTextures() {
  MOB_TEX.pig = mobTex(8, 8, [240, 162, 162], 9);
  MOB_TEX.pigFace = mobTex(8, 8, [240, 162, 162], 7, (x, y) => {
    if (y === 3 && (x === 1 || x === 6)) return [250, 250, 250];
    if (y === 3 && (x === 2 || x === 5)) return [24, 20, 20];
    return null;
  });
  MOB_TEX.snout = mobTex(6, 4, [226, 128, 138], 5, (x, y) => ((x === 1 || x === 4) && (y === 1 || y === 2) ? [120, 56, 66] : null));
  MOB_TEX.wool = mobTex(8, 8, [236, 236, 236], 10, (x, y, R) => (R() < 0.18 ? [212, 212, 212] : null));
  MOB_TEX.sheepFace = mobTex(8, 8, [214, 188, 168], 7, (x, y) => {
    if (y < 2) return [236, 236, 236];
    if (y === 3 && (x === 1 || x === 6)) return [250, 250, 250];
    if (y === 3 && (x === 2 || x === 5)) return [24, 20, 20];
    if (y === 6 && x >= 3 && x <= 4) return [200, 150, 150];
    return null;
  });
  MOB_TEX.sheepSkin = mobTex(4, 8, [214, 188, 168], 7);
  MOB_TEX.cow = mobTex(8, 8, [92, 62, 40], 8, (x, y, R) => {
    const n = Math.sin(x * 1.7 + y * 0.9) + Math.cos(y * 1.3 - x * 0.6);
    return n > 0.9 + R() * 0.2 ? [236, 236, 236] : null;
  });
  MOB_TEX.cowFace = mobTex(8, 8, [92, 62, 40], 6, (x, y) => {
    if (y >= 5 && x >= 1 && x <= 6) return y === 6 && (x === 2 || x === 5) ? [60, 40, 40] : [196, 168, 150];
    if (y === 3 && (x === 1 || x === 6)) return [250, 250, 250];
    if (y === 3 && (x === 2 || x === 5)) return [16, 14, 14];
    if (x >= 3 && x <= 4 && y <= 4) return [236, 236, 236];
    return null;
  });
  MOB_TEX.horn = mobTex(2, 2, [226, 222, 206], 6);
}

const ANIMALS = {
  pig: { hw: 0.42, h: 0.9, sound: 'oink', leg: [0.25, 0.375, 0.25], legPos: [0.19, 0.31], body: [0.625, 0.5, 1.0], bodyY: 0.625,
    head: [0.5, 0.5, 0.5], headPos: [0, 0.78, 0.62], skin: 'pig', face: 'pigFace', legSkin: 'pig' },
  sheep: { hw: 0.42, h: 1.25, sound: 'baa', leg: [0.24, 0.5, 0.24], legPos: [0.19, 0.31], body: [0.72, 0.62, 1.05], bodyY: 0.81,
    head: [0.4, 0.45, 0.45], headPos: [0, 1.05, 0.62], skin: 'wool', face: 'sheepFace', legSkin: 'sheepSkin' },
  cow: { hw: 0.44, h: 1.35, sound: 'moo', leg: [0.25, 0.6, 0.25], legPos: [0.22, 0.35], body: [0.75, 0.62, 1.1], bodyY: 0.91,
    head: [0.5, 0.5, 0.38], headPos: [0, 1.16, 0.72], skin: 'cow', face: 'cowFace', legSkin: 'cow' },
};

// Doos met een gezicht aan de voorkant (+z) in maar 2 tekenbeurten (een gewone doos met 6 materialen kost er 6)
function faceBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const idx = Array.from(g.index.array);
  g.setIndex(idx.slice(0, 24).concat(idx.slice(30, 36), idx.slice(24, 30)));
  g.clearGroups(); g.addGroup(0, 30, 0); g.addGroup(30, 6, 1);
  return g;
}

function buildAnimalModel(type) {
  const spec = ANIMALS[type];
  const mats = [];
  const mat = (tex) => { const m = new THREE.MeshLambertMaterial({ map: tex }); mats.push(m); return m; };
  const skin = mat(MOB_TEX[spec.skin]);
  const face = mat(MOB_TEX[spec.face]);
  const legSkin = mat(MOB_TEX[spec.legSkin]);
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(spec.body[0], spec.body[1], spec.body[2]), skin);
  body.position.y = spec.bodyY;
  group.add(body);

  const head = new THREE.Group();
  head.position.set(spec.headPos[0], spec.headPos[1], spec.headPos[2]);
  const headMesh = new THREE.Mesh(faceBox(spec.head[0], spec.head[1], spec.head[2]), [skin, face]);
  head.add(headMesh);
  if (type === 'pig') {
    const sn = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.19, 0.07), mat(MOB_TEX.snout));
    sn.position.set(0, -0.08, spec.head[2] / 2 + 0.03);
    head.add(sn);
  }
  if (type === 'cow') {
    const hm = mat(MOB_TEX.horn);
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), hm);
      horn.position.set(sx * 0.29, 0.26, 0);
      head.add(horn);
    }
  }
  group.add(head);

  const legs = [];
  const lh = spec.leg[1];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * spec.legPos[0], lh, sz * spec.legPos[1]);
    const g = new THREE.BoxGeometry(spec.leg[0], lh, spec.leg[2]);
    g.translate(0, -lh / 2, 0);
    pivot.add(new THREE.Mesh(g, legSkin));
    group.add(pivot);
    legs.push(pivot);
  }
  return { group, head, legs, mats };
}

class Animal {
  constructor(type, x, y, z, world) {
    const spec = ANIMALS[type];
    this.type = type;
    this.world = world;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.hw = spec.hw; this.h = spec.h;
    this.yaw = Math.random() * Math.PI * 2;
    this.drawYaw = this.yaw;
    this.state = 'idle';
    this.timer = 1 + Math.random() * 3;
    this.panic = 0; this.flash = 0; this.stuck = 0;
    this.walkPhase = Math.random() * 6;
    this.soundTimer = 6 + Math.random() * 16;
    this.onGround = false; this.hitWall = false;
    this.model = buildAnimalModel(type);
    this.mesh = this.model.group;
    this.kind = 'animal';
  }

  update(dt) {
    this.timer -= dt;
    if (this.panic > 0) this.panic -= dt;
    if (this.timer <= 0) {
      if (this.panic > 0) { this.state = 'walk'; this.yaw = Math.random() * Math.PI * 2; this.timer = 0.6 + Math.random() * 0.7; }
      else if (this.state === 'idle') { this.state = 'walk'; this.yaw += (Math.random() - 0.5) * 2.6; this.timer = 2 + Math.random() * 4; }
      else { this.state = 'idle'; this.timer = 2 + Math.random() * 5; }
    }
    const speed = this.state === 'walk' ? (this.panic > 0 ? 3.4 : 1.1) : 0;
    let fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    if (speed > 0 && this.onGround) {
      const ax = Math.floor(this.pos.x + fx * 0.9), az = Math.floor(this.pos.z + fz * 0.9), ay = Math.floor(this.pos.y + 0.1);
      const ahead = this.world.get(ax, ay, az);
      const below = this.world.get(ax, ay - 1, az), below2 = this.world.get(ax, ay - 2, az);
      if (ahead === B.WATER || ahead === B.LAVA || below === B.WATER || (!SOLID[ahead] && !SOLID[below] && !SOLID[below2])) {
        this.yaw += Math.PI * (0.6 + Math.random() * 0.8);
        fx = Math.sin(this.yaw); fz = Math.cos(this.yaw);
      }
    }
    const k = 1 - Math.exp(-dt * (this.onGround ? 10 : 1.5));
    this.vel.x += (fx * speed - this.vel.x) * k;
    this.vel.z += (fz * speed - this.vel.z) * k;
    this.vel.y -= GRAVITY * dt;
    const feet = this.world.get(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.45), Math.floor(this.pos.z));
    if (feet === B.WATER) this.vel.y = Math.min(this.vel.y + 40 * dt, 2.2);
    physicsStep(this.world, this, dt);
    if (this.hitWall && speed > 0) {
      if (this.onGround && canStepUp(this.world, this, fx, fz)) this.vel.y = 7.6;
      this.stuck += dt;
      if (this.stuck > 0.8) { this.yaw += Math.PI * 0.5 + Math.random(); this.stuck = 0; }
    } else this.stuck = 0;

    // animatie
    const moving = Math.hypot(this.vel.x, this.vel.z);
    this.walkPhase += dt * moving * 5;
    const sw = Math.sin(this.walkPhase) * Math.min(1, moving) * 0.7;
    const L = this.model.legs;
    L[0].rotation.x = sw; L[3].rotation.x = sw;
    L[1].rotation.x = -sw; L[2].rotation.x = -sw;
    this.drawYaw += angleDiff(this.drawYaw, this.yaw) * Math.min(1, dt * 8);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.drawYaw;
    if (this.state === 'idle' && this.type === 'sheep') this.model.head.rotation.x = Math.max(0, Math.sin(this.timer * 1.3)) * 0.6;
    else this.model.head.rotation.x *= 0.9;

    if (this.flash > 0) {
      this.flash -= dt;
      const on = this.flash > 0;
      for (const m of this.model.mats) m.emissive.setRGB(on ? 0.55 : 0, 0, 0);
    }

    this.soundTimer -= dt;
    if (this.soundTimer <= 0) {
      this.soundTimer = 8 + Math.random() * 18;
      SND.play(ANIMALS[this.type].sound, { at: this.pos, range: 18, vol: 0.8 });
    }
  }

  hurt(from) {
    const dx = this.pos.x - from.x, dz = this.pos.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    this.vel.x = dx / d * 6; this.vel.z = dz / d * 6; this.vel.y = 5.5;
    this.panic = 4; this.timer = 0; this.flash = 0.3;
    for (const m of this.model.mats) m.emissive.setRGB(0.55, 0, 0);
    SND.play(ANIMALS[this.type].sound, { at: this.pos, range: 20 });
    SND.play('hit', { vol: 0.6 });
    FX.hit(this.pos.x, this.pos.y + this.h * 0.6, this.pos.z, 0.8, 0.1, 0.1);
  }

  aabb() {
    return [this.pos.x - this.hw, this.pos.y, this.pos.z - this.hw, this.pos.x + this.hw, this.pos.y + this.h, this.pos.z + this.hw];
  }
}
