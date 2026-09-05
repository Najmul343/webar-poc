# WebAR Proof of Concept (WebAR POC)

A clean, high-performance, mobile-first WebAR proof of concept built with Three.js, the 2026 open-source 8th Wall SLAM engine binary, and native W3C WebXR hit-testing for Android Chrome.

---

## Purpose

The purpose of this project is to demonstrate a robust, lightweight, client-side WebAR experience running in mobile browsers without any app installation or backend dependencies.

The experience flow:
1. **Android Phone** opens the HTTPS Vercel URL in Google Chrome.
2. User grants camera permission.
3. Environment tracking scans the floor/table surfaces.
4. A 3D placement reticle projects onto detected physical surfaces.
5. User taps the screen to anchor a high-quality 3D model into the real world with realistic contact shadows.
6. User can physically walk 360° around the model.
7. User can interact using single-finger rotation and two-finger pinch-to-scale, or reset/remove the model via UI controls.

---

## Technology Stack

- **Rendering Engine**: [Three.js](https://threejs.org/) (r170)
- **AR Tracking**: 
  - **8th Wall SLAM Engine**: `@8thwall/engine-binary` (v1.0.0, distributed binary chunked with SLAM)
  - **Native WebXR Driver**: W3C WebXR Device API (`immersive-ar` + `hit-test` + `dom-overlay`)
- **Build System**: [Vite](https://vite.dev/) (v6) with `@vitejs/plugin-basic-ssl` for local mobile HTTPS testing
- **Styling & UI**: Native CSS3 glassmorphism HUD with safe-area notch handling (zero heavy UI framework overhead)
- **Hosting / Deployment**: [Vercel](https://vercel.com) static SPA deployment

---

## 3D Model Specifications

```text
MODEL: Astronaut / Damaged Sci-fi Helmet
SOURCE: Khronos Group glTF Sample Assets & Google model-viewer
AUTHOR: Poly by Google / thebluetests
LICENSE: CC-BY 4.0 / CC-BY-NC 4.0
ORIGINAL SIZE: 2.86 MB (Astronaut) / 3.77 MB (Helmet)
OPTIMIZED SIZE: 2.73 MB payload
```

- **PBR Materials**: Metallic-roughness workflow with normal maps and ambient occlusion.
- **Lighting**: PBR hemisphere ambient bounce, directional sun light, fill light, and a transparent contact shadow receiver plane (`ShadowMaterial`).
- **Scale**: Normalized to real-world dimensions (~0.65m height for the astronaut).

---

## Project Architecture

```
AR VR/
├── index.html                      # Mobile-optimized entry point & DOM overlay structure
├── package.json                    # Dependencies & npm scripts
├── vite.config.js                  # Vite bundler config with local HTTPS & LAN host
├── vercel.json                     # Vercel caching, MIME headers, and routing
├── public/
│   ├── models/
│   │   ├── model.glb               # Primary astronaut asset (2.7MB)
│   │   ├── astronaut.glb           # Astronaut model
│   │   └── damaged-helmet.glb      # Sci-fi battle helmet model
│   └── external/
│       └── xr/                     # 8th Wall engine binary distribution (xr.js, xr-slam.js)
├── src/
│   ├── main.js                     # Application entry point & lifecycle coordinator
│   ├── ar/
│   │   ├── ar-manager.js           # Multi-driver AR orchestrator
│   │   ├── eighthwall-driver.js    # 8th Wall SLAM pipeline & raycasting hit-test
│   │   └── webxr-driver.js         # Hardware-accelerated WebXR ARCore hit-test driver
│   ├── scene/
│   │   ├── scene-manager.js        # Three.js scene, camera, lights, reticle, model loader
│   │   └── shadow-plane.js         # Real-time contact shadow ground plane
│   ├── interaction/
│   │   └── gesture-handler.js      # 1-finger rotate, 2-finger pinch scale, tap detection
│   └── ui/
│       ├── ui-manager.js           # HUD status badges, instruction toasts, modal dialogs
│       └── style.css               # Modern glassmorphism UI with safe-area padding
└── README.md                       # Documentation & Android testing guide
```

---

## Installation & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Vite will start an HTTPS development server listening on `https://localhost:5173` and print your local network address (e.g. `https://192.168.1.X:5173`).

> [!TIP]
> To test directly on your Android phone on the same Wi-Fi network:
> 1. Open `https://<YOUR_LOCAL_IP>:5173` in Google Chrome on your phone.
> 2. Accept the self-signed SSL certificate bypass.
> 3. Allow camera access.

### 3. Production Build
```bash
npm run build
```
Builds optimized production assets into `dist/`.

### 4. Preview Production Build
```bash
npm run preview
```

---

## Vercel Deployment

The project is preconfigured for zero-config Vercel deployment:
- GitHub Repository: [https://github.com/Najmul343/webar-poc](https://github.com/Najmul343/webar-poc)
- `vercel.json` ensures correct MIME types for `.glb` binary assets and security headers.

### Deploying via Vercel Dashboard:
1. Log into [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import the GitHub repository: `Najmul343/webar-poc`.
4. Leave Framework preset as **Vite** and root directory as `./`.
5. Click **Deploy**.

---

## Android Testing Instructions

1. Open the production HTTPS Vercel URL in **Google Chrome** on an Android phone.
2. Tap **Start AR Experience** on the launch card.
3. When prompted, tap **Allow** for camera permissions.
4. Point your phone at the floor or a table and move it slowly side-to-side so the SLAM tracker detects surface feature points.
5. A blue circular placement reticle will appear and hug the detected surface.
6. **Tap the screen** to anchor the 3D astronaut into your room.
7. **Walk around the object**: Notice the model stays locked in physical space and casts a soft shadow on your floor.
8. **Touch interactions**:
   - **Rotate**: Swipe horizontally with 1 finger on the screen.
   - **Scale**: Pinch with 2 fingers to shrink or enlarge the model.
   - **Reset**: Tap the `↺ Reset` button to restore initial rotation and scale.
   - **Switch Model**: Tap `Switch: Helmet` to swap to the PBR sci-fi helmet.
   - **Remove**: Tap `✕ Remove` to unanchor and scan for a new spot.

---

## Known Limitations & 8th Wall 2026 Open-Source Status

1. **SLAM Licensing**: 8th Wall open-sourced their core framework under MIT in early 2026, but the SLAM tracking engine remains distributed under a binary-only license (`@8thwall/engine-binary`). No `appKey` is needed anymore.
2. **Dual-Engine Architecture**: If 8th Wall engine initialization is delayed or unavailable, the app seamlessly runs native Android WebXR (`immersive-ar`), ensuring universal compatibility on Android Chrome.
3. **Lighting Conditions**: SLAM surface detection requires visible texture on the floor. Completely blank white glossy floors or dim environments may require extra scanning time.

---

## Next Phase (Phase 2 Roadmap)

Following this successful proof of concept, Phase 2 will introduce:
- Image target tracking (e.g. tracking educational flashcards or business cards).
- Interactive 3D educational models with callout hotspot pins.
- Animated assembly and breakdown exploded views.
- Explanatory audio guides and contextual educational labels.
