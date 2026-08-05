# Deploying Lumen

## Vercel or Render?

**Vercel.** This app is a plain Next.js application whose API routes live in the
same project — exactly what Vercel's build target is for. Nothing here needs a
long-lived process: there are no websockets, no background jobs, no local disk
writes.

Render would also work (it would run `next start` on a normal Node server), but
you would be paying for an always-on instance and cold-start protection you do
not need, and you would give up preview deployments.

The one thing to know about serverless: each function instance keeps its own
MongoDB connection pool. `src/lib/db.ts` caches the connection on `globalThis`
so a warm instance reuses it instead of opening a pool per request — that is why
Atlas will show a handful of connections rather than hundreds.

## Vercel setup

| Setting | Value |
|---|---|
| Framework preset | Next.js (auto-detected) |
| Root Directory | `.` (repo root — the app is not in a subfolder) |
| Build command | `next build` (default) |
| Node version | 20 or 22 |

Environment variables (Settings → Environment Variables, all environments):

```
MONGODB_URI          mongodb://…            # your Atlas connection string
MONGODB_DB           lumen_fullstack
AUTH_JWT_SECRET      <48 random bytes>      # node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
APP_ORIGIN           https://<your-app>.vercel.app
```

`NODE_ENV=production` is set by Vercel itself — which is also what flips the
auth cookies to `Secure`.

`APP_ORIGIN` is a fallback only: the CSRF origin check compares against the
request's own Host header first, so preview deployments on `*.vercel.app` keep
working without extra configuration.

## Render setup (if you deploy here instead)

Create a **Web Service** — not a Static Site. This app needs a running server
for its API routes, middleware and server rendering; there is no `out/` folder
to serve.

| Setting | Value |
|---|---|
| Root Directory | *(leave blank — the app is at the repo root)* |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Runtime | Node |

Or import `render.yaml` as a Blueprint.

Environment variables are the same as the Vercel list above, plus
`NODE_ENV=production` (Vercel sets that for you, Render does not — and without
it the auth cookies are not marked `Secure`).

Do **not** set `PORT`. Render provides it and `next start` binds to it; that is
why the start script has no `-p` flag. Locally, `npm run dev` still uses 4001.

**`--include=dev` in the build command is not optional here.** With
`NODE_ENV=production` set, npm skips devDependencies — and TypeScript is one, so
`next build` fails with `Cannot find module 'typescript'` while loading
`next.config.ts`. The same applies to the Express APIs in the sibling repos,
whose build runs `tsc`. (Vercel installs devDependencies regardless, which is
why this only bites on Render.)

Running on one long-lived instance actually fixes two serverless caveats: the
MongoDB pool is shared across all requests, and the in-memory rate limiter
counts every request rather than a fraction of them.

## MongoDB Atlas

Add `0.0.0.0/0` to **Network Access**. Vercel functions do not have stable
egress IPs on the hobby plan, so an IP allow-list cannot work. Access is still
gated by the database user's credentials.

If your DNS resolves SRV records, use the short `mongodb+srv://…` form. The
machine this was built on refuses SRV lookups, which is why `.env.example`
carries the expanded seed-list form — both connect to the same cluster.

## Seeding production

There is no seed step in the build. Run it from your machine against the same
database:

```bash
MONGODB_URI="…" MONGODB_DB="lumen_fullstack" npm run seed
```

## Known limits of the serverless deployment

- **Rate limiting is per-instance.** `src/lib/rate-limit.ts` keeps counters in
  process memory, so with several warm instances the effective limit is higher
  than the configured one. For a real product, move the Map to Redis (Upstash);
  the function signature is already the shape you would keep.
- **Refresh-token cleanup** relies on the MongoDB TTL index on `expiresAt`, not
  on a cron — nothing to schedule.
