# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

General Angular/TypeScript style rules live in `.claude/CLAUDE.md` — read those too.

## Commands

- `npm run build` — production build to `dist/genkit-ssr-example/` (server output mode, emits both `browser/` and `server/`).
- `npm run watch` — dev-configuration build with file watching; pairs with `npm run dev:ssr`.
- `npm run dev:ssr` — run the dist SSR server with `node --watch`, so it restarts automatically when `npm run watch` rewrites `dist/`. Defaults to `PORT=4000`.
- `npm run serve:ssr:genkit-ssr-example` — same as `dev:ssr` but without the watcher; use for one-off prod-mode runs.
- `npm test` — Vitest via `@angular/build:unit-test`. Run a single spec with `npx ng test --include src/app/app.spec.ts` (or pass a test name filter through Vitest).
- Genkit Developer UI: `npx genkit start -- tsx --watch src/genkit/menuSuggestionFlow.ts` (flows are introspectable at the printed local URL; the `.genkit/` directory is the runtime cache for that UI).

`npm start` / `ng serve` is currently broken on this stack: Vite 7's SSR module runner can't resolve `z` through Genkit's `export * from <CJS>` chain, so `src/genkit/*.ts` crashes with `Cannot read properties of undefined (reading 'object')` at startup. The production esbuild path doesn't go through that runner, which is why `npm run build` works. Dev loop is therefore `npm run watch` + `npm run dev:ssr` in two terminals (no HMR; full reload on save). For Genkit flow iteration, prefer the Developer UI command above.

The `GOOGLE_GENAI_API_KEY` (or equivalent Google AI credentials) env var is required at runtime for `menuSuggestionFlow` to call Gemini.

## Architecture

This is an Angular 21 SSR app whose Express server also hosts Genkit AI flows on the same origin. The single process serves three concerns:

1. **Angular SSR/prerender** — `src/server.ts` builds an `AngularNodeAppEngine` and falls through to it for all non-API, non-static routes. `src/app/app.routes.server.ts` currently prerenders `**`, so changing a route to dynamic SSR means switching that entry to `RenderMode.Server` (and being aware the Genkit call in `App` will then run server-side on every request).
2. **Genkit flow endpoints** — `src/genkit/*.ts` defines flows with `ai.defineFlow(...)` and `src/server.ts` exposes them via `app.post('/api/<flowName>', expressHandler(flow))` from `@genkit-ai/express`. Add a new flow by creating a file under `src/genkit/`, importing it in `src/server.ts`, and wiring a matching `app.post` route.
3. **Client → flow calls** — components call flows with `runFlow({ url: '/api/<flowName>', input })` from `genkit/beta/client` (see `src/app/app.ts`). The URL is same-origin in both dev (port 4200) and prod (port 4000), which is the reason flows must be mounted on the SSR Express server rather than a separate process.

Dual bootstrap entry points:
- `src/main.ts` → browser bootstrap with `appConfig` (router + client hydration with event replay).
- `src/main.server.ts` → server bootstrap with `config` from `app.config.server.ts`, which merges `appConfig` with `provideServerRendering(withRoutes(serverRoutes))`.

The Angular build's `outputMode: "server"` (in `angular.json`) is what causes `src/server.ts` to be bundled as the deployable entry; without it the Express + Genkit wiring would not be invoked.
