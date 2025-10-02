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
import { ensureDatabase, getDb as getDatabase } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { hashPassword } from "./passwords";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  setUserAdminStatus(id: string, isAdmin: boolean): Promise<void>;
  getUserCount(): Promise<number>;

  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;

  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: UpdateLead): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  getLeadsByStatus(status: string): Promise<Lead[]>;

  getWorkingHours(userId: string): Promise<WorkingHours[]>;
  upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours): Promise<WorkingHours>;

  getTimeBlocks(userId: string): Promise<TimeBlock[]>;
  createTimeBlock(timeBlock: InsertTimeBlock & { userId: string }): Promise<TimeBlock>;
  updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock>;
  deleteTimeBlock(id: string): Promise<void>;

  getGalleryImages(): Promise<GalleryImage[]>;
  getPublishedGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImageById(id: string): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private get db() {
    const database = getDatabase();
    if (!database) {
      throw new Error("Database connection is not configured");
    }
    return database;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.toLowerCase();
    const [user] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalized}`);
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const normalizedEmail = insertUser.email.toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase() ?? "crawlguardllc@gmail.com";

    const userData = {
      ...insertUser,
      email: normalizedEmail,
      isAdmin: normalizedEmail === adminEmail,
    } as any;

    const [user] = await this.db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await this.db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async setUserAdminStatus(id: string, isAdmin: boolean): Promise<void> {
    await this.db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUserCount(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await this.db
      .insert(contactSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await this.db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const dbData: any = { ...insertLead };
    if (dbData.scheduledDate && typeof dbData.scheduledDate === "string") {
      dbData.scheduledDate = new Date(dbData.scheduledDate);
    }
    const [lead] = await this.db
      .insert(leads)
      .values(dbData)
      .returning();
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return await this.db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead> {
    const dbUpdates: any = { ...updates, updatedAt: new Date() };
    if (dbUpdates.scheduledDate && typeof dbUpdates.scheduledDate === "string") {
      dbUpdates.scheduledDate = new Date(dbUpdates.scheduledDate);
    }
    const [lead] = await this.db
      .update(leads)
      .set(dbUpdates)
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await this.db.delete(leads).where(eq(leads.id, id));
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await this.db
      .select()
      .from(leads)
      .where(eq(leads.status, status))
      .orderBy(desc(leads.createdAt));
  }

  async getWorkingHours(userId: string): Promise<WorkingHours[]> {
    return this.db.select().from(workingHours).where(eq(workingHours.userId, userId));
  }

  async upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours): Promise<WorkingHours> {
    const existingHours = await this.db
      .select()
      .from(workingHours)
      .where(and(eq(workingHours.userId, userId), eq(workingHours.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (existingHours.length > 0) {
      const [result] = await this.db
        .update(workingHours)
        .set({ ...hours, updatedAt: new Date() })
        .where(and(eq(workingHours.userId, userId), eq(workingHours.dayOfWeek, dayOfWeek)))
        .returning();
      return result;
    } else {
      const [result] = await this.db
        .insert(workingHours)
        .values({ userId, dayOfWeek, ...hours, updatedAt: new Date() })
        .returning();
      return result;
    }
  }

  async getTimeBlocks(userId: string): Promise<TimeBlock[]> {
    return this.db.select().from(timeBlocks).where(eq(timeBlocks.userId, userId));
  }

  async createTimeBlock(timeBlockData: InsertTimeBlock & { userId: string }): Promise<TimeBlock> {
    const [result] = await this.db
      .insert(timeBlocks)
      .values({
        ...timeBlockData,
        startDateTime:
          typeof timeBlockData.startDateTime === "string"
            ? new Date(timeBlockData.startDateTime)
            : timeBlockData.startDateTime,
        endDateTime:
          typeof timeBlockData.endDateTime === "string"
            ? new Date(timeBlockData.endDateTime)
            : timeBlockData.endDateTime,
      })
      .returning();
    return result;
  }

  async updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    if (updates.startDateTime) {
      updateData.startDateTime =
        typeof updates.startDateTime === "string" ? new Date(updates.startDateTime) : updates.startDateTime;
    }
    if (updates.endDateTime) {
      updateData.endDateTime =
        typeof updates.endDateTime === "string" ? new Date(updates.endDateTime) : updates.endDateTime;
    }
    const [result] = await this.db
      .update(timeBlocks)
      .set(updateData)
      .where(eq(timeBlocks.id, id))
      .returning();
    return result;
  }

  async deleteTimeBlock(id: string): Promise<void> {
    await this.db.delete(timeBlocks).where(eq(timeBlocks.id, id));
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    return this.db
      .select()
      .from(galleryImages)
      .orderBy(desc(galleryImages.displayOrder), desc(galleryImages.createdAt));
  }

  async getPublishedGalleryImages(): Promise<GalleryImage[]> {
    return this.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isPublished, true))
      .orderBy(desc(galleryImages.displayOrder), desc(galleryImages.createdAt));
  }

  async getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
    const [image] = await this.db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return image || undefined;
  }

  async createGalleryImage(imageData: InsertGalleryImage): Promise<GalleryImage> {
    const [result] = await this.db.insert(galleryImages).values(imageData).returning();
    return result;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage> {
    const [result] = await this.db
      .update(galleryImages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(galleryImages.id, id))
      .returning();
    return result;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await this.db.delete(galleryImages).where(eq(galleryImages.id, id));
  }
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private contactSubs: ContactSubmission[] = [];
  private leads: Lead[] = [];
  private workingHours: WorkingHours[] = [];
  private timeBlocks: TimeBlock[] = [];
  private gallery: GalleryImage[] = [];

  async getUser(id: string) { return this.users.find(u => u.id === id); }
  async getUserByUsername(username: string) { return this.users.find(u => u.username === username); }
  async getUserByEmail(email: string) { return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  async createUser(insertUser: InsertUser) {
    const user: User = {
      id: randomUUID(),
      username: insertUser.username,
      email: insertUser.email.toLowerCase(),
      password: insertUser.password,
      isAdmin: insertUser.email.toLowerCase() === "crawlguardllc@gmail.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.push(user);
    return user;
  }
  async getAllUsers() { return [...this.users]; }
  async deleteUser(id: string) { this.users = this.users.filter(u => u.id !== id); }
  async updateUserPassword(id: string, password: string) {
    const u = this.users.find(x => x.id === id);
    if (u) {
      u.password = password;
      u.updatedAt = new Date() as any;
    }
  }

  async setUserAdminStatus(id: string, isAdmin: boolean) {
    const u = this.users.find(x => x.id === id);
    if (u) {
      u.isAdmin = isAdmin;
      u.updatedAt = new Date() as any;
    }
  }
  async getUserCount() { return this.users.length; }

  async createContactSubmission(data: InsertContactSubmission) {
    const sub: ContactSubmission = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone ?? null as any,
      address: data.address ?? null as any,
      zipCode: data.zipCode,
      service: data.service ?? null as any,
      message: data.message ?? null as any,
      createdAt: new Date(),
    } as ContactSubmission;
    this.contactSubs.push(sub);
    return sub;
  }
  async getContactSubmissions() { return [...this.contactSubs].sort((a,b) => (b.createdAt as any) - (a.createdAt as any)); }

  async createLead(data: InsertLead) {
    const lead: Lead = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone ?? null as any,
      address: data.address ?? null as any,
      zipCode: data.zipCode ?? null as any,
      service: data.service,
      status: (data.status as any) ?? "new",
      priority: (data.priority as any) ?? "medium",
      source: (data.source as any) ?? "website",
      notes: data.notes ?? null as any,
      estimatedValue: data.estimatedValue ?? null as any,
      scheduledDate: (data as any).scheduledDate ? new Date((data as any).scheduledDate) : null as any,
      googleCalendarEventId: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Lead;
    this.leads.push(lead);
    return lead;
  }
  async getLeads() { return [...this.leads].sort((a,b) => (b.createdAt as any) - (a.createdAt as any)); }
  async getLeadById(id: string) { return this.leads.find(l => l.id === id); }
  async updateLead(id: string, updates: UpdateLead) {
    const lead = this.leads.find(l => l.id === id)!;
    Object.assign(lead, {
      ...updates,
      scheduledDate: (updates as any).scheduledDate ? new Date((updates as any).scheduledDate) : lead.scheduledDate,
      updatedAt: new Date(),
    });
    return lead;
  }
  async deleteLead(id: string) { this.leads = this.leads.filter(l => l.id !== id); }
  async getLeadsByStatus(status: string) { return this.leads.filter(l => l.status === status).sort((a,b) => (b.createdAt as any) - (a.createdAt as any)); }

  async getWorkingHours(userId: string) { return this.workingHours.filter(w => w.userId === userId); }
  async upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours) {
    const found = this.workingHours.find(w => w.userId === userId && w.dayOfWeek === dayOfWeek);
    if (found) {
      Object.assign(found, { ...hours, updatedAt: new Date() });
      return found;
    }
    const rec: WorkingHours = {
      id: randomUUID(),
      userId,
      dayOfWeek,
      startTime: hours.startTime,
      endTime: hours.endTime,
      isActive: (hours as any).isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.workingHours.push(rec);
    return rec;
  }

  async getTimeBlocks(userId: string) { return this.timeBlocks.filter(t => t.userId === userId); }
  async createTimeBlock(data: InsertTimeBlock & { userId: string }) {
    const rec: TimeBlock = {
      id: randomUUID(),
      userId: data.userId,
      title: data.title,
      description: data.description ?? null as any,
      startDateTime: typeof (data as any).startDateTime === 'string' ? new Date((data as any).startDateTime) : (data as any).startDateTime,
      endDateTime: typeof (data as any).endDateTime === 'string' ? new Date((data as any).endDateTime) : (data as any).endDateTime,
      blockType: (data as any).blockType ?? 'personal',
      isRecurring: (data as any).isRecurring ?? false,
      recurringPattern: (data as any).recurringPattern ?? null as any,
      color: (data as any).color ?? '#ef4444',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.timeBlocks.push(rec);
    return rec;
  }
  async updateTimeBlock(id: string, updates: UpdateTimeBlock) {
    const tb = this.timeBlocks.find(t => t.id === id)!;
    Object.assign(tb, {
      ...updates,
      startDateTime: updates.startDateTime ? (typeof (updates as any).startDateTime === 'string' ? new Date((updates as any).startDateTime) : (updates as any).startDateTime) : tb.startDateTime,
      endDateTime: updates.endDateTime ? (typeof (updates as any).endDateTime === 'string' ? new Date((updates as any).endDateTime) : (updates as any).endDateTime) : tb.endDateTime,
      updatedAt: new Date(),
    });
    return tb;
  }
  async deleteTimeBlock(id: string) { this.timeBlocks = this.timeBlocks.filter(t => t.id !== id); }

  async getGalleryImages() { return [...this.gallery].sort((a,b) => (parseInt(b.displayOrder||'0') - parseInt(a.displayOrder||'0')) || ((b.createdAt as any) - (a.createdAt as any))); }
  async getPublishedGalleryImages() { return (await this.getGalleryImages()).filter(g => g.isPublished); }
  async getGalleryImageById(id: string) { return this.gallery.find(g => g.id === id); }
  async createGalleryImage(data: InsertGalleryImage) {
    const rec: GalleryImage = {
      id: randomUUID(),
      title: data.title,
      description: data.description ?? null as any,
      altText: data.altText,
      imageUrl: data.imageUrl,
      fileName: data.fileName,
      fileSize: data.fileSize ?? null as any,
      mimeType: data.mimeType ?? null as any,
      category: (data as any).category ?? 'general',
      isPublished: (data as any).isPublished ?? false,
      displayOrder: (data as any).displayOrder ?? '0',
      seoKeywords: data.seoKeywords ?? null as any,
      uploadedBy: data.uploadedBy ?? null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.gallery.push(rec);
    return rec;
  }
  async updateGalleryImage(id: string, updates: UpdateGalleryImage) {
    const g = this.gallery.find(x => x.id === id)!;
    Object.assign(g, { ...updates, updatedAt: new Date() });
    return g;
  }
  async deleteGalleryImage(id: string) { this.gallery = this.gallery.filter(g => g.id !== id); }
}

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  if (ensureDatabase()) {
    storageInstance = new DatabaseStorage();
  } else {
    console.warn("[storage] Using in-memory storage backend");
    storageInstance = new MemoryStorage();
  }

  return storageInstance;
}
