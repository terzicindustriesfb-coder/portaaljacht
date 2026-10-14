'use strict';
/* Portaaljacht – de speler: bewegen, slaan, schieten, eten, breken, bouwen en het voorwerp in je hand */

const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(),
  hw: 0.3, h: 1.8, eye: 1.62,
  yaw: 0, pitch: 0,
  mvx: 0, mvz: 0, kbx: 0, kbz: 0,
  onGround: false, hitWall: false,
  health: 20, maxHealth: 20, invuln: 0, lastHurt: 99, regenT: 0, hurtT: 0, hurtSide: 0,
  fire: 0, fireTick: 0, fallDist: 0, slow: 0, dark: 0, softLanding: false,
  inWater: false, inLava: false, eyeIn: null, wasInWater: false,
  sprinting: false, dead: false,
  selected: 0, attackCD: 0, swingT: 1, equipT: 1, bowCharge: 0, wasPrimary: false, eatT: 0,
  breakX: 0, breakY: 0, breakZ: 0, breakId: -1, breakProgress: 0, digSoundT: 0,
  bobPhase: 0, bobAmt: 0, hardMsgT: 0, useMsgT: 0,

  reset(spawn, yaw) {
    this.pos.set(spawn.x, spawn.y, spawn.z);
    this.vel.set(0, 0, 0);
    this.mvx = this.mvz = this.kbx = this.kbz = 0;
    this.yaw = yaw || 0; this.pitch = 0;
    this.health = this.maxHealth;
    this.invuln = 1; this.lastHurt = 99; this.fire = 0; this.fallDist = 0; this.slow = 0; this.dark = 0;
    this.dead = false; this.breakId = -1; this.breakProgress = 0; this.bowCharge = 0;
    this.hurtT = 0;
  },
};

const VM = { group: null, swords: {}, bow: null, apple: null, blocks: {}, current: null, crack: null, outline: null };

/* ---------- Schade ---------- */
// Harnas helpt niet tegen vallen of uit de wereld vallen
const ARMOR_IGNORES = { fall: 1, void: 1 };

function damagePlayer(amount, from, cause, knock, up) {
  const p = player;
  if (p.dead || game.state !== 'playing' || p.invuln > 0 || amount <= 0) return;
  if (!ARMOR_IGNORES[cause]) amount *= 1 - armorDefense();
  amount = Math.max(0.5, Math.round(amount * 2) / 2);
  p.health = Math.max(0, p.health - amount);
  p.invuln = 0.5; p.lastHurt = 0; p.hurtT = 0.45; p.regenT = 0;
  if (from) {
    const dx = p.pos.x - from.x, dz = p.pos.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    const k = knock === undefined ? 4 : knock;
    p.kbx += dx / d * k; p.kbz += dz / d * k;
    p.vel.y = Math.max(p.vel.y, up === undefined ? 4 : up);
    const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    p.hurtSide = (-(dx / d) * rx - (dz / d) * rz) > 0 ? 1 : -1;
  } else p.hurtSide = 0;
  HUD.hurt();
  SND.play('hurt');
  if (p.health <= 0) game.die(cause);
}

/* ---------- Beweging ---------- */
function playerTouches(id) {
  const p = player, w = game.world;
  const x0 = Math.floor(p.pos.x - p.hw), x1 = Math.floor(p.pos.x + p.hw);
  const z0 = Math.floor(p.pos.z - p.hw), z1 = Math.floor(p.pos.z + p.hw);
  const y0 = Math.floor(p.pos.y), y1 = Math.floor(p.pos.y + p.h - 0.01);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (w.get(x, y, z) === id) return true;
  return false;
}

