# FLOXI LIVE — Truth or Dare

A production OBS livestream scene built with React + Vite. The browser viewport IS the stream canvas (1920×1080, 16:9). Live webcam fills the full scene, with a compact Truth/Dare wheel and question overlay docked to the bottom edge.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Controls

- **SPACE** — Spin the wheel
- **R** — Clear used questions
- **ESC** — Exit Stream Mode
- Gear button — Question Manager (hidden in Stream Mode)

## For OBS

1. Open the app in a browser, grant camera access.
2. Toggle **STREAM MODE** (top-right) to hide all admin controls.
3. Add a Browser Source in OBS pointing at the app URL, size 1920×1080.

Questions, used-question tracking and settings persist in `localStorage`.
