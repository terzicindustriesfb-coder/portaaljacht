'use strict';
/* Portaaljacht – de winkel van de handelaar: steeds betere wapens, harnassen en gouden appels */

const Shop = {
  root: null, list: null, wallet: null, note: null, filter: 'sword',

  init() {
    const root = document.createElement('div');
    root.id = 'screen-shop';
    root.className = 'screen hidden darken';
    root.innerHTML =
      '<div class="mcpanel shop-panel">' +
      '  <div class="mcpanel-title">Handelaar Henk</div>' +
      '  <div class="shop-wallet" id="shop-wallet"></div>' +
      '  <div class="shop-tabs" role="tablist">' +
      '    <button class="shop-tab" data-tab="sword" type="button">Wapens</button>' +
      '    <button class="shop-tab" data-tab="armor" type="button">Harnassen</button>' +
      '    <button class="shop-tab" data-tab="apple" type="button">Eten</button>' +
      '  </div>' +
      '  <div class="shop-list" id="shop-list"></div>' +
      '  <div class="shop-note" id="shop-note">Verdien munten en diamanten met de schatten van de schurken.</div>' +
      '  <button class="mcbtn small" id="shop-close" type="button">Klaar</button>' +
      '</div>';
    document.body.appendChild(root);
    this.root = root;
    this.list = root.querySelector('#shop-list');
    this.wallet = root.querySelector('#shop-wallet');
    this.note = root.querySelector('#shop-note');
    root.querySelectorAll('.shop-tab').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      SND.play('click');
      this.filter = b.dataset.tab;
      this.render();
    }));
    root.querySelector('#shop-close').addEventListener('click', (e) => { e.preventDefault(); SND.play('click'); this.close(); });
  },

  open() {
    this.root.classList.remove('hidden');
    this.note.textContent = 'Hallo held! Wat wil je kopen?';
    this.render();
  },

  close() {
    this.root.classList.add('hidden');
    game.closeUI();
  },

  render() {
    this.root.querySelectorAll('.shop-tab').forEach((b) => b.classList.toggle('sel', b.dataset.tab === this.filter));
    this.wallet.innerHTML =
      '<span class="wal"><img alt="" src="' + itemIconURL('coin') + '">' + PROG.coins + '</span>' +
      '<span class="wal"><img alt="" src="' + itemIconURL('diamond') + '">' + PROG.diamonds + '</span>' +
      '<span class="wal"><img alt="" src="' + itemIconURL('apple') + '">' + PROG.apples + '</span>';
    this.list.innerHTML = '';
    const kinds = this.filter === 'sword' ? ['sword', 'bow'] : [this.filter];
    for (const it of SHOP_ITEMS) {
      if (!kinds.includes(it.kind)) continue;
      const row = document.createElement('div');
      row.className = 'shop-row';
      const owned = it.kind !== 'apple' && !!PROG.owned[it.id];
      const equipped = (it.kind === 'sword' && PROG.sword === it.id) || (it.kind === 'armor' && PROG.armor === it.id) || (it.kind === 'bow' && owned);
      let stat = '';
      if (it.kind === 'sword') stat = 'Schade ' + it.dmg;
      else if (it.kind === 'bow') stat = 'Schade tot ' + it.dmg + ' (op afstand)';
      else if (it.kind === 'armor') stat = 'Bescherming ' + Math.round(it.def * 100) + '%';
      else stat = 'Je hebt er ' + PROG.apples;
      const img = document.createElement('img');
      img.alt = ''; img.src = itemIconURL(it.id); img.className = 'shop-icon';
      const mid = document.createElement('div');
      mid.className = 'shop-mid';
      mid.innerHTML = '<div class="shop-name"></div><div class="shop-stat"></div><div class="shop-price"></div>';
      mid.querySelector('.shop-name').textContent = it.name;
      mid.querySelector('.shop-stat').textContent = stat + ' · ' + it.info;
      const price = mid.querySelector('.shop-price');
      if (owned) price.textContent = equipped ? 'In gebruik' : 'Van jou';
      else {
        if (it.price.coins) price.insertAdjacentHTML('beforeend', '<span class="wal"><img alt="" src="' + itemIconURL('coin') + '">' + it.price.coins + '</span>');
        if (it.price.diamonds) price.insertAdjacentHTML('beforeend', '<span class="wal"><img alt="" src="' + itemIconURL('diamond') + '">' + it.price.diamonds + '</span>');
        if (!it.price.coins && !it.price.diamonds) price.textContent = 'Gratis';
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mcbtn tiny';
      if (owned) {
        btn.textContent = equipped ? 'Gekozen' : 'Gebruik';
        btn.disabled = equipped;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          equipItem(it.id);
          SND.play('click');
          game.onGearChanged();
          this.render();
        });
      } else {
        const afford = canAfford(it);
        btn.textContent = 'Koop';
        btn.disabled = !afford;
        if (!afford) row.classList.add('poor');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const r = buyItem(it.id);
          this.note.textContent = r.msg;
          SND.play(r.ok ? 'levelup' : 'hurt', { vol: r.ok ? 0.8 : 0.3 });
          game.onGearChanged();
          this.render();
        });
      }
      row.appendChild(img); row.appendChild(mid); row.appendChild(btn);
      this.list.appendChild(row);
    }
  },
};