// Kleinste vertraging en grootste prik van alle blokken die de speler (bijna) raakt
const _fx = { slow: 1, hurt: 0, cause: 'boss' };
function blockEffects() {
  const p = player, w = game.world;
  _fx.slow = 1; _fx.hurt = 0;
  const e = 0.06;
  const x0 = Math.floor(p.pos.x - p.hw - e), x1 = Math.floor(p.pos.x + p.hw + e);
  const z0 = Math.floor(p.pos.z - p.hw - e), z1 = Math.floor(p.pos.z + p.hw + e);
  const y0 = Math.floor(p.pos.y - 0.05), y1 = Math.floor(p.pos.y + p.h - 0.05);
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const b = BLOCKS[w.get(x, y, z)];
        if (!b) continue;
        if (b.slow && !b.solid && b.slow < _fx.slow) _fx.slow = b.slow;
        if (b.hurt && b.hurt > _fx.hurt) { _fx.hurt = b.hurt; _fx.cause = b.hurtCause || 'cactus'; }
      }
    }
  }
  return _fx;
}

function groundBlock() {
  const p = player;
  return game.world.get(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.05), Math.floor(p.pos.z));
}

function updatePlayer(dt) {
  const p = player, w = game.world;

  p.yaw -= Input.lookDX;
  p.pitch = clamp(p.pitch - Input.lookDY, -1.55, 1.55);

  p.invuln -= dt; p.lastHurt += dt; p.attackCD -= dt; p.hurtT -= dt; p.hardMsgT -= dt; p.useMsgT -= dt;
  if (p.slow > 0) p.slow -= dt;
  if (p.dark > 0) p.dark -= dt;

  const fx = Math.floor(p.pos.x), fz = Math.floor(p.pos.z);
  const feet = w.get(fx, Math.floor(p.pos.y + 0.1), fz), body = w.get(fx, Math.floor(p.pos.y + 0.9), fz);
  const eye = w.get(fx, Math.floor(p.pos.y + p.eye), fz);
  // blokken die je raakt: spinnenweb/drijfzand vertraagt, cactus prikt
  const fxB = blockEffects();
  p.inWater = feet === B.WATER || body === B.WATER;
  p.inLava = feet === B.LAVA || body === B.LAVA;
  p.eyeIn = eye === B.WATER ? 'water' : eye === B.LAVA ? 'lava' : null;
  if (p.inWater && !p.wasInWater && p.vel.y < -4) SND.play('splash');
  p.wasInWater = p.inWater;

  // bewegingsrichting uit de invoer
  const f = Input.forward(), s = Input.strafe();
  let wx = -Math.sin(p.yaw) * f + Math.cos(p.yaw) * s;
  let wz = -Math.cos(p.yaw) * f - Math.sin(p.yaw) * s;
  const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  const drawing = p.bowCharge > 0;
  p.sprinting = Input.sprint() && f > 0.3 && !p.inWater && !p.inLava && !drawing;
  let speed = p.sprinting ? 5.6 : 4.3;
  if (p.inWater) speed *= 0.55;
  if (p.inLava) speed *= 0.4;
  if (p.slow > 0) speed *= 0.5;
  if (fxB.slow < 1) speed *= fxB.slow;
  if (drawing) speed *= 0.45;
  const under = p.onGround ? groundBlock() : B.AIR;
  const slippery = p.onGround && BLOCKS[under] && BLOCKS[under].slip;
  const accel = p.onGround ? (slippery ? 2.2 : 16) : (p.inWater || p.inLava ? 6 : 5);
  const k = 1 - Math.exp(-accel * dt);
  p.mvx += (wx * speed - p.mvx) * k;
  p.mvz += (wz * speed - p.mvz) * k;
  const kd = Math.exp(-dt * (p.onGround ? (slippery ? 1.5 : 7) : 2.2));
  p.kbx *= kd; p.kbz *= kd;
  p.vel.x = p.mvx + p.kbx;
  p.vel.z = p.mvz + p.kbz;

  if (p.inWater || p.inLava) {
    p.vel.y -= 10 * dt;
    p.vel.y *= Math.exp(-2.5 * dt);
    if (Input.jump()) p.vel.y = Math.min(p.vel.y + 26 * dt, 3.4);
    if (p.vel.y < -4) p.vel.y = -4;
  } else {
    p.vel.y -= GRAVITY * dt;
    if (p.vel.y < -50) p.vel.y = -50;
    if (Input.jump() && p.onGround) p.vel.y = 8.6;
  }

  const prevY = p.pos.y;
  const wasGround = p.onGround;
  physicsStep(w, p, dt);
  if (p.hitWall) {
    p.kbx = 0; p.kbz = 0;
    if ((p.inWater || p.inLava) && Input.jump()) p.vel.y = 5.6;
    else if (Input.touchMode && p.onGround && wl > 0.3 && f > 0 && canStepUp(w, p, wx / Math.max(wl, 1e-6), wz / Math.max(wl, 1e-6))) p.vel.y = 8.6;
  }
  // Vastgeraakt in een blok (bijv. na teleport)? Omhoog duwen.
  if (entityOverlaps(w, p)) p.pos.y = Math.floor(p.pos.y) + 1 + EPS;
  pushOutOfEntities(dt);

  // valschade (niet op sneeuw of wolken)
  const dy = prevY - p.pos.y;
  if (dy > 0) p.fallDist += dy;
  if (p.inWater || p.inLava || p.vel.y > 0) p.fallDist = 0;
  if (p.onGround) {
    const soft = BLOCKS[groundBlock()] && BLOCKS[groundBlock()].soft;
    if (p.fallDist > 3.4 && !soft) damagePlayer(Math.floor(p.fallDist - 2.6), null, 'fall');
    if (!wasGround && p.fallDist > 0.8) SND.play('step', { vol: 1.3, kind: stepKind() });
    p.fallDist = 0;
  }

  // lava, vuur en water
  if (p.inLava) { damagePlayer(4, null, 'lava', 0, 0); p.fire = 6; }
  if (p.inWater && p.fire > 0) { p.fire = 0; SND.play('fizz'); }
  if (p.fire > 0 && !p.inLava) {
    p.fire -= dt; p.fireTick -= dt;
    if (p.fireTick <= 0) { p.fireTick = 1; damagePlayer(1, null, 'fire', 0, 0); }
  }
  if (fxB.hurt > 0) damagePlayer(fxB.hurt, null, fxB.cause, 0, 0);
  if (p.pos.y < -8) { p.health = 0; game.die('void'); return; }
  if (game.worldKind === 'realm' && game.realm && game.realm.fallLimit !== undefined && p.pos.y < game.realm.fallLimit) game.fellOut();

  // natuurlijke genezing
  if (p.lastHurt > 5 && p.health < p.maxHealth && !p.dead) {
    p.regenT += dt;
    if (p.regenT > 1.4) { p.regenT = 0; p.health = Math.min(p.maxHealth, p.health + 1); }
  }

  // loopgeluid en hoofdbeweging
  const hs = Math.hypot(p.vel.x, p.vel.z);
  const moving = p.onGround && hs > 0.5;
  p.bobAmt += ((moving ? Math.min(1, hs / 4.3) : 0) - p.bobAmt) * Math.min(1, dt * 10);
  if (moving) {
    const before = Math.floor(p.bobPhase / Math.PI);
    p.bobPhase += dt * hs * 2.3;
    if (Math.floor(p.bobPhase / Math.PI) !== before) SND.play('step', { kind: stepKind() });
  }
}

