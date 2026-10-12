# The Panel

Pitch a business idea to a panel of five AI judges, Shark Tank style, and get a localized
verdict and report. See [docs/brief.md](docs/brief.md) for the full product brief.

## Requirements

Only **Docker** (Docker Desktop on Windows/macOS, or Docker Engine + Compose v2.24+ on Linux).
Node, pnpm and Postgres all run inside containers.

## Run it (development)

```bash
docker compose up
```

The first start installs dependencies into a Docker volume, which takes a few minutes.

Then, in a second terminal, apply the database migrations:

```bash
docker compose exec web pnpm db:migrate
```

- App: http://localhost:3000 (English) and http://localhost:3000/ar (Arabic)
- Health check: http://localhost:3000/api/health
- Database viewer (optional): `docker compose --profile tools up`, then http://localhost:8080
  (system: PostgreSQL, server: `db`, user/password/db: `panel`)

Source files are mounted into the container, so edits hot-reload.

A `.env` file is optional in development. To change defaults, copy `.env.example` to `.env`.

## Everyday commands

All commands run inside the `web` container:

| Task                                           | Command                                     |
| ---------------------------------------------- | ------------------------------------------- |
| Lint                                           | `docker compose exec web pnpm lint`         |
| Type-check                                     | `docker compose exec web pnpm typecheck`    |
| Format check                                   | `docker compose exec web pnpm format:check` |
| Unit tests                                     | `docker compose exec web pnpm test`         |
| All checks (lint, types, format, tests)        | `docker compose exec web pnpm check`        |
| New migration after editing `src/db/schema.ts` | `docker compose exec web pnpm db:generate`  |
| Apply migrations                               | `docker compose exec web pnpm db:migrate`   |
| Add a dependency                               | `docker compose exec web pnpm add <pkg>`    |

## Production

```bash
cp .env.example .env   # then set a strong POSTGRES_PASSWORD
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm migrate
```

The `web` image is a multi-stage build using Next.js `output: "standalone"` and runs as a
non-root user.

## Project layout

```
src/
  app/[locale]/   pages (en, ar)
  app/api/        route handlers (health, …)
  components/     UI components
  db/             Drizzle schema + client
  domain/         Zod data contracts (pitch, judges, Q&A, debate, verdicts, report, events)
  engine/         SessionEngine interface + engines
    mock/         MockEngine and the 3 bilingual demo scenarios
  i18n/           locale routing and message loading
  lib/            shared helpers (env validation, …)
messages/         translation files (en.json, ar.json)
drizzle/          generated SQL migrations
docs/             product brief
```

## Dependencies and why

| Package                                                              | Why                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| next, react, react-dom                                               | App framework (App Router)                                     |
| next-intl                                                            | Arabic/English routing and translations, RTL-aware             |
| drizzle-orm, drizzle-kit                                             | Typed Postgres queries and migrations                          |
| postgres                                                             | Fast Postgres driver used by Drizzle                           |
| zod                                                                  | Validates env vars and every data contract                     |
| server-only                                                          | Stops server code (DB, secrets) being bundled for the browser  |
| tailwindcss, @tailwindcss/postcss                                    | Styling                                                        |
| eslint, eslint-config-next, @eslint/eslintrc, eslint-config-prettier | Linting                                                        |
| prettier, prettier-plugin-tailwindcss                                | Formatting, with sorted Tailwind classes                       |
| typescript, @types/\*                                                | Strict typing                                                  |
| vitest                                                               | Unit tests                                                     |
| react-hook-form                                                      | Form state without re-rendering on every keystroke             |
| @hookform/resolvers                                                  | Lets the form validate with the same Zod schemas as the server |
| motion                                                               | Boardroom scene animations (entrance, bubbles), GPU-friendly   |
| ai, @ai-sdk/google, @ai-sdk/openai-compatible                        | Vercel AI SDK: real judges and report (Gemini, OpenRouter)     |
| recharts                                                             | Report charts (radar, sales scenarios, marketing budget)       |
| react-globe.gl                                                       | Interactive 3D globe for "where else it could work"            |
| world-atlas, topojson-client                                         | Country shapes for the globe and the flat map                  |
| i18n-iso-countries                                                   | Maps country codes to the map shapes                           |
| three, @react-three/fiber, @react-three/drei                         | 3D boardroom and landing hero (characters built in code)       |
| @react-three/postprocessing, postprocessing                          | Bloom and vignette in the 3D scenes                            |