/* ---------- De handelaar (een dorpeling) ---------- */
function buildVillagerModel(robeRGB) {
  const rc = robeRGB || [112, 78, 48];
  const dark = rc.map((v) => Math.round(v * 0.8));
  const robe = pixelTexture(8, 8, (x, y) => (y === 5 ? [60, 40, 26] : x === 3 || x === 4 ? dark : rc));
  const skin = pixelTexture(8, 8, () => [190, 140, 110]);
  const face = pixelTexture(8, 8, (x, y) => {
    if (y === 1 && x >= 2 && x <= 5) return [70, 50, 40];               // wenkbrauwen
    if (y === 2 && (x === 2 || x === 5)) return [255, 255, 255];
    if (y === 2 && (x === 3 || x === 4)) return [40, 120, 50];          // groene ogen
    return [190, 140, 110];
  });
  const nose = pixelTexture(2, 4, () => [176, 124, 96]);
  const mats = [skin, face, robe, nose].map((t) => new THREE.MeshLambertMaterial({ map: t }));
  const [mSkin, mFace, mRobe, mNose] = mats;
  const g = new THREE.Group();
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(0.5, 1.15, 0.38, mRobe, 0, 0.6, 0);
  const head = new THREE.Group();
  head.position.set(0, 1.18, 0);
  g.add(head);
  const hm = new THREE.Mesh(faceBox(0.5, 0.62, 0.5), [mSkin, mFace]);
  hm.position.y = 0.31;
  head.add(hm);
  const ns = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), mNose);
  ns.position.set(0, 0.18, 0.31);
  head.add(ns);
  box(0.62, 0.22, 0.24, mRobe, 0, 0.92, 0.24); // gekruiste armen
  return { group: g, head, mats };
}

class Villager {
  constructor(x, y, z, yaw) {
    this.pos = new THREE.Vector3(x, y, z);
    this.yaw = yaw;
    this.hw = 0.3; this.h = 1.9;
    this.kind = 'villager';
    this.model = buildVillagerModel();
    this.mesh = this.model.group;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = yaw;
    this.talkT = 0; this.hmmT = 4;
  }
  aabb() { return [this.pos.x - this.hw, this.pos.y, this.pos.z - this.hw, this.pos.x + this.hw, this.pos.y + this.h, this.pos.z + this.hw]; }
  update(dt) {
    // kijk naar de speler als die dichtbij is
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 8) {
      const target = Math.atan2(dx, dz);
      this.model.head.rotation.y = clamp(angleDiff(this.yaw, target), -1.1, 1.1);
      this.hmmT -= dt;
      if (this.hmmT <= 0) { this.hmmT = 5 + Math.random() * 6; SND.play('hmm', { at: this.pos, range: 12 }); }
    } else this.model.head.rotation.y *= 0.95;
    if (this.talkT > 0) {
      this.talkT -= dt;
      this.model.head.rotation.x = Math.sin(this.talkT * 20) * 0.08;
    }
  }
  hurt() { this.talkT = 0.6; }
}

/* ---------- Dorpelingen die rondlopen en tips geven ---------- */
const WANDERERS = [
  { name: 'Boer Bart', robe: [150, 104, 60] },
  { name: 'Bibliothecaris Bea', robe: [228, 226, 214] },
  { name: 'Priester Piet', robe: [130, 60, 150] },
  { name: 'Smid Sam', robe: [58, 58, 64] },
  { name: 'Visser Fien', robe: [60, 110, 170] },
  { name: 'Herder Hans', robe: [86, 130, 60] },
  { name: 'Bakker Bo', robe: [200, 170, 120] },
];

