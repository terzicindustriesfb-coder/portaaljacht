'use strict';
/* Portaaljacht – de blokkenwereld en het omzetten naar 3D-meshes */

const CH = 16; // chunkgrootte (x en z)

// Vlakken: richting, hoeken (tegen de klok in van buitenaf gezien) en schaduw
const FACE_DEFS = [
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.62 },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.62 },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5 },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.8 },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.8 },
];
const FACE_UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AO_LEVELS = [0.42, 0.62, 0.8, 1.0];

// Voor elke hoek de drie buren die ambient occlusion bepalen
for (const f of FACE_DEFS) {
  const axes = [0, 1, 2].filter((a) => f.dir[a] === 0);
  f.ao = f.corners.map((c) => {
    const e1 = [0, 0, 0], e2 = [0, 0, 0];
    e1[axes[0]] = c[axes[0]] === 1 ? 1 : -1;
    e2[axes[1]] = c[axes[1]] === 1 ? 1 : -1;
    return [
      [f.dir[0] + e1[0], f.dir[1] + e1[1], f.dir[2] + e1[2]],
      [f.dir[0] + e2[0], f.dir[1] + e2[1], f.dir[2] + e2[2]],
      [f.dir[0] + e1[0] + e2[0], f.dir[1] + e1[1] + e2[1], f.dir[2] + e1[2] + e2[2]],
    ];
  });
}

