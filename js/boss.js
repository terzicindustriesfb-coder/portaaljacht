'use strict';
/* Portaaljacht – gedeelde basis voor alle schurken, plus projectielen (vuurballen, pijlen...) en grondaanvallen */

// Doos-mesh met verschoven middelpunt (voor ledematen die vanaf een scharnier hangen)
function bossBox(w, h, d, mat, oy, ox, oz) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (oy || ox || oz) g.translate(ox || 0, oy || 0, oz || 0);
  return new THREE.Mesh(g, mat);
}

/*
 * BossBase – alles wat elke schurk deelt. Een schurk-klasse erft hiervan en levert:
 *   buildModel()            -> { group, mats: [...materialen die rood flitsen], ... }
 *   think(dt, c)            -> gewenste loopsnelheid; c = { dx, dz, dist, targetYaw, p }
 *                              (alleen aangeroepen als de schurk wakker is en niet brult)
 *   animate(dt, speed)      -> pose bijwerken
 *   onEnrage()              (optioneel) bij 50% leven
 *   onWake() / onGoHome()   (optioneel)
 * Vliegende schurken zetten this.flying = true en regelen zelf hun beweging in think().
 */
class BossBase {
  constructor(world, info, opts) {
    this.world = world;
    this.info = info;
    this.name = opts.name;                    // 'De Lavareus' (begin van een zin, balk)
    this.ref = opts.ref || opts.name;         // 'de Lavareus' (midden in een zin)
    const s = info.bossSpawn;
    this.pos = new THREE.Vector3(s.x, s.y, s.z);
    this.home = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.hw = opts.hw; this.h = opts.h;
    this.yaw = opts.yaw || 0;
    const sc = roundScale();
    this.maxHp = Math.round(opts.hp * sc);
    this.hp = this.maxHp;
    this.dmgScale = sc;
    this.wakeRange = opts.wakeRange || 12.5;
    this.state = 'sleep'; this.t = 0;
    this.attackCD = 2.5; this.recoverTime = 1;
    this.enraged = false; this.flash = 0; this.iframe = 0;
    this.didHit = false; this.breakCD = 0; this.walkPhase = 0;
    this.onGround = false; this.hitWall = false;
    this.flying = false;
    this.burn = 0; this.burnTick = 0;
    this.deathTiles = opts.deathTiles || [T.NETHERRACK, T.MAGMA];
    this.kind = 'boss';
    this.model = this.buildModel();
    this.mesh = this.model.group;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
  }

  buildModel() { return { group: new THREE.Group(), mats: [] }; }
  think() { return 0; }
  animate() {}

  aabb() {
    return [this.pos.x - this.hw, this.pos.y, this.pos.z - this.hw, this.pos.x + this.hw, this.pos.y + this.h, this.pos.z + this.hw];
  }
  center() { return new THREE.Vector3(this.pos.x, this.pos.y + this.h * 0.55, this.pos.z); }
  alive() { return this.state !== 'dying' && this.state !== 'dead'; }
  awake() { return this.alive() && this.state !== 'sleep' && this.state !== 'idle'; }
  dmg(n) { return n * this.dmgScale; }

  setState(s, recover) {
    this.state = s; this.t = 0; this.didHit = false;
    if (recover !== undefined) this.recoverTime = recover;
  }

  wake(quiet) {
    this.setState('roar');
    if (this.onWake) this.onWake(quiet);
    if (!quiet) {
      SND.play('roar');
      game.shake = Math.max(game.shake, 0.5);
      HUD.title(this.name.toUpperCase(), 'is ontwaakt!', 2.6);
    }
    HUD.bossbar(true, this.hp / this.maxHp, this.enraged, this.name);
    SND.setMusic('boss', PROG.level);
  }

  // Na het respawnen van de speler gaat de schurk terug naar zijn plek
  goHome() {
    if (!this.alive()) return;
    this.pos.copy(this.home);
    this.vel.set(0, 0, 0);
    this.burn = 0;
    this.setState('idle');
    if (this.onGoHome) this.onGoHome();
  }

