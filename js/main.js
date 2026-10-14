'use strict';
/* Portaaljacht – spelverloop: portaal -> schurk -> schat + puzzel -> naar huis -> nieuw portaal; camera en hoofdlus */

const SPLASHES = [
  'Zoek het portaal!', 'Nu met lava!', '100% blokjes!', 'Pas op voor de Lavareus!', 'Ook op je telefoon!',
  'Knor knor!', 'Niet in de lava springen!', 'Vierkant is cool!', 'Sla vuurballen terug!', 'Volg het kompas!',
  'Veertien schurken!', 'Verborgen schatten!', 'Handelaar Henk zegt hmm!', 'Glad ijs!', 'Brr, de Vorstreus!',
  'Wie durft de Stormdraak aan?', 'Puzzels in elke kist!',
];

const DEATH_REASONS = {
  fall: 'Viel van te hoog',
  lava: 'Probeerde in lava te zwemmen',
  fire: 'Is verbrand',
  void: 'Viel uit de wereld',
  fireball: 'Geraakt door een vuurbal',
  ice: 'Geraakt door een ijsscherf',
  spike: 'Gespietst door een ijspegel',
  cold: 'Bevroren in de sneeuwstorm',
  orb: 'Geraakt door een schaduwbal',
  shadow: 'Gegrepen door de schaduw',
  lightning: 'Getroffen door de bliksem',
  wind: 'Weggeblazen door de storm',
  cactus: 'Geprikt door een cactus',
  minion: 'Overmeesterd door de handlangers',
};
function deathReason(cause) {
  if (DEATH_REASONS[cause]) return DEATH_REASONS[cause];
  return 'Verslagen door ' + (game.boss ? game.boss.ref : 'een schurk');
}

const game = {
  state: 'loading', worldKind: 'overworld', realm: null,
  renderer: null, scene: null, camera: null, handScene: null, handCam: null,
  owInfo: null, realmInfo: null, world: null,
  owGroup: null, realmGroup: null,
  animals: [], villager: null, boss: null, projectiles: [], hazards: [], minions: [],
  sky: {}, lights: {},
  target: null, targetBlock: null,
  time: 0, shake: 0,
  portalT: 0, portalCooldown: 0, sparkT: 0, ashT: 0, popT: 2,
  texT: 0, texFrame: 0, portalFrame: 0, portalTexT: 0,
  finalDelay: 0, uiName: null,
  perf: { acc: 0, n: 0, lowered: 0 }, baseRatio: 1,

  get stats() { return PROG.stats; },

  selectSlot(i) {
    if (i < 0 || i >= HOTBAR.length) return;
    if (player.selected !== i) { player.equipT = 0; SND.play('click', { vol: 0.6 }); }
    player.selected = i;
    player.bowCharge = 0;
    HUD.setSlot(i);
    setHeldItem(i);
  },

  addProjectile(pr) { this.projectiles.push(pr); this.realmGroup.add(pr.mesh); },
  addMinion(m) { this.minions.push(m); this.realmGroup.add(m.mesh); return m; },
  addHazard(h) { this.hazards.push(h); this.realmGroup.add(h.mesh); },

  // Bij het verslaan van een schurk: al zijn aanvallen verdwijnen
  clearBossAttacks() {
    for (const pr of this.projectiles) if (pr.owner === 'boss') pr.dead = true;
    for (const h of this.hazards) h.dead = true;
    for (const m of this.minions) m.die(true);
    player.fire = 0; player.slow = 0; player.dark = 0;
    player.invuln = Math.max(player.invuln, 3);
  },

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    Input.releaseAll();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    showScreen('pause');
  },

  resume() {
    if (this.state !== 'paused') return;
    showScreen(null);
    this.state = 'playing';
    SND.init();
    if (!Input.touchMode) Input.requestLock(); else goFullscreen();
  },

  // Winkel, puzzel of schatscherm: het spel staat even stil
  openUI(name) {
    if (this.state !== 'playing') return false;
    this.state = 'ui';
    this.uiName = name;
    Input.releaseAll();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    document.getElementById('touch').classList.add('hidden');
    return true;
  },
  closeUI() {
    if (this.state !== 'ui') return;
    this.state = 'playing';
    this.uiName = null;
    HUD.refreshHotbar();
    setHeldItem(player.selected);
    showScreen(null);
    SND.init();
    if (!Input.touchMode) Input.requestLock();
  },

  openShop() {
    if (!this.openUI('shop')) return;
    if (this.villager) this.villager.hurt();
    SND.play('hmm');
    Shop.open();
  },

  onGearChanged() {
    HUD.refreshHotbar();
    HUD.setSlot(player.selected);
    setHeldItem(player.selected);
  },

  useChest(tb) {
    const realm = this.realm;
    if (this.worldKind === 'overworld') { this.useBonusChest(tb); return; }
    if (this.worldKind !== 'realm' || !realm) { HUD.actionbar('Een gewone kist', 1.2); return; }
    if (PROG.phase === 'boss') { HUD.actionbar('Versla eerst ' + realm.bossRef + '!', 1.8); return; }
    if (PROG.phase !== 'treasure') { HUD.actionbar('De kist is leeg. Ga terug door het portaal!', 1.8); return; }
    if (!this.openUI('puzzle')) return;
    SND.play('click');
    Puzzle.open(realm.puzzle, PROG.level, 'Schatkist van ' + realm.bossRef, () => {
      const coins = Math.round(realm.loot.coins * roundScale()), dias = Math.round(realm.loot.diamonds * roundScale());
      Puzzle.showLoot('Schat gevonden!', coins, dias, () => {
        addLoot(coins, dias);
        PROG.phase = 'return';
        PROG.stats.treasures++;
        saveProgress();
        const t = this.realmInfo.treasure;
        FX.confetti(t.x + 0.5, t.y + 1, t.z + 0.5);
        SND.play('coin');
        this.closeUI();
        HUD.title('Schat gevonden!', 'Ga terug door het portaal naar huis', 3.5);
        HUD.chat('Je hebt nu ' + PROG.coins + ' munten en ' + PROG.diamonds + ' diamanten.');
        HUD.chat('Koop er iets moois van bij Handelaar Henk!');
        updateObjective();
      });
    });
  },

  // Verborgen kisten in de bovenwereld (piramide, oude toren): eenmalig, met een makkelijke puzzel
  useBonusChest(tb) {
    const c = tb && (this.owInfo.bonus || []).find((b) => b.x === tb.x && b.y === tb.y && b.z === tb.z);
    if (!c) { HUD.actionbar('Een gewone kist', 1.2); return; }
    if (PROG.looted.includes(c.key)) { HUD.actionbar('Deze kist heb je al leeggehaald', 1.6); return; }
    if (!this.openUI('puzzle')) return;
    SND.play('click');
    Puzzle.open(PROG.looted.length ? 'lights' : 'sequence', 0, c.name, () => {
      const coins = Math.round(c.coins * roundScale()), dias = c.diamonds;
      Puzzle.showLoot(c.name + '!', coins, dias, () => {
        addLoot(coins, dias);
        PROG.looted.push(c.key);
        saveProgress();
        FX.confetti(c.x + 0.5, c.y + 1, c.z + 0.5);
        SND.play('coin');
        this.closeUI();
        HUD.title('Verborgen schat!', 'Je hebt nu ' + PROG.coins + ' munten', 3);
      });
    });
  },

  die(cause) {
    if (player.dead) return;
    player.dead = true;
    player.health = 0;
    PROG.stats.deaths++;
    this.state = 'dead';
    SND.play('death');
    Input.releaseAll();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    document.getElementById('dead-reason').textContent = deathReason(cause);
    setTimeout(() => { if (this.state === 'dead') showScreen('dead'); }, 700);
  },

  respawn() {
    const info = this.worldKind === 'realm' ? this.realmInfo : this.owInfo;
    const sp = this.worldKind === 'realm' ? info.spawn : (info.respawn || info.spawn);
    player.reset(sp, this.worldKind === 'realm' ? info.spawnYaw : (info.respawnYaw || info.spawnYaw));
    this.portalCooldown = 2;
    if (this.worldKind === 'realm') {
      for (const pr of this.projectiles) pr.dead = true;
      for (const h of this.hazards) h.dead = true;
      for (const m of this.minions) m.die(true);
      if (this.boss && this.boss.alive()) {
        this.boss.goHome();
        HUD.title('', this.boss.name + ' wacht op je...', 2.5);
      }
    }
    showScreen(null);
    this.state = 'playing';
    SND.init();
    if (!Input.touchMode) Input.requestLock(); else goFullscreen();
  },

  // Van een zwevend eiland gevallen: een beetje schade en terug naar het begin
  fellOut() {
    const p = player;
    if (p.dead || !this.realmInfo) return;
    p.health -= 6;
    if (p.health <= 0) { this.die('void'); return; }
    HUD.hurt(); SND.play('hurt');
    const info = this.realmInfo;
    p.pos.set(info.spawn.x, info.spawn.y, info.spawn.z);
    p.vel.set(0, 0, 0); p.kbx = p.kbz = p.mvx = p.mvz = 0; p.fallDist = 0;
    p.invuln = 1.5;
    HUD.actionbar('Oei! Je viel naar beneden', 2);
  },

  onBossDying() {
    HUD.actionbar('Je hebt hem bijna!', 2);
  },

  onBossDefeated(boss) {
    const realm = this.realm;
    HUD.bossbar(false);
    SND.play('victory');
    PROG.stats.bosses++;
    const coins = Math.round(realm.bossCoins * roundScale());
    addLoot(coins, 0);
    PROG.phase = 'treasure';
    saveProgress();
    HUD.refreshWallet();
    HUD.title('OVERWINNING!', 'Je hebt ' + boss.ref + ' verslagen! +' + coins + ' munten', 4);
    const c = boss.center();
    let n = 0;
    const burst = () => {
      if (n++ > 6 || this.worldKind !== 'realm') return;
      FX.confetti(c.x + (Math.random() - 0.5) * 6, c.y + 2, c.z + (Math.random() - 0.5) * 6);
      SND.play('pop', { vol: 0.7 });
      setTimeout(burst, 450);
    };
    burst();
    setTimeout(() => {
      if (this.worldKind !== 'realm' || PROG.phase !== 'treasure') return;
      HUD.title('Zoek de schat!', 'Het kompas wijst naar de verborgen kist', 3.5);
      HUD.chat(realm.treasureTip || 'De schat ligt verborgen. Volg het kompas!');
    }, 4200);
    updateObjective();
  },
};

