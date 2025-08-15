import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertContactSubmissionSchema, insertLeadSchema, updateLeadSchema, type User } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

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
        id: submission.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Please check all required fields.",
          errors: error.errors 
        });
      } else {
        console.error("Contact form error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Sorry, there was a problem submitting your request. Please try again or call us directly." 
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
      const leads = status ? 
        await storage.getLeadsByStatus(status as string) : 
        await storage.getLeads();
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
      const lead = await storage.createLead(validatedData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
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
      const lead = await storage.updateLead(req.params.id, validatedData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Lead validation error:", error.errors);
        res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
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
  app.post("/api/contact-submissions/:id/convert-to-lead", requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      const submission = submissions.find(s => s.id === req.params.id);
      
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

  // User management routes (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as User;
      if (!currentUser.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as User;
      if (!currentUser.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const userToDelete = await storage.getUser(userId);
      
      // Prevent deleting admin users or self
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

  app.patch("/api/users/:id/reset-password", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as User;
      if (!currentUser.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      await storage.updateUserPassword(userId, password);
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Google Calendar integration endpoints
  app.post("/api/calendar/sync", requireAuth, async (req, res) => {
    try {
      // TODO: Implement Google Calendar OAuth integration
      // For now, return a placeholder response
      res.json({ 
        success: true, 
        message: "Google Calendar sync is not yet configured. Contact admin to set up OAuth credentials." 
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

      // TODO: Implement actual Google Calendar event creation
      // For now, just update the lead with a placeholder event ID
      const eventId = `placeholder_${leadId}_${Date.now()}`;
      await storage.updateLead(leadId, { googleCalendarEventId: eventId });
      
      res.json({ 
        success: true, 
        message: "Event would be added to Google Calendar (integration not yet configured)",
        eventId 
      });
    } catch (error) {
      console.error("Add calendar event error:", error);
      res.status(500).json({ message: "Failed to add event to calendar" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