  turnTo(target, dt, rate) {
    this.yaw += clamp(angleDiff(this.yaw, target), -rate * dt, rate * dt);
  }

  update(dt) {
    this.t += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.iframe > 0) this.iframe -= dt;
    if (this.state === 'dead') return;
    if (this.state === 'dying') { this.updateDying(dt); return; }

    // brandt nog door het vuurzwaard?
    if (this.burn > 0) {
      this.burn -= dt; this.burnTick -= dt;
      const c = this.center();
      if (Math.random() < dt * 25) FX.flame(c.x + (Math.random() - 0.5) * this.hw * 2, c.y + (Math.random() - 0.5) * this.h * 0.8, c.z + (Math.random() - 0.5) * this.hw * 2, 0.4);
      if (this.burnTick <= 0) { this.burnTick = 0.5; this.hurt(1.5, 'burn'); if (!this.alive()) return; }
    }

    const p = player;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const targetYaw = Math.atan2(dx, dz);
    let speed = 0;
    if (this.state === 'sleep') {
      if (dist < this.wakeRange && !p.dead) this.wake();
    } else if (this.state === 'idle') {
      if (dist < this.wakeRange - 1.5 && !p.dead) this.wake(true);
    } else if (this.state === 'roar') {
      this.turnTo(targetYaw, dt, 2.5);
      if (this.t > 1.5) { this.setState('chase'); this.attackCD = 1.2; }
    } else {
      speed = this.think(dt, { dx, dz, dist, targetYaw, p }) || 0;
      if (p.dead) speed = 0;
    }
    if (!this.flying) this.groundMove(dt, speed);
    if (this.awake() && this.enraged && this.enragedFx && Math.random() < dt * 20) this.enragedFx();
    this.animate(dt, this.flying ? speed : Math.hypot(this.vel.x, this.vel.z));
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    if (this.state !== 'dying') this.applyTint();
  }

  // Lopen in de kijkrichting, met zwaartekracht. Loopt hij vast, dan slaat hij de blokken weg.
  groundMove(dt, speed) {
    if (!this.noSteer) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const k = 1 - Math.exp(-dt * 8);
      this.vel.x += (fx * speed - this.vel.x) * k;
      this.vel.z += (fz * speed - this.vel.z) * k;
    }
    this.vel.y -= GRAVITY * dt;
    physicsStep(this.world, this, dt);
    if (this.hitWall && speed > 0) {
      this.breakCD -= dt;
      if (this.breakCD <= 0) { this.smashObstacles(); this.breakCD = 0.35; }
    }
    if (this.pos.y < this.info.floorY - 4) this.rescue();
  }

  // Van de arena gevallen: terug naar huis
  rescue() {
    FX.explosion(this.pos.x, this.pos.y + 2, this.pos.z, 1);
    this.pos.copy(this.home);
    this.vel.set(0, 0, 0);
  }

  // Alleen blokken binnen de arena; de arenamuur, kisten en portalen blijven heel
  smashObstacles() {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const ac = this.info.arenaCenter, ar = this.info.arenaRadius;
    let broke = false;
    for (let y = Math.floor(this.pos.y + 0.05); y <= Math.floor(this.pos.y + this.h); y++) {
      for (let off = -1.2; off <= 1.2; off += 0.6) {
        const x = Math.floor(this.pos.x + fx * (this.hw + 0.5) + rx * off);
        const z = Math.floor(this.pos.z + fz * (this.hw + 0.5) + rz * off);
        if (ac && Math.hypot(x + 0.5 - ac.x, z + 0.5 - ac.z) > ar - 0.8) continue;
        const id = this.world.get(x, y, z);
        if (!SOLID[id] || BLOCKS[id].hard === Infinity) continue;
        this.world.set(x, y, z, B.AIR);
        FX.blockBreak(x, y, z, id);
        broke = true;
      }
    }
    if (broke) { SND.play('break', { at: this.pos }); game.shake = Math.max(game.shake, 0.25); }
  }

  // Schokgolf over de grond (stamp of landing)
  shockwave(x, y, z, radius, dmg, color) {
    FX.ring(x, y, z, radius, color);
    FX.ring(x, y, z, radius * 0.5, color);
    SND.play('slam', { at: { x, y, z }, range: 40 });
    game.shake = Math.max(game.shake, 0.7);
    const p = player;
    const d = Math.hypot(p.pos.x - x, p.pos.z - z);
    if (d < radius && p.pos.y < y + 2.2 && !p.dead) damagePlayer(this.dmg(dmg), { x, y, z }, 'boss', 9, 6.5);
  }

  hurt(amount, kind) {
    if (!this.alive()) return false;
    if (this.iframe > 0 && kind !== 'fireball' && kind !== 'burn' && kind !== 'arrow') return false;
    if (this.state === 'sleep' || this.state === 'idle') this.wake(this.state === 'idle');
    this.hp = Math.max(0, this.hp - amount);
    if (kind !== 'burn') {
      this.iframe = 0.22; this.flash = 0.22;
      SND.play('bossHurt');
      const c = this.center();
      FX.hit(c.x, c.y, c.z, 1, 0.45, 0.1);
    } else this.flash = Math.max(this.flash, 0.08);
    if (kind === 'fireball' && this.onReflectHit) this.onReflectHit();
    if (!this.enraged && this.hp <= this.maxHp / 2 && this.hp > 0) {
      this.enraged = true;
      if (this.onEnrage) this.onEnrage();
      SND.play('roar', { vol: 1 });
      game.shake = Math.max(game.shake, 0.6);
      HUD.title('', this.name + ' wordt woedend!', 2.4);
    }
    HUD.bossbar(true, this.hp / this.maxHp, this.enraged, this.name);
    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    this.setState('dying');
    this.vel.set(0, 0, 0);
    this.burn = 0;
    SND.play('roar', { vol: 1 });
    SND.setMusic('none');
    game.clearBossAttacks();
    game.onBossDying(this);
  }

  updateDying(dt) {
    const c = this.center();
    if (this.model.inner) {
      this.model.inner.position.set((Math.random() - 0.5) * 0.3, -this.t * 0.25, (Math.random() - 0.5) * 0.3);
      this.model.inner.rotation.x = this.t * 0.15;
    } else {
      this.mesh.position.set(this.pos.x + (Math.random() - 0.5) * 0.3, this.pos.y - this.t * 0.25, this.pos.z + (Math.random() - 0.5) * 0.3);
    }
    if (Math.random() < dt * 40) FX.flame(c.x + (Math.random() - 0.5) * 3, c.y + (Math.random() - 0.5) * 4, c.z + (Math.random() - 0.5) * 3, 0.6);
    if (Math.random() < dt * 25) FX.smoke(c.x + (Math.random() - 0.5) * 2, c.y + 2, c.z + (Math.random() - 0.5) * 2);
    if (Math.random() < dt * 5) { SND.play('explode', { vol: 0.4 }); FX.explosion(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 2, 0.5); }
    this.flash = Math.sin(this.t * 30) > 0 ? 0.1 : 0;
    this.applyTint();
    if (this.t > 2.6) {
      FX.explosion(c.x, c.y, c.z, 3);
      for (let i = 0; i < 60; i++) {
        const col = sampleTileColor(this.deathTiles[i % this.deathTiles.length]);
        FX.debris.spawn(c.x + (Math.random() - 0.5) * 2, c.y + (Math.random() - 0.5) * 3, c.z + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 12, col[0], col[1], col[2], 1.5 + Math.random(), 18, 0.5, true);
      }
      FX.xpOrbs(c.x, c.y, c.z);
      SND.play('explode', { vol: 1 });
      game.shake = 1.2;
      this.mesh.visible = false;
      this.state = 'dead';
      game.onBossDefeated(this);
    }
  }

  applyTint() {
    const on = this.flash > 0;
    for (const m of this.model.mats) {
      if (on) m.color.setRGB(1, 0.35, 0.35);
      else if (m.userBase) m.color.copy(m.userBase);
      else m.color.setRGB(1, 1, 1);
    }
  }
}