/* ---------- Schermen ---------- */
const SCREENS = ['loading', 'code', 'menu', 'help', 'pause', 'dead', 'win', 'error'];
function showScreen(name) {
  for (const s of SCREENS) document.getElementById('screen-' + s).classList.toggle('hidden', s !== name);
  const playing = name === null;
  HUD.show(game.state !== 'menu' && name !== 'menu' && name !== 'loading' && name !== 'error');
  document.getElementById('touch').classList.toggle('hidden', !(playing && Input.touchMode && game.state === 'playing'));
}

function setLoad(frac, title, sub) {
  if (title) document.getElementById('load-title').textContent = title;
  if (sub !== undefined) document.getElementById('load-sub').textContent = sub;
  document.getElementById('load-fill').style.width = Math.round(frac * 100) + '%';
}

function updateSoundButtons() {
  const t = 'Geluid: ' + (SND.muted ? 'uit' : 'aan');
  document.getElementById('btn-sound').textContent = t;
  document.getElementById('btn-sound-menu').textContent = t;
}

function goFullscreen() {
  if (!Input.touchMode) return;
  try {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      const r = req.call(el, { navigationUI: 'hide' });
      if (r && r.then) r.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
    }
  } catch (e) { /* geen volledig scherm */ }
}

let helpReturn = 'menu';
function setupUI() {
  const on = (id, fn) => document.getElementById(id).addEventListener('click', (e) => { e.preventDefault(); SND.play('click'); fn(); });
  on('btn-play', () => {
    if (hasSave()) {
      const b = document.getElementById('btn-play');
      if (b.dataset.armed !== '1') {
        b.dataset.armed = '1';
        b.textContent = 'Zeker? Je voortgang verdwijnt';
        setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Nieuw spel'; }, 3000);
        return;
      }
    }
    newGame();
  });
  on('btn-continue', () => continueGame());
  on('btn-help', () => { helpReturn = 'menu'; showScreen('help'); });
  on('btn-help2', () => { helpReturn = 'pause'; showScreen('help'); });
  on('btn-help-back', () => showScreen(helpReturn));
  const toggleSound = () => { SND.init(); SND.setMuted(!SND.muted); saveSetting('muted', SND.muted); updateSoundButtons(); };
  on('btn-sound', toggleSound);
  on('btn-sound-menu', toggleSound);
  on('btn-resume', () => game.resume());
  on('btn-restart', () => {
    const b = document.getElementById('btn-restart');
    if (b.dataset.armed === '1') { b.dataset.armed = ''; b.textContent = 'Opnieuw beginnen'; newGame(); return; }
    b.dataset.armed = '1';
    b.textContent = 'Zeker? Klik nog een keer';
    setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Opnieuw beginnen'; }, 3000);
  });
  on('btn-respawn', () => game.respawn());
  on('btn-again', () => newRound());
  on('btn-explore', () => {
    showScreen(null);
    game.state = 'playing';
    SND.init();
    if (!Input.touchMode) Input.requestLock(); else goFullscreen();
  });
  const sens = document.getElementById('sens');
  sens.value = Math.round(Input.sens * 100);
  const sensLabel = () => { document.getElementById('sens-label').textContent = 'Gevoeligheid: ' + sens.value + '%'; };
  sensLabel();
  sens.addEventListener('input', () => { Input.sens = Number(sens.value) / 100; saveSetting('sens', Input.sens); sensLabel(); });
  sens.addEventListener('change', () => sens.blur());
  SND.muted = !!loadSetting('muted', false);
  updateSoundButtons();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.pause();
      if (SND.ctx && SND.ctx.state === 'running') SND.ctx.suspend();
    } else if (SND.ctx && game.state !== 'menu') SND.ctx.resume();
  });
  // Ctrl+W of per ongeluk wegklikken: eerst vragen
  window.addEventListener('beforeunload', (e) => {
    if (['playing', 'paused', 'dead', 'ui'].includes(game.state)) { saveProgress(); e.preventDefault(); e.returnValue = ''; }
  });
  document.getElementById('btn-restart').textContent = 'Opnieuw beginnen';
  refreshMenuButtons();
}

