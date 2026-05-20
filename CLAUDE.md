# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

General Angular/TypeScript style rules live in `.claude/CLAUDE.md` — read those too.

## Commands

- `npm start` — dev server on http://localhost:4200 (uses Angular's `@angular/build:dev-server`, which runs the Express+SSR entry from `src/server.ts`, so Genkit endpoints under `/api/*` are available in dev).
- `npm run build` — production build to `dist/genkit-ssr-example/` (server output mode, so emits both `browser/` and `server/`).
- `npm run watch` — dev-configuration build with file watching.
- `npm run serve:ssr:genkit-ssr-example` — run the built SSR server (`node dist/genkit-ssr-example/server/server.mjs`), defaults to `PORT=4000`.
- `npm test` — Vitest via `@angular/build:unit-test`. Run a single spec with `npx ng test --include src/app/app.spec.ts` (or pass a test name filter through Vitest).
- Genkit Developer UI: `npx genkit start -- tsx --watch src/genkit/menuSuggestionFlow.ts` (flows are introspectable at the printed local URL; the `.genkit/` directory is the runtime cache for that UI).

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
