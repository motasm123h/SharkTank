# Project Brief: "The Panel" — AI Shark-Tank-Style Idea Validator

You are a senior full-stack engineer and product designer. Build this project from zero to a production-ready MVP, phase by phase. Follow the working rules at the end strictly.

---

## 1. Product vision

A web app where an entrepreneur "pitches" a business idea to a panel of AI judges, Shark Tank style. The panel is a **visual, animated experience**, not a chat box. The panel asks questions, debates the idea, gives verdicts, and the session ends with a **visual report** that answers:

- Can this idea make sales, or not? Why?
- If yes: how? With what pricing, channels and first customers?
- If no: why not, and what would have to change?
- Marketing: Meta ads vs local influencers vs other channels, with a rough budget for each, **specific to the user's country/city**.
- Does it need a physical location, or can it run online?
- Is the market ready now, or is it too early?
- Where in the world could this idea work? (interactive globe)
- Are there similar ideas or competitors already out there?
- Concrete suggestions to improve the idea, plus the first 3 steps to take this week.

**Core differentiator: real localization.** Answers depend on where the user is. A user in Damascus gets answers that account for local payment methods (cash on delivery, limited online payment), purchasing power, dominant platforms (WhatsApp, Facebook, Instagram), and local business realities. A user in Mumbai gets answers based on India. Never give generic, US-centric advice.

**Honesty rule for all generated content:** every number is labelled as either a sourced fact or an estimate. Do not show made-up figures as facts.

---

## 2. The experience (user flow)

1. **Intake:** the user enters the idea, country, city, budget range, online/physical/hybrid preference, current stage (idea / prototype / selling), and language (Arabic or English).
2. **Entrance scene:** the user's avatar walks into a boardroom and stands in front of the panel.
3. **Q&A round:** each judge asks 1–2 questions from their expertise. The user answers by text (voice comes later). Judges react visually (thinking, nodding, skeptical).
4. **Debate round:** judges discuss the idea **with each other**, agree and disagree, in streamed speech bubbles.
5. **Verdict:** each judge says "I'm in" or "I'm out" with a one-line reason, then an overall score is revealed with an animation.
6. **Report:** a dashboard that can be shared and exported (see Phase 5).

### The panel (5 judges, each with a distinct look, color and personality)

| Judge | Focus |
|---|---|
| The Investor | Business model, scalability, return on investment |
| Local Market Expert | The user's country/city: demand, culture, purchasing power, regulations, payments |
| Marketing Strategist | Channels, Meta ads vs influencers, content, customer acquisition cost |
| Financial Analyst | Costs, pricing, break-even, sales scenarios |
| The Skeptic | Finds weaknesses, risks and reasons the idea could fail |

---

## 3. Tech stack

- **Framework:** Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- **Animation:** Motion (Framer Motion) for scenes and transitions
- **Characters:** 2D. Start with SVG/CSS characters that have states (`idle`, `talking`, `thinking`, `happy`, `skeptical`, `in`, `out`). Build them behind a `<JudgeAvatar state=... />` interface so they can be swapped for **Rive** animations later without changing the rest of the app.
- **Charts:** Recharts (or ECharts if a chart needs it)
- **Globe:** react-globe.gl
- **AI:** Vercel AI SDK behind a provider abstraction (see Phase 7)
- **Validation:** Zod for every data contract
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Auth.js (email magic link + Google)
- **i18n:** Arabic (RTL) + English (LTR) from the start
- **Testing:** Vitest (unit) + Playwright (end-to-end)
- **PDF export:** @react-pdf/renderer or a server-side print route

### Docker (required)

- `Dockerfile`: multi-stage (deps → build → runner), Next.js `output: "standalone"`, runs as a non-root user, small final image.
- `docker-compose.yml` for development: `web` (hot reload with mounted source), `db` (Postgres with a named volume and a healthcheck), and optionally `adminer` for viewing the database.
- `docker-compose.prod.yml` for production: built image, no source mount, restart policies.
- Everything must run with `docker compose up` and nothing installed on the host except Docker.
- `.env.example` documents every variable. Never commit real secrets.
- Migrations run with a single documented command inside the container.

---

## 4. No API key yet: mock first

The owner has **no AI API key yet**. The app must be fully usable without one:

- `AI_PROVIDER=mock` is the default. The mock provider returns realistic, pre-written sessions that follow exactly the same Zod schemas as the real provider, and streams them with realistic delays so the animations can be tested.
- Include at least 3 mock sessions:
  1. A healthy-food delivery service in Damascus, Syria
  2. A tutoring app in Mumbai, India
  3. A weak idea that should mostly get "I'm out" verdicts
- Switching to a real model later must only require changing environment variables.

---

## 5. Implementation phases

Complete each phase fully, check it against its acceptance criteria, then **stop and give me a short summary before starting the next phase.**

