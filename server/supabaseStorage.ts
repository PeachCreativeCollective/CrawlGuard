import type {
  ContactSubmission,
  GalleryImage,
  InsertContactSubmission,
  InsertGalleryImage,
  InsertLead,
  InsertTimeBlock,
  InsertUser,
  InsertWorkingHours,
  Lead,
  TimeBlock,
  UpdateGalleryImage,
  UpdateLead,
  UpdateTimeBlock,
  UpdateWorkingHours,
  User,
  WorkingHours,
} from "@shared/schema";
import { hashPassword } from "./passwords";
import { getSupabaseServiceClient } from "./supabaseClient";
import { readEnvOr } from "./env";
import type { IStorage } from "./storage";

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function sanitizeRecord<T extends Record<string, any>>(record: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapUser(row: any | null): User | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    isAdmin: Boolean(row.is_admin),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  } as User;
}

function mapContactSubmission(row: any | null): ContactSubmission | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    address: row.address ?? null,
    zipCode: row.zip_code,
    service: row.service ?? null,
    message: row.message ?? null,
    archived: Boolean(row.archived),
    createdAt: toDate(row.created_at),
  } as ContactSubmission;
}

function mapLead(row: any | null): Lead | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    address: row.address ?? null,
    zipCode: row.zip_code ?? null,
    service: row.service,
    status: row.status,
    priority: row.priority,
    source: row.source ?? null,
    notes: row.notes ?? null,
    estimatedValue: row.estimated_value ?? null,
    scheduledDate: toDate(row.scheduled_date),
    googleCalendarEventId: row.google_calendar_event_id ?? null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  } as Lead;
}

function mapWorkingHours(row: any | null): WorkingHours | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active ?? true,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  } as WorkingHours;
}

function mapTimeBlock(row: any | null): TimeBlock | undefined {
  if (!row) {
    return undefined;
  }

  const start = toDate(row.start_date_time) ?? new Date();
  const end = toDate(row.end_date_time) ?? new Date();

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? null,
    startDateTime: start,
    endDateTime: end,
    blockType: row.block_type,
    isRecurring: Boolean(row.is_recurring),
    recurringPattern: row.recurring_pattern ?? null,
    color: row.color ?? null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  } as TimeBlock;
}

function mapGalleryImage(row: any | null): GalleryImage | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    altText: row.alt_text,
    imageUrl: row.image_url,
    fileName: row.file_name,
    fileSize: row.file_size ?? null,
    mimeType: row.mime_type ?? null,
    category: row.category ?? null,
    isPublished: Boolean(row.is_published),
    displayOrder: row.display_order ?? null,
    seoKeywords: row.seo_keywords ?? null,
    uploadedBy: row.uploaded_by ?? null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  } as GalleryImage;
}

function toContactInsertPayload(submission: InsertContactSubmission) {
  return sanitizeRecord({
    name: submission.name,
    email: submission.email,
    phone: submission.phone ?? null,
    address: submission.address ?? null,
    zip_code: submission.zipCode,
    service: submission.service ?? null,
    message: submission.message ?? null,
    archived: false,
  });
}

function toLeadInsertPayload(lead: InsertLead) {
  const scheduledDate = lead.scheduledDate
    ? new Date(lead.scheduledDate as unknown as string | number | Date).toISOString()
    : null;

  return sanitizeRecord({
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    address: lead.address ?? null,
    zip_code: lead.zipCode ?? null,
    service: lead.service,
    status: lead.status ?? "new",
    priority: lead.priority ?? "medium",
    source: lead.source ?? "website",
    notes: lead.notes ?? null,
    estimated_value: lead.estimatedValue ?? null,
    scheduled_date: scheduledDate,
  });
}

function toLeadUpdatePayload(updates: UpdateLead) {
  const scheduledDate = updates.scheduledDate
    ? new Date(updates.scheduledDate as unknown as string | number | Date).toISOString()
    : undefined;

  return sanitizeRecord({
    name: updates.name,
    email: updates.email,
    phone: updates.phone,
    address: updates.address,
    zip_code: updates.zipCode,
    service: updates.service,
    status: updates.status,
    priority: updates.priority,
    source: updates.source,
    notes: updates.notes,
    estimated_value: updates.estimatedValue,
    scheduled_date: scheduledDate,
    google_calendar_event_id: updates.googleCalendarEventId,
    updated_at: new Date().toISOString(),
  });
}

