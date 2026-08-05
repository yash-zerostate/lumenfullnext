import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burn roughly the same CPU as a real comparison when the account does not
 * exist, so response timing does not reveal which emails are registered.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.9O1zZ8pQ0Ee3jkR0jJ3EJ2yJ2y3q4nS";

export async function fakeVerify(): Promise<void> {
  await bcrypt.compare("not-the-password", DUMMY_HASH);
}