### Phase 0: Foundation
- Scaffold Next.js + TS + Tailwind, ESLint + Prettier, folder structure.
- Dockerfile, both compose files, `.env.example`, Postgres connected via Drizzle.
- README with setup steps.
- ✅ `docker compose up` shows a running home page and a healthy database.

### Phase 1: Data contracts + mock engine
- Zod schemas for: `PitchInput`, `Judge`, `Question`, `Answer`, `DebateTurn`, `Verdict`, `Report` (score breakdown, sales scenarios, success/failure reasons, marketing plan, location advice, timing, global fit by country, similar ideas, improvements, next steps; each numeric field has `isEstimate` and an optional `source`).
- A `SessionEngine` interface with a `MockEngine` implementation and the 3 mock sessions.
- ✅ Unit tests prove every mock session validates against the schemas.

### Phase 2: Intake + design system
- Landing page and intake form (all fields from section 2), validated with Zod.
- Design tokens: colors, typography, one color per judge, dark mode.
- Arabic RTL + English LTR switching.
- ✅ The form works in both languages and on mobile.

### Phase 3: Boardroom scene + Q&A
- Boardroom layout, the 5 judge avatars with states, the user avatar entrance animation.
- Q&A round: the active judge is highlighted, the question streams into a speech bubble, the user answers, and the other judges react.
- ✅ A full Q&A round plays end to end on mock data, at 60fps on a mid-range phone.

### Phase 4: Debate + verdict
- Judges debate in turns with streamed bubbles. Disagreements are visually clear (who is replying to whom).
- Verdict sequence: each judge's in/out card, then an animated overall score reveal.
- Skip and replay controls.
- ✅ The full scene from entrance to verdict plays on all 3 mock sessions.

### Phase 5: Report dashboard
- Overall score + a radar chart (demand, competition, purchasing power, ease of launch, scalability).
- Sales scenarios (pessimistic / realistic / optimistic) chart.
- "Why it could succeed" vs "Why it could fail", side by side.
- Marketing plan: Meta ads vs influencers vs other channels, with a budget per channel.
- Online vs physical recommendation, plus a market-timing indicator (too early / right time / late).
- Interactive globe showing the countries where the idea fits, with a reason on hover.
- Similar ideas / competitors list.
- Improvement suggestions and the first 3 steps.
- Clear visual marking of estimates vs sourced facts.
- PDF export + shareable link.
- ✅ The report is readable on mobile, exports to PDF, and works in RTL.

### Phase 6: Accounts + persistence
- Auth.js login. Sessions and reports are saved to Postgres.
- "My pitches" history page. Public/private toggle for share links.
- ✅ A logged-in user can run a pitch, leave, come back and reopen the report.

### Phase 7: Real AI integration
- Provider abstraction via the Vercel AI SDK. Model and provider are chosen by environment variables (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`).
- One system prompt per judge persona, stored as versioned files. All prompts receive the user's country/city and must answer for that location.
- Structured output validated with the Zod schemas from Phase 1. Retry once on a validation failure, then fall back gracefully.
- Web search tool for competitors and similar ideas, with sources saved to the report.
- Cost control: token budget per session, logged cost per session, and rate limiting per user.
- ✅ With a key set, a real session completes. Without one, the mock still works.

### Phase 8: Performance + polish
- Optimize for slow internet: lazy-load the globe and the characters, compress assets, show skeleton states.
- Accessibility: keyboard navigation, reduced-motion mode, contrast checks.
- Error and empty states for every screen.
- ✅ Lighthouse mobile score ≥ 85 on the landing page and the report page.

### Phase 9: Production readiness
- Playwright end-to-end tests: intake → scene → verdict → report → PDF.
- Production Docker image builds and runs with `docker-compose.prod.yml`.
- Basic logging, a health check endpoint, and database backup notes in the README.
- ✅ All tests pass inside Docker, and the README lets a new developer run the project in under 10 minutes.

### Later (do not build now, but keep the architecture ready)
- Voice answers (speech-to-text) and judge voices (text-to-speech) with lip-sync on Rive characters.
- 3D boardroom (React Three Fiber).
- Payments and plans (free first pitch, paid after).

---

## 6. Working rules

1. **Before writing any code**, restate the plan in a few lines and ask me any questions that would change the architecture. Then wait for my answer.
2. Work one phase at a time. Do not jump ahead.
3. At the end of each phase: run lint, type-check and tests inside Docker, commit with a clear message, and give me a short summary (what was built, how to see it, anything left open).
4. Keep components small and typed. No `any`.
5. All user-facing text goes through i18n. No hard-coded strings.
6. Do not add a dependency without saying why in one line.
7. If something in this brief is unclear or conflicts with a better approach, say so and propose the alternative instead of guessing silently.
