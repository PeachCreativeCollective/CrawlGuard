import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { readEnv } from "./env";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
}

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      readEnv("GOOGLE_CLIENT_ID"),
      readEnv("GOOGLE_CLIENT_SECRET"),
      readEnv("GOOGLE_REDIRECT_URI")
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate OAuth URL for user authentication
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Store tokens securely (in production, use encrypted database storage)
      await this.saveTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  // Load stored tokens
  async loadTokens(): Promise<boolean> {
    try {
      const tokenPath = path.join(process.cwd(), 'google-tokens.json');
      const tokenData = await fs.readFile(tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);
      
      this.oauth2Client.setCredentials(tokens);
      
      // Check if token needs refresh
      if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
        await this.refreshTokens();
      }
      
      return true;
    } catch (error) {
      console.log('No existing tokens found or error loading tokens');
      return false;
    }
  }

  // Save tokens to file (use encrypted database in production)
  private async saveTokens(tokens: any): Promise<void> {
    try {
      const tokenPath = path.join(process.cwd(), 'google-tokens.json');
      await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Refresh expired tokens
  private async refreshTokens(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      await this.saveTokens(credentials);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh Google Calendar tokens');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return credentials && credentials.access_token;
  }

  // Create a calendar event
  async createEvent(eventData: CalendarEvent): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || 'America/New_York',
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || 'America/New_York',
        },
        attendees: eventData.attendees,
        location: eventData.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 30 },     // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email invitations
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Update a calendar event
  async updateEvent(eventId: string, eventData: CalendarEvent): Promise<any> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || 'America/New_York',
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || 'America/New_York',
        },
        attendees: eventData.attendees,
        location: eventData.location,
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'all',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // List upcoming events
  async listUpcomingEvents(maxResults: number = 10): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw new Error('Failed to retrieve calendar events');
    }
  }

  // Get events for a specific date range
  async getEventsInRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting events in range:', error);
      throw new Error('Failed to retrieve calendar events for date range');
    }
  }

  // Create calendar event for CrawlGuard appointment
  async createAppointmentEvent(appointmentData: {
    clientName: string;
    email?: string;
    phone?: string;
    address?: string;
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    notes?: string;
    estimatedValue?: number;
  }): Promise<any> {
    const startDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hour appointment

    const serviceLabels: Record<string, string> = {
      'crawl-space-encapsulation': 'Crawl Space Encapsulation',
      'basement-waterproofing': 'Basement Waterproofing',
      'mold-remediation': 'Mold Remediation',
      'vapor-barrier-installation': 'Vapor Barrier Installation',
      'sump-pump-installation': 'Sump Pump Installation',
      'french-drain-installation': 'French Drain Installation',
      'foundation-repair': 'Foundation Repair',
      'dehumidification': 'Dehumidification Systems',
      'consultation': 'Free Consultation',
    };

    const serviceLabel = serviceLabels[appointmentData.service] || appointmentData.service;

    const event: CalendarEvent = {
      summary: `CrawlGuard Appointment - ${appointmentData.clientName}`,
      description: `
Service: ${serviceLabel}
Client: ${appointmentData.clientName}
Phone: ${appointmentData.phone || 'Not provided'}
Email: ${appointmentData.email || 'Not provided'}
Address: ${appointmentData.address || 'Not provided'}
Estimated Value: ${appointmentData.estimatedValue ? `$${appointmentData.estimatedValue}` : 'Not specified'}
Notes: ${appointmentData.notes || 'None'}

Generated by CrawlGuard Lead Management System
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      location: appointmentData.address,
      attendees: appointmentData.email ? [{ email: appointmentData.email, displayName: appointmentData.clientName }] : undefined,
    };

    return await this.createEvent(event);
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
