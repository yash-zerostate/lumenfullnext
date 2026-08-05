import { z } from "zod";

/**
 * No strength rules — this is a demo where any password should work. Only the
 * bounds that keep things sane remain: non-empty, and short enough that bcrypt
 * (which silently ignores bytes past 72) is not doing something surprising.
 */
export const passwordSchema = z
  .string()
  .min(1, "Enter a password")
  .max(128, "Password is too long");

export const PLAN_OPTIONS = ["free", "pro", "enterprise"] as const;
export const ROLE_OPTIONS = ["developer", "security", "marketing", "compliance"] as const;
export const RISK_SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Sign-up collects the whole profile, and everything except email and password
 * is optional — the form offers a dropdown per attribute and the schema fills
 * in a default when one is left alone.
 *
 * Note this is a deliberate demo choice: letting a visitor pick their own
 * `plan` and `riskScore` is exactly what a real product must never do (plan
 * comes from billing, risk from scoring). Here it is the point — it is how you
 * create accounts across the whole attribute matrix without touching the
 * database.
 */
export const registerSchema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: passwordSchema,
  active: z.enum(["yes", "no"]).optional().default("yes"),
  plan: z.enum(PLAN_OPTIONS).optional().default("free"),
  role: z.enum(ROLE_OPTIONS).optional().default("developer"),
  riskScore: z.coerce
    .number()
    .int("Pick a whole number")
    .min(1, "Risk score starts at 1")
    .max(9, "Risk score stops at 9")
    .optional()
    .default(1),
});

/** Editing the profile from the account page — every attribute is settable. */
export const profileSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  active: z.enum(["yes", "no"]),
  plan: z.enum(PLAN_OPTIONS),
  role: z.enum(ROLE_OPTIONS),
  riskScore: z.coerce.number().int().min(1).max(9),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Name your project").max(80),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(4)
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Enter a bare domain like app.acme.com"),
  environment: z.enum(["production", "staging"]).default("production"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;

/** Flatten Zod issues into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
