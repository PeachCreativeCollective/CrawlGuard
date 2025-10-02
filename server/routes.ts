import type { Express } from "express";
import { getStorage } from "./storage";
import { requireAuth, requireAdmin } from "./auth";
import { googleCalendarService } from "./google-calendar";
import { ObjectStorageService } from "./objectStorage";
import {
  insertContactSubmissionSchema,
  insertLeadSchema,
  updateLeadSchema,
  insertWorkingHoursSchema,
  updateWorkingHoursSchema,
  insertTimeBlockSchema,
  updateTimeBlockSchema,
  insertGalleryImageSchema,
  updateGalleryImageSchema,
} from "@shared/schema";
import { updateSupabasePassword, type SafeUser } from "./supabaseAuthService";
import { z } from "zod";

export function registerRoutes(app: Express): void {
  const storage = getStorage();

  app.get("/api/user", (req, res) => {
    if (!req.user) {
      console.warn("[/api/user] Missing authenticated user", {
        hasAuthHeader: Boolean(req.headers.authorization),
      });
      return res.sendStatus(401);
    }
    res.json(req.user);
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);

      // TODO: Send email notification to business owner
      // TODO: Send confirmation email to customer

      res.json({
        success: true,
        message: "Thank you for your inquiry! We'll contact you within 24 hours.",
        id: submission.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Please check all required fields.",
          errors: error.errors,
        });
      } else {
        console.error("Contact form error:", error);
        res.status(500).json({
          success: false,
          message:
            "Sorry, there was a problem submitting your request. Please try again or call us directly.",
        });
      }
    }
  });

  // Get contact submissions (for admin use)
  app.get("/api/contact-submissions", requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Lead management API routes
  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const leads = status
        ? await storage.getLeadsByStatus(status as string)
        : await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);

      if (validatedData.scheduledDate && typeof validatedData.scheduledDate === "string") {
        validatedData.scheduledDate = new Date(validatedData.scheduledDate);
      }

      const lead = await storage.createLead(validatedData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({ message: "Failed to create lead" });
      }
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      console.log("Updating lead with data:", JSON.stringify(req.body, null, 2));
      const validatedData = updateLeadSchema.parse(req.body);

      if (validatedData.scheduledDate && typeof validatedData.scheduledDate === "string") {
        validatedData.scheduledDate = new Date(validatedData.scheduledDate);
      }

      const lead = await storage.updateLead(req.params.id, validatedData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Lead validation error:", error.errors);
        res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      } else {
        console.error("Error updating lead:", error);
        res.status(500).json({ message: "Failed to update lead" });
      }
    }
  });

  app.delete("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Convert contact submission to lead
  app.post(
    "/api/contact-submissions/:id/convert-to-lead",
    requireAuth,
    async (req, res) => {
      try {
        const submissions = await storage.getContactSubmissions();
        const submission = submissions.find((s) => s.id === req.params.id);

        if (!submission) {
          return res.status(404).json({ message: "Contact submission not found" });
        }

        const leadData = {
          name: submission.name,
          email: submission.email,
          phone: submission.phone || "",
          service: submission.service || "consultation",
          status: "new" as const,
          priority: "medium" as const,
          source: "website" as const,
          notes: submission.message || "",
        };

        const lead = await storage.createLead(leadData);
        res.json(lead);
      } catch (error) {
        console.error("Error converting to lead:", error);
        res.status(500).json({ message: "Failed to convert to lead" });
      }
    }
  );

  // User management routes (admin only)
  app.get("/api/users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const userId = req.params.id;
      const userToDelete = await storage.getUser(userId);

      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      if (userToDelete.isAdmin) {
        return res.status(400).json({ message: "Cannot delete admin users" });
      }

      if (userToDelete.id === currentUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const userToReset = await storage.getUser(userId);
      if (!userToReset) {
        return res.status(404).json({ message: "User not found" });
      }

      await updateSupabasePassword(userToReset.email, password);
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Google Calendar integration endpoints
  app.post("/api/calendar/sync", requireAuth, async (req, res) => {
    try {
      res.json({
        success: true,
        message:
          "Google Calendar sync is not yet configured. Contact admin to set up OAuth credentials.",
      });
    } catch (error) {
      console.error("Calendar sync error:", error);
      res.status(500).json({ message: "Failed to sync with Google Calendar" });
    }
  });

  app.post("/api/calendar/add-event/:leadId", requireAuth, async (req, res) => {
    try {
      const leadId = req.params.leadId;
      const lead = await storage.getLeadById(leadId);

      if (!lead || !lead.scheduledDate) {
        return res.status(400).json({ message: "Lead not found or no scheduled date" });
      }

      const eventId = `placeholder_${leadId}_${Date.now()}`;
      await storage.updateLead(leadId, { googleCalendarEventId: eventId });

      res.json({
        success: true,
        message:
          "Event would be added to Google Calendar (integration not yet configured)",
        eventId,
      });
    } catch (error) {
      console.error("Add calendar event error:", error);
      res.status(500).json({ message: "Failed to add event to calendar" });
    }
  });

  // Working Hours API Routes
  app.get("/api/working-hours/:userId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const userId = req.params.userId;

      if (userId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const workingHours = await storage.getWorkingHours(userId);
      res.json(workingHours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ message: "Failed to fetch working hours" });
    }
  });

  app.put("/api/working-hours/:dayOfWeek", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const dayOfWeek = req.params.dayOfWeek;
      console.log("Working hours update request:", { dayOfWeek, body: req.body });
      const validatedData = insertWorkingHoursSchema.parse(req.body);

      const workingHours = await storage.upsertWorkingHours(
        currentUser.id,
        dayOfWeek,
        validatedData
      );
      res.json(workingHours);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Working hours validation error:", error.errors);
        res.status(400).json({ message: "Invalid working hours data", errors: error.errors });
      } else {
        console.error("Error updating working hours:", error);
        res.status(500).json({ message: "Failed to update working hours" });
      }
    }
  });

  // Time Blocks API Routes
  app.get("/api/time-blocks/:userId", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const userId = req.params.userId;

      if (userId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeBlocks = await storage.getTimeBlocks(userId);
      res.json(timeBlocks);
    } catch (error) {
      console.error("Error fetching time blocks:", error);
      res.status(500).json({ message: "Failed to fetch time blocks" });
    }
  });

  app.post("/api/time-blocks", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const validatedData = insertTimeBlockSchema.parse(req.body);

      const timeBlock = await storage.createTimeBlock({
        ...validatedData,
        userId: currentUser.id,
      });
      res.status(201).json(timeBlock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid time block data", errors: error.errors });
      } else {
        console.error("Error creating time block:", error);
        res.status(500).json({ message: "Failed to create time block" });
      }
    }
  });

  app.patch("/api/time-blocks/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const timeBlockId = req.params.id;
      const validatedData = updateTimeBlockSchema.parse(req.body);

      const existingBlock = await storage.getTimeBlocks(currentUser.id);
      const userOwnsBlock = existingBlock.some((block) => block.id === timeBlockId);

      if (!userOwnsBlock && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeBlock = await storage.updateTimeBlock(timeBlockId, validatedData);
      res.json(timeBlock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid time block data", errors: error.errors });
      } else {
        console.error("Error updating time block:", error);
        res.status(500).json({ message: "Failed to update time block" });
      }
    }
  });

  app.delete("/api/time-blocks/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const timeBlockId = req.params.id;

      const existingBlocks = await storage.getTimeBlocks(currentUser.id);
      const userOwnsBlock = existingBlocks.some((block) => block.id === timeBlockId);

      if (!userOwnsBlock && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTimeBlock(timeBlockId);
      res.json({ success: true, message: "Time block deleted successfully" });
    } catch (error) {
      console.error("Error deleting time block:", error);
      res.status(500).json({ message: "Failed to delete time block" });
    }
  });

  // Google Calendar Integration Routes
  app.post("/api/calendar/init", requireAuth, async (req, res) => {
    try {
      await googleCalendarService.loadTokens();
      res.json({
        authenticated: googleCalendarService.isAuthenticated(),
        message: googleCalendarService.isAuthenticated()
          ? "Google Calendar connected"
          : "Not connected",
      });
    } catch (error) {
      console.error("Error initializing calendar:", error);
      res.status(500).json({ message: "Failed to initialize Google Calendar" });
    }
  });

  app.get("/api/calendar/auth-url", requireAuth, (req, res) => {
    try {
      const authUrl = googleCalendarService.generateAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  app.post("/api/calendar/callback", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }

      await googleCalendarService.exchangeCodeForTokens(code);
      res.json({
        success: true,
        message: "Google Calendar connected successfully",
        authenticated: true,
      });
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      res.status(500).json({ message: "Failed to connect Google Calendar" });
    }
  });

  app.get("/api/calendar/status", requireAuth, async (req, res) => {
    try {
      await googleCalendarService.loadTokens();
      res.json({ authenticated: googleCalendarService.isAuthenticated() });
    } catch (error) {
      console.error("Error checking calendar status:", error);
      res.status(500).json({ authenticated: false });
    }
  });

  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      const maxResults = parseInt(req.query.limit as string) || 10;
      const events = await googleCalendarService.listUpcomingEvents(maxResults);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/events/range", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const events = await googleCalendarService.getEventsInRange(start, end);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events in range:", error);
      res.status(500).json({ message: "Failed to fetch events in date range" });
    }
  });

  app.post("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      const event = await googleCalendarService.createEvent(req.body);
      res.json({ success: true, event });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.post("/api/calendar/appointment", requireAuth, async (req, res) => {
    try {
      const event = await googleCalendarService.createAppointmentEvent(req.body);
      res.json({ success: true, event });
    } catch (error) {
      console.error("Error creating appointment event:", error);
      res.status(500).json({ message: "Failed to create appointment in calendar" });
    }
  });

  // Serve public images from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Gallery Image Management API Routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getPublishedGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/admin/gallery", requireAuth, async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching all gallery images:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.post("/api/admin/gallery/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getGalleryImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/admin/gallery", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const validatedData = insertGalleryImageSchema.parse(req.body);

      const imageData = {
        ...validatedData,
        uploadedBy: currentUser.id,
      };

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeGalleryImagePath(imageData.imageUrl);

      const image = await storage.createGalleryImage({
        ...imageData,
        imageUrl: normalizedPath,
      });

      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid image data", errors: error.errors });
      } else {
        console.error("Error creating gallery image:", error);
        res.status(500).json({ message: "Failed to create gallery image" });
      }
    }
  });

  app.patch("/api/admin/gallery/:id", requireAuth, async (req, res) => {
    try {
      const imageId = req.params.id;
      const validatedData = updateGalleryImageSchema.parse(req.body);

      const image = await storage.updateGalleryImage(imageId, validatedData);
      res.json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid image data", errors: error.errors });
      } else {
        console.error("Error updating gallery image:", error);
        res.status(500).json({ message: "Failed to update gallery image" });
      }
    }
  });

  app.delete("/api/admin/gallery/:id", requireAuth, async (req, res) => {
    try {
      const imageId = req.params.id;
      await storage.deleteGalleryImage(imageId);
      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

}