function toWorkingHoursPayload(userId: string, dayOfWeek: string, hours: InsertWorkingHours) {
  return sanitizeRecord({
    user_id: userId,
    day_of_week: dayOfWeek,
    start_time: hours.startTime,
    end_time: hours.endTime,
    is_active: hours.isActive ?? true,
    updated_at: new Date().toISOString(),
  });
}

function toTimeBlockInsertPayload(timeBlock: InsertTimeBlock & { userId: string }) {
  const start = typeof timeBlock.startDateTime === "string" || timeBlock.startDateTime instanceof Date
    ? new Date(timeBlock.startDateTime).toISOString()
    : new Date(timeBlock.startDateTime as unknown as number).toISOString();
  const end = typeof timeBlock.endDateTime === "string" || timeBlock.endDateTime instanceof Date
    ? new Date(timeBlock.endDateTime).toISOString()
    : new Date(timeBlock.endDateTime as unknown as number).toISOString();

  return sanitizeRecord({
    user_id: timeBlock.userId,
    title: timeBlock.title,
    description: timeBlock.description ?? null,
    start_date_time: start,
    end_date_time: end,
    block_type: timeBlock.blockType ?? "personal",
    is_recurring: timeBlock.isRecurring ?? false,
    recurring_pattern: timeBlock.recurringPattern ?? null,
    color: timeBlock.color ?? "#ef4444",
  });
}

function toTimeBlockUpdatePayload(updates: UpdateTimeBlock) {
  const payload: Record<string, any> = {
    title: updates.title,
    description: updates.description,
    block_type: updates.blockType,
    is_recurring: updates.isRecurring,
    recurring_pattern: updates.recurringPattern,
    color: updates.color,
    updated_at: new Date().toISOString(),
  };

  if (updates.startDateTime) {
    payload.start_date_time = new Date(updates.startDateTime as unknown as string | number | Date).toISOString();
  }

  if (updates.endDateTime) {
    payload.end_date_time = new Date(updates.endDateTime as unknown as string | number | Date).toISOString();
  }

  return sanitizeRecord(payload);
}

function toGalleryInsertPayload(image: InsertGalleryImage) {
  return sanitizeRecord({
    title: image.title,
    description: image.description ?? null,
    alt_text: image.altText,
    image_url: image.imageUrl,
    file_name: image.fileName,
    file_size: image.fileSize ?? null,
    mime_type: image.mimeType ?? null,
    category: image.category ?? "general",
    is_published: image.isPublished ?? false,
    display_order: image.displayOrder ?? "0",
    seo_keywords: image.seoKeywords ?? null,
    uploaded_by: image.uploadedBy ?? null,
  });
}

function toGalleryUpdatePayload(updates: UpdateGalleryImage) {
  return sanitizeRecord({
    title: updates.title,
    description: updates.description,
    alt_text: updates.altText,
    image_url: updates.imageUrl,
    file_name: updates.fileName,
    file_size: updates.fileSize,
    mime_type: updates.mimeType,
    category: updates.category,
    is_published: updates.isPublished,
    display_order: updates.displayOrder,
    seo_keywords: updates.seoKeywords,
    uploaded_by: updates.uploadedBy,
    updated_at: new Date().toISOString(),
  });
}