/* ---------- Projectielen ---------- */
const PROJ_CACHE = {};
function cachedBoxMesh(key, size, makeMat) {
  if (!PROJ_CACHE[key]) PROJ_CACHE[key] = { geo: new THREE.BoxGeometry(size, size, size), mat: makeMat() };
  return new THREE.Mesh(PROJ_CACHE[key].geo, PROJ_CACHE[key].mat);
}

/*
 * Projectile – opties:
 *   pos, vel (Vector3), owner 'boss' | 'player', type (tekst, ook gebruikt als doodsoorzaak), dmg, life, radius,
 *   reflectable (sla terug met het zwaard), destroyable (stukslaan met het zwaard), homing (bijsturen, 0..),
 *   gravity, knock, splash (schade vlakbij bij ontploffen), mesh, spin, trail(proj), onHitPlayer(proj), explodeFx(proj)
 */
class Projectile {
  constructor(o) {
    this.pos = o.pos.clone();
    this.vel = o.vel.clone();
    this.speed = this.vel.length();
    this.owner = o.owner || 'boss';
    this.type = o.type || 'fireball';
    this.kind = 'projectile';
    this.dmg = o.dmg === undefined ? 5 : o.dmg;
    this.life = o.life || 6;
    this.radius = o.radius || 0.3;
    this.reflectable = !!o.reflectable;
    this.destroyable = !!o.destroyable;
    this.homing = o.homing || 0;
    this.gravity = o.gravity || 0;
    this.knock = o.knock === undefined ? 5 : o.knock;
    this.splash = o.splash || 0;
    this.trail = o.trail || null;
    this.onHitPlayer = o.onHitPlayer || null;
    this.explodeFx = o.explodeFx || null;
    this.spin = o.spin === undefined ? true : o.spin;
    this.reflectDmg = o.reflectDmg || 16;
    this.mesh = o.mesh || cachedBoxMesh('fireball', 0.55, () => new THREE.MeshBasicMaterial({ map: Tex.fire }));
    this.mesh.position.copy(this.pos);
    this.dead = false;
  }