function refreshMenuButtons() {
  const can = hasSave();
  document.getElementById('btn-continue').classList.toggle('hidden', !can);
  // iPhone/iPad in Safari (niet al als app geopend, niet in een ingebed venster): tip voor volledig scherm
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  document.getElementById('home-hint').classList.toggle('hidden', !(ios && !standalone && !framed));
}

/* ---------- Renderer, lucht en licht ---------- */
function setupRenderer() {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  game.baseRatio = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2);
  renderer.setPixelRatio(game.baseRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  game.renderer = renderer;

  game.scene = new THREE.Scene();
  game.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 220);
  game.camera.rotation.order = 'YXZ';
  game.handScene = new THREE.Scene();
  game.handCam = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);

  const L = game.lights;
  L.amb = new THREE.AmbientLight(0xffffff, 0.75);
  L.dir = new THREE.DirectionalLight(0xffffff, 0.55);
  L.dir.position.set(0.4, 1, 0.3);
  game.scene.add(L.amb, L.dir);
  L.hAmb = new THREE.AmbientLight(0xffffff, 0.8);
  L.hDir = new THREE.DirectionalLight(0xffffff, 0.55);
  L.hDir.position.set(-0.3, 1, 0.8);
  game.handScene.add(L.hAmb, L.hDir);

  FX.init(game.scene);
  initViewModel(game.scene, game.handScene);
  buildSky();
  game.owGroup = new THREE.Group();
  game.realmGroup = new THREE.Group();

  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    game.camera.aspect = w / h; game.camera.updateProjectionMatrix();
    game.handCam.aspect = w / h; game.handCam.updateProjectionMatrix();
    updateParticleScale(h * renderer.getPixelRatio());
  };
  game.onResize = onResize;
  onResize();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
}