// Wezens zijn vast: de speler loopt niet door de schurk, de handelaar of dieren heen.
function pushOutOfEntities(dt) {
  const p = player, w = game.world;
  let list;
  if (game.worldKind === 'overworld') list = game.villager ? game.animals.concat([game.villager]) : game.animals;
  else list = game.boss && game.boss.alive() ? [game.boss] : [];
  for (const e of list) {
    if (p.pos.y >= e.pos.y + e.h || p.pos.y + p.h <= e.pos.y) continue;
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z;
    const ox = p.hw + e.hw - Math.abs(dx), oz = p.hw + e.hw - Math.abs(dz);
    if (ox <= 0 || oz <= 0) continue;
    const save = { x: p.pos.x, z: p.pos.z };
    if (e.kind === 'boss' || e.kind === 'villager') {
      // hard eruit duwen langs de kortste as; lukt dat niet (muur), dan de andere as, en anders de schurk wegduwen
      const sx = (dx >= 0 ? 1 : -1) * (ox + EPS), sz = (dz >= 0 ? 1 : -1) * (oz + EPS);
      const tries = ox < oz ? [['x', sx], ['z', sz]] : [['z', sz], ['x', sx]];
      let ok = false;
      for (const [axis, amt] of tries) {
        p.pos[axis] += amt;
        if (!entityOverlaps(w, p)) { ok = true; break; }
        p.pos.x = save.x; p.pos.z = save.z;
      }
      if (!ok && e.kind === 'boss' && !e.flying) moveAxis(w, e, tries[0][0], -tries[0][1]);
      continue;
    }
    const k = Math.min(1, dt * 6);
    if (ox < oz) p.pos.x += (dx >= 0 ? 1 : -1) * ox * k;
    else p.pos.z += (dz >= 0 ? 1 : -1) * oz * k;
    if (entityOverlaps(w, p)) { p.pos.x = save.x; p.pos.z = save.z; }
  }
}

