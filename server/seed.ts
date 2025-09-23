import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await storage.getUserByEmail(email);
  if (!existing) {
    const username = email.split("@")[0];
    const hashed = await hashPassword(password);
    await storage.createUser({ username, email, password: hashed });
    await db.update(users).set({ isAdmin: true }).where(eq(users.email, email));
    console.log(`Seeded admin user ${email}`);
    return;
  }

  // Update password and ensure admin flag
  await storage.updateUserPassword(existing.id, password);
  await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
  console.log(`Ensured admin privileges and updated password for ${email}`);
}
