import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Phone, Mail, MapPin, FileText, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

const appointmentSchema = z.object({
  leadId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  service: z.string().min(1, "Service is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  duration: z.string().default("60"),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentBookingProps {
  leads: Lead[];
  selectedDate?: Date;
  selectedTime?: string;
  selectedLead?: Lead | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppointmentBooking({ 
  leads, 
  selectedDate, 
  selectedTime, 
  selectedLead,
  trigger,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange 
}: AppointmentBookingProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [internalSelectedLead, setInternalSelectedLead] = useState<Lead | null>(null);
  const currentSelectedLead = selectedLead || internalSelectedLead;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientName: "",
      email: "",
      phone: "",
      address: "",
      service: "",
      appointmentDate: selectedDate ? selectedDate.toISOString().split('T')[0] : "",
      appointmentTime: selectedTime || "",
      duration: "60",
      notes: "",
      priority: "medium",
    },
  });

  // Service options matching the lead services
  const serviceOptions = [
    { value: "crawl-space-encapsulation", label: "Crawl Space Encapsulation" },
    { value: "vapor-barriers", label: "Vapor Barriers" },
    { value: "basement-waterproofing", label: "Basement Waterproofing" },
    { value: "mold-remediation", label: "Mold Remediation" },
    { value: "insulation-dehumidification", label: "Insulation & Dehumidification" },
    { value: "consultation", label: "Consultation" },
  ];

  const timeOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
  ];

  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
  ];

  // Filter leads that don't already have appointments
  const availableLeads = leads.filter(lead => !lead.scheduledDate);

  // Effect to handle selectedLead prop
  useEffect(() => {
    if (selectedLead && selectedLead !== currentSelectedLead) {
      setInternalSelectedLead(selectedLead);
      form.setValue("leadId", selectedLead.id);
      form.setValue("clientName", selectedLead.name);
      form.setValue("email", selectedLead.email);
      form.setValue("phone", selectedLead.phone || "");
      form.setValue("address", selectedLead.address || "");
      form.setValue("service", selectedLead.service);
      form.setValue("notes", selectedLead.notes || "");
      form.setValue("priority", selectedLead.priority as "low" | "medium" | "high");
    }
  }, [selectedLead, currentSelectedLead, form]);

  const handleLeadSelection = (leadId: string) => {
    const lead = availableLeads.find(l => l.id === leadId);
    if (lead) {
      setInternalSelectedLead(lead);
      form.setValue("leadId", lead.id);
      form.setValue("clientName", lead.name);
      form.setValue("email", lead.email);
      form.setValue("phone", lead.phone || "");
      form.setValue("address", lead.address || "");
      form.setValue("service", lead.service);
      form.setValue("notes", lead.notes || "");
      form.setValue("priority", lead.priority as "low" | "medium" | "high");
    }
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Create the appointment date-time
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      
      if (data.leadId) {
        // Update existing lead with appointment details
        const response = await apiRequest("PATCH", `/api/leads/${data.leadId}`, {
          scheduledDate: appointmentDateTime.toISOString(),
          status: "scheduled",
          notes: data.notes || "",
          priority: data.priority,
        });
        return response.json();
      } else {
        // Create new lead with appointment
        const response = await apiRequest("POST", "/api/leads", {
          name: data.clientName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          service: data.service,
          scheduledDate: appointmentDateTime.toISOString(),
          status: "scheduled",
          notes: data.notes || "",
          priority: data.priority,
          source: "appointment-booking",
        });
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked",
        description: "The appointment has been successfully scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      form.reset();
      setInternalSelectedLead(null);
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setInternalSelectedLead(null);
  };

  const getServiceLabel = (value: string) => {
    return serviceOptions.find(option => option.value === value)?.label || value;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-book-appointment">
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book New Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a new appointment for waterproofing services. You can select an existing lead or create a new one.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Lead Selection Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Existing Lead (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={currentSelectedLead?.id || ""} onValueChange={handleLeadSelection}>
                  <SelectTrigger data-testid="select-lead">
                    <SelectValue placeholder="Choose from existing leads or create new appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {getServiceLabel(lead.service)} • {lead.email}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {lead.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {currentSelectedLead && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Selected Lead Details</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetForm}
                        data-testid="button-clear-selection"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Status:</strong> <Badge variant="outline" className="capitalize">{currentSelectedLead.status}</Badge></div>
                      <div><strong>Priority:</strong> <Badge variant="outline" className="capitalize">{currentSelectedLead.priority}</Badge></div>
                      <div><strong>Source:</strong> {currentSelectedLead.source}</div>
                      <div><strong>Service:</strong> {getServiceLabel(currentSelectedLead.service)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-client-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" data-testid="input-email" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" data-testid="input-phone" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" data-testid="input-address" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-service">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about the appointment, special requirements, or client preferences..."
                      className="min-h-[100px]"
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending}
                data-testid="button-book"
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}