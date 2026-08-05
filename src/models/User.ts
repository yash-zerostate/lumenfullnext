import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * The six attributes below are the shared user profile across all three demo
 * apps, so a rule written against one works against the others unchanged.
 */
export const PLANS = ["free", "pro", "enterprise"] as const;
export const ROLES = ["developer", "security", "marketing", "compliance"] as const;
export const RISK_SCORE_MIN = 1;
export const RISK_SCORE_MAX = 9;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Never selected by default — a stray `User.find()` must not be able to leak
    // password material into a response body.
    passwordHash: { type: String, required: true, select: false },
    /** Deactivated accounts cannot sign in, and their live sessions stop refreshing. */
    active: { type: Boolean, default: true },
    plan: { type: String, enum: PLANS, default: "free" },
    role: { type: String, enum: ROLES, default: "developer" },
    riskScore: {
      type: Number,
      default: 1,
      min: RISK_SCORE_MIN,
      max: RISK_SCORE_MAX,
      validate: {
        validator: Number.isInteger,
        message: "riskScore must be a whole number between 1 and 9",
      },
    },
    lastLoginAt: { type: Date, default: null },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