  aabb(pad) {
    const r = this.radius + (pad || 0);
    return [this.pos.x - r, this.pos.y - r, this.pos.z - r, this.pos.x + r, this.pos.y + r, this.pos.z + r];
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.explode(false); return; }
    const p = player;
    if (this.homing > 0 && this.owner === 'boss' && !p.dead) {
      const want = new THREE.Vector3(p.pos.x - this.pos.x, p.pos.y + 1.1 - this.pos.y, p.pos.z - this.pos.z).normalize().multiplyScalar(this.speed);
      this.vel.lerp(want, Math.min(1, this.homing * dt));
      this.vel.setLength(this.speed);
    }
    if (this.gravity) this.vel.y -= this.gravity * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.mesh.position.copy(this.pos);
    if (this.spin) { this.mesh.rotation.x += dt * 6; this.mesh.rotation.y += dt * 4; }
    else if (this.type === 'arrow') this.mesh.lookAt(this.pos.x + this.vel.x, this.pos.y + this.vel.y, this.pos.z + this.vel.z);
    if (this.trail) this.trail(this);

    if (this.owner === 'boss') {
      const r = this.radius + 0.25;
      if (!p.dead && this.pos.x > p.pos.x - p.hw - r && this.pos.x < p.pos.x + p.hw + r && this.pos.z > p.pos.z - p.hw - r && this.pos.z < p.pos.z + p.hw + r &&
        this.pos.y > p.pos.y - r && this.pos.y < p.pos.y + p.h + r) {
        damagePlayer(this.dmg, this.pos, this.type, this.knock, 3);
        if (this.onHitPlayer) this.onHitPlayer(this);
        this.explode(true, true);
        return;
      }
    } else if (this.type === 'arrow' && game.minions.some((m) => {
      if (m.dead) return false;
      const a = m.aabb();
      if (this.pos.x > a[0] && this.pos.x < a[3] && this.pos.y > a[1] && this.pos.y < a[4] && this.pos.z > a[2] && this.pos.z < a[5]) { m.hurt(this.dmg, this.pos); return true; }
      return false;
    })) {
      this.explode(false);
      return;
    } else if (game.boss && game.boss.alive()) {
      const b = game.boss.aabb();
      const r = this.radius;
      if (this.pos.x > b[0] - r && this.pos.x < b[3] + r && this.pos.y > b[1] - r && this.pos.y < b[4] + r && this.pos.z > b[2] - r && this.pos.z < b[5] + r) {
        if (this.type === 'arrow') {
          game.boss.hurt(this.dmg, 'arrow');
          game.stats.hits++;
          SND.play('hit', { vol: 0.7 });
        } else {
          game.boss.hurt(this.reflectDmg * (game.boss.dmgScale || 1), 'fireball');
          HUD.actionbar('Voltreffer! Zijn eigen aanval!', 2);
          game.stats.reflectHits++;
        }
        this.explode(true);
        return;
      }
    }
    if (game.world.solidAt(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z))) this.explode(this.type !== 'arrow');
  }

  // Met het zwaard terugslaan (vuurballen) of kapotslaan (schaduwballen)
  playerHit() {
    if (this.owner !== 'boss') return false;
    if (this.reflectable) {
      this.owner = 'player';
      this.life = 4;
      this.homing = 0;
      const target = game.boss && game.boss.alive() ? game.boss.center() : this.pos.clone().sub(this.vel);
      this.vel.copy(target.sub(this.pos).normalize().multiplyScalar(17));
      this.speed = 17;
      SND.play('deflect');
      FX.crit(this.pos.x, this.pos.y, this.pos.z);
      game.stats.reflects++;
      HUD.actionbar('Teruggekaatst!', 1.5);
      return true;
    }
    if (this.destroyable) {
      SND.play('deflect');
      FX.crit(this.pos.x, this.pos.y, this.pos.z);
      this.explode(false, true);
      HUD.actionbar('Kapotgeslagen!', 1.2);
      return true;
    }
    return false;
  }

  explode(loud, noSplash) {
    if (this.dead) return;
    this.dead = true;
    if (this.explodeFx) this.explodeFx(this);
    else if (this.type === 'arrow') FX.hit(this.pos.x, this.pos.y, this.pos.z, 0.5, 0.4, 0.3);
    else FX.explosion(this.pos.x, this.pos.y, this.pos.z, 0.8);
    if (loud) SND.play('explode', { at: this.pos, range: 36, vol: 0.6 });
    if (this.owner === 'boss' && this.splash > 0 && !noSplash && !player.dead) {
      const d = this.pos.distanceTo(new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z));
      if (d < 2.2) damagePlayer(this.splash, this.pos, this.type, 4, 3);
    }
  }
}