function buildSky() {
  const S = game.sky;
  S.group = new THREE.Group();
  const geo = new THREE.SphereGeometry(160, 24, 12);
  const pos = geo.attributes.position;
  const top = new THREE.Color(0x6a98ff), hor = new THREE.Color(0xc0d8ff);
  const cols = [];
  for (let i = 0; i < pos.count; i++) {
    const t = clamp(pos.getY(i) / 160 * 1.7, 0, 1);
    const c = hor.clone().lerp(top, t);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  S.dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  S.dome.renderOrder = -10;
  S.group.add(S.dome);
  S.sun = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ map: Tex.sun, transparent: true, fog: false, depthWrite: false }));
  S.sun.renderOrder = -9;
  S.group.add(S.sun);
  S.clouds = new THREE.Mesh(new THREE.PlaneGeometry(640, 640),
    new THREE.MeshBasicMaterial({ map: Tex.clouds, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  S.clouds.rotation.x = -Math.PI / 2;
  S.clouds.position.set(OW_SIZE / 2, OW_HEIGHT + 4, OW_SIZE / 2);
  S.clouds.renderOrder = 3;
}

const OW_FOG = 0xc0d8ff;
function applyAtmosphere() {
  const s = game.scene;
  const far = game.perf.lowered ? 0.82 : 1;
  const L = game.lights;
  if (game.worldKind === 'overworld') {
    s.background = new THREE.Color(OW_FOG);
    s.fog = new THREE.Fog(OW_FOG, 34 * far, 86 * far);
    L.amb.color.setHex(0xffffff); L.amb.intensity = 0.75;
    L.dir.color.setHex(0xffffff); L.dir.intensity = 0.55;
    L.hAmb.color.setHex(0xffffff);
  } else {
    const a = game.realm.atmosphere;
    s.background = new THREE.Color(a.background);
    s.fog = new THREE.Fog(a.fog, a.near * far, a.far * far);
    L.amb.color.setHex(a.amb); L.amb.intensity = a.ambI;
    L.dir.color.setHex(a.dir); L.dir.intensity = a.dirI;
    L.hAmb.color.setHex(a.hand);
  }
  game.fogNormal = { color: s.fog.color.clone(), near: s.fog.near, far: s.fog.far };
}

/* ---------- Werelden ---------- */
function disposeGroup(g) {
  while (g.children.length) {
    const c = g.children[0];
    g.remove(c);
    c.traverse((o) => {
      if (o.isMesh && o.geometry && !o.geometry.userShared) o.geometry.dispose();
    });
  }
}

function setWorld(kind) {
  const s = game.scene;
  if (game.world) s.remove(game.world.group);
  s.remove(game.owGroup); s.remove(game.realmGroup); s.remove(game.sky.group); s.remove(game.sky.clouds);
  game.worldKind = kind;
  const info = kind === 'overworld' ? game.owInfo : game.realmInfo;
  game.world = info.world;
  s.add(game.world.group);
  const showSky = kind === 'overworld' || (game.realm && game.realm.atmosphere.sky);
  if (kind === 'overworld') { s.add(game.owGroup); s.add(game.sky.clouds); }
  else s.add(game.realmGroup);
  if (showSky) s.add(game.sky.group);
  MAT.portal.map = portalTexture(Math.min(PROG.level, REALMS.length - 1));
  applyAtmosphere();
  FX.clear();
  if (typeof updateShadowEyes === 'function') updateShadowEyes(null);
  game.target = null; game.targetBlock = null;
  SND.setHum(0);
  SND.setAmbient(kind === 'realm' ? (game.realm.ambientSound || 0) : 0);
  if (kind === 'overworld') { HUD.bossbar(false); SND.setMusic('calm'); }
  else if (game.boss && game.boss.awake()) { HUD.bossbar(true, game.boss.hp / game.boss.maxHp, game.boss.enraged, game.boss.name); SND.setMusic('boss', PROG.level); }
  else { HUD.bossbar(false); SND.setMusic('none'); }
  updateObjective();
}

// Doel en kompas bij de huidige fase
function updateObjective() {
  const realm = currentRealm();
  if (game.worldKind === 'overworld') {
    if (allBossesBeaten()) {
      HUD.objective('Alle schurken verslagen!', 'Je bent een echte held. Bouw lekker verder!');
      HUD.showCompass(false);
    } else {
      HUD.objective(PROG.level === 0 ? 'Vind het portaal' : 'Vind het nieuwe portaal',
        PROG.level === 0 ? 'Volg het kompas rechtsboven' : 'Naar ' + realm.name + ' – volg het kompas');
      HUD.showCompass(true, 'Portaal');
    }
  } else if (PROG.phase === 'boss') {
    HUD.objective('Versla ' + realm.bossRef, realm.tip || '');
    HUD.showCompass(false);
  } else if (PROG.phase === 'treasure') {
    HUD.objective('Zoek de schat', realm.treasureTip || 'Volg het kompas naar de kist');
    HUD.showCompass(true, 'Schat');
  } else {
    HUD.objective('Ga terug naar huis', 'Stap in het portaal');
    HUD.showCompass(true, 'Portaal');
  }
}

function compassTarget() {
  if (game.worldKind === 'overworld') return allBossesBeaten() ? null : game.owInfo.portal;
  if (PROG.phase === 'treasure') { const t = game.realmInfo.treasure; return { x: t.x + 0.5, y: t.y, z: t.z + 0.5 }; }
  if (PROG.phase === 'return') return game.realmInfo.portal;
  return null;
}

// Zoek een vrije plek (2 blokken lucht) voor de speler
function freeSpot(world, x, y, z) {
  const probe = { pos: new THREE.Vector3(x, y, z), hw: 0.3, h: 1.8 };
  for (let i = 0; i < 30 && entityOverlaps(world, probe); i++) probe.pos.y = Math.floor(probe.pos.y) + 1;
  return { x: probe.pos.x, y: probe.pos.y, z: probe.pos.z };
}

// Plek voor het portaal in de bovenwereld (om er na thuiskomst te staan)
function spotBeforePortal(info) {
  const pc = info.portal, axis = info.portalAxis;
  const sx = axis === 'x' ? pc.x : pc.x + 2.5, sz = axis === 'x' ? pc.z + 2.5 : pc.z;
  const s = freeSpot(info.world, sx, Math.floor(pc.y - 2.5), sz);
  return { spot: s, yaw: axis === 'x' ? 0 : -Math.PI / 2 };
}

// De bovenwereld (opnieuw) maken voor de huidige voortgang
function buildOverworld() {
  if (game.owInfo) game.owInfo.world.dispose();
  if (game.realmInfo) game.realmInfo.world.dispose();
  game.realmInfo = null; game.realm = null; game.boss = null;
  disposeGroup(game.owGroup); disposeGroup(game.realmGroup);
  game.animals = []; game.projectiles = []; game.hazards = []; game.minions = []; game.villager = null;
  if (game.world) game.scene.remove(game.world.group);
  game.world = null;
  const info = genOverworld(PROG.seed);
  // al verder in het spel? speel de oude portalen na zoals leaveRealm ze maakte,
  // zodat het portaal van de huidige schurk precies op dezelfde plek staat als vóór het opslaan
  if (PROG.level > 0) {
    let prev = info.portal, axis = info.portalAxis;
    for (let l = 1; l <= Math.min(PROG.level, REALMS.length); l++) {
      const back = spotBeforePortal({ world: info.world, portal: prev, portalAxis: axis });
      breakOverworldPortal(info.world, prev);
      if (l === REALMS.length) break;
      const pr = placeOverworldPortal(info.world, info.spawn, mulberry32(PROG.seed + l * 7919), l, info.avoid.concat([{ x: back.spot.x, z: back.spot.z, r: 12 }]), prev);
      prev = pr.center; axis = pr.axis;
    }
    if (!allBossesBeaten()) { info.portal = prev; info.portalAxis = axis; }
  }
  info.world.computeTops();
  // eerst alles rond het dorp en het portaal, de verre stukken bouwen daarna tijdens het spelen
  info.world.buildAll(info.spawn.x, info.spawn.z, 72);
  info.world.dirty.clear();
  game.owInfo = info;
  const types = ['pig', 'sheep', 'cow'];
  info.animalSpots.forEach((sp, i) => {
    const a = new Animal(sp.type || types[i % 3], sp.x, sp.y, sp.z, info.world);
    a.mesh.position.copy(a.pos);
    game.animals.push(a);
    game.owGroup.add(a.mesh);
  });
  info.villagers.forEach((sp, i) => {
    const v = new Wanderer(sp.x, sp.y, sp.z, info.world, info.village, i);
    game.animals.push(v);
    game.owGroup.add(v.mesh);
  });
  const sh = info.shop;
  game.villager = new Villager(sh.x, sh.y, sh.z, sh.yaw);
  game.owGroup.add(game.villager.mesh);
  game.owKey = PROG.seed + ':' + PROG.level;
  setWorld('overworld');
}

function newGame() {
  resetProgress((Math.random() * 1e9) >>> 0);
  saveProgress();
  setLoad(0.2, 'Nieuwe wereld genereren', 'Blokken stapelen...');
  game.state = 'loading';
  showScreen('loading');
  setTimeout(() => {
    buildOverworld();
    player.reset(game.owInfo.spawn, game.owInfo.spawnYaw);
    setLoad(1);
    startPlaying(true);
  }, 60);
}

function continueGame() {
  if (!loadProgress()) { newGame(); return; }
  setLoad(0.2, 'Je wereld laden', 'Even geduld...');
  game.state = 'loading';
  showScreen('loading');
  setTimeout(() => {
    // de wereld achter het menu is al precies deze wereld: niet nog eens bouwen
    if (!(game.owInfo && game.worldKind === 'overworld' && game.owKey === PROG.seed + ':' + PROG.level)) buildOverworld();
    player.reset(game.owInfo.spawn, game.owInfo.spawnYaw);
    setLoad(1);
    startPlaying(false);
  }, 60);
}

// Na alle schurken: opnieuw, maar alles is sterker (je spullen houd je)
function newRound() {
  PROG.round++;
  PROG.level = 0;
  PROG.phase = 'portal';
  saveProgress();
  setLoad(0.3, 'Ronde ' + PROG.round, 'De schurken worden sterker...');
  game.state = 'loading';
  showScreen('loading');
  setTimeout(() => {
    buildOverworld();
    player.reset(game.owInfo.spawn, game.owInfo.spawnYaw);
    startPlaying(false);
    HUD.title('Ronde ' + PROG.round + '!', 'Alle schurken zijn terug, en sterker', 4);
  }, 60);
}

function startPlaying(fresh) {
  SND.init();
  SND.setMuted(SND.muted);
  goFullscreen();
  game.state = 'playing';
  game.portalT = 0; game.portalCooldown = 1; game.finalDelay = 0;
  showScreen(null);
  HUD.clearChat();
  HUD.refreshHotbar();
  game.selectSlot(0);
  if (!Input.touchMode) Input.requestLock();
  if (document.hidden) game.pause();
  const realm = currentRealm();
  if (fresh) {
    HUD.title('Vind het portaal!', 'Volg het kompas rechtsboven', 4);
    if (Input.touchMode) {
      HUD.chat('Linkerduim: lopen. Rechterduim: rondkijken.');
      HUD.chat('Tik om te slaan, vasthouden om een blok te breken.');
    } else {
      HUD.chat('WASD = lopen, spatie = springen, muis = kijken.');
      HUD.chat('Klik = slaan, ingedrukt houden = breken, rechtsklik = bouwen.');
    }
    HUD.chat('Voor je staat Handelaar Henk. Tik op hem om zijn winkel te zien.');
  } else if (allBossesBeaten()) {
    HUD.title('Welkom terug, held!', '', 3);
    game.finalDelay = 1.5; // het overwinningsscherm (met 'Nog een ronde!') komt terug
  } else {
    HUD.title('Welkom terug!', 'Op naar ' + realm.name + ' en ' + realm.bossRef, 3.5);
  }
  SND.setMusic('calm');
}

function enterRealm() {
  const realm = currentRealm();
  game.realm = realm;
  if (game.realmInfo) game.realmInfo.world.dispose();
  disposeGroup(game.realmGroup);
  game.projectiles = []; game.hazards = []; game.minions = [];
  const info = realm.gen(((PROG.seed ^ 0x5bd1e995) + PROG.level * 101 + PROG.round * 7) >>> 0);
  info.world.computeTops();
  info.world.buildAll();
  game.realmInfo = info;
  game.boss = realm.makeBoss(info.world, info);
  game.realmGroup.add(game.boss.mesh);
  if (game.boss.animate) game.boss.animate(0.016, 0);
  PROG.phase = 'boss';
  saveProgress();
  setWorld('realm');
  player.reset(info.spawn, info.spawnYaw || 0);
  if (realm.onEnter) realm.onEnter(info);
}

function leaveRealm() {
  const finished = PROG.phase === 'return';
  if (finished) PROG.level++;
  const ow = game.owInfo;
  // terug bij het oude portaal
  const back = spotBeforePortal(ow);
  if (finished) {
    breakOverworldPortal(ow.world, ow.portal);
    if (!allBossesBeaten()) {
      const prev = ow.portal;
      const pr = placeOverworldPortal(ow.world, ow.spawn, mulberry32(PROG.seed + PROG.level * 7919), PROG.level, ow.avoid.concat([{ x: back.spot.x, z: back.spot.z, r: 12 }]), prev);
      ow.portal = pr.center; ow.portalAxis = pr.axis;
      PROG.phase = 'portal';
    } else PROG.phase = 'done';
    ow.world.updateDirty(999);
  }
  ow.respawn = back.spot; ow.respawnYaw = back.yaw;
  saveProgress();
  if (game.realmInfo) { game.realmInfo.world.dispose(); game.realmInfo = null; }
  disposeGroup(game.realmGroup);
  game.boss = null; game.projectiles = []; game.hazards = []; game.minions = [];
  setWorld('overworld');
  player.reset(back.spot, back.yaw);
  return finished;
}

function travel() {
  const toRealm = game.worldKind === 'overworld';
  game.portalT = 0;
  HUD.setPortalFx(0);
  game.state = 'loading';
  Input.releaseAll();
  const realm = currentRealm();
  setLoad(0.2, toRealm ? realm.name + ' betreden' : 'Terug naar huis', toRealm ? 'Pas goed op...' : 'Bijna thuis...');
  showScreen('loading');
  setTimeout(() => {
    let finished = false;
    if (toRealm) enterRealm();
    else finished = leaveRealm();
    game.selectSlot(player.selected);
    game.portalCooldown = 3;
    setLoad(1);
    setTimeout(() => {
      showScreen(null);
      game.state = 'playing';
      if (!Input.touchMode) Input.requestLock();
      if (document.hidden) game.pause();
      if (toRealm) {
        HUD.title(realm.name, 'Versla ' + realm.bossRef + '!', 3.2);
        if (realm.intro) HUD.chat(realm.intro);
        if (realm.tip) HUD.chat(realm.tip);
      } else if (finished && allBossesBeaten()) {
        game.finalDelay = 2.5;
        HUD.title('Welkom thuis, held!', 'Je hebt alle ' + REALMS.length + ' schurken verslagen!', 4);
      } else if (finished) {
        const next = currentRealm();
        HUD.title('Welkom thuis!', 'Er is ergens een nieuw portaal verschenen...', 4);
        SND.play('portal', { vol: 0.5 });
        HUD.chat('Het kompas wijst naar het nieuwe portaal, naar ' + next.name + '.');
        if (PROG.coins >= 25) HUD.chat('Tip: koop eerst betere spullen bij Handelaar Henk!');
      } else {
        HUD.title('Welkom thuis!', '', 2.5);
      }
    }, 450);
  }, 60);
}

function showFinalWin() {
  game.state = 'won';
  Input.releaseAll();
  if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
  const s = PROG.stats;
  const mm = Math.floor(s.time / 60), ss = Math.floor(s.time % 60);
  document.querySelector('#screen-win .win-sub').textContent = 'Je hebt alle ' + REALMS.length + ' schurken verslagen! In een nieuwe ronde worden ze sterker.';
  document.getElementById('win-stats').innerHTML =
    'Speeltijd: <b>' + mm + ':' + String(ss).padStart(2, '0') + '</b><br>' +
    'Schurken verslagen: <b>' + s.bosses + '</b> · Schatten gevonden: <b>' + s.treasures + '</b><br>' +
    'Zwaardklappen raak: <b>' + s.hits + '</b> · Teruggekaatst: <b>' + s.reflects + '</b><br>' +
    'Munten: <b>' + PROG.coins + '</b> · Diamanten: <b>' + PROG.diamonds + '</b><br>' +
    'Keer doodgegaan: <b>' + s.deaths + '</b>';
  document.getElementById('btn-again').textContent = 'Nog een ronde!';
  HUD.clearTitle(); HUD.clearChat();
  showScreen('win');
  SND.play('levelup');
  SND.play('victory');
}

/* ---------- Per frame ---------- */
function updatePortal(dt) {
  game.portalCooldown -= dt;
  const inPortal = playerTouches(B.PORTAL);
  let active = true, msg = '';
  if (game.worldKind === 'realm') {
    if (PROG.phase === 'boss') { active = false; msg = 'Het portaal werkt pas als ' + game.realm.bossRef + ' verslagen is!'; }
    else if (PROG.phase === 'treasure') { active = false; msg = 'Zoek eerst de schat! Volg het kompas.'; }
  } else if (allBossesBeaten()) active = false;
  else if (!currentRealm().gen) { active = false; msg = currentRealm().name + ' wordt nog gebouwd. Kom straks terug!'; }
  if (!active) {
    if (inPortal && game.portalCooldown <= 0 && msg) HUD.actionbar(msg, 1.5);
    game.portalT = 0;
    HUD.setPortalFx(0);
    return;
  }
  if (inPortal && game.portalCooldown <= 0) {
    if (game.portalT === 0) SND.play('portal');
    game.portalT += dt;
    if (game.portalT >= 1.7) { travel(); return; }
  } else game.portalT = Math.max(0, game.portalT - dt * 2);
  HUD.setPortalFx(Math.min(1, game.portalT / 1.7));
}

function updateEntities(dt) {
  if (game.worldKind === 'overworld') {
    for (const a of game.animals) {
      const near = Math.abs(a.pos.x - player.pos.x) < 64 && Math.abs(a.pos.z - player.pos.z) < 64;
      if (near) a.update(dt);
      a.mesh.visible = near;
    }
    if (game.villager) game.villager.update(dt);
  } else {
    if (game.boss && game.boss.state !== 'dead') game.boss.update(dt);
    for (const pr of game.projectiles) if (!pr.dead) pr.update(dt);
    for (const h of game.hazards) if (!h.dead) h.update(dt);
    for (const m of game.minions) if (!m.dead) m.update(dt);
    for (let i = game.minions.length - 1; i >= 0; i--) {
      if (game.minions[i].dead) { game.realmGroup.remove(game.minions[i].mesh); game.minions.splice(i, 1); }
    }
    for (let i = game.projectiles.length - 1; i >= 0; i--) {
      if (game.projectiles[i].dead) { game.realmGroup.remove(game.projectiles[i].mesh); game.projectiles.splice(i, 1); }
    }
    for (let i = game.hazards.length - 1; i >= 0; i--) {
      if (game.hazards[i].dead) { game.realmGroup.remove(game.hazards[i].mesh); game.hazards[i].dispose(); game.hazards.splice(i, 1); }
    }
  }
}

function updateAmbience(dt) {
  const p = player;
  if (game.worldKind === 'overworld') {
    const pc = game.owInfo.portal;
    const d = Math.hypot(pc.x - p.pos.x, pc.z - p.pos.z);
    if (!allBossesBeaten() && d < 48) {
      game.sparkT += dt * (d < 20 ? 40 : 18);
      while (game.sparkT > 1) { game.sparkT -= 1; FX.portalSparkle(pc, game.owInfo.portalAxis); }
    }
    SND.setHum(allBossesBeaten() ? 0 : clamp(1 - d / 20, 0, 1));
    if (game.state === 'playing' && !allBossesBeaten()) {
      const realm = currentRealm();
      if (!realm.gen) HUD.objective('Nieuw portaal gevonden!', realm.name + ' wordt nog gebouwd. Kom straks terug!');
      else if (d < 9) HUD.objective(PROG.level === 0 ? 'Vind het portaal' : 'Vind het nieuwe portaal', 'Je bent er bijna! Spring op de rand en stap erin!');
      else if (PROG.level > 0) HUD.objective('Vind het nieuwe portaal', 'Naar ' + realm.name + ' – volg het kompas');
    }
  } else {
    const realm = game.realm;
    if (realm.ambience) realm.ambience(dt, game.realmInfo);
    const pc = game.realmInfo.portal;
    if (PROG.phase === 'return') {
      game.sparkT += dt * 30;
      while (game.sparkT > 1) { game.sparkT -= 1; FX.portalSparkle(pc, game.realmInfo.portalAxis || 'x'); }
    } else if (Math.random() < dt * 6) FX.portalSparkle(pc, game.realmInfo.portalAxis || 'x');
    // schatglinstering zodat de plek opvalt
    if (PROG.phase === 'treasure' && Math.random() < dt * 12) {
      const t = game.realmInfo.treasure;
      FX.glow.spawn(t.x + Math.random(), t.y + 1 + Math.random() * 6, t.z + Math.random(), 0, 1.5, 0, 1, 0.9, 0.3, 1.2, 0, 0);
    }
  }
  const tgt = compassTarget();
  if (tgt) {
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    const dx = tgt.x - p.pos.x, dz = tgt.z - p.pos.z;
    HUD.drawCompass(Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz));
    HUD.compassDist(Math.hypot(dx, dz));
  }
}

function animateTextures(dt) {
  game.texT += dt;
  if (game.texT > 0.11) {
    game.texT = 0; game.texFrame++;
    setStripFrame(Tex.water, game.texFrame);
    setStripFrame(Tex.lava, Math.floor(game.texFrame / 2));
  }
  game.portalTexT += dt;
  if (game.portalTexT > 0.06) { game.portalTexT = 0; game.portalFrame++; setStripFrame(MAT.portal.map, game.portalFrame); }
  if (game.sky.clouds) game.sky.clouds.material.map.offset.x = (game.time * 0.0016) % 1;
}

function applyCamera(dt) {
  const p = player, cam = game.camera;
  if (game.state === 'menu' || (game.state === 'loading' && !game.owInfo)) {
    const sp = game.owInfo ? game.owInfo.spawn : { x: 56, y: 20, z: 56 };
    cam.position.set(sp.x, sp.y + 7, sp.z);
    cam.rotation.set(-0.12, game.time * 0.05, 0);
  } else {
    let x = p.pos.x, y = p.pos.y + (p.dead ? 0.35 : p.eye), z = p.pos.z;
    const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    const bobX = Math.sin(p.bobPhase) * 0.045 * p.bobAmt;
    x += rx * bobX; z += rz * bobX;
    y -= Math.abs(Math.cos(p.bobPhase)) * 0.06 * p.bobAmt;
    game.shake = Math.max(0, game.shake - dt * 1.6);
    if (game.shake > 0) {
      const k = game.shake * 0.22;
      x += (Math.random() - 0.5) * k; y += (Math.random() - 0.5) * k; z += (Math.random() - 0.5) * k;
    }
    cam.position.set(x, y, z);
    let roll = Math.sin(p.bobPhase) * 0.006 * p.bobAmt;
    if (p.hurtT > 0) roll += Math.sin((0.45 - p.hurtT) / 0.45 * Math.PI) * 0.1 * (p.hurtSide || 1);
    if (p.dead) roll = 0.5;
    cam.rotation.set(p.pitch, p.yaw, roll);
  }
  const fovTarget = 72 + (player.sprinting && game.state === 'playing' ? 9 : 0) - player.bowCharge * 8 +
    game.portalT * 10 * (0.7 + Math.sin(game.time * 9) * 0.3);
  if (Math.abs(cam.fov - fovTarget) > 0.05) {
    cam.fov += (fovTarget - cam.fov) * Math.min(1, dt * 8);
    cam.updateProjectionMatrix();
  }
  // onder water of in lava: dichte mist
  const fog = game.scene.fog;
  if (fog && game.fogNormal) {
    const fl = game.state === 'playing' || game.state === 'paused' ? p.eyeIn : null;
    if (fl === 'water') { fog.color.setHex(0x1d3c8f); fog.near = 0.5; fog.far = 16; }
    else if (fl === 'lava') { fog.color.setHex(0xd04000); fog.near = 0.1; fog.far = 2.5; }
    else { fog.color.copy(game.fogNormal.color); fog.near = game.fogNormal.near; fog.far = game.fogNormal.far; }
    if (game.worldKind === 'overworld') game.scene.background.copy(fog.color);
  }
  if (game.sky.group.parent) {
    game.sky.group.position.copy(cam.position);
    game.sky.sun.position.set(0.35 * 120, 0.72 * 120, -0.6 * 120);
    game.sky.sun.lookAt(0, 0, 0);
  }
}

function render() {
  const r = game.renderer;
  r.clear();
  r.render(game.scene, game.camera);
  if ((game.state === 'playing' || game.state === 'paused' || game.state === 'ui') && !player.dead) {
    r.clearDepth();
    r.render(game.handScene, game.handCam);
  }
}

// Te traag op een telefoon? Dan iets minder pixels en een kortere kijkafstand.
function watchPerformance(dt) {
  const P = game.perf;
  P.acc += dt; P.n++;
  if (P.acc < 2.5) return;
  const avg = P.acc / P.n;
  P.acc = 0; P.n = 0;
  if (avg > 1 / 26 && game.state === 'playing') {
    const cur = game.renderer.getPixelRatio();
    if (cur > 0.75) {
      game.renderer.setPixelRatio(Math.max(0.75, cur - 0.25));
      game.onResize();
    }
    if (!P.lowered) { P.lowered = 1; applyAtmosphere(); }
  }
}

let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  tick(now);
}

