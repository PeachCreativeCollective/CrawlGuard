import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leads table for managing customer inquiries and sales pipeline
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  service: text("service").notNull(), // crawl-space, basement, foundation, etc.
  status: text("status").notNull().default("new"), // new, contacted, scheduled, quoted, won, lost
  priority: text("priority").notNull().default("medium"), // low, medium, high
  source: text("source").default("website"), // website, referral, google, etc.
  notes: text("notes"),
  estimatedValue: text("estimated_value"), // storing as text for flexibility
  scheduledDate: timestamp("scheduled_date"),
  googleCalendarEventId: text("google_calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_leads_status").on(table.status),
  index("idx_leads_created_at").on(table.createdAt),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).pick({
  name: true,
  email: true,
  phone: true,
  service: true,
  message: true,
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  service: true,
  status: true,
  priority: true,
  source: true,
  notes: true,
  estimatedValue: true,
  scheduledDate: true,
});

export const updateLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  service: true,
  status: true,
  priority: true,
  source: true,
  notes: true,
  estimatedValue: true,
  scheduledDate: true,
  googleCalendarEventId: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type Lead = typeof leads.$inferSelect;