// Vuurbal van De Lavareus (terug te slaan)
function makeFireball(origin, dir, speed, dmg) {
  return new Projectile({
    pos: origin, vel: dir.clone().normalize().multiplyScalar(speed), owner: 'boss', type: 'fireball',
    dmg, reflectable: true, splash: 2,
    trail: (pr) => { FX.flame(pr.pos.x, pr.pos.y, pr.pos.z, 0.4); if (Math.random() < 0.4) FX.smoke(pr.pos.x, pr.pos.y, pr.pos.z); },
    onHitPlayer: () => { player.fire = Math.max(player.fire, 3); },
  });
}

// Pijl uit de boog van de speler
function makeArrow(origin, dir, power) {
  const mesh = new THREE.Mesh(PROJ_CACHE.arrowGeo || (PROJ_CACHE.arrowGeo = new THREE.BoxGeometry(0.07, 0.07, 0.7)),
    PROJ_CACHE.arrowMat || (PROJ_CACHE.arrowMat = new THREE.MeshLambertMaterial({ color: 0x8a6232 })));
  const pr = new Projectile({
    pos: origin, vel: dir.clone().normalize().multiplyScalar(14 + power * 22), owner: 'player', type: 'arrow',
    dmg: Math.max(2, ITEM.bow.dmg * power) * (power >= 0.95 ? 1.25 : 1), life: 5, radius: 0.15, gravity: 9, spin: false, mesh,
    trail: (p) => { if (power >= 0.95 && Math.random() < 0.6) FX.glow.spawn(p.pos.x, p.pos.y, p.pos.z, 0, 0, 0, 1, 1, 0.8, 0.3, 0, 0); },
  });
  return pr;
}