function stepKind() {
  const id = groundBlock();
  return BLOCKS[id] ? BLOCKS[id].sound : 'stone';
}

/* ---------- Richten ---------- */
const _eye = new THREE.Vector3(), _dir = new THREE.Vector3();

function viewRay() {
  const p = player;
  _eye.set(p.pos.x, p.pos.y + p.eye, p.pos.z);
  const cp = Math.cos(p.pitch);
  _dir.set(-Math.sin(p.yaw) * cp, Math.sin(p.pitch), -Math.cos(p.yaw) * cp);
  return { o: _eye, d: _dir };
}

function findTarget() {
  const { o, d } = viewRay();
  const hit = raycastVoxels(game.world, o, d, 5);
  const blockDist = hit ? hit.dist : Infinity;
  let best = null, bestT = Infinity;
  const consider = (ent, box, reach) => {
    const t = rayAABB(o, d, box[0], box[1], box[2], box[3], box[4], box[5], Math.min(reach, blockDist + 0.01));
    if (t >= 0 && t < bestT) { bestT = t; best = ent; }
  };
  if (game.worldKind === 'overworld') {
    for (const a of game.animals) consider(a, a.aabb(), 4);
    if (game.villager) consider(game.villager, game.villager.aabb(), 4.5);
  } else {
    for (const pr of game.projectiles) {
      if (!pr.dead && pr.owner === 'boss' && (pr.reflectable || pr.destroyable)) consider(pr, pr.aabb(Input.touchMode ? 0.65 : 0.4), 6);
    }
    for (const m of game.minions) if (!m.dead) consider(m, m.aabb(), 4.2);
    const b = game.boss;
    if (b && b.alive()) {
      consider(b, b.aabb(), 4.2 + b.hw);
      // Hulp bij richten op een telefoon: dichtbij en ongeveer ervoor = raak
      if (!best && Input.touchMode && !b.flying) {
        const dx = b.pos.x - o.x, dz = b.pos.z - o.z;
        if (Math.hypot(dx, dz) < 3.8 + b.hw) {
          const ang = Math.abs(angleDiff(Math.atan2(-d.x, -d.z), Math.atan2(-dx, -dz)));
          if (ang < 0.6) best = b;
        }
      }
    }
  }
  return { ent: best, block: best ? null : hit };
}

function swingArm() { player.swingT = 0; }

