import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, Phone, Mail, MapPin, Edit2, Trash2, UserPlus, GripVertical, LogOut, Settings, Key, Users, AlertTriangle, CalendarDays, Clock, ExternalLink } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LeadForm } from "@/components/lead-form";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { DailyCalendar } from "@/components/daily-calendar";
import { AvailabilityManager } from "@/components/availability-manager";
import { AppointmentBooking } from "@/components/appointment-booking";
import { CustomAppointmentModal } from "@/components/custom-appointment-modal";
import { GoogleCalendarIntegration } from "@/components/google-calendar-integration";
import { GalleryManagement } from "@/components/gallery-management";
import { SEOHead } from "@/components/seo-head";
import type { Lead, ContactSubmission, User, TimeBlock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const statusColors = {
  new: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border border-yellow-200", 
  scheduled: "bg-purple-50 text-purple-700 border border-purple-200",
  quoted: "bg-orange-50 text-orange-700 border border-orange-200",
  won: "bg-green-50 text-green-700 border border-green-200",
  lost: "bg-red-50 text-red-700 border border-red-200",
} as const;

const priorityColors = {
  low: "bg-gray-50 text-gray-700 border border-gray-200",
  medium: "bg-crawlguard-primary/10 text-crawlguard-primary border border-crawlguard-primary/20",
  high: "bg-crawlguard-secondary/10 text-crawlguard-secondary border border-crawlguard-secondary/20",
} as const;

// Draggable Lead Card Component
function DraggableLeadCard({ lead, onEdit, onDelete, onUpdateLead, onOpenCalendar, onBookAppointment }: { 
  lead: Lead; 
  onEdit: (lead: Lead) => void; 
  onDelete: (id: string) => void; 
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onOpenCalendar: () => void;
  onBookAppointment: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handlePriorityChange = (newPriority: string) => {
    onUpdateLead(lead.id, { priority: newPriority as 'low' | 'medium' | 'high' });
  };

  const handleEstimatedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onUpdateLead(lead.id, { estimatedValue: value.toString() });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={isDragging ? "z-50" : ""}
    >
      <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-border/50 hover:border-crawlguard-primary/30">
        <CardHeader className="pb-3 px-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="cursor-move p-1 -ml-1 hover:bg-gray-100 rounded" {...attributes} {...listeners}>
                <div className="w-2 h-2 grid grid-cols-2 gap-px">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold text-crawlguard-dark truncate">
                {lead.name}
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0">
              <Select value={lead.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger 
                  className={`h-6 text-xs border-0 px-2 py-0 ${priorityColors[lead.priority as keyof typeof priorityColors]} hover:opacity-80`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={`text-xs ${statusColors[lead.status as keyof typeof statusColors]}`}>
                {lead.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
              <span className="truncate text-gray-700">{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
                <span className="text-gray-700">{lead.phone}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-crawlguard-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-tight break-words">{lead.address}</span>
              </div>
            )}
            {lead.zipCode && (
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
                <span className="text-gray-700">Zip: {lead.zipCode}</span>
              </div>
            )}
            {lead.service && (
              <div className="bg-crawlguard-primary/10 px-2 py-1 rounded text-crawlguard-primary font-medium text-xs">
                Service: {lead.service}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-crawlguard-dark/70">Value: $</span>
              <input
                type="number"
                value={lead.estimatedValue?.toString() || "0"}
                onChange={handleEstimatedValueChange}
                className="bg-green-50 border border-green-200 px-2 py-1 rounded text-green-700 font-medium text-xs w-20 focus:outline-none focus:ring-1 focus:ring-crawlguard-primary"
                min="0"
                step="100"
              />
            </div>
            {lead.notes && (
              <div className="bg-gray-50 p-2 rounded text-gray-700 text-xs leading-relaxed">
                {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
              </div>
            )}
            {lead.scheduledDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalendar();
                }}
                className="flex items-center gap-2 text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs hover:bg-purple-100 transition-colors cursor-pointer"
                data-testid={`scheduled-date-${lead.id}`}
              >
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{new Date(lead.scheduledDate).toLocaleDateString()} at {new Date(lead.scheduledDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </button>
            )}
          </div>
          <div className="flex gap-1 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBookAppointment(lead);
              }}
              data-testid={`button-book-appointment-${lead.id}`}
              className="h-7 px-2 text-xs border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 flex-1"
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Book Appointment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              data-testid={`button-edit-lead-${lead.id}`}
              className="h-7 w-7 p-0 border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
              className="h-7 w-7 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              data-testid={`button-delete-lead-${lead.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Status Column Component
function StatusColumn({ 
  status, 
  title, 
  color, 
  leads, 
  onEditLead, 
  onDeleteLead,
  onUpdateLead,
  onOpenCalendar,
  onBookAppointment
}: {
  status: string;
  title: string;
  color: string;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onOpenCalendar: () => void;
  onBookAppointment: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-fit min-w-[280px] sm:min-w-[320px]">
      <div className={`${color} border-2 rounded-lg p-3 sm:p-4 min-h-[400px] sm:min-h-[500px] transition-all duration-200 ${isOver ? 'border-crawlguard-primary bg-crawlguard-primary/5' : 'border-gray-200 hover:border-crawlguard-primary/30'}`}>
        <h3 className="font-semibold text-sm sm:text-base text-crawlguard-dark mb-3 sm:mb-4 flex items-center justify-between">
          <span className="truncate">{title}</span>
          <span className="bg-crawlguard-primary/10 text-crawlguard-primary px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
            {leads.length}
          </span>
        </h3>
        <div ref={setNodeRef} className="space-y-3">
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                onEdit={onEditLead}
                onDelete={onDeleteLead}
                onUpdateLead={onUpdateLead}
                onOpenCalendar={onOpenCalendar}
                onBookAppointment={onBookAppointment}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

// Password Reset Form Component
const passwordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

function PasswordResetForm({ 
  userId, 
  username, 
  onSuccess, 
  resetPasswordMutation 
}: { 
  userId: string; 
  username: string; 
  onSuccess: () => void;
  resetPasswordMutation: any;
}) {
  const form = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const onSubmit = (data: { password: string; confirmPassword: string }) => {
    resetPasswordMutation.mutate(
      { userId, newPassword: data.password },
      { onSuccess: () => {
          form.reset();
          onSuccess();
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  {...field}
                  data-testid="input-new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  {...field}
                  data-testid="input-confirm-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="bg-crawlguard-primary hover:bg-crawlguard-primary/90"
            data-testid="button-submit-password-reset"
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchivedSubmissions, setShowArchivedSubmissions] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadForAppointment, setSelectedLeadForAppointment] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"month" | "week" | "schedule" | "day">("month");
  const [selectedCalendarLead, setSelectedCalendarLead] = useState<Lead | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<{ date: Date; hour?: number } | null>(null);
  const [isAppointmentBookingOpen, setIsAppointmentBookingOpen] = useState(false);
  const [appointmentBookingKey, setAppointmentBookingKey] = useState(0);

  const queryClient = useQueryClient();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
    select: (data: Lead[]) => data.filter((lead: Lead) => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lead.phone && lead.phone.includes(searchTerm));
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  });

  // Fetch contact submissions
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/contact-submissions", showArchivedSubmissions],
    queryFn: async () => {
      const endpoint = showArchivedSubmissions ? "/api/contact-submissions/archived" : "/api/contact-submissions";
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });

  // Fetch current user to check admin status
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"]
  });

  // Fetch time blocks for calendar views
  const { data: userTimeBlocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ['/api/time-blocks', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Fetch users for admin management (only if admin)
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: currentUser?.isAdmin === true
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      if (!response.ok) throw new Error("Failed to reset password");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }
  });

  // Google Calendar mutations
  
  const syncCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to sync calendar");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Calendar Sync",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addToGoogleCalendarMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(`/api/calendar/add-event/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to add event to calendar");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Calendar Event",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error) => {
      toast({
        title: "Add Event Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Convert submission to lead
  const convertToLeadMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/contact-submissions/${submissionId}/convert-to-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to convert submission");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Submission Converted",
        description: `${data.name} has been converted to a lead.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      // Invalidate both active and archived submissions
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions", true] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions", false] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert submission to lead",
        variant: "destructive",
      });
    }
  });

  // Archive submission
  const archiveSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/contact-submissions/${submissionId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to archive submission");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Archived",
        description: "The submission has been archived.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete submission
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/contact-submissions/${submissionId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete submission");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Deleted",
        description: "The submission has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update lead status and properties
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Handle updating lead properties inline
  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    updateLeadMutation.mutate({ id: leadId, updates });
  };

  // Delete lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a status column, update the lead status
    const validStatuses = ['new', 'contacted', 'scheduled', 'quoted', 'won', 'lost'];
    if (validStatuses.includes(overId)) {
      const lead = leads.find(l => l.id === activeId);
      if (lead && lead.status !== overId) {
        updateLeadMutation.mutate({
          id: activeId,
          updates: { status: overId as Lead['status'] }
        });
      }
    }
  };

  // Group leads by status for kanban view
  const leadsByStatus = leads.reduce((acc, lead) => {
    if (!acc[lead.status]) {
      acc[lead.status] = [];
    }
    acc[lead.status].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  const statusColumns = [
    { id: 'new', title: 'New Leads', color: 'border-blue-200 bg-blue-50' },
    { id: 'contacted', title: 'Contacted', color: 'border-yellow-200 bg-yellow-50' },
    { id: 'scheduled', title: 'Scheduled', color: 'border-purple-200 bg-purple-50' },
    { id: 'quoted', title: 'Quoted', color: 'border-orange-200 bg-orange-50' },
    { id: 'won', title: 'Won', color: 'border-green-200 bg-green-50' },
    { id: 'lost', title: 'Lost', color: 'border-red-200 bg-red-50' },
  ];

  const getStatusStats = () => {
    const stats = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: "Total Leads", value: leads.length, color: "text-crawlguard-primary", bgColor: "bg-crawlguard-primary/10" },
      { label: "New Leads", value: stats.new || 0, color: "text-blue-600", bgColor: "bg-blue-50" },
      { label: "Scheduled", value: stats.scheduled || 0, color: "text-purple-600", bgColor: "bg-purple-50" },
      { label: "Won", value: stats.won || 0, color: "text-green-600", bgColor: "bg-green-50" },
    ];
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "No phone";
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  };

  return (
    <>
      <SEOHead
        title="Admin Dashboard - CrawlGuard LLC Lead Management"
        description="Private admin dashboard for managing leads and customer inquiries"
      />

      <div className="min-h-screen bg-crawlguard-light">
        <div className="bg-white shadow-sm border-b border-crawlguard-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-crawlguard-dark" data-testid="admin-title">
                  CrawlGuard Admin Dashboard
                </h1>
                <p className="text-crawlguard-dark/70 mt-2">Manage leads, track opportunities, and schedule appointments</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => {
                    setSelectedLeadForAppointment(null);
                    setIsAppointmentBookingOpen(true);
                  }}
                  className="bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" 
                  data-testid="button-book-appointment-header"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                <Button
                  onClick={() => {
                    setSelectedLead(null);
                    setIsLeadFormOpen(true);
                  }}
                  variant="outline" 
                  className="border-crawlguard-primary text-crawlguard-primary hover:bg-crawlguard-primary/10"
                  data-testid="button-add-lead"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
                <Button
                  onClick={() =>
                    logoutMutation.mutate(undefined, {
                      onSuccess: () => {
                        window.location.href = "/auth";
                      },
                    })
                  }
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  data-testid="button-logout"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {getStatusStats().map((stat) => (
              <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`} 
                    className="border-crawlguard-primary/10 hover:border-crawlguard-primary/30 transition-all duration-200">
                <CardContent className={`p-4 sm:p-6 ${stat.bgColor || 'bg-white'}`}>
                  <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs sm:text-sm text-crawlguard-dark/70 mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="leads" className="w-full">
            <TabsList className={`grid w-full ${currentUser?.isAdmin ? 'grid-cols-7' : 'grid-cols-6'} bg-white border border-crawlguard-primary/20`}>
              <TabsTrigger value="leads" data-testid="leads-tab" 
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Lead Management
              </TabsTrigger>
              <TabsTrigger value="submissions" data-testid="submissions-tab"
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Contact Submissions
              </TabsTrigger>
              <TabsTrigger value="calendar" data-testid="calendar-tab"
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="availability" data-testid="availability-tab"
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Availability
              </TabsTrigger>
              <TabsTrigger value="google-calendar" data-testid="google-calendar-tab"
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Google Calendar
              </TabsTrigger>
              <TabsTrigger value="gallery" data-testid="gallery-tab"
                           className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                Gallery
              </TabsTrigger>
              {currentUser?.isAdmin && (
                <TabsTrigger value="users" data-testid="users-tab"
                             className="data-[state=active]:bg-crawlguard-primary data-[state=active]:text-white">
                  User Management
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              {/* Lead Management Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-crawlguard-primary/60 w-4 h-4" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-crawlguard-primary/20 focus:border-crawlguard-primary focus:ring-crawlguard-primary/20"
                      data-testid="search-leads"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 border-crawlguard-primary/20 focus:border-crawlguard-primary focus:ring-crawlguard-primary/20" data-testid="filter-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white border-crawlguard-primary" data-testid="add-lead-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
                      <DialogDescription>
                        {selectedLead ? "Update lead information and status" : "Fill out the form below to add a new lead to the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <LeadForm
                      lead={selectedLead}
                      onSuccess={() => {
                        setIsLeadFormOpen(false);
                        setSelectedLead(null);
                        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                      }}
                      onCancel={() => {
                        setIsLeadFormOpen(false);
                        setSelectedLead(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Kanban Board */}
              {leadsLoading ? (
                <div className="text-center py-8">Loading leads...</div>
              ) : leads.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No leads found</p>
                  </CardContent>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
                    {statusColumns.map((column) => (
                      <StatusColumn
                        key={column.id}
                        status={column.id}
                        title={column.title}
                        color={column.color}
                        leads={leadsByStatus[column.id] || []}
                        onEditLead={(lead) => {
                          setSelectedLead(lead);
                          setIsLeadFormOpen(true);
                        }}
                        onDeleteLead={(id) => deleteLeadMutation.mutate(id)}
                        onUpdateLead={handleUpdateLead}
                        onOpenCalendar={() => {
                          setCalendarView("week");
                          // Switch to calendar tab and weekly view
                          const calendarTab = document.querySelector('[data-testid="calendar-tab"]') as HTMLElement;
                          if (calendarTab) {
                            calendarTab.click();
                          }
                        }}
                        onBookAppointment={(lead) => {
                          setSelectedLeadForAppointment(lead);
                          setSelectedDateTime(null); // Clear any calendar selection
                          setIsAppointmentBookingOpen(true);
                        }}
                      />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeId ? (
                      <div className="transform rotate-2">
                        <DraggableLeadCard
                          lead={leads.find(l => l.id === activeId)!}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onUpdateLead={() => {}}
                          onOpenCalendar={() => {}}
                          onBookAppointment={() => {}}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-semibold text-crawlguard-dark">Contact Form Submissions</h2>
                <Button
                  variant={showArchivedSubmissions ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchivedSubmissions(!showArchivedSubmissions)}
                  className={showArchivedSubmissions ?
                    "bg-yellow-600 hover:bg-yellow-700 text-white" :
                    "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  }
                  data-testid="toggle-archived-submissions"
                >
                  {showArchivedSubmissions ? "Hiding Archived" : "Show Archived"}
                </Button>
              </div>

              {submissionsLoading ? (
                <div className="text-center py-8 text-crawlguard-dark/70">Loading submissions...</div>
              ) : submissionsError ? (
                <Card className="border-red-300 border-2">
                  <CardContent className="text-center py-8">
                    <p className="text-red-600 font-semibold">Error loading submissions</p>
                    <p className="text-red-500 text-sm mt-2">{submissionsError.message}</p>
                  </CardContent>
                </Card>
              ) : submissions.length === 0 ? (
                <Card className="border-crawlguard-primary/10">
                  <CardContent className="text-center py-8">
                    <p className="text-crawlguard-dark/70">No contact submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission: ContactSubmission) => (
                    <Card key={submission.id} data-testid={`submission-card-${submission.id}`}
                          className="border-crawlguard-primary/10 hover:border-crawlguard-primary/30 transition-all duration-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-crawlguard-dark truncate">{submission.name}</h3>
                            <div className="text-sm text-crawlguard-dark/70 space-y-1 mt-2">
                              <p className="truncate">Email: {submission.email}</p>
                              {submission.phone && <p>Phone: {formatPhone(submission.phone)}</p>}
                              {submission.service && (
                                <div className="bg-crawlguard-primary/10 px-2 py-1 rounded text-crawlguard-primary text-xs inline-block">
                                  Service: {submission.service}
                                </div>
                              )}
                              <p className="text-xs text-crawlguard-dark/50">Submitted: {formatDate(submission.createdAt)}</p>
                            </div>
                            {submission.message && (
                              <div className="mt-3 bg-crawlguard-primary/5 p-3 rounded-lg border border-crawlguard-primary/10">
                                <p className="text-sm text-crawlguard-dark/80 leading-relaxed">
                                  {submission.message.length > 200 ? `${submission.message.substring(0, 200)}...` : submission.message}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => convertToLeadMutation.mutate(submission.id)}
                              disabled={convertToLeadMutation.isPending}
                              className="bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white border-crawlguard-primary flex-1 sm:flex-none"
                              data-testid={`convert-submission-${submission.id}`}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Convert
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => archiveSubmissionMutation.mutate(submission.id)}
                              disabled={archiveSubmissionMutation.isPending}
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex-1 sm:flex-none"
                              data-testid={`archive-submission-${submission.id}`}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Archive
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteSubmissionMutation.mutate(submission.id)}
                              disabled={deleteSubmissionMutation.isPending}
                              className="border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                              data-testid={`delete-submission-${submission.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-crawlguard-dark">Calendar & Scheduled Leads</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => syncCalendarMutation.mutate()}
                    disabled={syncCalendarMutation.isPending}
                    className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                    data-testid="sync-google-calendar"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {syncCalendarMutation.isPending ? "Syncing..." : "Sync with Google Calendar"}
                  </Button>
                </div>
              </div>

              {leadsLoading ? (
                <div className="text-center py-8 text-crawlguard-dark/70">Loading scheduled leads...</div>
              ) : (
                <div className="space-y-6">
                  {/* Calendar View Options */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={calendarView === "month" ? "default" : "outline"}
                      onClick={() => setCalendarView("month")}
                      className={calendarView === "month" ? 
                        "bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" : 
                        "border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                      }
                      data-testid="button-month-view"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Month View
                    </Button>
                    <Button
                      variant={calendarView === "week" ? "default" : "outline"}
                      onClick={() => setCalendarView("week")}
                      className={calendarView === "week" ? 
                        "bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" : 
                        "border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                      }
                      data-testid="button-week-view"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Week View
                    </Button>
                    <Button
                      variant={calendarView === "day" ? "default" : "outline"}
                      onClick={() => setCalendarView("day")}
                      className={calendarView === "day" ? 
                        "bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" : 
                        "border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                      }
                      data-testid="button-day-view"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Day View
                    </Button>
                    <Button
                      variant={calendarView === "schedule" ? "default" : "outline"}
                      onClick={() => setCalendarView("schedule")}
                      className={calendarView === "schedule" ? 
                        "bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" : 
                        "border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                      }
                      data-testid="button-schedule-view"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule List
                    </Button>
                  </div>
                  
                  {/* Calendar Views */}
                  {calendarView === "month" && (
                    <div className="mb-8">
                      <MonthlyCalendar
                        leads={leads}
                        onLeadClick={(lead) => setSelectedLead(lead)}
                        onDateClick={(date) => {
                          // Could add functionality to create new appointment on date click
                          console.log("Date clicked:", date);
                        }}
                      />
                    </div>
                  )}

                  {calendarView === "week" && (
                    <div className="mb-8">
                      <WeeklyCalendar
                        leads={leads}
                        timeBlocks={userTimeBlocks}
                        onDateClick={(date) => {
                          setSelectedDateTime({ date });
                          setIsAppointmentBookingOpen(true);
                        }}
                        onLeadClick={(lead) => {
                          setSelectedLead(lead);
                          setIsLeadFormOpen(true);
                        }}
                        onTimeSlotClick={(date, hour) => {
                          setSelectedDateTime({ date, hour });
                          setIsAppointmentBookingOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {calendarView === "day" && (
                    <div className="mb-8">
                      <DailyCalendar
                        leads={leads}
                        timeBlocks={userTimeBlocks}
                        onDateClick={(date) => {
                          setSelectedDateTime({ date });
                          setIsAppointmentBookingOpen(true);
                        }}
                        onLeadClick={(lead) => {
                          setSelectedLead(lead);
                          setIsLeadFormOpen(true);
                        }}
                        onTimeSlotClick={(date, hour) => {
                          setSelectedDateTime({ date, hour });
                          setIsAppointmentBookingOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {calendarView === "schedule" && (
                    <div className="mb-8">
                      <Card className="border-crawlguard-primary/10">
                        <CardContent className="text-center py-8">
                          <Clock className="w-12 h-12 text-crawlguard-primary/40 mx-auto mb-4" />
                          <p className="text-crawlguard-dark/70 mb-2">Schedule List View</p>
                          <p className="text-sm text-crawlguard-dark/50">All scheduled appointments in chronological order</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Schedule List View */}
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold text-crawlguard-dark">
                      {calendarView === "schedule" ? "Upcoming Appointments" : "Recent Appointments"}
                    </h3>
                    {leads
                      .filter((lead: Lead) => lead.scheduledDate && (calendarView === "schedule" ? new Date(lead.scheduledDate) >= new Date() : true))
                      .sort((a: Lead, b: Lead) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
                      .slice(0, calendarView === "schedule" ? undefined : 5)
                      .map((lead: Lead) => (
                        <Card key={lead.id} data-testid={`scheduled-lead-${lead.id}`}
                              className="border-crawlguard-primary/10 hover:border-crawlguard-primary/30 transition-all duration-200">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-crawlguard-dark truncate">{lead.name}</h3>
                                  <Badge className={`text-xs ${statusColors[lead.status as keyof typeof statusColors]}`}>
                                    {lead.status}
                                  </Badge>
                                  <Badge className={`text-xs ${priorityColors[lead.priority as keyof typeof priorityColors]}`}>
                                    {lead.priority}
                                  </Badge>
                                </div>
                                <div className="text-sm text-crawlguard-dark/70 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
                                    <span className="font-medium text-purple-700">
                                      {new Date(lead.scheduledDate!).toLocaleDateString()} at {new Date(lead.scheduledDate!).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                  {lead.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-crawlguard-primary flex-shrink-0" />
                                      <span>{lead.phone}</span>
                                    </div>
                                  )}
                                  {lead.address && (
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-crawlguard-primary flex-shrink-0 mt-0.5" />
                                      <span className="leading-tight break-words">{lead.address}</span>
                                    </div>
                                  )}
                                  {lead.service && (
                                    <div className="bg-crawlguard-primary/10 px-2 py-1 rounded text-crawlguard-primary font-medium text-xs inline-block">
                                      Service: {lead.service}
                                    </div>
                                  )}
                                </div>
                                {lead.notes && (
                                  <div className="mt-3 bg-gray-50 p-2 rounded text-gray-700 text-xs leading-relaxed">
                                    {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedLead(lead)}
                                  className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
                                  data-testid={`edit-scheduled-lead-${lead.id}`}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addToGoogleCalendarMutation.mutate(lead.id)}
                                  disabled={addToGoogleCalendarMutation.isPending}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                  data-testid={`add-to-google-calendar-${lead.id}`}
                                >
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {addToGoogleCalendarMutation.isPending ? "Adding..." : "Add to Google"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    
                    {leads.filter((lead: Lead) => lead.scheduledDate && (calendarView === "schedule" ? new Date(lead.scheduledDate) >= new Date() : true)).length === 0 && (
                      <Card className="border-crawlguard-primary/10">
                        <CardContent className="text-center py-8">
                          <Calendar className="w-12 h-12 text-crawlguard-primary/40 mx-auto mb-4" />
                          <p className="text-crawlguard-dark/70 mb-2">No upcoming appointments scheduled</p>
                          <p className="text-sm text-crawlguard-dark/50">Schedule appointments from the Lead Management tab</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Past Appointments */}
                  <div className="grid gap-4 mt-8">
                    <h3 className="text-lg font-semibold text-crawlguard-dark">Past Appointments</h3>
                    {leads
                      .filter((lead: Lead) => lead.scheduledDate && new Date(lead.scheduledDate) < new Date())
                      .sort((a: Lead, b: Lead) => new Date(b.scheduledDate!).getTime() - new Date(a.scheduledDate!).getTime())
                      .slice(0, 10) // Show only last 10 past appointments
                      .map((lead: Lead) => (
                        <Card key={lead.id} data-testid={`past-lead-${lead.id}`}
                              className="border-gray-200 opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-crawlguard-dark">{lead.name}</h4>
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(lead.scheduledDate!).toLocaleDateString()}</span>
                                  <Badge className={`text-xs ${statusColors[lead.status as keyof typeof statusColors]}`}>
                                    {lead.status}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedLead(lead)}
                                className="text-gray-600 hover:text-crawlguard-primary"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {/* Custom Appointment Modal for Lead Cards */}
                  <CustomAppointmentModal
                    isOpen={isAppointmentBookingOpen}
                    onClose={() => {
                      setIsAppointmentBookingOpen(false);
                      setSelectedLeadForAppointment(null);
                    }}
                    leads={leads}
                    selectedLead={selectedLeadForAppointment}
                    onSuccess={() => {
                      setIsAppointmentBookingOpen(false);
                      setSelectedLeadForAppointment(null);
                      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                    }}
                  />

                  {/* AppointmentBooking Dialog for Calendar Time Slots */}
                  {selectedDateTime !== null && (
                    <AppointmentBooking
                      key={appointmentBookingKey}
                      leads={leads}
                      selectedDate={selectedDateTime.date}
                      selectedTime={selectedDateTime.hour ? `${selectedDateTime.hour.toString().padStart(2, '0')}:00` : undefined}
                      open={true}
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedDateTime(null);
                        }
                      }}
                      onSuccess={() => {
                        setSelectedDateTime(null);
                        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                      }}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-crawlguard-dark">Time Availability Management</h2>
              </div>
              <div className="bg-white p-6 rounded-lg border border-crawlguard-primary/10">
                <AvailabilityManager userId={currentUser?.id || ''} />
              </div>
            </TabsContent>

            <TabsContent value="google-calendar" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-crawlguard-dark">Google Calendar Integration</h2>
              </div>
              <GoogleCalendarIntegration />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <GalleryManagement />
            </TabsContent>

            {currentUser?.isAdmin && (
              <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-crawlguard-dark">User Management</h2>
              </div>

              {usersLoading ? (
                <div className="text-center py-8 text-crawlguard-dark/70">Loading users...</div>
              ) : users.length === 0 ? (
                <Card className="border-crawlguard-primary/10">
                  <CardContent className="text-center py-8">
                    <p className="text-crawlguard-dark/70">No users found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {users.map((user: User) => (
                    <Card key={user.id} data-testid={`user-card-${user.id}`}
                          className="border-crawlguard-primary/10 hover:border-crawlguard-primary/30 transition-all duration-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-crawlguard-dark truncate">{user.username}</h3>
                            <div className="text-sm text-crawlguard-dark/70 space-y-1 mt-2">
                              <p className="truncate">Email: {user.email || 'N/A'}</p>
                              <p className="text-xs text-crawlguard-dark/50">
                                Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                              {user.isAdmin && (
                                <Badge className="bg-crawlguard-primary/10 text-crawlguard-primary text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10 w-full sm:w-auto"
                                  data-testid={`reset-password-${user.id}`}
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Reset Password
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset Password for {user.username}</DialogTitle>
                                  <DialogDescription>
                                    Enter a new password for this user account.
                                  </DialogDescription>
                                </DialogHeader>
                                <PasswordResetForm
                                  userId={user.id}
                                  username={user.username}
                                  onSuccess={() => {
                                    // Dialog will close automatically
                                  }}
                                  resetPasswordMutation={resetPasswordMutation}
                                />
                              </DialogContent>
                            </Dialog>
                            {!user.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                                data-testid={`delete-user-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
}
