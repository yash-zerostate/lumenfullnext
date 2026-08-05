import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const PLANS = ["free", "pro", "enterprise"] as const;
export const ROLES = ["user", "admin"] as const;

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
    plan: { type: String, enum: PLANS, default: "free" },
    role: { type: String, enum: ROLES, default: "user" },
    company: { type: String, trim: true, maxlength: 120, default: "" },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