export class SupabaseStorage implements IStorage {
  private get client() {
    return getSupabaseServiceClient();
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.client.from("users").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return mapUser(data) ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return mapUser(data) ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = normalizeEmail(email);
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", normalized)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return mapUser(data) ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const normalizedEmail = normalizeEmail(insertUser.email);
    const adminEmail = readEnvOr("ADMIN_EMAIL", "crawlguardllc@gmail.com").toLowerCase();

    const payload = sanitizeRecord({
      username: insertUser.username,
      email: normalizedEmail,
      password: insertUser.password,
      is_admin: normalizedEmail === adminEmail,
    });

    const { data, error } = await this.client
      .from("users")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const user = mapUser(data);
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.client.from("users").select("*");
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapUser)
      .filter((row): row is User => Boolean(row));
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.client.from("users").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    const { error } = await this.client
      .from("users")
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw error;
    }
  }

  async updateUsername(id: string, username: string): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw error;
    }
  }

  async setUserAdminStatus(id: string, isAdmin: boolean): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    const { count, error } = await this.client.from("users").select("id", { count: "exact", head: true });
    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const { data, error } = await this.client
      .from("contact_submissions")
      .insert(toContactInsertPayload(submission))
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapContactSubmission(data);
    if (!mapped) {
      throw new Error("Failed to create contact submission");
    }
    return mapped;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    const { data, error } = await this.client
      .from("contact_submissions")
      .select("*")
      .or("archived.is.null,archived.eq.false")
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapContactSubmission)
      .filter((row): row is ContactSubmission => Boolean(row));
  }

  async getArchivedContactSubmissions(): Promise<ContactSubmission[]> {
    const { data, error } = await this.client
      .from("contact_submissions")
      .select("*")
      .eq("archived", true)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapContactSubmission)
      .filter((row): row is ContactSubmission => Boolean(row));
  }

  async archiveContactSubmission(id: string): Promise<void> {
    const { error } = await this.client
      .from("contact_submissions")
      .update({ archived: true })
      .eq("id", id);
    if (error) {
      throw error;
    }
  }

  async deleteContactSubmission(id: string): Promise<void> {
    const { error } = await this.client
      .from("contact_submissions")
      .delete()
      .eq("id", id);
    if (error) {
      throw error;
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const payload = toLeadInsertPayload(lead);
    const { data, error } = await this.client.from("leads").insert(payload).select("*").single();
    if (error) {
      throw error;
    }
    const mapped = mapLead(data);
    if (!mapped) {
      throw new Error("Failed to create lead");
    }
    return mapped;
  }

  async getLeads(): Promise<Lead[]> {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapLead)
      .filter((row): row is Lead => Boolean(row));
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const { data, error } = await this.client.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return mapLead(data) ?? undefined;
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead> {
    const payload = toLeadUpdatePayload(updates);
    const { data, error } = await this.client
      .from("leads")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapLead(data);
    if (!mapped) {
      throw new Error("Failed to update lead");
    }
    return mapped;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await this.client.from("leads").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapLead)
      .filter((row): row is Lead => Boolean(row));
  }

  async getWorkingHours(userId: string): Promise<WorkingHours[]> {
    const { data, error } = await this.client.from("working_hours").select("*").eq("user_id", userId);
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapWorkingHours)
      .filter((row): row is WorkingHours => Boolean(row));
  }

  async upsertWorkingHours(userId: string, dayOfWeek: string, hours: InsertWorkingHours): Promise<WorkingHours> {
    const payload = toWorkingHoursPayload(userId, dayOfWeek, hours);
    const { data, error } = await this.client
      .from("working_hours")
      .upsert(payload, { onConflict: "user_id,day_of_week" })
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapWorkingHours(data);
    if (!mapped) {
      throw new Error("Failed to upsert working hours");
    }
    return mapped;
  }

  async getTimeBlocks(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await this.client.from("time_blocks").select("*").eq("user_id", userId);
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapTimeBlock)
      .filter((row): row is TimeBlock => Boolean(row));
  }

  async createTimeBlock(timeBlock: InsertTimeBlock & { userId: string }): Promise<TimeBlock> {
    const payload = toTimeBlockInsertPayload(timeBlock);
    const { data, error } = await this.client.from("time_blocks").insert(payload).select("*").single();
    if (error) {
      throw error;
    }
    const mapped = mapTimeBlock(data);
    if (!mapped) {
      throw new Error("Failed to create time block");
    }
    return mapped;
  }

  async updateTimeBlock(id: string, updates: UpdateTimeBlock): Promise<TimeBlock> {
    const payload = toTimeBlockUpdatePayload(updates);
    const { data, error } = await this.client
      .from("time_blocks")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapTimeBlock(data);
    if (!mapped) {
      throw new Error("Failed to update time block");
    }
    return mapped;
  }

  async deleteTimeBlock(id: string): Promise<void> {
    const { error } = await this.client.from("time_blocks").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    const { data, error } = await this.client
      .from("gallery_images")
      .select("*")
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapGalleryImage)
      .filter((row): row is GalleryImage => Boolean(row));
  }

  async getPublishedGalleryImages(): Promise<GalleryImage[]> {
    const { data, error } = await this.client
      .from("gallery_images")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? [])
      .map(mapGalleryImage)
      .filter((row): row is GalleryImage => Boolean(row));
  }

  async getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
    const { data, error } = await this.client.from("gallery_images").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }
    return mapGalleryImage(data) ?? undefined;
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const { data, error } = await this.client
      .from("gallery_images")
      .insert(toGalleryInsertPayload(image))
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapGalleryImage(data);
    if (!mapped) {
      throw new Error("Failed to create gallery image");
    }
    return mapped;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage> {
    const { data, error } = await this.client
      .from("gallery_images")
      .update(toGalleryUpdatePayload(updates))
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const mapped = mapGalleryImage(data);
    if (!mapped) {
      throw new Error("Failed to update gallery image");
    }
    return mapped;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    const { error } = await this.client.from("gallery_images").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }
}
