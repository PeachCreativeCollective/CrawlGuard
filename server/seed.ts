import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await storage.getUserByEmail(email);
  if (existing) return;

  const username = email.split("@")[0];
  const hashed = await hashPassword(password);
  await storage.createUser({ username, email, password: hashed });
  console.log(`Seeded admin user ${email}`);
}