// Tips van de dorpelingen; de eerste vertelt waar het portaal is
function villagerTips(v) {
  const tips = [];
  const ow = game.owInfo;
  if (ow && !allBossesBeaten()) {
    const d = Math.round(Math.hypot(ow.portal.x - v.pos.x, ow.portal.z - v.pos.z) / 10) * 10;
    const where = ow.biomeAt ? BIOME_PLACE[ow.biomeAt(ow.portal.x, ow.portal.z)] : 'ergens';
    tips.push('Het portaal naar ' + currentRealm().name + ' staat ' + where + ', zo\'n ' + d + ' blokken hiervandaan. Volg je kompas!');
  }
  tips.push('Koop betere wapens bij Handelaar Henk. De schurken worden steeds sterker!');
  if (ow && ow.bonus) {
    for (const b of ow.bonus) {
      if (PROG.looted.includes(b.key)) continue;
      if (b.key === 'piramide') tips.push('In de woestijn staat een oude piramide. Er zou een schat in liggen...');
      if (b.key === 'toren') tips.push('Bij een ingestorte toren is een geheime kelder met een kist erin.');
    }
  }
  tips.push('Spring en sla als je naar beneden valt: dat is een voltreffer!');
  tips.push('Diep onder de grond zitten diamanten. Pas op voor de lava in de grotten!');
  tips.push('Gouden appels maken je weer gezond. Henk verkoopt ze.');
  tips.push('Een harnas beschermt je tegen de klappen van de schurken.');
  tips.push('Pas op voor cactussen, die prikken!');
  tips.push('Op de bergtoppen ligt sneeuw. Daar heb je een prachtig uitzicht!');
  return tips;
}

class Wanderer {
  constructor(x, y, z, world, home, idx) {
    const info = WANDERERS[idx % WANDERERS.length];
    this.name = info.name;
    this.world = world;
    this.home = home;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.hw = 0.3; this.h = 1.9;
    this.kind = 'animal'; this.type = 'villager';
    this.yaw = Math.random() * Math.PI * 2; this.drawYaw = this.yaw;
    this.state = 'idle'; this.timer = 1 + Math.random() * 3;
    this.talkT = 0; this.hmmT = 3 + Math.random() * 8; this.tip = 0;
    this.walkPhase = 0; this.stuck = 0;
    this.onGround = false; this.hitWall = false;
    this.model = buildVillagerModel(info.robe);
    this.mesh = this.model.group;
    this.mesh.position.copy(this.pos);
  }

  update(dt) {
    const dxp = player.pos.x - this.pos.x, dzp = player.pos.z - this.pos.z;
    const dp = Math.hypot(dxp, dzp);
    this.timer -= dt;
    if (this.talkT > 0) {
      this.talkT -= dt;
      this.state = 'idle';
      this.yaw = Math.atan2(dxp, dzp);
    } else if (this.timer <= 0) {
      if (this.state === 'idle') {
        this.state = 'walk'; this.timer = 2 + Math.random() * 4;
        const hx = this.home.x - this.pos.x, hz = this.home.z - this.pos.z;
        if (Math.hypot(hx, hz) > this.home.r) this.yaw = Math.atan2(hx, hz) + (Math.random() - 0.5) * 0.6;
        else this.yaw += (Math.random() - 0.5) * 2.6;
      } else { this.state = 'idle'; this.timer = 2 + Math.random() * 5; }
    }
    const speed = this.state === 'walk' ? 1.1 : 0;
    let fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    if (speed > 0 && this.onGround) {
      // niet in het water, de lava of een kuil in lopen
      const ax = Math.floor(this.pos.x + fx * 0.9), az = Math.floor(this.pos.z + fz * 0.9), ay = Math.floor(this.pos.y + 0.1);
      const ahead = this.world.get(ax, ay, az), below = this.world.get(ax, ay - 1, az), below2 = this.world.get(ax, ay - 2, az);
      if (ahead === B.WATER || ahead === B.LAVA || below === B.WATER || below === B.LAVA || (!SOLID[ahead] && !SOLID[below] && !SOLID[below2])) {
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

    const moving = Math.hypot(this.vel.x, this.vel.z);
    this.walkPhase += dt * moving * 6;
    this.drawYaw += angleDiff(this.drawYaw, this.yaw) * Math.min(1, dt * 6);
    this.mesh.position.copy(this.pos);
    this.mesh.position.y += Math.abs(Math.sin(this.walkPhase)) * 0.05 * Math.min(1, moving);
    this.mesh.rotation.y = this.drawYaw;
    const head = this.model.head;
    if (dp < 7) {
      head.rotation.y = clamp(angleDiff(this.drawYaw, Math.atan2(dxp, dzp)), -1.1, 1.1);
      this.hmmT -= dt;
      if (this.hmmT <= 0) { this.hmmT = 6 + Math.random() * 8; SND.play('hmm', { at: this.pos, range: 12, vol: 0.7 }); }
    } else head.rotation.y *= 0.95;
    head.rotation.x = this.talkT > 2.4 ? Math.sin(this.talkT * 20) * 0.08 : 0;
  }

  // Slaan = praten: de dorpeling vertelt een tip
  hurt() {
    if (this.talkT > 2.2) return;
    this.talkT = 3;
    SND.play('hmm', { at: this.pos, range: 14 });
    const tips = villagerTips(this);
    HUD.chat(this.name + ': ' + tips[this.tip % tips.length]);
    this.tip++;
  }

  aabb() {
    return [this.pos.x - this.hw, this.pos.y, this.pos.z - this.hw, this.pos.x + this.hw, this.pos.y + this.h, this.pos.z + this.hw];
  }
}
