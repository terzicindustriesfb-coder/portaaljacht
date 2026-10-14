'use strict';
/* Portaaljacht – wereld 1: de Nether met De Lavareus (mokerslag, vuurballen, sprong) */

const LAVA_TEX = {};

function buildLavaTextures() {
  const R = mulberry32(666);
  const cells = [];
  for (let i = 0; i < 8; i++) cells.push([R() * 16, R() * 16]);
  const crack = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) crack[y * 16 + x] = voronoi(cells, x, y, 16).edge < 0.9 ? 1 : 0;
  const base = (x, y) => {
    if (crack[y * 16 + x]) return R() < 0.5 ? [255, 150, 40] : [250, 100, 20];
    const r = R();
    return r < 0.3 ? [38, 24, 24] : r < 0.6 ? [58, 34, 30] : [48, 28, 26];
  };
  const glow = (x, y) => (crack[y * 16 + x] ? [255, 120, 20] : [0, 0, 0]);
  LAVA_TEX.body = pixelTexture(16, 16, base);
  LAVA_TEX.bodyGlow = pixelTexture(16, 16, glow);
  const eye = (x, y) => ((x >= 3 && x <= 5) || (x >= 10 && x <= 12)) && (y === 6 || y === 7);
  const mouth = (x, y) => (y === 11 && x >= 4 && x <= 11) || (y === 12 && x >= 5 && x <= 10 && x % 2 === 1);
  LAVA_TEX.face = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return [255, 246, 150];
    if (mouth(x, y)) return [255, 140, 30];
    if (y === 5 && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13))) return [20, 10, 10];
    return base(x, y);
  });
  LAVA_TEX.faceGlow = pixelTexture(16, 16, (x, y) => {
    if (eye(x, y)) return [255, 240, 140];
    if (mouth(x, y)) return [255, 120, 20];
    return glow(x, y);
  });
  LAVA_TEX.horn = pixelTexture(4, 4, () => { const k = R() * 20; return [30 + k, 26 + k, 30 + k]; });
}

class LavaBoss extends BossBase {
  constructor(world, info) {
    super(world, info, { name: 'De Lavareus', ref: 'de Lavareus', hp: 150, hw: 1.25, h: 4.5, deathTiles: [T.NETHERRACK, T.MAGMA] });
    this.anim = { armX: 0.2, armZ: 0, legL: 0, legR: 0, lean: 0.3, head: 0.4, crouch: 0 };
  }