function tick(now) {
  let dt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (!(dt > 0)) dt = 1 / 60;
  dt = Math.min(dt, 0.05);
  game.time += dt;
  animateTextures(dt);

  if (game.state === 'playing') {
    PROG.stats.time += dt;
    game.saveT = (game.saveT || 0) + dt;
    if (game.saveT > 30) { game.saveT = 0; saveProgress(); }
    updatePlayer(dt);
    if (game.state === 'playing') {
      updateEntities(dt);
      handleActions(dt);
      updatePortal(dt);
    }
    if (game.finalDelay > 0 && game.state === 'playing') {
      game.finalDelay -= dt;
      if (game.finalDelay <= 0) showFinalWin();
    }
  } else if (game.state === 'dead' || game.state === 'won') {
    updateEntities(dt);
  } else if (game.state === 'menu') {
    for (const a of game.animals) a.update(dt);
    if (game.villager) game.villager.update(dt);
  }
  if (game.state !== 'playing') { VM.outline.visible = false; VM.crack.visible = false; }

  if (game.world) {
    // tijdens pauze staat de wereld stil (geen afbrokkelende randen of tikkende vallen)
    if (game.state !== 'paused') {
      updateAmbience(dt);
      FX.update(dt, game.world);
    }
    game.world.updateDirty(2);
    game.cullT = (game.cullT || 0) - dt;
    const cp = game.cullPos;
    const jumped = !cp || cp.world !== game.world || Math.abs(cp.x - player.pos.x) + Math.abs(cp.z - player.pos.z) > 8;
    if ((game.cullT <= 0 || jumped) && game.scene.fog) {
      game.cullT = 0.25;
      game.cullPos = { x: player.pos.x, z: player.pos.z, world: game.world };
      game.world.cull(player.pos.x, player.pos.z, (game.fogNormal || game.scene.fog).far + 6);
    }
  }
  HUD.update(dt);
  updateViewModel(dt);
  applyCamera(dt);
  if (game.world) render();
  Input.endFrame();
  SND.updateMusic();
  watchPerformance(dt);
}