/* ---------- Slaan ---------- */
function attackEntity(ent) {
  const p = player;
  const full = p.attackCD <= 0;
  const item = HOTBAR[p.selected];
  const sword = item.type === 'sword';
  const it = ITEM[PROG.sword];
  const crit = full && !p.onGround && p.vel.y < -0.5 && !p.inWater;
  let dmg = sword ? it.dmg : 1;
  if (!full) dmg *= 0.3;
  if (crit) dmg *= 1.5;
  p.attackCD = 0.55;
  swingArm();
  if (ent.kind === 'animal') {
    ent.hurt(p.pos);
  } else if (ent.kind === 'villager') {
    game.openShop();
  } else if (ent.kind === 'projectile') {
    ent.playerHit();
  } else if (ent.kind === 'minion') {
    ent.hurt(dmg, p.pos);
    if (sword && it.fire && full) ent.hurt(2);
  } else if (ent.kind === 'boss') {
    if (ent.hurt(dmg, 'melee')) {
      PROG.stats.hits++;
      SND.play('hit');
      const c = ent.center();
      if (sword && it.fire && full) { ent.burn = 4; FX.flame(c.x, c.y, c.z, 1.2); }
      if (crit) {
        FX.crit(c.x, c.y + 0.5, c.z);
        SND.play('crit');
        HUD.actionbar('Voltreffer!', 0.8);
        if (sword && it.star) starfall(ent);
      }
    } else SND.play('swing');
  }
}

