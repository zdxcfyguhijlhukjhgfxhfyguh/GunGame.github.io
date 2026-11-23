# Three.js FPS Game

A browser-based first-person shooter built with React Three Fiber, Rapier physics, and Zustand state management.

## Maps

- **Nuketown** — Classic desert cul-de-sac. Snipe enemies across two houses.
- **Dotonbori** — Neon-lit Osaka canal at night. Cherry blossoms and bridges.
- **Vatican** — Defend the Pope's balcony from 100 enemies swarming St. Peter's Square.
- **Hormuz** — Cliff fortress overlooking the strait. Rocket launcher enemy ships before they pass through.
- **E Island** — Circle a private island in an AC-130 gunship. Rain rockets down on billionaires below.

## Controls

| Key | Action |
|-----|--------|
| W A S D | Move |
| SPACE | Jump |
| SHIFT | Sprint |
| LMB | Shoot |
| RMB | Aim Down Sights |
| R | Reload |
| Q | Lasso Whip |
| 1 | Sniper |
| 2 | Rocket Launcher |

## Tech Stack

- **React Three Fiber** — React renderer for Three.js
- **@react-three/rapier** — Physics engine
- **@react-three/drei** — Helpers (Sky, Environment, Stats)
- **@react-three/postprocessing** — Bloom, vignette, chromatic aberration, tone mapping
- **Zustand** — State management
- **Vite** — Build tool

## Run

```bash
npm install
npm run dev
```