/* ---------- Grondaanvallen met waarschuwing ---------- */
const HAZARD_GEO = {};
/*
 * GroundHazard – eerst een gekleurde cirkel op de grond (waarschuwing), daarna gaat hij af.
 *   x, y (bovenkant vloer), z, radius, warn (sec), linger (sec na afgaan), color (hex),
 *   onTrigger(h) – standaard: schade als de speler in de cirkel staat; dmg, type, knock, up
 *   onLinger(h, dt) – optioneel, elke frame na het afgaan
 */
class GroundHazard {
  constructor(o) {
    Object.assign(this, { radius: 1.5, warn: 1, linger: 0.3, color: 0xff4400, dmg: 4, type: 'boss', knock: 4, up: 6 }, o);
    this.t = 0; this.fired = false; this.dead = false;
    const key = this.radius.toFixed(2);
    if (!HAZARD_GEO[key]) HAZARD_GEO[key] = { disc: new THREE.CircleGeometry(this.radius, 24), ring: new THREE.RingGeometry(this.radius * 0.88, this.radius, 24) };
    this.mesh = new THREE.Group();
    this.discMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    this.ringMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(HAZARD_GEO[key].disc, this.discMat);
    const ring = new THREE.Mesh(HAZARD_GEO[key].ring, this.ringMat);
    this.inner = new THREE.Mesh(HAZARD_GEO[key].disc, this.ringMat);
    for (const m of [disc, ring, this.inner]) { m.rotation.x = -Math.PI / 2; this.mesh.add(m); }
    this.inner.scale.setScalar(0.01);
    this.mesh.position.set(this.x, this.y + 0.03, this.z);
    this.mesh.renderOrder = 4;
  }

  playerInside() {
    const p = player;
    return !p.dead && Math.hypot(p.pos.x - this.x, p.pos.z - this.z) < this.radius + p.hw && p.pos.y < this.y + 2.5 && p.pos.y > this.y - 1.5;
  }

  update(dt) {
    this.t += dt;
    if (!this.fired) {
      const k = clamp(this.t / this.warn, 0, 1);
      this.inner.scale.setScalar(Math.max(0.01, k));
      this.discMat.opacity = 0.18 + 0.2 * (Math.sin(this.t * 18) * 0.5 + 0.5);
      if (this.t >= this.warn) {
        this.fired = true;
        if (this.onTrigger) this.onTrigger(this);
        else if (this.playerInside()) damagePlayer(this.dmg, { x: this.x, y: this.y, z: this.z }, this.type, this.knock, this.up);
      }
    } else {
      if (this.onLinger) this.onLinger(this, dt);
      const k = 1 - clamp((this.t - this.warn) / Math.max(0.01, this.linger), 0, 1);
      this.discMat.opacity = 0.3 * k; this.ringMat.opacity = 0.85 * k;
      if (this.t >= this.warn + this.linger) this.dead = true;
    }
  }

  // materialen niet vrijgeven: dan gooit three.js de shader weg en moet hij bij de volgende aanval opnieuw compileren
  dispose() {}
}

/* ---------- Grondaanval in een baan (laser, golf, duikvlucht) ---------- */
/*
 * LaneHazard – een rechthoekige baan van (x0,z0) naar (x1,z1), breedte width, op hoogte y (bovenkant vloer).
 *   Zelfde opties als GroundHazard: warn, linger, color, dmg, type, knock, up, onTrigger(h), onLinger(h, dt)
 */
