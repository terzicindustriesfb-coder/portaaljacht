'use strict';
/* Portaaljacht – vierkante deeltjes (brokjes, vuur, portaalvonken) */

// Vierkante punten met een maximale grootte, zodat deeltjes vlak voor de camera niet het hele beeld vullen.
const PARTICLE_MATS = [];
function particleMaterial(size) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      size: { value: size }, scale: { value: 300 }, maxSize: { value: 28 },
    }]),
    vertexShader: [
      'uniform float size;', 'uniform float scale;', 'uniform float maxSize;',
      'attribute vec3 color;', 'varying vec3 vColor;',
      '#include <fog_pars_vertex>',
      'void main() {',
      '  vColor = color;',
      '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = min(size * scale / max(-mvPosition.z, 0.05), maxSize);',
      '  gl_Position = projectionMatrix * mvPosition;',
      '  #include <fog_vertex>',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor;',
      '#include <fog_pars_fragment>',
      'void main() {',
      '  gl_FragColor = vec4(vColor, 1.0);',
      '  #include <fog_fragment>',
      '}',
    ].join('\n'),
    fog: true,
  });
  PARTICLE_MATS.push(mat);
  return mat;
}

// Na het wijzigen van de schermgrootte de puntgrootte bijwerken
function updateParticleScale(heightPx) {
  for (const m of PARTICLE_MATS) {
    m.uniforms.scale.value = heightPx / 2;
    m.uniforms.maxSize.value = Math.max(6, heightPx * 0.045);
  }
}

class Particles {
  constructor(max, size) {
    this.max = max;
    this.count = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.collide = new Uint8Array(max);
    const g = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3);
    this.colAttr = new THREE.BufferAttribute(this.col, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.posAttr);
    g.setAttribute('color', this.colAttr);
    g.setDrawRange(0, 0);
    this.mat = particleMaterial(size);
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
  }

  spawn(x, y, z, vx, vy, vz, r, g, b, life, grav, drag, collide) {
    const i = this.count < this.max ? this.count++ : Math.floor(Math.random() * this.max);
    const i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.col[i3] = r; this.col[i3 + 1] = g; this.col[i3 + 2] = b;
    this.life[i] = life;
    this.grav[i] = grav || 0;
    this.drag[i] = drag || 0;
    this.collide[i] = collide ? 1 : 0;
  }

  kill(i) {
    const last = --this.count;
    if (i === last) return;
    const i3 = i * 3, l3 = last * 3;
    for (let k = 0; k < 3; k++) {
      this.pos[i3 + k] = this.pos[l3 + k];
      this.vel[i3 + k] = this.vel[l3 + k];
      this.col[i3 + k] = this.col[l3 + k];
    }
    this.life[i] = this.life[last];
    this.grav[i] = this.grav[last];
    this.drag[i] = this.drag[last];
    this.collide[i] = this.collide[last];
  }

  update(dt, world) {
    for (let i = 0; i < this.count;) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.kill(i); continue; }
      const i3 = i * 3;
      this.vel[i3 + 1] -= this.grav[i] * dt;
      if (this.drag[i] > 0) {
        const k = Math.exp(-this.drag[i] * dt);
        this.vel[i3] *= k; this.vel[i3 + 1] *= k; this.vel[i3 + 2] *= k;
      }
      const nx = this.pos[i3] + this.vel[i3] * dt;
      const ny = this.pos[i3 + 1] + this.vel[i3 + 1] * dt;
      const nz = this.pos[i3 + 2] + this.vel[i3 + 2] * dt;
      if (this.collide[i] && world && world.solidAt(Math.floor(nx), Math.floor(ny), Math.floor(nz))) {
        this.vel[i3] *= 0.4; this.vel[i3 + 2] *= 0.4; this.vel[i3 + 1] = 0;
      } else {
        this.pos[i3] = nx; this.pos[i3 + 1] = ny; this.pos[i3 + 2] = nz;
      }
      i++;
    }
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.points.geometry.setDrawRange(0, this.count);
  }

  clear() {
    this.count = 0;
    this.points.geometry.setDrawRange(0, 0);
  }
}