/* ---------- Toegangscode ----------
   Houdt toevallige bezoekers tegen. Echte beveiliging is het niet: alles draait in de browser.
   In de code staat alleen een hash van de code, niet de code zelf. Na de goede code onthoudt dit apparaat het. */
const CODE_HASH = 'cslxdr';
const CODE_KEY = 'portaaljacht.code';
function codeHash(s) {
  let h = 2166136261 >>> 0;
  const t = 'portaaljacht/' + s;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}

const CodeGate = {
  val: '', busy: false,

  unlocked() {
    try { return localStorage.getItem(CODE_KEY) === CODE_HASH; } catch (e) { return false; }
  },

  init() {
    this.digits = document.getElementById('code-digits');
    this.msg = document.getElementById('code-msg');
    const pad = document.getElementById('code-pad');
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'wis', '0', '']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mcbtn' + (k === 'wis' ? ' code-wis' : '') + (k === '' ? ' gap' : '');
      b.textContent = k === 'wis' ? 'Wis' : k;
      if (k === '') b.tabIndex = -1;
      else {
        b.addEventListener('click', (e) => { e.preventDefault(); this.press(k); });
        // met de muis geen focus op de knop, anders tikt Enter dat cijfer nog een keer in
        b.addEventListener('mousedown', (e) => e.preventDefault());
      }
      pad.appendChild(b);
    }
    window.addEventListener('keydown', (e) => {
      if (document.getElementById('screen-code').classList.contains('hidden')) return;
      if (/^(Digit|Numpad)[0-9]$/.test(e.code)) { e.preventDefault(); if (!e.repeat) this.press(e.code.slice(-1)); }
      else if (e.code === 'Backspace' || e.code === 'Delete') { e.preventDefault(); this.press('wis'); }
    });
  },

  show() {
    this.val = ''; this.busy = false;
    this.msg.textContent = '';
    this.render();
    showScreen('code');
  },

  render() {
    const spans = this.digits.children;
    for (let i = 0; i < spans.length; i++) {
      spans[i].textContent = i < this.val.length ? '*' : '';
      spans[i].classList.toggle('cur', i === this.val.length);
    }
  },

  press(k) {
    if (this.busy) return;
    SND.init();
    SND.play('click');
    if (k === 'wis') this.val = this.val.slice(0, -1);
    else if (this.val.length < 4) this.val += k;
    this.msg.textContent = '';
    this.render();
    if (this.val.length === 4) { this.busy = true; setTimeout(() => this.check(), 180); }
  },

  check() {
    if (codeHash(this.val) === CODE_HASH) {
      try { localStorage.setItem(CODE_KEY, CODE_HASH); } catch (e) { /* dan vragen we het de volgende keer weer */ }
      SND.play('levelup');
      this.busy = false;
      showScreen('menu');
      return;
    }
    SND.play('hurt');
    this.msg.textContent = 'Verkeerde code!';
    this.digits.classList.remove('wrong');
    void this.digits.offsetWidth; // animatie opnieuw starten
    this.digits.classList.add('wrong');
    // meteen opnieuw kunnen typen; alleen het schudden duurt nog even
    this.val = ''; this.busy = false; this.render();
    setTimeout(() => this.digits.classList.remove('wrong'), 500);
  },
};

