/**
 * Procedural Rasengan (螺旋丸) renderer — fan demo, no copyrighted assets.
 * Layered spheres + spiral particles + additive glow on 2D canvas.
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

  class RasenganFX {
    constructor() {
      this.time = 0;
      this.smooth = { x: 0, y: 0, r: 0, visible: 0 };
      this.particles = [];
      this.wisps = [];
      this._initParticles(200);
      this._initWisps(16);
    }

    _initParticles(n) {
      const rnd = mulberry32(0xc0ffee42);
      this.particles = [];
      for (let i = 0; i < n; i++) {
        this.particles.push({
          theta: rnd() * Math.PI * 2,
          phi: (rnd() - 0.5) * Math.PI * 0.85,
          speed: 1.2 + rnd() * 2.8,
          radius: 0.55 + rnd() * 0.45,
          size: 0.6 + rnd() * 1.8,
          alpha: 0.25 + rnd() * 0.75,
          spiral: rnd() > 0.45,
          hueShift: rnd() * 30 - 10,
        });
      }
    }

    _initWisps(n) {
      const rnd = mulberry32(0xabad1dea);
      this.wisps = [];
      for (let i = 0; i < n; i++) {
        this.wisps.push({
          phase: rnd() * Math.PI * 2,
          speed: 0.8 + rnd() * 1.6,
          amp: 0.7 + rnd() * 0.45,
          width: 1.2 + rnd() * 2.2,
          turns: 2.2 + rnd() * 2.5,
          alpha: 0.35 + rnd() * 0.45,
        });
      }
    }

    /**
     * @param {number|null} x
     * @param {number|null} y
     * @param {number} baseRadius
     * @param {number} dt seconds
     */
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

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {{intensity:number, sizeMul:number}} opts
     */
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

      this._radialGlow(ctx, cx, cy, R * 2.4, [
        [0, `rgba(80, 200, 255, ${0.18 * intensity})`],
        [0.35, `rgba(40, 140, 255, ${0.08 * intensity})`],
        [1, 'rgba(0, 40, 80, 0)'],
      ]);

      this._radialGlow(ctx, cx, cy, R * 1.7, [
        [0, `rgba(120, 230, 255, ${0.22 * intensity})`],
        [0.5, `rgba(50, 160, 255, ${0.1 * intensity})`],
        [1, 'rgba(0,0,0,0)'],
      ]);

      this._drawWisps(ctx, cx, cy, R, t, intensity);

      this._radialGlow(ctx, cx, cy, R * 1.05, [
        [0, `rgba(180, 245, 255, ${0.55 * intensity})`],
        [0.45, `rgba(60, 180, 255, ${0.35 * intensity})`],
        [0.78, `rgba(30, 100, 220, ${0.18 * intensity})`],
        [1, 'rgba(10, 40, 100, 0)'],
      ]);

      this._drawParticles(ctx, cx, cy, R, t, intensity);

      this._radialGlow(ctx, cx, cy, R * 0.42, [
        [0, `rgba(255, 255, 255, ${0.95 * intensity})`],
        [0.35, `rgba(200, 250, 255, ${0.7 * intensity})`],
        [0.7, `rgba(80, 200, 255, ${0.25 * intensity})`],
        [1, 'rgba(40, 140, 255, 0)'],
      ]);

      this._drawRings(ctx, cx, cy, R, t, intensity);

      const hx = cx - R * 0.22;
      const hy = cy - R * 0.28;
      this._radialGlow(ctx, hx, hy, R * 0.28, [
        [0, `rgba(255, 255, 255, ${0.55 * intensity})`],
        [0.5, `rgba(200, 240, 255, ${0.15 * intensity})`],
        [1, 'rgba(255,255,255,0)'],
      ]);

      ctx.restore();
    }

    _radialGlow(ctx, x, y, r, stops) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [p, c] of stops) g.addColorStop(p, c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawWisps(ctx, cx, cy, R, t, intensity) {
      for (const w of this.wisps) {
        const rot = t * w.speed + w.phase;
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const ang = rot + u * Math.PI * 2 * w.turns;
          const rad =
            R *
            (0.35 +
              w.amp * 0.55 * (0.55 + 0.45 * Math.sin(u * Math.PI * 3 + rot)));
          const wobble = Math.sin(u * 8 + rot * 2) * R * 0.04;
          const x = cx + Math.cos(ang) * (rad + wobble);
          const y = cy + Math.sin(ang) * (rad + wobble) * 0.92;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(140, 230, 255, ${w.alpha * 0.55 * intensity})`;
        ctx.lineWidth = w.width * (R / 70);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    _drawParticles(ctx, cx, cy, R, t, intensity) {
      for (const p of this.particles) {
        let ang = p.theta + t * p.speed;
        if (p.spiral) ang += Math.sin(t * 1.4 + p.theta) * 0.35;
        const lat = p.phi + Math.sin(t * 0.9 + p.theta) * 0.12;
        const rr = R * p.radius * (0.85 + 0.15 * Math.sin(t * 2 + p.theta));
        const x = cx + Math.cos(ang) * Math.cos(lat) * rr;
        const y =
          cy + Math.sin(ang) * rr * 0.95 + Math.sin(lat) * R * 0.15;

        const depth = 0.5 + 0.5 * Math.cos(lat);
        const a = p.alpha * depth * 0.85 * intensity;
        const s = p.size * (R / 55) * (0.7 + 0.3 * depth);

        ctx.fillStyle = `hsla(${190 + p.hueShift}, 100%, ${70 + depth * 20}%, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, s), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawRings(ctx, cx, cy, R, t, intensity) {
      for (let i = 0; i < 3; i++) {
        const tilt = t * (1.6 + i * 0.55) + i * 1.1;
        const rx = R * (0.55 + i * 0.12);
        const ry = rx * (0.28 + i * 0.05);
        ctx.strokeStyle = `rgba(160, 230, 255, ${(0.35 - i * 0.08) * intensity})`;
        ctx.lineWidth = Math.max(1, R * 0.025);
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

  global.RasenganFX = RasenganFX;
})(window);