class LaneHazard {
  constructor(o) {
    Object.assign(this, { width: 2, warn: 1, linger: 0.3, color: 0xff3300, dmg: 5, type: 'boss', knock: 6, up: 5 }, o);
    this.t = 0; this.fired = false; this.dead = false;
    const dx = this.x1 - this.x0, dz = this.z1 - this.z0;
    this.len = Math.max(0.5, Math.hypot(dx, dz));
    this.dirX = dx / this.len; this.dirZ = dz / this.len;
    this.discMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    this.ringMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Group();
    const base = new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.len), this.discMat);
    base.rotation.x = -Math.PI / 2;
    const fillGeo = new THREE.PlaneGeometry(this.width * 0.8, this.len).translate(0, -this.len / 2, 0);
    this.fill = new THREE.Mesh(fillGeo, this.ringMat);
    this.fill.rotation.x = -Math.PI / 2;
    this.fill.position.z = -this.len / 2;
    this.fill.scale.y = 0.01;
    this.mesh.add(base, this.fill);
    this.mesh.position.set((this.x0 + this.x1) / 2, this.y + 0.04, (this.z0 + this.z1) / 2);
    this.mesh.rotation.y = Math.atan2(dx, dz);
    this.mesh.renderOrder = 4;
  }

  playerInside() {
    const p = player;
    if (p.dead || p.pos.y > this.y + 2.5 || p.pos.y < this.y - 1.5) return false;
    const px = p.pos.x - this.x0, pz = p.pos.z - this.z0;
    const t = clamp(px * this.dirX + pz * this.dirZ, 0, this.len);
    const cx = this.x0 + this.dirX * t, cz = this.z0 + this.dirZ * t;
    return Math.hypot(p.pos.x - cx, p.pos.z - cz) < this.width / 2 + p.hw;
  }

  update(dt) {
    this.t += dt;
    if (!this.fired) {
      this.fill.scale.y = Math.max(0.01, clamp(this.t / this.warn, 0, 1));
      this.discMat.opacity = 0.15 + 0.2 * (Math.sin(this.t * 18) * 0.5 + 0.5);
      if (this.t >= this.warn) {
        this.fired = true;
        if (this.onTrigger) this.onTrigger(this);
        else if (this.playerInside()) damagePlayer(this.dmg, { x: player.pos.x - this.dirZ, y: this.y, z: player.pos.z + this.dirX }, this.type, this.knock, this.up);
      }
    } else {
      if (this.onLinger) this.onLinger(this, dt);
      const k = 1 - clamp((this.t - this.warn) / Math.max(0.01, this.linger), 0, 1);
      this.discMat.opacity = 0.3 * k; this.ringMat.opacity = 0.7 * k;
      if (this.t >= this.warn + this.linger) this.dead = true;
    }
  }

  dispose() {
    this.mesh.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  }
}

/* ---------- Handlangers van een schurk ---------- */
let MINION_DEFAULT = null;
function defaultMinionModel() {
  if (!MINION_DEFAULT) {
    MINION_DEFAULT = {
      body: pixelTexture(8, 8, () => { const k = Math.random() * 20; return [30 + k, 24 + k, 36 + k]; }),
      face: pixelTexture(8, 8, (x, y) => (y === 3 && (x === 1 || x === 2 || x === 5 || x === 6) ? [255, 60, 60] : [34, 28, 40])),
    };
  }
  const body = new THREE.MeshLambertMaterial({ map: MINION_DEFAULT.body });
  const face = new THREE.MeshLambertMaterial({ map: MINION_DEFAULT.face, emissive: 0x330000 });
  const group = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.7), [body, body, body, body, face, body]);
  m.position.y = 0.3;
  group.add(m);
  return { group, mats: [body, face] };
}

/*
 * Minion – kleine handlanger (spinnetje, scarabee, spookje...). De speler kan hem met 1 à 3 klappen verslaan.
 *   opts: name, hp, speed, dmg, hw, h, fly (vliegt naar je toe), life (sec, daarna verdwijnt hij),
 *         model() -> { group, mats, animate?(minion, dt) }, color [r,g,b] (deeltjes), onHit(minion) (na raken speler)
 */
