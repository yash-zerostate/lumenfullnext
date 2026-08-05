import { Schema, Types, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * The product's actual domain object: a website the customer tracks. Kept small
 * on purpose — the point of this demo is the auth and data plumbing around it.
 */
const projectSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    domain: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    environment: { type: String, enum: ["production", "staging"], default: "production" },
    monthlyEvents: { type: Number, default: 0, min: 0 },
    uniqueVisitors: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

projectSchema.index({ ownerId: 1, domain: 1 }, { unique: true });

export type ProjectDoc = InferSchemaType<typeof projectSchema> & { _id: unknown };

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) || model<ProjectDoc>("Project", projectSchema);