  buildModel() {
    if (!LAVA_TEX.body) buildLavaTextures();
    const body = new THREE.MeshLambertMaterial({ map: LAVA_TEX.body, emissive: 0xffffff, emissiveMap: LAVA_TEX.bodyGlow, emissiveIntensity: 0.9 });
    const face = new THREE.MeshLambertMaterial({ map: LAVA_TEX.face, emissive: 0xffffff, emissiveMap: LAVA_TEX.faceGlow, emissiveIntensity: 1 });
    const horn = new THREE.MeshLambertMaterial({ map: LAVA_TEX.horn });
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const legs = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 0.62, 1.6, 0);
      p.add(bossBox(0.9, 1.6, 0.9, body, -0.8));
      inner.add(p);
      legs.push(p);
    }
    const torso = new THREE.Group();
    torso.position.y = 1.6;
    inner.add(torso);
    torso.add(bossBox(2.4, 1.85, 1.4, body, 0.92));
    const arms = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group();
      p.position.set(sx * 1.62, 1.6, 0);
      p.add(bossBox(0.82, 2.3, 0.82, body, -1.0));
      p.add(bossBox(0.95, 0.6, 0.95, body, -2.2));
      torso.add(p);
      arms.push(p);
    }
    const head = new THREE.Group();
    head.position.set(0, 1.85, 0.15);
    torso.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.2, 1.2).translate(0, 0.6, 0), [body, body, body, body, face, body]));
    for (const sx of [-1, 1]) {
      const h1 = bossBox(0.25, 0.5, 0.25, horn, 0.25);
      h1.position.set(sx * 0.55, 1.15, 0);
      h1.rotation.z = -sx * 0.35;
      head.add(h1);
    }
    return { group, inner, legs, torso, arms, head, mats: [body, face, horn], body, face };
  }

  onEnrage() { this.model.body.emissiveIntensity = 1.6; }
  onReflectHit() { this.setState('stagger'); }
  enragedFx() {
    FX.flame(this.pos.x + (Math.random() - 0.5) * 2.4, this.pos.y + 1.5 + Math.random() * 3, this.pos.z + (Math.random() - 0.5) * 2.4, 0.4);
  }

  think(dt, c) {
    const ph2 = this.enraged;
    let speed = 0;
    switch (this.state) {
      case 'chase':
        this.turnTo(c.targetYaw, dt, ph2 ? 4.5 : 3.2);
        if (c.dist > 3.3) speed = ph2 ? 3.1 : 2.3;
        this.attackCD -= dt;
        // staat de speler hoog (op een toren)? dan vuurballen
        if (this.attackCD <= 0 && !c.p.dead) {
          const high = c.p.pos.y > this.pos.y + 2;
          if (c.dist < 4.4 && !high) this.setState('smashWind');
          else if (c.dist > 9 && !high && Math.random() < 0.45) this.setState('leapWind');
          else this.setState('fireWind');
        }
        break;
      case 'smashWind':
        this.turnTo(c.targetYaw, dt, 2.2);
        if (this.t > (ph2 ? 0.55 : 0.8)) this.setState('smash');
        break;
      case 'smash':
        if (!this.didHit && this.t > 0.1) {
          this.didHit = true;
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          this.shockwave(this.pos.x + fx * 1.9, this.pos.y, this.pos.z + fz * 1.9, 3.9, ph2 ? 7 : 6);
        }
        if (this.t > 0.3) this.setState('recover', ph2 ? 0.55 : 0.9);
        break;
      case 'fireWind':
        this.turnTo(c.targetYaw, dt, 4);
        if (this.t > (ph2 ? 0.5 : 0.7)) {
          this.shootFireballs(ph2 ? 3 : 1);
          this.setState('recover', ph2 ? 0.4 : 0.6);
        }
        break;
      case 'leapWind':
        this.turnTo(c.targetYaw, dt, 3);
        if (this.t > 0.6) {
          let vx = c.dx, vz = c.dz;
          const hs = Math.hypot(vx, vz);
          if (hs > 14) { vx *= 14 / hs; vz *= 14 / hs; }
          this.vel.set(vx, 14, vz);
          this.noSteer = true;
          this.setState('leap');
          SND.play('whoosh', { at: this.pos });
        }
        break;
      case 'leap':
        if (this.t > 0.15 && this.onGround) {
          this.vel.x = 0; this.vel.z = 0;
          this.noSteer = false;
          this.shockwave(this.pos.x, this.pos.y, this.pos.z, 4.7, ph2 ? 6 : 5);
          this.setState('recover', 1.0);
        }
        break;
      case 'recover':
        if (this.t > this.recoverTime) {
          this.setState('chase');
          this.attackCD = ph2 ? 1.2 + Math.random() * 0.8 : 2.0 + Math.random() * 1.2;
        }
        break;
      case 'stagger':
        if (this.t > 1.6) { this.setState('chase'); this.attackCD = 0.9; }
        break;
      default:
        this.setState('chase');
        break;
    }
    return speed;
  }

  onGoHome() { this.noSteer = false; }

  shootFireballs(n) {
    const p = player;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const origin = new THREE.Vector3(this.pos.x + fx * 1.0, this.pos.y + 4.0, this.pos.z + fz * 1.0);
    const base = new THREE.Vector3(p.pos.x, p.pos.y + 1.2, p.pos.z).sub(origin).normalize();
    const speed = this.enraged ? 11.5 : 10;
    for (let i = 0; i < n; i++) {
      const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (n - 1) / 2) * 0.28);
      game.addProjectile(makeFireball(origin.clone().addScaledVector(dir, 0.5), dir, speed, this.dmg(5)));
    }
    SND.play('shoot', { at: origin, range: 40 });
  }

  animate(dt, speed) {
    const a = this.anim;
    this.walkPhase += dt * speed * 2.0;
    const sw = Math.sin(this.walkPhase) * Math.min(1, speed / 2) * 0.55;
    let armX = -sw * 0.7, armZ = 0.12, legL = sw, legR = -sw, lean = 0.05, head = 0, crouch = 0, rate = 10;
    const ph2 = this.enraged;
    switch (this.state) {
      case 'sleep': case 'idle':
        armX = 0.25; armZ = 0.05; lean = 0.35; head = 0.45; legL = 0; legR = 0;
        if (this.state === 'sleep') head += Math.sin(game.time * 1.5) * 0.05;
        break;
      case 'roar': armX = -0.6; armZ = 0.9; lean = -0.15; head = -0.5; rate = 6; break;
      case 'smashWind': {
        const k = clamp(this.t / (ph2 ? 0.55 : 0.8), 0, 1);
        armX = -2.9 * easeOut(k); armZ = 0.2; lean = -0.2 * k; head = -0.2; rate = 14;
        break;
      }
      case 'smash': armX = 0.7; armZ = 0.1; lean = 0.35; head = 0.2; rate = 40; break;
      case 'fireWind': armX = -0.4; armZ = 0.5; lean = -0.12; head = -0.45 + Math.sin(this.t * 40) * 0.05; rate = 10; break;
      case 'leapWind': armX = 0.9; armZ = 0.3; lean = 0.4; crouch = 0.45; legL = 0.3; legR = 0.3; rate = 10; break;
      case 'leap': armX = -2.4; armZ = 0.4; lean = -0.1; legL = -0.3; legR = 0.3; rate = 12; break;
      case 'recover': armX = 0.35; armZ = 0.15; lean = 0.25; head = 0.25; rate = 6; break;
      case 'stagger':
        armX = 0.5 + Math.sin(this.t * 8) * 0.2; armZ = 0.5; lean = 0.45; head = 0.5 + Math.sin(this.t * 6) * 0.25; legL = 0.2; legR = -0.2; rate = 8;
        break;
      default: break;
    }
    const k = 1 - Math.exp(-dt * rate);
    a.armX += (armX - a.armX) * k;
    a.armZ += (armZ - a.armZ) * k;
    a.legL += (legL - a.legL) * Math.min(1, k * 1.5);
    a.legR += (legR - a.legR) * Math.min(1, k * 1.5);
    a.lean += (lean - a.lean) * k;
    a.head += (head - a.head) * k;
    a.crouch += (crouch - a.crouch) * k;
    const m = this.model;
    m.arms[0].rotation.x = a.armX; m.arms[1].rotation.x = a.armX;
    m.arms[0].rotation.z = -a.armZ; m.arms[1].rotation.z = a.armZ;
    m.legs[0].rotation.x = a.legL; m.legs[1].rotation.x = a.legR;
    m.torso.rotation.x = a.lean;
    m.head.rotation.x = a.head;
    m.inner.position.y = -a.crouch;
    m.face.emissiveIntensity = this.state === 'fireWind' ? 2.2 : 1;
  }
}

registerRealm('nether', {
  gen: genNether,
  makeBoss: (world, info) => new LavaBoss(world, info),
  atmosphere: { background: 0x250604, fog: 0x3c0d07, near: 14, far: 58, amb: 0xffc8b0, ambI: 0.8, dir: 0xff9a60, dirI: 0.45, hand: 0xffd2c0 },
  intro: 'Daar slaapt de Lavareus... loop dichterbij als je durft!',
  tip: 'Tip: sla zijn vuurballen met je zwaard terug.',
  ambience(dt, info) {
    const p = player;
    game.ashT += dt * 14;
    while (game.ashT > 1) { game.ashT -= 1; FX.ash(p.pos.x, p.pos.y + 3, p.pos.z); }
    game.popT -= dt;
    if (game.popT <= 0) {
      game.popT = 0.6 + Math.random() * 2.2;
      const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 8;
      const x = info.arenaCenter.x + Math.cos(a) * r, z = info.arenaCenter.z + Math.sin(a) * r;
      for (let i = 0; i < 6; i++) FX.flame(x, 7.9, z, 0.5);
      SND.play('lavapop', { vol: 0.5 });
    }
  },
  ambientSound: 1,
});
