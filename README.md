# Prudent frontend

React + TypeScript + Vite + Tailwind + Recharts + MapLibre + Motion + React Router + TanStack Query + Zod.

## Quickstart

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev            # http://localhost:5173
```

## Checks

```bash
npm test        # vitest
npm run build   # tsc --noEmit && vite build
```

## Routes

- `/` — editorial hero (“The climate is changing. Explore where.”)
- `/explore` — analysis workspace (search → boundary map → period → heatwave analysis → results)
- `/methodology`, `/about`

Only `VITE_*` public settings live in frontend env. No secrets.
