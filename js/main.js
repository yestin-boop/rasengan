/**
 * MediaPipe Hands + camera + skill FX overlay.
 */
(function () {
  'use strict';

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const statusEl = document.getElementById('status');
  const btnStart = document.getElementById('btnStart');
  const btnStop = document.getElementById('btnStop');
  const toggleLandmarks = document.getElementById('toggleLandmarks');
  const intensitySlider = document.getElementById('intensity');
  const sizeSlider = document.getElementById('size');
  const titleMain = document.getElementById('titleMain');
  const skillButtons = document.querySelectorAll('.skill-btn');

  const SKILLS = {
    rasengan: {
      title: '螺旋丸 <span class="sub">Rasengan</span>',
      theme: '',
      factory: () => new RasenganFX(),
    },
    void: {
      title: '無量空處 <span class="sub">Unlimited Void</span>',
      theme: 'theme-void',
      factory: () => new UnlimitedVoidFX(),
    },
  };

  let currentSkill = 'rasengan';
  let fx = SKILLS.rasengan.factory();
  let camera = null;
  let hands = null;
  let running = false;
  let lastTs = performance.now();
  let latestResults = null;
  let animId = 0;

  const PALM_IDS = [0, 5, 9, 13, 17];

  const FALLBACK_BONES = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17],
  ];

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setSkill(id) {
    if (!SKILLS[id] || id === currentSkill) {
      // Still refresh UI if re-clicked same
      if (SKILLS[id]) applySkillUI(id);
      return;
    }
    // Preserve smooth palm pose across switch
    const prev = fx.smooth;
    currentSkill = id;
    fx = SKILLS[id].factory();
    if (prev) {
      fx.smooth.x = prev.x;
      fx.smooth.y = prev.y;
      fx.smooth.r = prev.r;
      fx.smooth.visible = prev.visible;
    }
    applySkillUI(id);
  }

  function applySkillUI(id) {
    const meta = SKILLS[id];
    titleMain.innerHTML = meta.title;
    document.body.classList.remove('theme-void');
    if (meta.theme) document.body.classList.add(meta.theme);
    skillButtons.forEach((btn) => {
      const on = btn.dataset.skill === id;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function palmCenterAndRadius(landmarks) {
    let sx = 0;
    let sy = 0;
    for (const id of PALM_IDS) {
      sx += landmarks[id].x;
      sy += landmarks[id].y;
    }
    const n = PALM_IDS.length;
    const cx = sx / n;
    const cy = sy / n;
    const dx = landmarks[9].x - landmarks[0].x;
    const dy = landmarks[9].y - landmarks[0].y;
    const palmLen = Math.hypot(dx, dy);
    const radius = palmLen * 0.55;
    return { cx, cy, radius };
  }

  function paintHandSkeleton(landmarks, w, h) {
    const mpDrawConnectors = typeof drawConnectors === 'function' ? drawConnectors : null;
    const mpDrawLandmarks = typeof drawLandmarks === 'function' ? drawLandmarks : null;
    const connections =
      typeof HAND_CONNECTIONS !== 'undefined' ? HAND_CONNECTIONS : null;

    if (mpDrawConnectors && connections) {
      mpDrawConnectors(ctx, landmarks, connections, {
        color: '#ff8c2a',
        lineWidth: 2,
      });
    } else {
      ctx.strokeStyle = '#ff8c2a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const [a, b] of FALLBACK_BONES) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
        ctx.stroke();
      }
    }

    if (mpDrawLandmarks) {
      mpDrawLandmarks(ctx, landmarks, {
        color: '#ffb34d',
        lineWidth: 1,
        radius: 3,
      });
    } else {
      ctx.fillStyle = '#ffb34d';
      for (const p of landmarks) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function onResults(results) {
    latestResults = results;
  }

  function frame(ts) {
    animId = requestAnimationFrame(frame);
    if (!running) return;

    resizeCanvas();
    const w = canvas.width;
    const h = canvas.height;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, w, h);
    }

    const results = latestResults;
    let palmX = null;
    let palmY = null;
    let palmR = 0;
    let handCount = 0;

    if (results && results.multiHandLandmarks && results.multiHandLandmarks.length) {
      handCount = results.multiHandLandmarks.length;
      let best = null;
      let bestScore = -1;
      for (const lm of results.multiHandLandmarks) {
        const p = palmCenterAndRadius(lm);
        if (p.radius > bestScore) {
          bestScore = p.radius;
          best = { lm, p };
        }
      }
      if (best) {
        palmX = best.p.cx * w;
        palmY = best.p.cy * h;
        palmR = best.p.radius * Math.min(w, h);
        if (toggleLandmarks.checked) {
          paintHandSkeleton(best.lm, w, h);
        }
      }
    }

    fx.update(palmX, palmY, palmR, dt);
    fx.draw(ctx, {
      intensity: parseFloat(intensitySlider.value) || 1,
      sizeMul: parseFloat(sizeSlider.value) || 1,
    });

    ctx.restore();

    if (handCount > 0) {
      setStatus(`Tracking · ${handCount} hand${handCount > 1 ? 's' : ''} · ${currentSkill === 'void' ? 'Void' : 'Rasengan'}`);
    } else if (running) {
      setStatus('Looking for palm…');
    }
  }

  async function start() {
    if (running) return;
    setStatus('Loading hand model…');
    overlay.classList.add('hidden');

    try {
      if (typeof Hands !== 'function' || typeof Camera !== 'function') {
        throw new Error(
          'MediaPipe scripts failed to load. Check network / CDN access.'
        );
      }

      if (!hands) {
        hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.55,
        });
        hands.onResults(onResults);
      }

      camera = new Camera(video, {
        onFrame: async () => {
          if (hands && running) {
            await hands.send({ image: video });
          }
        },
        width: 1280,
        height: 720,
      });

      running = true;
      btnStop.disabled = false;
      btnStart.disabled = true;
      lastTs = performance.now();
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(frame);

      await camera.start();
      setStatus('Camera on');
    } catch (err) {
      console.error(err);
      running = false;
      overlay.classList.remove('hidden');
      btnStop.disabled = true;
      btnStart.disabled = false;
      setStatus('Camera failed');
      alert(
        'Could not start the camera.\n\n' +
          '• Use http://localhost (or HTTPS)\n' +
          '• Allow camera permission\n' +
          '• Close other apps using the webcam\n\n' +
          String(err && err.message ? err.message : err)
      );
    }
  }

  function stop() {
    running = false;
    if (camera) {
      try {
        camera.stop();
      } catch (_) {}
      camera = null;
    }
    if (video.srcObject) {
      for (const t of video.srcObject.getTracks()) t.stop();
      video.srcObject = null;
    }
    latestResults = null;
    cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlay.classList.remove('hidden');
    btnStop.disabled = true;
    btnStart.disabled = false;
    setStatus('Stopped');
  }

  skillButtons.forEach((btn) => {
    btn.addEventListener('click', () => setSkill(btn.dataset.skill));
  });

  btnStart.addEventListener('click', start);
  btnStop.addEventListener('click', stop);
  window.addEventListener('resize', resizeCanvas);

  // Keyboard 1 / 2 to switch skills
  window.addEventListener('keydown', (e) => {
    if (e.key === '1') setSkill('rasengan');
    if (e.key === '2') setSkill('void');
  });

  overlay.classList.remove('hidden');
  applySkillUI('rasengan');
  setStatus('Idle — press Start Camera');
  resizeCanvas();
})();
