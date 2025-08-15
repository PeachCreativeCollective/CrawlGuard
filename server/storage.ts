import {
  users,
  contactSubmissions,
  leads,
  workingHours,
  timeBlocks,
  galleryImages,
  type User,
  type InsertUser,
  type LoginUser,
  type ContactSubmission,
  type InsertContactSubmission,
  type Lead,
  type InsertLead,
  type UpdateLead,
  type WorkingHours,
  type InsertWorkingHours,
  type UpdateWorkingHours,
  type TimeBlock,
  type InsertTimeBlock,
  type UpdateTimeBlock,
  type GalleryImage,
  type InsertGalleryImage,
  type UpdateGalleryImage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  getUserCount(): Promise<number>;
  
  // Contact submission operations
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  
  // Lead management operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: UpdateLead): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  getLeadsByStatus(status: string): Promise<Lead[]>;

  // Working hours operations
  getWorkingHours(userId: string): Promise<WorkingHours[]>;
  upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours): Promise<WorkingHours>;

  // Time blocks operations
  getTimeBlocks(userId: string): Promise<TimeBlock[]>;
  createTimeBlock(timeBlock: InsertTimeBlock & { userId: string }): Promise<TimeBlock>;
  updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock>;
  deleteTimeBlock(id: string): Promise<void>;

  // Gallery image operations
  getGalleryImages(): Promise<GalleryImage[]>;
  getPublishedGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImageById(id: string): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Only crawlguardllc@gmail.com should be admin (case insensitive)
    const userData = {
      ...insertUser,
      isAdmin: insertUser.email.toLowerCase() === 'crawlguardllc@gmail.com'
    };

    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    // We'll need to hash the password here, similar to how it's done in auth.ts
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(password);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  // Contact submission operations
  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db
      .insert(contactSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }

  // Lead management operations
  async createLead(insertLead: InsertLead): Promise<Lead> {
    // Convert the data to match the database schema
    const dbData: any = { ...insertLead };
    
    // Ensure scheduledDate is properly handled
    if (dbData.scheduledDate && typeof dbData.scheduledDate === 'string') {
      dbData.scheduledDate = new Date(dbData.scheduledDate);
    }
    
    const [lead] = await db
      .insert(leads)
      .values(dbData)
      .returning();
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead> {
    // Convert the updates to match the database schema
    const dbUpdates: any = { ...updates, updatedAt: new Date() };
    
    // Ensure scheduledDate is properly handled
    if (dbUpdates.scheduledDate && typeof dbUpdates.scheduledDate === 'string') {
      dbUpdates.scheduledDate = new Date(dbUpdates.scheduledDate);
    }
    
    const [lead] = await db
      .update(leads)
      .set(dbUpdates)
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.status, status))
      .orderBy(desc(leads.createdAt));
  }

  // Working hours operations
  async getWorkingHours(userId: string): Promise<WorkingHours[]> {
    return db.select().from(workingHours).where(eq(workingHours.userId, userId));
  }

  async upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours): Promise<WorkingHours> {
    // First, try to find existing working hours for this user and day
    const existingHours = await db
      .select()
      .from(workingHours)
      .where(and(eq(workingHours.userId, userId), eq(workingHours.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (existingHours.length > 0) {
      // Update existing record
      const [result] = await db
        .update(workingHours)
        .set({
          ...hours,
          updatedAt: new Date(),
        })
        .where(and(eq(workingHours.userId, userId), eq(workingHours.dayOfWeek, dayOfWeek)))
        .returning();
      return result;
    } else {
      // Insert new record
      const [result] = await db
        .insert(workingHours)
        .values({
          userId,
          dayOfWeek,
          ...hours,
          updatedAt: new Date(),
        })
        .returning();
      return result;
    }
  }

  // Time blocks operations
  async getTimeBlocks(userId: string): Promise<TimeBlock[]> {
    return db.select().from(timeBlocks).where(eq(timeBlocks.userId, userId));
  }

  async createTimeBlock(timeBlockData: InsertTimeBlock & { userId: string }): Promise<TimeBlock> {
    const [result] = await db
      .insert(timeBlocks)
      .values({
        ...timeBlockData,
        startDateTime: typeof timeBlockData.startDateTime === 'string' ? 
          new Date(timeBlockData.startDateTime) : timeBlockData.startDateTime,
        endDateTime: typeof timeBlockData.endDateTime === 'string' ? 
          new Date(timeBlockData.endDateTime) : timeBlockData.endDateTime,
      })
      .returning();
    return result;
  }

  async updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    if (updates.startDateTime) {
      updateData.startDateTime = typeof updates.startDateTime === 'string' ? 
        new Date(updates.startDateTime) : updates.startDateTime;
    }
    
    if (updates.endDateTime) {
      updateData.endDateTime = typeof updates.endDateTime === 'string' ? 
        new Date(updates.endDateTime) : updates.endDateTime;
    }

    const [result] = await db
      .update(timeBlocks)
      .set(updateData)
      .where(eq(timeBlocks.id, id))
      .returning();
    return result;
  }

  async deleteTimeBlock(id: string): Promise<void> {
    await db.delete(timeBlocks).where(eq(timeBlocks.id, id));
  }

  // Gallery image operations
  async getGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(desc(galleryImages.displayOrder), desc(galleryImages.createdAt));
  }

  async getPublishedGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages)
      .where(eq(galleryImages.isPublished, true))
      .orderBy(desc(galleryImages.displayOrder), desc(galleryImages.createdAt));
  }

  async getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return image || undefined;
  }

  async createGalleryImage(imageData: InsertGalleryImage): Promise<GalleryImage> {
    const [result] = await db
      .insert(galleryImages)
      .values(imageData)
      .returning();
    return result;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage> {
    const [result] = await db
      .update(galleryImages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(galleryImages.id, id))
      .returning();
    return result;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }
}

export const storage = new DatabaseStorage();
