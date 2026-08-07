// Signs a short-lived Preta context JWT (RS256) that the loader reads from a
// readable cookie (`data-ctx-cookie`). Preta verifies it with the matching PUBLIC
// key registered for this domain — lumen-public.pem.
//
// Why a cookie and not a window variable: the token then lives OUTSIDE the HTML,
// so a page can be cached and served identically to everyone while still
// personalising per visitor. It also keeps the root layout free of `cookies()`,
// which would otherwise force every page in the app to render dynamically.
import { SignJWT, importPKCS8 } from "jose";

// PEM may be stored with real newlines, with \n escaped, or base64 in the env.
function decodePem(value: string | undefined): string | null {
  if (!value) return null;
  if (value.includes("BEGIN")) return value.replace(/\\n/g, "\n");
  return Buffer.from(value, "base64").toString("utf8");
}

let privateKeyPromise: Promise<CryptoKey> | null = null;

function getPrivateKey(): Promise<CryptoKey> {
  const pem = decodePem(process.env.PRETA_PRIVATE_KEY);
  if (!pem) throw new Error("PRETA_PRIVATE_KEY is not set");
  privateKeyPromise ??= importPKCS8(pem, "RS256");
  return privateKeyPromise;
}

/** Attributes we target on. Deliberately no email and no raw database id. */
export type PretaAttributes = {
  plan: string;
  role: string;
  active: boolean;
  risk_score: number;
};

/**
 * Sign the context token. Returns null instead of throwing if the key is missing
 * or malformed — a broken Preta config must never break login.
 */
export async function createPretaContextToken(
  attributes: PretaAttributes,
  opts: { ttlSeconds?: number } = {},
): Promise<string | null> {
  try {
    const key = await getPrivateKey();
    const ttl = opts.ttlSeconds ?? 900; // matches the access token's lifetime
    return await new SignJWT({ "preta:user": { ...attributes } })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(`${ttl}s`)
      .sign(key);
  } catch (e) {
    console.error("[Preta] context sign failed:", (e as Error)?.message);
    return null;
  }
}
