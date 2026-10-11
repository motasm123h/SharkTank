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

| Package                                                              | Why                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| next, react, react-dom                                               | App framework (App Router)                                    |
| next-intl                                                            | Arabic/English routing and translations, RTL-aware            |
| drizzle-orm, drizzle-kit                                             | Typed Postgres queries and migrations                         |
| postgres                                                             | Fast Postgres driver used by Drizzle                          |
| zod                                                                  | Validates env vars and every data contract                    |
| server-only                                                          | Stops server code (DB, secrets) being bundled for the browser |
| tailwindcss, @tailwindcss/postcss                                    | Styling                                                       |
| eslint, eslint-config-next, @eslint/eslintrc, eslint-config-prettier | Linting                                                       |
| prettier, prettier-plugin-tailwindcss                                | Formatting, with sorted Tailwind classes                      |
| typescript, @types/\*                                                | Strict typing                                                 |
| vitest                                                               | Unit tests                                                    |

## How a session works

A session is a stream of typed `SessionEvent`s (`src/domain/events.ts`). An engine's `run()`
reads the transcript so far, continues from there, and stops when it needs the user's answer
(`await_answer`) or when the session is over (`phase: done`). The scene only consumes events,
so the mock engine and a real AI engine are interchangeable.

With `AI_PROVIDER=mock` (the default), three pre-written scenarios are available in English and
Arabic: a healthy-food delivery service in Damascus, a tutoring app in Mumbai, and a weak idea
(a paid water-reminder app in Cairo). The scenario is chosen by the pitch's country, or pinned
with a demo picker.

Honesty rule: every number is a `Figure` with `isEstimate`; a figure presented as a fact must
carry a `source`, and the schema rejects it otherwise.
