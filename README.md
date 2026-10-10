# Rasengan (螺旋丸) — Palm Energy Demo

Fun side project: webcam hand-tracking with a **procedural** glowing energy sphere anchored to your palm. Inspired by Instagram-style MediaPipe Hands demos.

Fan-made effect only — **no Naruto assets or official IP**. Not affiliated with Studio Pierrot / Shueisha.

## Stack

- MediaPipe Hands + Camera utils (CDN: jsDelivr)
- Canvas 2D overlay (layered glow, spiral wisps, particles, rings)
- Static HTML / CSS / JS — no build step

## Run locally

Camera APIs need a **secure context**: `localhost` or HTTPS.

```bash
cd /workspace/rasengan
python3 -m http.server 8000
```

Open: [http://localhost:8000](http://localhost:8000)

Then click **Start Camera**, allow permission, and show an open palm to the webcam.

### Alternatives

```bash
# Node
npx --yes serve -l 8000

# PHP
php -S localhost:8000
```

## Controls

| Control | Action |
|--------|--------|
| **Start Camera** | Request webcam + start tracking |
| **Stop Camera** | Release webcam |
| **Show landmarks** | Orange MediaPipe skeleton overlay |
| **Intensity** | Glow / particle brightness |
| **Size** | Sphere scale relative to palm |

## Tips

- Open palm facing the camera works best
- Good lighting helps detection
- Close other apps using the webcam if start fails
- Mirrored selfie view (matches typical front-camera UX)

## Files

```
rasengan/
  index.html
  README.md
  css/styles.css
  js/rasengan.js   # procedural sphere renderer
  js/main.js       # MediaPipe + camera + UI
```

## Caveats

- First load downloads the MediaPipe WASM/model from the CDN (needs network)
- Performance depends on device; lower intensity if FPS drops
- `file://` usually cannot access the camera — always use a local server