// Sterrenzwaard: bij een voltreffer regent het sterren op de schurk
function starfall(ent) {
  const c = ent.center();
  for (let i = 0; i < 40; i++) {
    FX.glow.spawn(c.x + (Math.random() - 0.5) * 3, c.y + 4 + Math.random() * 4, c.z + (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 2, -10 - Math.random() * 6, (Math.random() - 0.5) * 2, 1, 1, 0.6 + Math.random() * 0.4, 0.5, 0, 0);
  }
  setTimeout(() => { if (ent.alive && ent.alive()) { ent.hurt(8, 'burn'); SND.play('crit'); } }, 250);
}

/* ---------- Boog en appel ---------- */
function shootArrow(power) {
  const { o, d } = viewRay();
  const origin = o.clone().addScaledVector(d, 0.6);
  origin.y -= 0.1;
  game.addProjectile(makeArrow(origin, d, power));
  SND.play('bow', { vol: 0.5 + power * 0.5 });
}

function eatApple() {
  const p = player;
  if (PROG.apples <= 0) { HUD.actionbar('Je hebt geen gouden appels. Koop ze bij Handelaar Henk!', 2); return; }
  if (p.health >= p.maxHealth) { HUD.actionbar('Je bent al helemaal gezond', 1.4); return; }
  PROG.apples--;
  p.health = Math.min(p.maxHealth, p.health + ITEM.apple.heal);
  p.fire = 0; p.slow = 0;
  p.eatT = 0.6;
  SND.play('eat');
  HUD.actionbar('Mmm! +5 hartjes', 1.5);
  HUD.refreshHotbar();
  saveProgress();
}

/* ---------- Acties per frame ---------- */
function handleActions(dt) {
  const p = player;
  const target = findTarget();
  game.target = target.ent;
  game.targetBlock = target.block;
  const item = HOTBAR[p.selected];
  const tb = target.block;
  const pressed = Input.primaryPressed || Input.secondaryPressed;

  // Schatkist openen
  if (tb && BLOCKS[tb.id].chest && pressed) {
    swingArm();
    game.useChest(tb);
    finishActions(null, target);
    return;
  }

  if (item.type === 'bow') {
    if (!PROG.owned.bow) {
      if (pressed && p.useMsgT <= 0) { HUD.actionbar('Koop eerst een boog bij Handelaar Henk', 1.8); p.useMsgT = 1; }
    } else if (Input.primary) {
      p.bowCharge = Math.min(1, p.bowCharge + dt);
    } else if (p.wasPrimary && p.bowCharge > 0) {
      shootArrow(Math.max(0.3, p.bowCharge));
      p.bowCharge = 0;
    } else p.bowCharge = 0;
    if (target.ent && target.ent.kind === 'villager' && Input.primaryPressed) game.openShop();
    p.wasPrimary = Input.primary;
    finishActions(null, target);
    return;
  }
  p.bowCharge = 0;
  p.wasPrimary = Input.primary;

  if (item.type === 'apple') {
    if (target.ent && target.ent.kind === 'villager' && Input.primaryPressed) game.openShop();
    else if (pressed) eatApple();
    finishActions(null, target);
    return;
  }

  // slaan
  if (Input.primaryPressed) {
    if (target.ent) attackEntity(target.ent);
    else { swingArm(); if (!tb) SND.play('swing', { vol: 0.6 }); }
  } else if (Input.primary && target.ent && target.ent.kind !== 'villager' && p.attackCD <= 0) {
    attackEntity(target.ent);
  }

  // blok breken (ingedrukt houden)
  if (Input.primary && tb && !target.ent) {
    if (tb.x !== p.breakX || tb.y !== p.breakY || tb.z !== p.breakZ || tb.id !== p.breakId) {
      p.breakX = tb.x; p.breakY = tb.y; p.breakZ = tb.z; p.breakId = tb.id; p.breakProgress = 0;
    }
    const b = BLOCKS[tb.id];
    if (b.hard === Infinity) {
      if (p.hardMsgT <= 0) { HUD.actionbar(b.name + ' is veel te hard om te breken!', 1.6); p.hardMsgT = 2; }
    } else {
      p.breakProgress += dt / Math.max(0.05, b.hard);
      p.digSoundT -= dt;
      if (p.digSoundT <= 0) {
        p.digSoundT = 0.22;
        if (p.swingT >= 0.6) swingArm();
        SND.play('dig');
        FX.blockHit(tb.x, tb.y, tb.z, tb.id, { x: tb.nx, y: tb.ny, z: tb.nz });
      }
      if (p.breakProgress >= 1) breakBlock(tb.x, tb.y, tb.z, tb.id);
    }
  } else {
    p.breakId = -1; p.breakProgress = 0;
  }

  // blok bouwen
  if (Input.secondaryPressed && item.type === 'block') {
    if (target.ent && target.ent.kind === 'villager') game.openShop();
    else if (tb) placeBlock(tb, item.id);
    else HUD.actionbar('Richt op een blok om te bouwen', 1.2);
  } else if (Input.secondaryPressed && item.type === 'sword') {
    if (target.ent && target.ent.kind === 'villager') game.openShop();
    else HUD.actionbar('Kies eerst een blok in de balk onderaan', 1.4);
  }
  finishActions(tb, target);
}

// selectie-randje en breekscheuren
function finishActions(tb, target) {
  const p = player;
  const show = target.block && !target.ent;
  VM.outline.visible = !!show;
  if (show) VM.outline.position.set(target.block.x + 0.5, target.block.y + 0.5, target.block.z + 0.5);
  if (tb && p.breakId >= 0 && p.breakProgress > 0) {
    VM.crack.visible = true;
    VM.crack.position.set(p.breakX + 0.5, p.breakY + 0.5, p.breakZ + 0.5);
    setStripFrame(Tex.crack, Math.min(4, Math.floor(p.breakProgress * 5)));
  } else {
    VM.crack.visible = false;
    if (!tb) { p.breakId = -1; p.breakProgress = 0; }
  }
}

// Wat erts oplevert in de winkel-munten
const ORE_LOOT = {};
ORE_LOOT[B.COAL_ORE] = { coins: 1 };
ORE_LOOT[B.IRON_ORE] = { coins: 3 };
ORE_LOOT[B.DIAMOND_ORE] = { diamonds: 1 };
ORE_LOOT[B.GOLD] = { coins: 8 };

function breakBlock(x, y, z, id) {
  const w = game.world;
  let fill = B.AIR;
  // water of lava stroomt het gat in
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]]) {
    const n = w.get(x + dx, y + dy, z + dz);
    if (n === B.WATER || n === B.LAVA) { fill = n; break; }
  }
  w.set(x, y, z, fill);
  const above = w.get(x, y + 1, z);
  if (BLOCKS[above].render === R_CROSS) w.set(x, y + 1, z, B.AIR);
  w.updateDirty(9);
  FX.blockBreak(x, y, z, id);
  SND.play('break');
  PROG.stats.broken++;
  player.breakId = -1; player.breakProgress = 0;
  const loot = ORE_LOOT[id];
  if (loot) {
    addLoot(loot.coins || 0, loot.diamonds || 0);
    HUD.actionbar(loot.diamonds ? '+1 diamant!' : '+' + loot.coins + (loot.coins === 1 ? ' munt' : ' munten'), 1.2);
    SND.play('pop');
    HUD.refreshWallet();
  }
}

