import { Schema, Types, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * One document per issued refresh token. The raw token never touches the
 * database — only its SHA-256 hash — so a database dump cannot be replayed
 * against the API.
 *
 * `familyId` ties every rotation of one login together. If a token that was
 * already rotated shows up again (classic replay of a stolen cookie), the whole
 * family is revoked at once.
 */
const refreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

// Mongo drops expired documents on its own; no cleanup job needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = InferSchemaType<typeof refreshTokenSchema> & { _id: unknown };

export const RefreshToken: Model<RefreshTokenDoc> =
  (models.RefreshToken as Model<RefreshTokenDoc>) ||
  model<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);