/* ---------- Testhulp (alleen voor ontwikkelen) ---------- */
const DEBUG = {
  // direct naar wereld `level` (0..3)
  realm(level) {
    PROG.level = level; PROG.phase = 'portal';
    if (game.worldKind !== 'overworld') leaveRealm();
    enterRealm();
    game.state = 'playing'; showScreen(null);
  },
  killBoss() { if (game.boss && game.boss.alive()) game.boss.hurt(game.boss.hp + 1, 'fireball'); },
  // naar een plek in de huidige wereld (bovenop het hoogste blok)
  tp(x, z) {
    const s = freeSpot(game.world, x + 0.5, Math.max(0, game.world.topAt(Math.floor(x), Math.floor(z))) + 1, z + 0.5);
    player.pos.set(s.x, s.y, s.z); player.vel.set(0, 0, 0);
  },
  rich() { PROG.coins += 500; PROG.diamonds += 30; PROG.apples += 5; HUD.refreshHotbar(); },
  toTreasure() {
    const t = game.realmInfo.treasure;
    const s = freeSpot(game.world, t.x + 1.5, t.y, t.z + 0.5);
    player.pos.set(s.x, s.y, s.z);
  },
};

/* ---------- Opstarten ---------- */
function boot() {
  if (!window.THREE) {
    document.getElementById('screen-loading').classList.add('hidden');
    document.getElementById('screen-error').classList.remove('hidden');
    return;
  }
  setLoad(0.05, 'Wereld genereren', 'Texturen tekenen...');
  setTimeout(() => {
    try {
      buildAllTextures();
      buildMaterials();
      buildMobTextures();
      document.getElementById('screen-loading').style.backgroundImage = 'url(' + Tex.dirtURL + ')';
      HUD.init();
      Puzzle.init();
      Shop.init();
      setupRenderer();
      Input.init(game.renderer.domElement);
      setupUI();
      CodeGate.init();
      setLoad(0.35, 'Wereld genereren', 'Bergen en bomen bouwen...');
    } catch (e) {
      showBootError(e);
      return;
    }
    setTimeout(() => {
      try {
        // een wereld voor op de achtergrond van het menu (de opgeslagen wereld als die er is)
        const saved = loadProgress();
        if (!saved) resetProgress((Math.random() * 1e9) >>> 0);
        buildOverworld();
        player.pos.set(game.owInfo.spawn.x, game.owInfo.spawn.y, game.owInfo.spawn.z);
        setLoad(1, 'Wereld genereren', 'Klaar!');
        document.getElementById('splash').textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
        game.state = 'menu';
        refreshMenuButtons();
        // eerst de toegangscode, behalve als dit apparaat hem al eens goed heeft ingevoerd
        if (CodeGate.unlocked()) showScreen('menu');
        else CodeGate.show();
        requestAnimationFrame(frame);
      } catch (e) {
        showBootError(e);
      }
    }, 40);
  }, 40);
}

function showBootError(e) {
  console.error(e);
  document.getElementById('error-text').textContent = 'Er ging iets mis bij het opstarten: ' + (e && e.message ? e.message : e);
  showScreen('error');
}

boot();