function placeBlock(tb, id) {
  const w = game.world;
  let x = tb.x + tb.nx, y = tb.y + tb.ny, z = tb.z + tb.nz;
  if (BLOCKS[tb.id].replace) { x = tb.x; y = tb.y; z = tb.z; }
  if (!w.inBounds(x, y, z)) { HUD.actionbar('Hier kun je niet bouwen', 1.2); return; }
  if (!BLOCKS[w.get(x, y, z)].replace) return;
  const overlaps = (box) => x < box[3] && x + 1 > box[0] && y < box[4] && y + 1 > box[1] && z < box[5] && z + 1 > box[2];
  const p = player;
  if (overlaps([p.pos.x - p.hw, p.pos.y, p.pos.z - p.hw, p.pos.x + p.hw, p.pos.y + p.h, p.pos.z + p.hw])) return;
  if (game.worldKind === 'overworld') {
    for (const a of game.animals) if (overlaps(a.aabb())) return;
    if (game.villager && overlaps(game.villager.aabb())) return;
  } else if (game.boss && game.boss.alive() && overlaps(game.boss.aabb())) return;
  w.set(x, y, z, id);
  w.updateDirty(9);
  swingArm();
  SND.play('place');
  PROG.stats.placed++;
}

/* ---------- Voorwerp in je hand ---------- */
// Draaiing die lokale assen (lb: lemmet, ln: vlak) op doelrichtingen (db, dn) zet
function frameQuat(lb, ln, db, dn) {
  const l1 = lb.clone().normalize(), l2 = ln.clone().normalize(), l3 = l1.clone().cross(l2);
  const d1 = db.clone().normalize();
  const d2 = dn.clone().sub(d1.clone().multiplyScalar(dn.dot(d1))).normalize();
  const d3 = d1.clone().cross(d2);
  const mL = new THREE.Matrix4().makeBasis(l1, l2, l3);
  const mD = new THREE.Matrix4().makeBasis(d1, d2, d3);
  return new THREE.Quaternion().setFromRotationMatrix(mD.multiply(mL.transpose()));
}

let SWORD_QUAT = null;
function swordMesh(mat) {
  if (!VM.swords[mat]) {
    const m = buildSpriteMesh(ITEM_ART.sword(mat));
    m.scale.setScalar(0.66);
    m.quaternion.copy(SWORD_QUAT);
    VM.swords[mat] = m;
  }
  return VM.swords[mat];
}

function heldBlockMesh(id) {
  if (VM.blocks[id]) return VM.blocks[id];
  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv;
  const b = BLOCKS[id];
  const order = [b.tiles.side, b.tiles.side, b.tiles.top, b.tiles.bottom, b.tiles.side, b.tiles.side];
  for (let f = 0; f < 6; f++) {
    const t = TILE_UV[order[f]];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, lerp(t[0], t[2], uv.getX(i)), lerp(t[1], t[3], uv.getY(i)));
    }
  }
  uv.needsUpdate = true;
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: Tex.atlas, alphaTest: 0.5, side: THREE.DoubleSide }));
  m.scale.setScalar(0.42);
  m.rotation.set(0.12, Math.PI / 4, 0);
  m.position.set(0.02, 0.08, 0);
  VM.blocks[id] = m;
  return m;
}

