import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CalendarIntegrationProps {
  lead: Lead;
}

export function CalendarIntegration({ lead }: CalendarIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState(`${lead.service} consultation - ${lead.name}`);
  const [eventDate, setEventDate] = useState(
    lead.scheduledDate ? 
      new Date(lead.scheduledDate).toISOString().slice(0, 16) : 
      ""
  );
  const [eventDescription, setEventDescription] = useState(
    `Customer: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || "Not provided"}\nAddress: ${lead.address || "Not provided"}\nService: ${lead.service}\nNotes: ${lead.notes || "No additional notes"}`
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scheduleEventMutation = useMutation({
    mutationFn: async () => {
      // For now, we'll create a Google Calendar link
      // In a production app, you'd integrate with Google Calendar API
      const startDate = new Date(eventDate);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(lead.address || "Asheville, NC")}`;

      // Update the lead with scheduled date
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: startDate,
          status: "scheduled"
        })
      });
      if (!response.ok) throw new Error("Failed to update lead");

      return googleCalendarUrl;
    },
    onSuccess: (googleCalendarUrl) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Open Google Calendar in new tab
      window.open(googleCalendarUrl, '_blank');
      
      toast({
        title: "Calendar Event Created",
        description: "The lead has been updated and Google Calendar opened for you to save the event.",
      });
      
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule event. Please try again.",
        variant: "destructive",
      });
    }
  });

  const openExistingEvent = () => {
    if (lead.googleCalendarEventId) {
      // In a real implementation, this would open the specific event
      window.open("https://calendar.google.com", '_blank');
    }
  };

  return (
    <>
      {lead.scheduledDate && lead.googleCalendarEventId ? (
        <Button
          size="sm"
          variant="outline"
          onClick={openExistingEvent}
          data-testid={`view-calendar-${lead.id}`}
        >
          <Calendar className="w-4 h-4 mr-1" />
          View Event
        </Button>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              data-testid={`schedule-calendar-${lead.id}`}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  data-testid="input-event-title"
                />
              </div>
              
              <div>
                <Label htmlFor="eventDate">Date & Time</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  data-testid="input-event-date"
                />
              </div>
              
              <div>
                <Label htmlFor="eventDescription">Description</Label>
                <Textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="h-32"
                  data-testid="textarea-event-description"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>This will open Google Calendar to create the event</span>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-cancel-schedule"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => scheduleEventMutation.mutate()}
                  disabled={!eventDate || scheduleEventMutation.isPending}
                  className="bg-crawlguard-primary hover:bg-teal-600"
                  data-testid="button-create-event"
                >
                  {scheduleEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}