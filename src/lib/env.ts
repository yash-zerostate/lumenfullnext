/**
 * Fail fast on missing configuration. A half-configured auth system is worse
 * than one that refuses to boot, so every secret is read through here.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  get mongoUri() {
    return required("MONGODB_URI");
  },
  get mongoDb() {
    return process.env.MONGODB_DB || "lumen_demo";
  },
  get jwtSecret() {
    const secret = required("AUTH_JWT_SECRET");
    if (secret.length < 32) {
      throw new Error("AUTH_JWT_SECRET must be at least 32 characters long.");
    }
    return secret;
  },
  get accessTtlMinutes() {
    return int("ACCESS_TOKEN_TTL_MIN", 15);
  },
  get refreshTtlDays() {
    return int("REFRESH_TOKEN_TTL_DAYS", 30);
  },
  get appOrigin() {
    return process.env.APP_ORIGIN || "http://localhost:4001";
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
