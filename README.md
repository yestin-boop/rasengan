# Palm Energy Demo — Rasengan & Unlimited Void

Fun side project: webcam hand-tracking with **procedural** glowing skills anchored to your palm.

- **螺旋丸 / Rasengan** — dense spinning blue energy sphere (wisps, ribbons, sparks, volumetric glow)
- **無量空處 / Unlimited Void** — Gojo-inspired domain vibe: purple-black cosmic void, starfield, fractal rings expanding from the palm

Fan-made procedural FX only — **no copyrighted anime assets**. Not affiliated with Naruto / Jujutsu Kaisen / Studio Pierrot / MAPPA / Shueisha.

**Live:** [https://yestin-boop.github.io/rasengan/](https://yestin-boop.github.io/rasengan/)

## Stack

- MediaPipe Hands + Camera utils (CDN: jsDelivr)
- Canvas 2D overlay (layered glow, particles, domain void)
- Static HTML / CSS / JS — no build step

## Run locally

Camera APIs need a **secure context**: `localhost` or HTTPS.

```bash
cd rasengan
python3 -m http.server 8000
```

Open: [http://localhost:8000](http://localhost:8000)

Then click **Start Camera**, allow permission, and show an open palm.

## Controls

| Control | Action |
|--------|--------|
| **Skill tabs** | Switch Rasengan ↔ Unlimited Void (or keys `1` / `2`) |
| **Start Camera** | Request webcam + start tracking |
| **Stop Camera** | Release webcam |
| **Show landmarks** | Orange MediaPipe skeleton overlay |
| **Intensity** | Glow / particle brightness |
| **Size** | Effect scale relative to palm |

## Tips

- Open palm facing the camera works best
- Good lighting helps detection
- Unlimited Void expands into a domain bubble from the palm
- Mirrored selfie view (matches typical front-camera UX)

## Files

```
rasengan/
  index.html
  README.md
  css/styles.css
  js/effects.js   # RasenganFX + UnlimitedVoidFX
  js/main.js      # MediaPipe + camera + skill UI
```

## Caveats

- First load downloads the MediaPipe WASM/model from the CDN (needs network)
- Performance depends on device; lower intensity if FPS drops
- `file://` usually cannot access the camera — always use a local server
