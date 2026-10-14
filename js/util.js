'use strict';
/* Portaaljacht – hulpfuncties: willekeur, ruis en wiskunde */

// Snelle random-generator met zaadje, zodat een wereld reproduceerbaar is.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function easeOut(t) { return 1 - (1 - t) * (1 - t); }

// Kleinste hoekverschil van a naar b (-PI..PI)
function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Klassieke 2D Perlin-ruis met eigen permutatietabel.
class Noise2D {
  constructor(rand) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  grad(h, x, y) {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  }
  noise(x, y) {
    const X = Math.floor(x), Y = Math.floor(y);
    const xf = x - X, yf = y - Y;
    const xi = X & 255, yi = Y & 255;
    const p = this.perm;
    const u = fade(xf), v = fade(yf);
    const aa = p[p[xi] + yi], ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi], bb = p[p[xi + 1] + yi + 1];
    const x1 = lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }
  fbm(x, y, oct) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += this.noise(x * freq, y * freq) * amp;
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  }
}

// Naadloos herhalende, vervaagde ruis (0..1) voor textures die moeten tegelen.
function tileableNoise(rand, size, passes) {
  let a = new Float32Array(size * size);
  for (let i = 0; i < a.length; i++) a[i] = rand();
  for (let p = 0; p < passes; p++) {
    const b = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let s = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            s += a[((y + oy + size) % size) * size + ((x + ox + size) % size)];
          }
        }
        b[y * size + x] = s / 9;
      }
    }
    a = b;
  }
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < a.length; i++) { if (a[i] < mn) mn = a[i]; if (a[i] > mx) mx = a[i]; }
  const r = mx - mn || 1;
  for (let i = 0; i < a.length; i++) a[i] = (a[i] - mn) / r;
  return a;
}

// Straal tegen een asgerichte doos; geeft afstand t of -1.
function rayAABB(o, d, minX, minY, minZ, maxX, maxY, maxZ, maxT) {
  let tmin = 0, tmax = maxT;
  const os = [o.x, o.y, o.z], ds = [d.x, d.y, d.z];
  const mins = [minX, minY, minZ], maxs = [maxX, maxY, maxZ];
  for (let a = 0; a < 3; a++) {
    if (Math.abs(ds[a]) < 1e-9) {
      if (os[a] < mins[a] || os[a] > maxs[a]) return -1;
    } else {
      let t1 = (mins[a] - os[a]) / ds[a];
      let t2 = (maxs[a] - os[a]) / ds[a];
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }
  }
  return tmin;
}

// Telefoon/tablet: grove aanwijzer en geen muis. Een laptop met aanraakscherm speelt met de muis.
const IS_TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches &&
  !window.matchMedia('(any-pointer: fine)').matches) || (('ontouchstart' in window) && !(window.matchMedia && window.matchMedia('(any-pointer: fine)').matches));

function loadSetting(key, def) {
  try {
    const v = localStorage.getItem('portaaljacht.' + key);
    return v === null ? def : JSON.parse(v);
  } catch (e) { return def; }
}
function saveSetting(key, val) {
  try { localStorage.setItem('portaaljacht.' + key, JSON.stringify(val)); } catch (e) { /* geen opslag */ }
}