// Handige effecten bovenop de deeltjessystemen
const FX = {
  debris: null, glow: null,

  init(scene) {
    this.debris = new Particles(1400, 0.11);
    this.glow = new Particles(1600, 0.2);
    scene.add(this.debris.points);
    scene.add(this.glow.points);
  },

  update(dt, world) {
    this.debris.update(dt, world);
    this.glow.update(dt, world);
  },

  clear() { this.debris.clear(); this.glow.clear(); },

  blockBreak(x, y, z, id) {
    const b = BLOCKS[id];
    if (!b || !b.tiles) return;
    for (let i = 0; i < 26; i++) {
      const c = sampleTileColor(Math.random() < 0.5 ? b.tiles.side : b.tiles.top);
      this.debris.spawn(x + Math.random(), y + Math.random(), z + Math.random(),
        (Math.random() - 0.5) * 3, Math.random() * 3.5, (Math.random() - 0.5) * 3,
        c[0], c[1], c[2], 0.5 + Math.random() * 0.6, 14, 0.5, true);
    }
  },

  blockHit(x, y, z, id, n) {
    const b = BLOCKS[id];
    if (!b || !b.tiles) return;
    for (let i = 0; i < 2; i++) {
      const c = sampleTileColor(b.tiles.side);
      this.debris.spawn(x + 0.5 + n.x * 0.52 + (Math.random() - 0.5) * 0.8, y + 0.5 + n.y * 0.52 + (Math.random() - 0.5) * 0.8,
        z + 0.5 + n.z * 0.52 + (Math.random() - 0.5) * 0.8, n.x * 1.5 + (Math.random() - 0.5), 1 + Math.random(),
        n.z * 1.5 + (Math.random() - 0.5), c[0], c[1], c[2], 0.35, 12, 0, true);
    }
  },

  crit(x, y, z) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3;
      this.glow.spawn(x, y, z, Math.cos(a) * s, (Math.random() - 0.3) * 4, Math.sin(a) * s,
        0.95, 0.95, 0.8, 0.45, 4, 2);
    }
  },

  hit(x, y, z, r, g, b) {
    for (let i = 0; i < 10; i++) {
      this.debris.spawn(x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, z + (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4, r, g, b, 0.5, 10, 1);
    }
  },

  explosion(x, y, z, scale) {
    const s = scale || 1;
    for (let i = 0; i < 60 * s; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI, sp = (2 + Math.random() * 6) * s;
      const hot = Math.random();
      const c = hot < 0.3 ? [1, 0.95, 0.5] : hot < 0.7 ? [1, 0.55, 0.1] : [0.35, 0.33, 0.32];
      this.glow.spawn(x, y, z, Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 1, Math.sin(a) * Math.cos(e) * sp,
        c[0], c[1], c[2], 0.4 + Math.random() * 0.6, hot > 0.7 ? -1 : 2, 2.5);
    }
  },

  ring(x, y, z, radius, color) {
    const n = Math.floor(radius * 14);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const c = color || sampleTileColor(T.NETHERRACK);
      this.debris.spawn(x + Math.cos(a) * 0.8, y + 0.15, z + Math.sin(a) * 0.8,
        Math.cos(a) * radius * 2.6, 2.5 + Math.random() * 3, Math.sin(a) * radius * 2.6,
        c[0], c[1], c[2], 0.5 + Math.random() * 0.3, 12, 1.5, true);
    }
  },

  portalSparkle(c, axis) {
    const along = (Math.random() - 0.5) * 2.2;
    const x = axis === 'x' ? c.x + along : c.x + (Math.random() - 0.5) * 1.6;
    const z = axis === 'x' ? c.z + (Math.random() - 0.5) * 1.6 : c.z + along;
    const y = c.y + (Math.random() - 0.5) * 3.2;
    const k = Math.random();
    this.glow.spawn(x, y, z, (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6,
      0.55 + k * 0.4, 0.15 + k * 0.3, 0.9, 1.2 + Math.random(), -0.4, 0.5);
  },

  flame(x, y, z, spread) {
    const s = spread || 0.3;
    const k = Math.random();
    this.glow.spawn(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s, z + (Math.random() - 0.5) * s,
      (Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.5,
      1, 0.45 + k * 0.45, 0.08, 0.35 + Math.random() * 0.3, -1, 1);
  },

  smoke(x, y, z) {
    const g = 0.25 + Math.random() * 0.2;
    this.glow.spawn(x + (Math.random() - 0.5) * 0.3, y, z + (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.4, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4,
      g, g, g, 0.8 + Math.random() * 0.5, -0.5, 1);
  },

  ash(px, py, pz) {
    const x = px + (Math.random() - 0.5) * 30, y = py + (Math.random() - 0.3) * 14, z = pz + (Math.random() - 0.5) * 30;
    const hot = Math.random() < 0.25;
    this.debris.spawn(x, y, z, (Math.random() - 0.5) * 0.6, hot ? 0.8 : -0.25, (Math.random() - 0.5) * 0.6,
      hot ? 1 : 0.35, hot ? 0.5 : 0.3, hot ? 0.15 : 0.3, 4 + Math.random() * 3, 0, 0);
  },

  confetti(x, y, z) {
    const cols = [[1, 0.85, 0.2], [0.4, 1, 0.4], [0.3, 0.8, 1], [1, 0.4, 0.8], [1, 1, 1]];
    for (let i = 0; i < 90; i++) {
      const c = cols[i % cols.length];
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      this.glow.spawn(x, y, z, Math.cos(a) * sp, 4 + Math.random() * 7, Math.sin(a) * sp, c[0], c[1], c[2], 2 + Math.random() * 1.5, 7, 0.8);
    }
  },

  xpOrbs(x, y, z) {
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      const k = Math.random();
      this.glow.spawn(x, y, z, Math.cos(a) * sp, 3 + Math.random() * 4, Math.sin(a) * sp, 0.55 + k * 0.4, 1, 0.2, 2.5, 9, 0.6, true);
    }
  },
};
