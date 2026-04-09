# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Run with tsx (no build required, uses .env)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled dist/index.js
npm run lint         # ESLint on src/
npm test             # Run tests with vitest
```

## Architecture

This is a **Model Context Protocol (MCP) server** that wraps the Taiga REST API. It exposes 71 tools to LLMs via stdio transport. The layers from top to bottom:

```
src/index.ts              — MCP server bootstrap, tool registration, request dispatch
src/tools/*.tools.ts      — Zod schemas + descriptions for each MCP tool (no logic)
src/services/*.ts         — Business logic; orchestrate repos, handle OCC
src/repositories/*.ts     — HTTP abstraction per Taiga entity
src/http/TaigaHttpClient.ts — Axios singleton with 401 auto-refresh, 409 OCC, 429 rate-limit
src/auth/                 — AuthService (login/refresh/me), TokenManager (in-memory JWT)
src/config/config.ts      — Zod-validated env config, loaded at startup
```

### Key patterns

**Tool registration** (`src/index.ts`): all `*.tools.ts` schemas are merged into a flat map. `ListToolsRequestSchema` returns them; `CallToolRequestSchema` dispatches to the matching service method. To add a new tool: add the schema in `*.tools.ts`, add the handler case in `index.ts`.

**BaseRepository** (`src/repositories/base/BaseRepository.ts`): generic CRUD over `TaigaHttpClient`. Each entity repository extends it and adds entity-specific methods.

**OCC (Optimistic Concurrency Control)**: Taiga requires a `version` field on every PATCH. Use `withCurrentVersion(getFn, editFn)` from `src/utils/occ.ts` — it fetches the current resource version then applies the edit in one call. All `changeStatus`/`edit` service methods follow this pattern.

**Error handling**: `TaigaAPIError` wraps non-2xx responses; `OCCConflictError` is thrown on HTTP 409. Both are caught in `index.ts` and returned as MCP error responses with descriptive messages for the LLM.

**Authentication flow**: `AuthService.initialize()` is called at server startup to authenticate using env credentials. `TaigaHttpClient` automatically retries on 401 by refreshing the token via `TokenManager`.

## Environment variables

Required: `TAIGA_HOST`, `TAIGA_USERNAME`, `TAIGA_PASSWORD`  
Optional: `TAIGA_AUTH_TYPE` (`normal`|`ldap`, default `normal`), `LOG_LEVEL`, `LOG_FORMAT`, `TAIGA_TLS_VERIFY`, `TAIGA_AUTO_PAGINATE`, `TAIGA_DEFAULT_PAGE_SIZE`

See `.env.example` for the full list. Config is validated at startup via Zod in `src/config/config.ts` — missing required vars throw immediately with a clear message.

## TypeScript notes

- ESM project (`"type": "module"`); all imports must use `.js` extension even for `.ts` source files
- `moduleResolution: bundler` in tsconfig — use `tsx` for dev, `tsc` for production build
- Output to `dist/`, source maps and declarations included