function initViewModel(scene, handScene) {
  VM.group = new THREE.Group();
  handScene.add(VM.group);
  SWORD_QUAT = frameQuat(new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-0.42, 0.8, -0.55), new THREE.Vector3(0.6, 0.1, 0.8));
  VM.bow = buildSpriteMesh(ITEM_ART.bow(), [7.5, 7.5]);
  VM.bow.scale.setScalar(0.6);
  VM.bow.quaternion.copy(frameQuat(new THREE.Vector3(1, 1, 0), new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-0.15, 1, -0.2), new THREE.Vector3(0.35, 0, 1)));
  VM.apple = buildSpriteMesh(ITEM_ART.apple(), [7.5, 7.5]);
  VM.apple.scale.setScalar(0.42);
  VM.apple.rotation.set(0, -0.5, 0);
  VM.current = swordMesh('stone');
  VM.group.add(VM.current);

  const og = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
  VM.outline = new THREE.LineSegments(og, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.65 }));
  VM.outline.visible = false;
  scene.add(VM.outline);

  VM.crack = new THREE.Mesh(new THREE.BoxGeometry(1.008, 1.008, 1.008),
    new THREE.MeshBasicMaterial({ map: Tex.crack, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  VM.crack.visible = false;
  scene.add(VM.crack);
}

function setHeldItem(slot) {
  const it = HOTBAR[slot];
  let next;
  if (it.type === 'sword') next = swordMesh(ITEM[PROG.sword].mat);
  else if (it.type === 'bow') next = VM.bow;
  else if (it.type === 'apple') next = VM.apple;
  else next = heldBlockMesh(it.id);
  if (VM.current !== next) {
    VM.group.remove(VM.current);
    VM.group.add(next);
    VM.current = next;
  }
  VM.current.visible = !(it.type === 'bow' && !PROG.owned.bow) && !(it.type === 'apple' && PROG.apples <= 0);
}

function updateViewModel(dt) {
  const p = player;
  p.swingT = Math.min(1, p.swingT + dt / 0.28);
  p.equipT = Math.min(1, p.equipT + dt / 0.22);
  if (p.eatT > 0) p.eatT -= dt;
  const t = p.swingT;
  const s = Math.sin(t * Math.PI), s2 = Math.sin(Math.sqrt(t) * Math.PI);
  const bx = Math.cos(p.bobPhase) * 0.03 * p.bobAmt;
  const by = -Math.abs(Math.sin(p.bobPhase)) * 0.035 * p.bobAmt;
  const type = HOTBAR[p.selected].type;
  const isBlock = type === 'block';
  let baseX = isBlock ? 0.62 : 0.64, baseY = isBlock ? -0.56 : -0.6, baseZ = isBlock ? -0.95 : -0.92;
  if (type === 'bow') { baseX = 0.42 - p.bowCharge * 0.22; baseY = -0.42 + p.bowCharge * 0.08; baseZ = -0.85 + p.bowCharge * 0.2; }
  if (type === 'apple') { baseX = 0.55; baseY = -0.5; baseZ = -0.85; }
  const shake = p.bowCharge > 0.95 ? (Math.random() - 0.5) * 0.01 : 0;
  const eat = p.eatT > 0 ? Math.sin(p.eatT * 40) * 0.03 : 0;
  VM.group.position.set(
    baseX + bx - s2 * 0.3 + shake - (p.eatT > 0 ? 0.25 : 0),
    baseY + by + Math.sin(Math.sqrt(t) * Math.PI * 2) * 0.1 - (1 - p.equipT) * 0.6 + eat,
    baseZ - s * 0.18);
  VM.group.rotation.set(-s2 * 0.75, s2 * 0.35, s * 0.35);
}
