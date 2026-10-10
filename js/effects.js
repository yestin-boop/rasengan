/**
 * Procedural palm energy FX — fan demo, no copyrighted assets.
 * Skills: Rasengan (螺旋丸) + Unlimited Void–inspired domain (無量空處 vibe).
 */
(function (global) {
  'use strict';

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Shared palm-smoothing base
  class PalmFX {
    constructor() {
      this.time = 0;
      this.smooth = { x: 0, y: 0, r: 0, visible: 0 };
    }

    update(x, y, baseRadius, dt) {
      this.time += dt;
      const has = x != null && y != null && baseRadius > 0;
      const targetVis = has ? 1 : 0;
      const k = 1 - Math.exp(-dt * (has ? 14 : 8));
      this.smooth.visible += (targetVis - this.smooth.visible) * k;

      if (has) {
        const kn = 1 - Math.exp(-dt * 16);
        this.smooth.x += (x - this.smooth.x) * kn;
        this.smooth.y += (y - this.smooth.y) * kn;
        this.smooth.r += (baseRadius - this.smooth.r) * kn;
      } else {
        this.smooth.r += (0 - this.smooth.r) * (1 - Math.exp(-dt * 6));
      }
    }

    _radialGlow(ctx, x, y, r, stops) {
      if (r < 0.5) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [p, c] of stops) g.addColorStop(p, c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Rasengan: dense spinning chakra sphere ───────────────────────────
  class RasenganFX extends PalmFX {
    constructor() {
      super();
      this.particles = [];
      this.wisps = [];
      this.ribbons = [];
      this.sparks = [];
      this._initParticles(420);
      this._initWisps(28);
      this._initRibbons(10);
      this._initSparks(80);
    }

    _initParticles(n) {
      const rnd = mulberry32(0xc0ffee42);
      this.particles = [];
      for (let i = 0; i < n; i++) {
        const layer = rnd();
        this.particles.push({
          theta: rnd() * Math.PI * 2,
          phi: (rnd() - 0.5) * Math.PI * 0.95,
          speed: 1.6 + rnd() * 4.2,
          radius: 0.28 + layer * 0.72,
          size: 0.35 + rnd() * 1.6,
          alpha: 0.2 + rnd() * 0.8,
          spiral: rnd() > 0.35,
          hueShift: rnd() * 40 - 12,
          orbit: 0.7 + rnd() * 0.6,
          layer,
        });
      }
    }

    _initWisps(n) {
      const rnd = mulberry32(0xabad1dea);
      this.wisps = [];
      for (let i = 0; i < n; i++) {
        this.wisps.push({
          phase: rnd() * Math.PI * 2,
          speed: 1.1 + rnd() * 2.4,
          amp: 0.55 + rnd() * 0.5,
          width: 0.9 + rnd() * 2.8,
          turns: 2.8 + rnd() * 3.5,
          alpha: 0.25 + rnd() * 0.5,
          tilt: (rnd() - 0.5) * 0.9,
        });
      }
    }

    _initRibbons(n) {
      const rnd = mulberry32(0xfeedface);
      this.ribbons = [];
      for (let i = 0; i < n; i++) {
        this.ribbons.push({
          phase: rnd() * Math.PI * 2,
          speed: 0.9 + rnd() * 1.8,
          pitch: 0.35 + rnd() * 0.55,
          width: 2 + rnd() * 4,
          alpha: 0.2 + rnd() * 0.35,
          turns: 1.8 + rnd() * 2.2,
        });
      }
    }

    _initSparks(n) {
      const rnd = mulberry32(0x7e57ed);
      this.sparks = [];
      for (let i = 0; i < n; i++) {
        this.sparks.push({
          theta: rnd() * Math.PI * 2,
          speed: 2.5 + rnd() * 5,
          life: rnd(),
          rate: 0.4 + rnd() * 0.9,
          len: 0.08 + rnd() * 0.18,
          alpha: 0.4 + rnd() * 0.55,
        });
      }
    }

    draw(ctx, opts) {
      const vis = this.smooth.visible;
      if (vis < 0.02 || this.smooth.r < 1) return;

      const intensity = opts.intensity ?? 1;
      const sizeMul = opts.sizeMul ?? 1;
      const cx = this.smooth.x;
      const cy = this.smooth.y;
      const R = this.smooth.r * sizeMul;
      const t = this.time;

      ctx.save();
      ctx.globalAlpha = vis;
      ctx.globalCompositeOperation = 'lighter';

      // Soft atmospheric bloom
      this._radialGlow(ctx, cx, cy, R * 3.2, [
        [0, `rgba(40, 160, 255, ${0.12 * intensity})`],
        [0.4, `rgba(20, 90, 200, ${0.05 * intensity})`],
        [1, 'rgba(0, 20, 60, 0)'],
      ]);

      this._radialGlow(ctx, cx, cy, R * 2.1, [
        [0, `rgba(90, 210, 255, ${0.2 * intensity})`],
        [0.45, `rgba(40, 140, 255, ${0.09 * intensity})`],
        [1, 'rgba(0,0,0,0)'],
      ]);

      this._drawRibbons(ctx, cx, cy, R, t, intensity);
      this._drawWisps(ctx, cx, cy, R, t, intensity);

      // Mid volumetric shell
      this._radialGlow(ctx, cx, cy, R * 1.15, [
        [0, `rgba(160, 240, 255, ${0.42 * intensity})`],
        [0.35, `rgba(70, 190, 255, ${0.32 * intensity})`],
        [0.7, `rgba(30, 110, 230, ${0.16 * intensity})`],
        [1, 'rgba(10, 40, 100, 0)'],
      ]);

      this._drawParticles(ctx, cx, cy, R, t, intensity);
      this._drawSparks(ctx, cx, cy, R, t, intensity);
      this._drawRings(ctx, cx, cy, R, t, intensity);

      // Hot white core
      this._radialGlow(ctx, cx, cy, R * 0.48, [
        [0, `rgba(255, 255, 255, ${0.98 * intensity})`],
        [0.25, `rgba(220, 250, 255, ${0.85 * intensity})`],
        [0.55, `rgba(100, 210, 255, ${0.4 * intensity})`],
        [1, 'rgba(40, 140, 255, 0)'],
      ]);

      // Specular highlight
      const hx = cx - R * 0.2;
      const hy = cy - R * 0.26;
      this._radialGlow(ctx, hx, hy, R * 0.26, [
        [0, `rgba(255, 255, 255, ${0.65 * intensity})`],
        [0.45, `rgba(200, 240, 255, ${0.18 * intensity})`],
        [1, 'rgba(255,255,255,0)'],
      ]);

      // Rim light
      ctx.strokeStyle = `rgba(180, 240, 255, ${0.22 * intensity})`;
      ctx.lineWidth = Math.max(1.2, R * 0.035);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    _drawRibbons(ctx, cx, cy, R, t, intensity) {
      for (const rb of this.ribbons) {
        const rot = t * rb.speed + rb.phase;
        ctx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const ang = rot + u * Math.PI * 2 * rb.turns;
          const lat = Math.sin(u * Math.PI * 2 + rot) * rb.pitch;
          const rad = R * (0.5 + 0.42 * Math.sin(u * Math.PI));
          const x = cx + Math.cos(ang) * Math.cos(lat) * rad;
          const y = cy + Math.sin(ang) * rad * 0.94 + Math.sin(lat) * R * 0.35;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(120, 220, 255, ${rb.alpha * intensity})`;
        ctx.lineWidth = rb.width * (R / 80);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    _drawWisps(ctx, cx, cy, R, t, intensity) {
      for (const w of this.wisps) {
        const rot = t * w.speed + w.phase;
        ctx.beginPath();
        const steps = 80;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const ang = rot + u * Math.PI * 2 * w.turns;
          const rad =
            R *
            (0.28 +
              w.amp * 0.62 * (0.5 + 0.5 * Math.sin(u * Math.PI * 4 + rot * 1.3)));
          const wobble = Math.sin(u * 12 + rot * 2.4) * R * 0.035;
          const tiltY = Math.sin(ang * 0.5 + w.tilt) * R * 0.08 * w.tilt;
          const x = cx + Math.cos(ang) * (rad + wobble);
          const y = cy + Math.sin(ang) * (rad + wobble) * 0.9 + tiltY;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fade = 0.45 + 0.55 * Math.sin(rot * 0.7 + w.phase);
        ctx.strokeStyle = `rgba(150, 235, 255, ${w.alpha * fade * 0.7 * intensity})`;
        ctx.lineWidth = w.width * (R / 75);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    _drawParticles(ctx, cx, cy, R, t, intensity) {
      // Sort-ish by layer for depth (back first)
      for (const p of this.particles) {
        let ang = p.theta + t * p.speed * p.orbit;
        if (p.spiral) ang += Math.sin(t * 1.8 + p.theta) * 0.55;
        const lat = p.phi + Math.sin(t * 1.1 + p.theta * 1.3) * 0.18;
        const pulse = 0.82 + 0.18 * Math.sin(t * 2.4 + p.theta);
        const rr = R * p.radius * pulse;
        const x = cx + Math.cos(ang) * Math.cos(lat) * rr;
        const y = cy + Math.sin(ang) * rr * 0.95 + Math.sin(lat) * R * 0.22;

        const depth = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(lat));
        const a = p.alpha * depth * 0.9 * intensity * (0.55 + 0.45 * p.layer);
        const s = p.size * (R / 58) * (0.55 + 0.45 * depth);

        const lum = 55 + depth * 35;
        ctx.fillStyle = `hsla(${188 + p.hueShift}, 100%, ${lum}%, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.45, s), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawSparks(ctx, cx, cy, R, t, intensity) {
      for (const s of this.sparks) {
        const life = (s.life + t * s.rate) % 1;
        const ang = s.theta + t * s.speed;
        const rad = R * (0.55 + life * 0.55);
        const x0 = cx + Math.cos(ang) * rad * 0.85;
        const y0 = cy + Math.sin(ang) * rad * 0.85;
        const x1 = cx + Math.cos(ang) * rad * (1 + s.len);
        const y1 = cy + Math.sin(ang) * rad * (1 + s.len);
        const a = s.alpha * (1 - life) * intensity * 0.7;
        ctx.strokeStyle = `rgba(200, 245, 255, ${a})`;
        ctx.lineWidth = Math.max(0.8, R * 0.012);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    _drawRings(ctx, cx, cy, R, t, intensity) {
      for (let i = 0; i < 5; i++) {
        const tilt = t * (1.9 + i * 0.65) + i * 0.85;
        const rx = R * (0.42 + i * 0.11);
        const ry = rx * (0.22 + i * 0.04);
        ctx.strokeStyle = `rgba(170, 235, 255, ${(0.32 - i * 0.045) * intensity})`;
        ctx.lineWidth = Math.max(0.9, R * (0.018 - i * 0.002));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ─── Unlimited Void–inspired domain (無量空處 vibe) ───────────────────
  // Procedural cosmic void: purple-black infinity, starfield, fractal rings.
  // Expands from palm into a domain bubble — fan interpretation only.
  class UnlimitedVoidFX extends PalmFX {
    constructor() {
      super();
      this.stars = [];
      this.glyphs = [];
      this.shards = [];
      this.domainExpand = 0;
      this._initStars(280);
      this._initGlyphs(36);
      this._initShards(48);
    }

    _initStars(n) {
      const rnd = mulberry32(0xdeadbeef);
      this.stars = [];
      for (let i = 0; i < n; i++) {
        this.stars.push({
          ang: rnd() * Math.PI * 2,
          dist: 0.05 + rnd() * 0.95,
          size: 0.4 + rnd() * 2.2,
          twinkle: rnd() * Math.PI * 2,
          speed: 0.15 + rnd() * 0.55,
          hue: 250 + rnd() * 60,
          bright: 0.35 + rnd() * 0.65,
          layer: rnd(),
        });
      }
    }

    _initGlyphs(n) {
      const rnd = mulberry32(0xcafeBabe);
      this.glyphs = [];
      for (let i = 0; i < n; i++) {
        this.glyphs.push({
          ang: rnd() * Math.PI * 2,
          dist: 0.25 + rnd() * 0.7,
          rot: rnd() * Math.PI * 2,
          rotSpeed: (rnd() - 0.5) * 1.8,
          size: 0.04 + rnd() * 0.08,
          sides: 3 + Math.floor(rnd() * 4),
          alpha: 0.15 + rnd() * 0.4,
          pulse: rnd() * Math.PI * 2,
        });
      }
    }

    _initShards(n) {
      const rnd = mulberry32(0x1337c0de);
      this.shards = [];
      for (let i = 0; i < n; i++) {
        this.shards.push({
          ang: rnd() * Math.PI * 2,
          dist: 0.3 + rnd() * 0.65,
          len: 0.06 + rnd() * 0.2,
          width: 0.8 + rnd() * 2,
          speed: 0.3 + rnd() * 1.2,
          alpha: 0.2 + rnd() * 0.45,
          hue: 260 + rnd() * 50,
        });
      }
    }

    update(x, y, baseRadius, dt) {
      super.update(x, y, baseRadius, dt);
      const has = this.smooth.visible > 0.3;
      const target = has ? 1 : 0;
      const k = 1 - Math.exp(-dt * (has ? 3.5 : 5));
      this.domainExpand += (target - this.domainExpand) * k;
    }

    draw(ctx, opts) {
      const vis = this.smooth.visible;
      if (vis < 0.02 || this.smooth.r < 1) return;

      const intensity = opts.intensity ?? 1;
      const sizeMul = opts.sizeMul ?? 1;
      const cx = this.smooth.x;
      const cy = this.smooth.y;
      const palmR = this.smooth.r * sizeMul;
      const expand = this.domainExpand;
      // Domain grows well beyond the palm
      const R = palmR * (1.4 + expand * 3.6);
      const t = this.time;

      ctx.save();
      ctx.globalAlpha = vis;

      // Dark domain disk (source-over so it reads as void)
      ctx.globalCompositeOperation = 'source-over';
      this._drawVoidCore(ctx, cx, cy, R, expand, intensity);

      // Additive cosmic layers
      ctx.globalCompositeOperation = 'lighter';
      this._drawStarfield(ctx, cx, cy, R, t, intensity, expand);
      this._drawFractalRings(ctx, cx, cy, R, t, intensity, expand);
      this._drawGlyphs(ctx, cx, cy, R, t, intensity, expand);
      this._drawShards(ctx, cx, cy, R, t, intensity, expand);
      this._drawDomainRim(ctx, cx, cy, R, t, intensity, expand);
      this._drawPalmFocus(ctx, cx, cy, palmR, t, intensity);

      ctx.restore();
    }

    _drawVoidCore(ctx, cx, cy, R, expand, intensity) {
      const a = (0.55 + 0.35 * expand) * intensity;
      const g = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, R);
      g.addColorStop(0, `rgba(12, 4, 28, ${a * 0.95})`);
      g.addColorStop(0.25, `rgba(35, 8, 70, ${a * 0.85})`);
      g.addColorStop(0.55, `rgba(55, 15, 110, ${a * 0.55})`);
      g.addColorStop(0.8, `rgba(80, 30, 140, ${a * 0.22})`);
      g.addColorStop(1, 'rgba(20, 5, 40, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Inner abyss
      this._radialGlow(ctx, cx, cy, R * 0.35, [
        [0, `rgba(0, 0, 0, ${0.7 * intensity})`],
        [0.5, `rgba(20, 0, 40, ${0.35 * intensity})`],
        [1, 'rgba(0,0,0,0)'],
      ]);
    }

    _drawStarfield(ctx, cx, cy, R, t, intensity, expand) {
      for (const s of this.stars) {
        const spin = s.ang + t * s.speed * (0.3 + s.layer);
        const dist = s.dist * R * (0.2 + 0.8 * expand);
        // Subtle radial drift
        const drift = 1 + 0.04 * Math.sin(t * 0.7 + s.twinkle);
        const x = cx + Math.cos(spin) * dist * drift;
        const y = cy + Math.sin(spin) * dist * drift * 0.96;
        const tw =
          0.45 +
          0.55 * Math.sin(t * (2 + s.speed) + s.twinkle);
        const a = s.bright * tw * intensity * (0.35 + 0.65 * expand);
        const sz = s.size * (0.6 + expand * 0.8) * (R / 120);

        ctx.fillStyle = `hsla(${s.hue}, 90%, ${70 + tw * 20}%, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.4, sz), 0, Math.PI * 2);
        ctx.fill();

        // Occasional cross flare on bright stars
        if (s.bright > 0.75 && tw > 0.85) {
          const fl = sz * 3;
          ctx.strokeStyle = `hsla(${s.hue}, 100%, 85%, ${a * 0.45})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x - fl, y);
          ctx.lineTo(x + fl, y);
          ctx.moveTo(x, y - fl);
          ctx.lineTo(x, y + fl);
          ctx.stroke();
        }
      }
    }

    _drawFractalRings(ctx, cx, cy, R, t, intensity, expand) {
      for (let i = 0; i < 7; i++) {
        const u = (i + 1) / 8;
        const rad = R * (0.18 + u * 0.78);
        const wobble = 1 + 0.03 * Math.sin(t * 1.5 + i);
        const rot = t * (0.25 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
        const a = (0.28 - i * 0.025) * intensity * (0.4 + 0.6 * expand);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `hsla(${270 + i * 8}, 85%, ${55 + i * 4}%, ${a})`;
        ctx.lineWidth = Math.max(0.8, R * 0.008);
        ctx.setLineDash([R * 0.04, R * 0.025]);
        ctx.beginPath();
        // Slightly elliptical “infinity” ring
        const rx = rad * wobble;
        const ry = rad * wobble * (0.88 + 0.08 * Math.sin(t + i));
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Nested hex-ish lattice arcs
      for (let k = 0; k < 3; k++) {
        const base = R * (0.4 + k * 0.18);
        const rot = t * 0.4 * (k % 2 ? -1 : 1) + k;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(180, 140, 255, ${(0.18 - k * 0.04) * intensity * expand})`;
        ctx.lineWidth = Math.max(1, R * 0.01);
        for (let s = 0; s < 6; s++) {
          const a0 = (s / 6) * Math.PI * 2;
          const a1 = a0 + Math.PI / 4;
          ctx.beginPath();
          ctx.arc(0, 0, base, a0, a1);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    _drawGlyphs(ctx, cx, cy, R, t, intensity, expand) {
      for (const g of this.glyphs) {
        const ang = g.ang + t * 0.15;
        const dist = g.dist * R * expand;
        const x = cx + Math.cos(ang) * dist;
        const y = cy + Math.sin(ang) * dist;
        const pulse = 0.7 + 0.3 * Math.sin(t * 2 + g.pulse);
        const size = g.size * R * pulse;
        const rot = g.rot + t * g.rotSpeed;
        const a = g.alpha * intensity * expand * pulse;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(200, 170, 255, ${a})`;
        ctx.lineWidth = Math.max(0.7, R * 0.006);
        ctx.beginPath();
        for (let i = 0; i <= g.sides; i++) {
          const a2 = (i / g.sides) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a2) * size;
          const py = Math.sin(a2) * size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Inner dot
        ctx.fillStyle = `rgba(230, 210, 255, ${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.5, size * 0.12), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    _drawShards(ctx, cx, cy, R, t, intensity, expand) {
      for (const sh of this.shards) {
        const ang = sh.ang + t * sh.speed * 0.4;
        const dist = sh.dist * R * expand;
        const x = cx + Math.cos(ang) * dist;
        const y = cy + Math.sin(ang) * dist;
        const len = sh.len * R;
        const tang = ang + Math.PI / 2;
        const a = sh.alpha * intensity * expand;
        ctx.strokeStyle = `hsla(${sh.hue}, 90%, 70%, ${a})`;
        ctx.lineWidth = sh.width * (R / 100);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(tang) * len * 0.5, y - Math.sin(tang) * len * 0.5);
        ctx.lineTo(x + Math.cos(tang) * len * 0.5, y + Math.sin(tang) * len * 0.5);
        ctx.stroke();
      }
    }

    _drawDomainRim(ctx, cx, cy, R, t, intensity, expand) {
      // Outer barrier glow
      this._radialGlow(ctx, cx, cy, R * 1.05, [
        [0.75, 'rgba(0,0,0,0)'],
        [0.88, `rgba(140, 80, 255, ${0.25 * intensity * expand})`],
        [0.95, `rgba(200, 160, 255, ${0.45 * intensity * expand})`],
        [1, 'rgba(255, 230, 255, 0)'],
      ]);

      ctx.strokeStyle = `rgba(210, 180, 255, ${(0.35 + 0.25 * Math.sin(t * 2)) * intensity * expand})`;
      ctx.lineWidth = Math.max(1.5, R * 0.02);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
      ctx.stroke();

      // Scanning arc
      const sweep = (t * 1.2) % (Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 220, 255, ${0.55 * intensity * expand})`;
      ctx.lineWidth = Math.max(2, R * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.98, sweep, sweep + 0.6);
      ctx.stroke();
    }

    _drawPalmFocus(ctx, cx, cy, palmR, t, intensity) {
      // Bright singularity at palm center
      this._radialGlow(ctx, cx, cy, palmR * 1.1, [
        [0, `rgba(255, 240, 255, ${0.9 * intensity})`],
        [0.3, `rgba(180, 120, 255, ${0.55 * intensity})`],
        [0.65, `rgba(100, 40, 200, ${0.2 * intensity})`],
        [1, 'rgba(40, 0, 80, 0)'],
      ]);

      // Orbiting motes near palm
      for (let i = 0; i < 8; i++) {
        const a = t * 2.2 + (i / 8) * Math.PI * 2;
        const rr = palmR * (0.55 + 0.15 * Math.sin(t * 3 + i));
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.85;
        ctx.fillStyle = `rgba(230, 200, 255, ${0.7 * intensity})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, palmR * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Keep old name for compatibility
  global.RasenganFX = RasenganFX;
  global.UnlimitedVoidFX = UnlimitedVoidFX;
  global.PalmSkills = {
    rasengan: RasenganFX,
    void: UnlimitedVoidFX,
  };
})(window);