const MAT = {};
function buildMaterials() {
  // Mist op afstand (zoals in Minecraft) in plaats van op diepte: aan de zijkant van het scherm is hij even dik
  // als in het midden, zodat de chunks die achter de mist verdwijnen nergens zichtbaar zijn.
  if (THREE.ShaderChunk.fog_vertex.indexOf('length( mvPosition.xyz )') < 0) {
    THREE.ShaderChunk.fog_vertex = THREE.ShaderChunk.fog_vertex.replace('fogDepth = - mvPosition.z;', 'fogDepth = length( mvPosition.xyz );');
  }
  MAT.opaque = new THREE.MeshBasicMaterial({ map: Tex.atlas, vertexColors: true, alphaTest: 0.5 });
  MAT.water = new THREE.MeshBasicMaterial({ map: Tex.water, vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide });
  MAT.lava = new THREE.MeshBasicMaterial({ map: Tex.lava, vertexColors: true });
  MAT.portal = new THREE.MeshBasicMaterial({ map: Tex.portal, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
}

class MeshBuf {
  constructor() { this.pos = []; this.uv = []; this.col = []; this.idx = []; this.n = 0; }
}

class World {
  constructor(kind, sx, sy, sz) {
    this.kind = kind;
    this.sx = sx; this.sy = sy; this.sz = sz;
    this.data = new Uint8Array(sx * sy * sz);
    this.top = new Int16Array(sx * sz).fill(-1);
    this.ncx = Math.ceil(sx / CH);
    this.ncz = Math.ceil(sz / CH);
    this.chunks = new Array(this.ncx * this.ncz).fill(null);
    this.dirty = new Set();
    this.pending = [];
    this.group = new THREE.Group();
    this.portalAxis = 'x';
    this.skyShade = kind === 'overworld';
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  get(x, y, z) {
    if (y < 0) return B.BEDROCK;
    if (y >= this.sy || x < 0 || z < 0 || x >= this.sx || z >= this.sz) return B.AIR;
    return this.data[(y * this.sz + z) * this.sx + x];
  }

  // Alleen tijdens het genereren: geen mesh-updates
  setRaw(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.data[(y * this.sz + z) * this.sx + x] = id;
  }

  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    this.data[(y * this.sz + z) * this.sx + x] = id;
    this.updateTop(x, z);
    this.markDirty(x, z);
    return true;
  }

  // Botsing: buiten de wereld (zijkanten en onderkant) is een onzichtbare muur
  solidAt(x, y, z) {
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz || y < 0) return true;
    if (y >= this.sy) return false;
    return SOLID[this.data[(y * this.sz + z) * this.sx + x]] === 1;
  }

  topAt(x, z) {
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return -1;
    return this.top[z * this.sx + x];
  }

  updateTop(x, z) {
    let t = -1;
    for (let y = this.sy - 1; y >= 0; y--) {
      const id = this.data[(y * this.sz + z) * this.sx + x];
      if (OPAQUE[id] || id === B.LEAVES) { t = y; break; }
    }
    this.top[z * this.sx + x] = t;
  }

  computeTops() {
    for (let z = 0; z < this.sz; z++) for (let x = 0; x < this.sx; x++) this.updateTop(x, z);
  }

  markDirty(x, z) {
    const cx = x >> 4, cz = z >> 4;
    const lx = x & 15, lz = z & 15;
    for (let dz = -1; dz <= 1; dz++) {
      if ((dz === -1 && lz !== 0) || (dz === 1 && lz !== 15)) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx === -1 && lx !== 0) || (dx === 1 && lx !== 15)) continue;
        const ncx = cx + dx, ncz = cz + dz;
        if (ncx < 0 || ncz < 0 || ncx >= this.ncx || ncz >= this.ncz) continue;
        this.dirty.add(ncz * this.ncx + ncx);
      }
    }
  }

  // Alles meteen bouwen, of (met px/pz) eerst de chunks binnen nearR en de rest later stukje bij beetje
  buildAll(px, pz, nearR) {
    this.pending = [];
    if (px === undefined) {
      for (let cz = 0; cz < this.ncz; cz++) for (let cx = 0; cx < this.ncx; cx++) this.rebuildChunk(cx, cz);
    } else {
      const list = [];
      for (let cz = 0; cz < this.ncz; cz++) {
        for (let cx = 0; cx < this.ncx; cx++) list.push([Math.hypot((cx + 0.5) * CH - px, (cz + 0.5) * CH - pz), cx, cz]);
      }
      list.sort((a, b) => a[0] - b[0]);
      for (const [d, cx, cz] of list) {
        if (d <= nearR) this.rebuildChunk(cx, cz);
        else this.pending.push(cz * this.ncx + cx);
      }
    }
    this.dirty.clear();
  }

  updateDirty(max) {
    let n = 0;
    for (const key of this.dirty) {
      this.dirty.delete(key);
      this.rebuildChunk(key % this.ncx, Math.floor(key / this.ncx));
      if (++n >= max) break;
    }
    // nog niet gebouwde verre chunks: zolang het binnen een paar milliseconden past
    if (this.pending.length && n < max) {
      const t0 = performance.now();
      do {
        const key = this.pending.shift();
        if (!this.chunks[key]) this.rebuildChunk(key % this.ncx, Math.floor(key / this.ncx));
      } while (this.pending.length && performance.now() - t0 < 5);
    }
  }

  // Chunks ver achter de mist niet tekenen
  cull(px, pz, dist) {
    const r = dist + CH * 0.71;
    for (let cz = 0; cz < this.ncz; cz++) {
      for (let cx = 0; cx < this.ncx; cx++) {
        const list = this.chunks[cz * this.ncx + cx];
        if (!list) continue;
        const vis = Math.hypot((cx + 0.5) * CH - px, (cz + 0.5) * CH - pz) < r;
        for (const m of list) m.visible = vis;
      }
    }
  }

  rebuildChunk(cx, cz) {
    const key = cz * this.ncx + cx;
    const old = this.chunks[key];
    if (old) for (const m of old) { this.group.remove(m); m.geometry.dispose(); }
    const meshes = this.buildChunk(cx, cz);
    this.chunks[key] = meshes;
    for (const m of meshes) this.group.add(m);
  }

  dispose() {
    for (const list of this.chunks) if (list) for (const m of list) { this.group.remove(m); m.geometry.dispose(); }
    this.chunks.fill(null);
    this.pending = [];
  }

  buildChunk(cx, cz) {
    const bufs = { opaque: new MeshBuf(), water: new MeshBuf(), lava: new MeshBuf(), portal: new MeshBuf() };
    const x0 = cx * CH, z0 = cz * CH;
    const x1 = Math.min(x0 + CH, this.sx), z1 = Math.min(z0 + CH, this.sz);
    const sx = this.sx, sz = this.sz;
    for (let y = 0; y < this.sy; y++) {
      for (let z = z0; z < z1; z++) {
        for (let x = x0; x < x1; x++) {
          const id = this.data[(y * sz + z) * sx + x];
          if (id === 0) continue;
          const b = BLOCKS[id];
          switch (b.render) {
            case R_CUBE: this.emitCube(bufs.opaque, x, y, z, id, b); break;
            case R_CROSS: this.emitCross(bufs.opaque, x, y, z, b); break;
            case R_WATER: this.emitFluid(bufs.water, x, y, z, id, false); break;
            case R_LAVA: this.emitFluid(bufs.lava, x, y, z, id, true); break;
            case R_PORTAL: this.emitPortal(bufs.portal, x, y, z); break;
            default: break;
          }
        }
      }
    }
    const out = [];
    const add = (buf, mat, order) => {
      const m = makeChunkMesh(buf, mat);
      if (m) { m.renderOrder = order; out.push(m); }
    };
    add(bufs.opaque, MAT.opaque, 0);
    add(bufs.lava, MAT.lava, 0);
    add(bufs.water, MAT.water, 1);
    add(bufs.portal, MAT.portal, 2);
    return out;
  }

  skyLight(nx, ny, nz) {
    if (!this.skyShade) return 1;
    return this.topAt(nx, nz) > ny ? 0.74 : 1;
  }

  emitCube(buf, x, y, z, id, b) {
    const tiles = b.tiles;
    for (let f = 0; f < 6; f++) {
      const F = FACE_DEFS[f];
      const nx = x + F.dir[0], ny = y + F.dir[1], nz = z + F.dir[2];
      const nid = this.get(nx, ny, nz);
      if (OPAQUE[nid]) continue;
      if (nid === id && b.cullSame) continue;
      const tile = f === 2 ? tiles.top : f === 3 ? tiles.bottom : tiles.side;
      const uv = TILE_UV[tile];
      const ao = [3, 3, 3, 3];
      let light = 1;
      if (!b.glow) {
        light = F.shade * this.skyLight(nx, ny, nz);
        for (let v = 0; v < 4; v++) {
          const o = F.ao[v];
          const s1 = AOC[this.get(x + o[0][0], y + o[0][1], z + o[0][2])];
          const s2 = AOC[this.get(x + o[1][0], y + o[1][1], z + o[1][2])];
          const c = AOC[this.get(x + o[2][0], y + o[2][1], z + o[2][2])];
          ao[v] = (s1 && s2) ? 0 : 3 - (s1 + s2 + c);
        }
      }
      const base = buf.n;
      for (let v = 0; v < 4; v++) {
        const c = F.corners[v];
        buf.pos.push(x + c[0], y + c[1], z + c[2]);
        buf.uv.push(lerp(uv[0], uv[2], FACE_UV[v][0]), lerp(uv[1], uv[3], FACE_UV[v][1]));
        const l = light * AO_LEVELS[ao[v]];
        buf.col.push(l, l, l);
      }
      if (ao[0] + ao[2] < ao[1] + ao[3]) buf.idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
      else buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      buf.n += 4;
    }
  }

  emitCross(buf, x, y, z, b) {
    const uv = TILE_UV[b.tiles.side];
    const l = b.glow ? 1 : this.skyLight(x, y, z) * 0.95;
    const quads = [
      [[x + 0.15, z + 0.15], [x + 0.85, z + 0.85]],
      [[x + 0.85, z + 0.15], [x + 0.15, z + 0.85]],
    ];
    for (const q of quads) {
      const base = buf.n;
      const v = [[q[0][0], y, q[0][1]], [q[1][0], y, q[1][1]], [q[1][0], y + 1, q[1][1]], [q[0][0], y + 1, q[0][1]]];
      for (let i = 0; i < 4; i++) {
        buf.pos.push(v[i][0], v[i][1], v[i][2]);
        buf.uv.push(lerp(uv[0], uv[2], FACE_UV[i][0]), lerp(uv[1], uv[3], FACE_UV[i][1]));
        buf.col.push(l, l, l);
      }
      buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      buf.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      buf.n += 4;
    }
  }

  emitFluid(buf, x, y, z, id, glow) {
    const above = this.get(x, y + 1, z);
    const h = above === id ? 1 : 0.875;
    for (let f = 0; f < 6; f++) {
      const F = FACE_DEFS[f];
      const nid = this.get(x + F.dir[0], y + F.dir[1], z + F.dir[2]);
      if (nid === id || OPAQUE[nid]) continue;
      if (f === 3 && SOLID[nid]) continue;
      const l = glow ? 1 : F.shade;
      const base = buf.n;
      for (let v = 0; v < 4; v++) {
        const c = F.corners[v];
        buf.pos.push(x + c[0], y + c[1] * h, z + c[2]);
        buf.uv.push(FACE_UV[v][0], FACE_UV[v][1]);
        buf.col.push(l, l, l);
      }
      buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      buf.n += 4;
    }
  }

  emitPortal(buf, x, y, z) {
    const base = buf.n;
    const v = this.portalAxis === 'x'
      ? [[x, y, z + 0.5], [x + 1, y, z + 0.5], [x + 1, y + 1, z + 0.5], [x, y + 1, z + 0.5]]
      : [[x + 0.5, y, z], [x + 0.5, y, z + 1], [x + 0.5, y + 1, z + 1], [x + 0.5, y + 1, z]];
    for (let i = 0; i < 4; i++) {
      buf.pos.push(v[i][0], v[i][1], v[i][2]);
      buf.uv.push(FACE_UV[i][0], FACE_UV[i][1]);
      buf.col.push(1, 1, 1);
    }
    buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    buf.n += 4;
  }
}