## How a session works

A session is a stream of typed `SessionEvent`s (`src/domain/events.ts`). An engine's `run()`
reads the transcript so far, continues from there, and stops when it needs the user's answer
(`await_answer`) or when the session is over (`phase: done`). The scene only consumes events,
so the mock engine and a real AI engine are interchangeable.

With `AI_PROVIDER=mock` (the default), three pre-written scenarios are available in English and
Arabic: a healthy-food delivery service in Damascus, a tutoring app in Mumbai, and a weak idea
(a paid water-reminder app in Cairo). The scenario is chosen by the pitch's country, or pinned
with a demo picker.

In the app, `POST /api/sessions/:id/turn` (optionally with the user's answer) runs one turn and
streams the events as NDJSON; each finished item is saved to Postgres before it is sent, so a reload
resumes where the user left off. The boardroom (`src/components/boardroom/`) folds the events
into scene state with a pure reducer. Judge characters sit behind a `<JudgeAvatar judgeId state />`
interface so the SVG versions can be swapped for Rive animations later.

Skip sends `{ fast: true }`: the server stops the run in progress (one run per session), and the
engine continues from the saved transcript without presentation delays. Replay rebuilds the show
in the browser from the transcript, with no engine call.

Honesty rule: every number is a `Figure` with `isEstimate`; a figure presented as a fact must
carry a `source`, and the schema rejects it otherwise.

## 3D scenes

The boardroom and the landing hero are rendered with React Three Fiber
(`src/components/three/`). Judges and the pitcher are built from simple shapes in code (no model
files) and keep the same contract as the SVG avatars: `judgeId` + `state`. A camera director
(`CameraDirector.tsx`, pure `chooseShot` function with tests) picks the shot from the scene state:
wide establishing shot, dolly-in on the entrance, close-up on the speaker, over-the-shoulder while
you answer, two-shots during the debate, a low push-in per verdict and an orbit for the score.

Speech bubbles, verdict cards and the score stay in the page (sharp text, RTL, screen readers).
Devices without WebGL2, with "reduce motion", data saver or little memory/CPU get the 2D scene;
anyone can switch with the 3D/2D button. Bloom and soft shadows only run on capable desktops, and a
performance monitor drops to the light mode if the frame rate falls.

## Real AI (Gemini)

By default the panel runs on the mock engine (`AI_PROVIDER=mock`, no key needed). To use real AI:

1. Create a free key at https://aistudio.google.com/apikey.
2. Copy `.env.example` to `.env` (never commit it) and set `AI_PROVIDER=google` and `AI_API_KEY=...`.
3. Recreate the app container so it reads the new values: `docker compose up -d web`.

How it works (`src/engine/ai/`):

- **Router with fallbacks** (`router.ts`): every call goes to the first model in a chain. If it is
  overloaded, rate-limited or out of daily quota, the call moves to the next model, and the failed
  model is skipped for a while (Google's retry delay, 8 s for an overload, 1 h for a daily quota) so
  later calls don't waste quota on it. Chains are set with `AI_MODEL` / `AI_REPORT_MODEL` and can mix
  providers (`openrouter:` entries need `OPENROUTER_API_KEY`). When every model is busy the viewer
  sees "the panel is busy, try again in a minute" and can retry; nothing already said is lost.
- **Drafts, then strict data** (`drafts.ts`): models fill simple, flat drafts (plain numbers, one
  currency). Code builds the strict domain types from them, adds units, repairs who-answers-whom in
  the debate, checks every rule, and rejects unusable output (the router then tries the next model).
- **Honesty**: every number is an estimate unless it is tied to a search result we actually
  received. Without web search (`AI_SEARCH=off`, the default; Gemini's Google Search is not in the
  free tier) competitors are listed from the model's knowledge with status "unknown".
- **Speed**: the debate is written while the last reaction plays, and the report while the verdicts
  play. Speech is shown word by word after a reply has been checked, so a failed model never leaves
  a half sentence on screen.
- **Limits**: `AI_DAILY_SESSION_LIMIT` (default 30) caps new real sessions per day.
- **Which model answered**: in development, http://localhost:3000/api/dev/ai-usage lists recent calls
  (model, time, failures). The server log has one `[ai]` line per call.
