/**
 * Idempotent seed. The six accounts are identical across all three demo apps
 * and are chosen to cover the attribute matrix — every plan, every role, both
 * active states and a spread of risk scores — so a targeting rule written
 * against one app can be tried against the others unchanged.
 *
 * Run with `npm run seed` after filling in .env.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { hashPassword } from "../src/lib/auth/password";
import { env } from "../src/lib/env";
import { Project } from "../src/models/Project";
import { PLANS, ROLES, User } from "../src/models/User";

/**
 * Accounts registered before the profile schema changed are missing the new
 * fields, or carry a role that is no longer a valid enum value (the old set was
 * user/admin). Reading them still works, but any save would fail validation —
 * so bring every straggler onto the current shape.
 */
async function normaliseLegacyUsers(): Promise<void> {
  const users = User.collection;

  const filled = await users.updateMany(
    { $or: [{ active: { $exists: false } }, { riskScore: { $exists: false } }] },
    { $set: { active: true, riskScore: 1 } },
  );
  const roles = await users.updateMany(
    { role: { $nin: ROLES as unknown as string[] } },
    { $set: { role: "developer" } },
  );
  const plans = await users.updateMany(
    { plan: { $nin: PLANS as unknown as string[] } },
    { $set: { plan: "free" } },
  );
  const cleaned = await users.updateMany({}, { $unset: { company: "", emailVerifiedAt: "" } });

  const touched = filled.modifiedCount + roles.modifiedCount + plans.modifiedCount;
  if (touched > 0 || cleaned.modifiedCount > 0) {
    console.log(
      `  migrated ${touched} legacy user document(s), cleared stale fields on ${cleaned.modifiedCount}`,
    );
  }
}

const PASSWORD = "Password123!";

const ACCOUNTS = [
  { email: "admin@example.com", name: "Aditi Rao", active: true, plan: "enterprise", role: "compliance", riskScore: 2 },
  { email: "pro@example.com", name: "Rohan Mehta", active: true, plan: "pro", role: "developer", riskScore: 5 },
  { email: "free@example.com", name: "Sara Iyer", active: true, plan: "free", role: "marketing", riskScore: 7 },
  { email: "security@example.com", name: "Imran Qureshi", active: true, plan: "pro", role: "security", riskScore: 9 },
  { email: "inactive@example.com", name: "Neha Kapoor", active: false, plan: "pro", role: "developer", riskScore: 4 },
  { email: "dev-free@example.com", name: "Kabir Shah", active: true, plan: "free", role: "developer", riskScore: 1 },
  { email: "yash@gmail.com", name: "yash", active: true, plan: "enterprise", role: "marketing", riskScore: 8 },
] as const;

const PROJECTS: Record<string, Array<{ name: string; domain: string }>> = {
  "admin@example.com": [
    { name: "Acme Marketing", domain: "www.acme.com" },
    { name: "Acme App", domain: "app.acme.com" },
  ],
  "pro@example.com": [{ name: "Northwind Store", domain: "shop.northwind.io" }],
  "security@example.com": [{ name: "Bluebird Console", domain: "console.bluebird.co" }],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDb });
  console.log(`Connected to ${env.mongoDb}`);

  const passwordHash = await hashPassword(PASSWORD);

  for (const account of ACCOUNTS) {
    const user = await User.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          active: account.active,
          plan: account.plan,
          role: account.role,
          riskScore: account.riskScore,
        },
        $setOnInsert: { passwordHash },
        // Attributes from the previous schema, removed so old documents do not
        // keep stale fields around.
        $unset: { company: "", emailVerifiedAt: "" },
      },
      { upsert: true, new: true },
    );

    console.log(
      `  user  ${account.email.padEnd(22)} ${account.plan.padEnd(10)} ${account.role.padEnd(10)} risk ${account.riskScore} ${account.active ? "" : "(inactive)"}`,
    );

    for (const project of PROJECTS[account.email] ?? []) {
      await Project.findOneAndUpdate(
        { ownerId: user!._id, domain: project.domain },
        {
          $set: { name: project.name, archivedAt: null },
          $setOnInsert: {
            environment: "production",
            monthlyEvents: randomInt(40_000, 900_000),
            uniqueVisitors: randomInt(3_000, 60_000),
            conversionRate: Number((Math.random() * 6 + 1).toFixed(1)),
          },
        },
        { upsert: true },
      );
      console.log(`  proj  ${project.domain}`);
    }
  }

  await normaliseLegacyUsers();

  console.log(`\nDone. All seeded accounts use the password: ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