function makeChunkMesh(buf, mat) {
  if (buf.n === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
  g.setIndex(buf.n > 65535 ? new THREE.Uint32BufferAttribute(buf.idx, 1) : new THREE.Uint16BufferAttribute(buf.idx, 1));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat);
  m.matrixAutoUpdate = false;
  m.updateMatrix();
  return m;
}

// Straal door het blokkenrooster (DDA). Geeft het eerste raakbare blok + vlaknormaal.
function raycastVoxels(world, o, d, maxDist) {
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const stepX = d.x > 0 ? 1 : -1, stepY = d.y > 0 ? 1 : -1, stepZ = d.z > 0 ? 1 : -1;
  const tdx = d.x !== 0 ? Math.abs(1 / d.x) : Infinity;
  const tdy = d.y !== 0 ? Math.abs(1 / d.y) : Infinity;
  const tdz = d.z !== 0 ? Math.abs(1 / d.z) : Infinity;
  let tmx = d.x !== 0 ? (d.x > 0 ? (x + 1 - o.x) : (o.x - x)) * tdx : Infinity;
  let tmy = d.y !== 0 ? (d.y > 0 ? (y + 1 - o.y) : (o.y - y)) * tdy : Infinity;
  let tmz = d.z !== 0 ? (d.z > 0 ? (z + 1 - o.z) : (o.z - z)) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  for (let i = 0; i < 200 && t <= maxDist; i++) {
    const id = world.get(x, y, z);
    if (id !== B.AIR && BLOCKS[id].target) return { x, y, z, id, nx, ny, nz, dist: t };
    if (tmx < tmy && tmx < tmz) { x += stepX; t = tmx; tmx += tdx; nx = -stepX; ny = 0; nz = 0; }
    else if (tmy < tmz) { y += stepY; t = tmy; tmy += tdy; nx = 0; ny = -stepY; nz = 0; }
    else { z += stepZ; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -stepZ; }
  }
  return null;
}