class Minion {
  constructor(world, x, y, z, o) {
    o = o || {};
    this.world = world; this.o = o;
    this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3();
    this.hw = o.hw || 0.35; this.h = o.h || 0.6;
    this.hp = o.hp || 6; this.maxHp = this.hp;
    this.speed = o.speed || 3; this.dmgAmount = o.dmg || 2; this.fly = !!o.fly;
    this.life = o.life || 30; this.kind = 'minion'; this.name = o.name || 'Handlanger';
    this.yaw = 0; this.flash = 0; this.hitCD = 0.6; this.dead = false;
    this.onGround = false; this.hitWall = false; this.walk = 0;
    this.color = o.color || [0.25, 0.2, 0.3];
    this.model = o.model ? o.model() : defaultMinionModel();
    this.mesh = this.model.group;
    this.mesh.position.copy(this.pos);
  }
  aabb() { return [this.pos.x - this.hw, this.pos.y, this.pos.z - this.hw, this.pos.x + this.hw, this.pos.y + this.h, this.pos.z + this.hw]; }
  center() { return new THREE.Vector3(this.pos.x, this.pos.y + this.h / 2, this.pos.z); }
  alive() { return !this.dead; }

  update(dt) {
    if (this.dead) return;
    this.life -= dt;
    if (this.life <= 0) { this.die(true); return; }
    this.flash -= dt; this.hitCD -= dt;
    const p = player;
    const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, dy = (p.pos.y + 0.9) - (this.pos.y + this.h / 2);
    const d = Math.hypot(dx, dz);
    this.yaw = Math.atan2(dx, dz);
    const sp = p.dead ? 0 : this.speed;
    if (this.fly) {
      const dd = Math.hypot(dx, dy, dz) || 1;
      const k = 1 - Math.exp(-dt * 3);
      this.vel.x += (dx / dd * sp - this.vel.x) * k;
      this.vel.y += (dy / dd * sp - this.vel.y) * k;
      this.vel.z += (dz / dd * sp - this.vel.z) * k;
      this.pos.addScaledVector(this.vel, dt);
    } else {
      const k = 1 - Math.exp(-dt * (this.onGround ? 10 : 2));
      this.vel.x += ((d > 0.4 ? dx / d : 0) * sp - this.vel.x) * k;
      this.vel.z += ((d > 0.4 ? dz / d : 0) * sp - this.vel.z) * k;
      this.vel.y -= GRAVITY * dt;
      physicsStep(this.world, this, dt);
      if (this.hitWall && this.onGround) this.vel.y = 7.5;
      if (this.pos.y < -10) { this.die(true); return; }
    }
    if (!p.dead && this.hitCD <= 0 && d < this.hw + p.hw + 0.3 && Math.abs(dy) < 1.5) {
      damagePlayer(this.dmgAmount, this.pos, 'minion', 4, 3);
      this.hitCD = 1.0;
      if (this.o.onHit) this.o.onHit(this);
    }
    this.walk += dt * (Math.hypot(this.vel.x, this.vel.z) * 6 + 1);
    if (this.model.animate) this.model.animate(this, dt);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    const on = this.flash > 0;
    for (const m of this.model.mats) {
      if (!m.userBase) m.userBase = m.color.clone();
      if (on) m.color.setRGB(1, 0.35, 0.35); else m.color.copy(m.userBase);
    }
  }

  hurt(amount, from) {
    if (this.dead) return false;
    this.hp -= amount;
    this.flash = 0.2;
    if (from) {
      const dx = this.pos.x - from.x, dz = this.pos.z - from.z, d = Math.hypot(dx, dz) || 1;
      this.vel.x = dx / d * 7; this.vel.z = dz / d * 7; this.vel.y = this.fly ? this.vel.y : 4.5;
    }
    SND.play('hit', { vol: 0.6 });
    const c = this.center();
    FX.hit(c.x, c.y, c.z, this.color[0], this.color[1], this.color[2]);
    if (this.hp <= 0) this.die(false);
    return true;
  }

  die(quiet) {
    if (this.dead) return;
    this.dead = true;
    const c = this.center();
    for (let i = 0; i < 14; i++) {
      FX.glow.spawn(c.x, c.y, c.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4,
        this.color[0] * 0.6 + 0.3, this.color[1] * 0.6 + 0.3, this.color[2] * 0.6 + 0.3, 0.5, 4, 2);
    }
    if (!quiet) SND.play('pop', { vol: 0.7 });
  }
}
