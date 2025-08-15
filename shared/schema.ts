import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  zipCode: text("zip_code").notNull(),
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
  zipCode: text("zip_code"),
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
  email: true,
  password: true,
});

export const loginSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  zipCode: true,
  service: true,
  message: true,
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  zipCode: true,
  service: true,
  status: true,
  priority: true,
  source: true,
  notes: true,
  estimatedValue: true,
  scheduledDate: true,
}).extend({
  scheduledDate: z.union([z.date(), z.string().datetime(), z.null()]).optional(),
});

export const updateLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
  zipCode: true,
  service: true,
  status: true,
  priority: true,
  source: true,
  notes: true,
  estimatedValue: true,
  scheduledDate: true,
  googleCalendarEventId: true,
}).partial().extend({
  scheduledDate: z.union([z.date(), z.string().datetime(), z.null()]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Working Hours and Availability Management
export const workingHours = pgTable("working_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dayOfWeek: varchar("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("start_time").notNull(), // HH:mm format
  endTime: varchar("end_time").notNull(), // HH:mm format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_working_hours_user_day").on(table.userId, table.dayOfWeek),
]);

export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  blockType: varchar("block_type").notNull().default("personal"), // personal, maintenance, break, etc.
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // weekly, daily, etc.
  color: varchar("color").default("#ef4444"), // hex color for display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_time_blocks_user").on(table.userId),
  index("idx_time_blocks_date").on(table.startDateTime),
]);

export const insertWorkingHoursSchema = createInsertSchema(workingHours).pick({
  startTime: true,
  endTime: true,
  isActive: true,
});

export const updateWorkingHoursSchema = insertWorkingHoursSchema.partial();

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).pick({
  title: true,
  description: true,
  startDateTime: true,
  endDateTime: true,
  blockType: true,
  isRecurring: true,
  recurringPattern: true,
  color: true,
}).extend({
  startDateTime: z.union([z.date(), z.string().datetime()]),
  endDateTime: z.union([z.date(), z.string().datetime()]),
});

export const updateTimeBlockSchema = insertTimeBlockSchema.partial();

export type WorkingHours = typeof workingHours.$inferSelect;
export type InsertWorkingHours = z.infer<typeof insertWorkingHoursSchema>;
export type UpdateWorkingHours = z.infer<typeof updateWorkingHoursSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type UpdateTimeBlock = z.infer<typeof updateTimeBlockSchema>;

// Gallery Images Table
export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  altText: varchar("alt_text", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: varchar("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  category: varchar("category", { length: 100 }).default("general"),
  isPublished: boolean("is_published").default(false),
  displayOrder: varchar("display_order").default("0"),
  seoKeywords: varchar("seo_keywords", { length: 500 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_gallery_images_published").on(table.isPublished),
  index("idx_gallery_images_category").on(table.category),
  index("idx_gallery_images_order").on(table.displayOrder),
]);

// Gallery image schemas
export const insertGalleryImageSchema = createInsertSchema(galleryImages).pick({
  title: true,
  description: true,
  altText: true,
  imageUrl: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  category: true,
  isPublished: true,
  displayOrder: true,
  seoKeywords: true,
  uploadedBy: true,
});

export const updateGalleryImageSchema = insertGalleryImageSchema.partial();

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type UpdateGalleryImage = z.infer<typeof updateGalleryImageSchema>;
