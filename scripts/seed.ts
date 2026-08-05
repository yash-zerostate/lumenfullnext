/**
 * Idempotent seed: creates the three demo accounts and a couple of projects.
 * Run with `npm run seed` after filling in .env.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { hashPassword } from "../src/lib/auth/password";
import { env } from "../src/lib/env";
import { Project } from "../src/models/Project";
import { User } from "../src/models/User";

const PASSWORD = "Password123!";

const ACCOUNTS = [
  { name: "Aditi Rao", email: "admin@example.com", plan: "enterprise", role: "admin", company: "Acme Corp" },
  { name: "Rohan Mehta", email: "pro@example.com", plan: "pro", role: "user", company: "Northwind" },
  { name: "Sara Iyer", email: "free@example.com", plan: "free", role: "user", company: "" },
] as const;

const PROJECTS: Record<string, Array<{ name: string; domain: string }>> = {
  "admin@example.com": [
    { name: "Acme Marketing", domain: "www.acme.com" },
    { name: "Acme App", domain: "app.acme.com" },
  ],
  "pro@example.com": [{ name: "Northwind Store", domain: "shop.northwind.io" }],
  "free@example.com": [],
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
          plan: account.plan,
          role: account.role,
          company: account.company,
          emailVerifiedAt: new Date(),
        },
        $setOnInsert: { passwordHash },
      },
      { upsert: true, new: true },
    );

    console.log(`  user  ${account.email} (${account.plan})`);

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

  console.log(`\nDone. All seeded accounts use the password: ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
