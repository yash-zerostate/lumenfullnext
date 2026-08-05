# Lumen Analytics — full-stack Next.js demo

A Next.js 15 app whose **API lives on the same origin as the site**. This is the
"Laravel / Rails / full-stack Next" shape: one deployment, one domain, session
cookies attached automatically.

- **Frontend** — Next.js App Router, Server Components, Tailwind
- **Backend** — Next.js Route Handlers under `/api/*`, Mongoose, MongoDB Atlas
- **Auth** — `httpOnly` cookies, `SameSite=Lax`, 15-min access JWT + 30-day
  rotating opaque refresh token with reuse detection

## Setup

```bash
cp .env.example .env      # then paste your Atlas URI and a random AUTH_JWT_SECRET
npm install
npm run seed
npm run dev               # http://localhost:4001
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Pages

| Route | Access | What it does |
|-------|--------|--------------|
| `/` | public | Marketing home |
| `/pricing` | public | Plans; highlights the signed-in user's current plan |
| `/login` | public | Signs in, sets cookies, redirects to `?next=` |
| `/signup` | public | Creates an account and logs straight in |
| `/dashboard` | **protected** | Projects list + create/archive, usage totals |

## API

| Method | Route | Notes |
|--------|-------|-------|
| `POST` | `/api/auth/register` | Zod-validated, rate limited 5 / 15 min / IP |
| `POST` | `/api/auth/login` | Timing-equalised, locks after 8 failures for 15 min |
| `POST` | `/api/auth/logout` | Revokes the refresh family server-side |
| `POST` | `/api/auth/refresh` | XHR rotation |
| `GET`  | `/api/auth/refresh?next=…` | Navigation rotation — middleware bounces here |
| `GET`  | `/api/auth/me` | Live user row, not just the token claims |
| `GET/POST` | `/api/projects` | List / create (enforces the plan's project limit) |
| `DELETE` | `/api/projects/:id` | Soft-archive; ownership is part of the query |

## How the session actually behaves

1. Login sets three cookies: `lumen_access` (15 min, JWT), `lumen_refresh`
   (30 days, opaque, scoped to `/api/auth`) and `lumen_has_session` (a flag with
   no secret in it).
2. `middleware.ts` verifies the access JWT on every `/dashboard` request.
3. When the access token expires, middleware sees `lumen_has_session` and
   redirects to `GET /api/auth/refresh?next=…`, which rotates the refresh token,
   sets a fresh pair and redirects back. The user notices nothing.
4. Logout revokes the refresh family in MongoDB — clearing the cookie alone is
   not enough, because a copied cookie would still work.
5. Presenting an already-rotated refresh token revokes **every** token in that
   family, so a stolen cookie is usable at most once and the theft is contained.

## Things worth poking at

- Sign in, then delete the `lumen_access` cookie in devtools and reload
  `/dashboard` — the refresh bounce restores the session silently.
- Delete `lumen_refresh` too and reload — you land on `/login?reason=session_expired`.
- Sign in as `free@example.com` and try to add a second project — the API answers
  `402 plan_limit_reached`.
