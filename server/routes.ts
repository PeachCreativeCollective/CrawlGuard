import { Router } from "express";
import type { Express } from "express";
import { getStorage } from "./storage";
import { attachUser, requireAuth, requireAuthOrLocal, requireAdmin } from "./auth";
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

  // Public endpoint to expose non-sensitive runtime configuration to the client
  // (used when Vite build-time VITE_* variables are not available). Only exposes
  // the VITE-prefixed Supabase runtime variables which are safe for client use.
  app.get("/api/runtime-config", (_req, res) => {
    res.json({
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? null,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? null,
    });
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);

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

  const apiRouter = Router();
  apiRouter.use(attachUser);

  apiRouter.get("/user", (req, res) => {
    if (!req.user) {
      const hasAuthHeader = Boolean(req.headers.authorization);
      const tokenPreview =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
          ? `${req.headers.authorization.slice(0, 20)}…`
          : undefined;
      const supabaseResolved = Boolean(req.supabaseUser);
      const resolutionError = req.supabaseResolutionError;

      console.warn("[/api/user] Missing authenticated user", {
        hasAuthHeader,
        tokenPreview,
        supabaseResolved,
        accessTokenPresent: Boolean(req.accessToken),
        supabaseResolutionError: resolutionError,
      });

      return res.status(401).json({
        error: "AUTH_USER_MISSING",
        message: "Authenticated Supabase user was not attached to the request.",
        details: {
          hasAuthHeader,
          supabaseResolved,
          supabaseResolutionError: resolutionError || undefined,
        },
      });
    }
    res.json(req.user);
  });

  apiRouter.get("/contact-submissions", requireAuthOrLocal, async (_req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  apiRouter.get("/contact-submissions/archived", requireAuthOrLocal, async (_req, res) => {
    try {
      const submissions = await storage.getArchivedContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching archived submissions:", error);
      res.status(500).json({ message: "Failed to fetch archived submissions" });
    }
  });

  apiRouter.get("/leads", requireAuthOrLocal, async (req, res) => {
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

  apiRouter.get("/leads/:id", requireAuthOrLocal, async (req, res) => {
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

  apiRouter.post("/leads", requireAuthOrLocal, async (req, res) => {
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

  apiRouter.patch("/leads/:id", requireAuthOrLocal, async (req, res) => {
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

  apiRouter.delete("/leads/:id", requireAuthOrLocal, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  apiRouter.post("/contact-submissions/:id/convert-to-lead", requireAuthOrLocal, async (req, res) => {
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
  });

  apiRouter.patch("/contact-submissions/:id/archive", requireAuthOrLocal, async (req, res) => {
    try {
      await storage.archiveContactSubmission(req.params.id);
      res.json({ success: true, message: "Submission archived successfully" });
    } catch (error) {
      console.error("Error archiving submission:", error);
      res.status(500).json({ message: "Failed to archive submission" });
    }
  });

  apiRouter.delete("/contact-submissions/:id", requireAuthOrLocal, async (req, res) => {
    try {
      await storage.deleteContactSubmission(req.params.id);
      res.json({ success: true, message: "Submission deleted successfully" });
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  apiRouter.get("/users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  apiRouter.delete("/users/:id", requireAdmin, async (req, res) => {
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

  apiRouter.patch("/users/:id/reset-password", requireAdmin, async (req, res) => {
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

  apiRouter.post("/calendar/sync", requireAuth, async (_req, res) => {
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

  apiRouter.post("/calendar/add-event/:leadId", requireAuth, async (req, res) => {
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

  apiRouter.get("/working-hours/:userId", requireAuth, async (req, res) => {
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

  apiRouter.put("/working-hours/:dayOfWeek", requireAuth, async (req, res) => {
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

  apiRouter.get("/time-blocks/:userId", requireAuth, async (req, res) => {
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

  apiRouter.post("/time-blocks", requireAuth, async (req, res) => {
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

  apiRouter.patch("/time-blocks/:id", requireAuth, async (req, res) => {
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

  apiRouter.delete("/time-blocks/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as SafeUser;
      const timeBlockId = req.params.id;

      const existingBlock = await storage.getTimeBlocks(currentUser.id);
      const userOwnsBlock = existingBlock.some((block) => block.id === timeBlockId);

      if (!userOwnsBlock && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTimeBlock(timeBlockId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting time block:", error);
      res.status(500).json({ message: "Failed to delete time block" });
    }
  });

  apiRouter.get("/gallery", requireAuth, async (_req, res) => {
    try {
      const gallery = await storage.getGalleryImages();
      res.json(gallery);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  apiRouter.post("/gallery", requireAuth, async (req, res) => {
    try {
      const body = insertGalleryImageSchema.parse(req.body);
      const storageService = new ObjectStorageService();
      const image = await storage.createGalleryImage(body);

      if (body.imageUrl?.startsWith("data:")) {
        const maybeUpload = (storageService as any).uploadBase64Image;
        if (typeof maybeUpload === "function") {
          const uploaded = await maybeUpload.call(storageService, body.imageUrl, {
            directory: "gallery",
            fileName: `${image.id}.webp`,
          });
          if (uploaded?.url) {
            image.imageUrl = uploaded.url;
            await storage.updateGalleryImage(image.id, { imageUrl: uploaded.url });
          }
        }
      }

      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid gallery image", errors: error.errors });
      } else {
        console.error("Error creating gallery image:", error);
        res.status(500).json({ message: "Failed to create gallery image" });
      }
    }
  });

  apiRouter.patch("/gallery/:id", requireAuth, async (req, res) => {
    try {
      const body = updateGalleryImageSchema.parse(req.body);
      const storageService = new ObjectStorageService();
      const updated = await storage.updateGalleryImage(req.params.id, body);

      if (body.imageUrl?.startsWith("data:")) {
        const maybeUpload = (storageService as any).uploadBase64Image;
        if (typeof maybeUpload === "function") {
          const uploaded = await maybeUpload.call(storageService, body.imageUrl, {
            directory: "gallery",
            fileName: `${updated.id}.webp`,
          });
          if (uploaded?.url) {
            updated.imageUrl = uploaded.url;
            await storage.updateGalleryImage(updated.id, { imageUrl: uploaded.url });
          }
        }
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid gallery image", errors: error.errors });
      } else {
        console.error("Error updating gallery image:", error);
        res.status(500).json({ message: "Failed to update gallery image" });
      }
    }
  });

  apiRouter.delete("/gallery/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteGalleryImage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  apiRouter.get("/gallery/published", async (_req, res) => {
    try {
      const images = await storage.getPublishedGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching published gallery images:", error);
      res.status(500).json({ message: "Failed to fetch published gallery images" });
    }
  });

  apiRouter.get("/calendar/auth-url", requireAuth, async (_req, res) => {
    try {
      const url = await googleCalendarService.generateAuthUrl();
      res.json({ url });
    } catch (error) {
      console.error("Error generating calendar auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  apiRouter.post("/calendar/oauth-callback", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Missing OAuth code" });
      }

      await googleCalendarService.exchangeCodeForTokens(code);
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      res.status(500).json({ message: "Failed to process OAuth callback" });
    }
  });

  apiRouter.post("/calendar/revoke", requireAuth, async (_req, res) => {
    try {
      const maybeRevoke = (googleCalendarService as any).revokeAccess;
      if (typeof maybeRevoke === "function") {
        await maybeRevoke.call(googleCalendarService);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking calendar access:", error);
      res.status(500).json({ message: "Failed to revoke calendar access" });
    }
  });

  app.use("/api", apiRouter);
}
