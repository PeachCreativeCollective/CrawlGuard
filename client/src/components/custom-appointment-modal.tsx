import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, User, MapPin, Phone, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

const appointmentSchema = z.object({
  leadId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  service: z.string().min(1, "Service is required"),
  notes: z.string().optional(),
  estimatedValue: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const serviceOptions = [
  { value: "crawl-space-encapsulation", label: "Crawl Space Encapsulation" },
  { value: "basement-waterproofing", label: "Basement Waterproofing" },
  { value: "mold-remediation", label: "Mold Remediation" },
  { value: "vapor-barrier-installation", label: "Vapor Barrier Installation" },
  { value: "sump-pump-installation", label: "Sump Pump Installation" },
  { value: "french-drain-installation", label: "French Drain Installation" },
  { value: "foundation-repair", label: "Foundation Repair" },
  { value: "dehumidification", label: "Dehumidification Systems" },
  { value: "consultation", label: "Free Consultation" },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

interface CustomAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLead?: Lead | null;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  onSuccess?: () => void;
}

export function CustomAppointmentModal({
  isOpen,
  onClose,
  leads,
  selectedLead,
  selectedDate,
  selectedTime,
  onSuccess
}: CustomAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log("CustomAppointmentModal - Props:", { 
    isOpen, 
    selectedLead: selectedLead?.name,
    selectedDate: selectedDate?.toISOString().split('T')[0],
    selectedTime 
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      leadId: selectedLead?.id || "",
      clientName: selectedLead?.name || "",
      email: selectedLead?.email || "",
      phone: selectedLead?.phone || "",
      address: selectedLead?.address || "",
      appointmentDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      appointmentTime: selectedTime || "",
      service: selectedLead?.service || "",
      notes: selectedLead?.notes || "",
      estimatedValue: selectedLead?.estimatedValue?.toString() || "",
    },
  });

  // Reset form when props change
  useEffect(() => {
    if (isOpen) {
      form.reset({
        leadId: selectedLead?.id || "",
        clientName: selectedLead?.name || "",
        email: selectedLead?.email || "",
        phone: selectedLead?.phone || "",
        address: selectedLead?.address || "",
        appointmentDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        appointmentTime: selectedTime || "",
        service: selectedLead?.service || "",
        notes: selectedLead?.notes || "",
        estimatedValue: selectedLead?.estimatedValue?.toString() || "",
      });
    }
  }, [isOpen, selectedLead, selectedDate, selectedTime, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentData = {
        ...data,
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
      };
      
      if (data.leadId) {
        // Update existing lead with appointment
        const response = await apiRequest("PATCH", `/api/leads/${data.leadId}`, {
          scheduledDate: `${data.appointmentDate}T${data.appointmentTime}:00`,
          status: "scheduled",
          ...appointmentData,
        });
        return response.json();
      } else {
        // Create new lead with appointment
        const response = await apiRequest("POST", "/api/leads", {
          ...appointmentData,
          scheduledDate: `${data.appointmentDate}T${data.appointmentTime}:00`,
          status: "scheduled",
        });
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      form.setValue("leadId", lead.id);
      form.setValue("clientName", lead.name);
      form.setValue("email", lead.email || "");
      form.setValue("phone", lead.phone || "");
      form.setValue("address", lead.address || "");
      form.setValue("service", lead.service || "");
      form.setValue("notes", lead.notes || "");
      form.setValue("estimatedValue", lead.estimatedValue?.toString() || "");
    }
  };

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Schedule Appointment</h2>
            <p className="text-sm text-gray-600">
              Book an appointment for waterproofing services
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Lead Selection */}
          <div className="space-y-2">
            <Label htmlFor="leadSelect">Select Existing Lead (Optional)</Label>
            <Select
              onValueChange={handleLeadSelect}
              value={selectedLead?.id || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a lead or enter new client info below" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">New Client</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{lead.name}</span>
                      {lead.phone && (
                        <span className="text-xs text-gray-500">• {lead.phone}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                placeholder="Full name"
                className={form.formState.errors.clientName ? "border-red-500" : ""}
              />
              {form.formState.errors.clientName && (
                <p className="text-xs text-red-600">{form.formState.errors.clientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="client@example.com"
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="(555) 123-4567"
                className={form.formState.errors.phone ? "border-red-500" : ""}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                {...form.register("estimatedValue")}
                placeholder="5000"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Service Address *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="123 Main St, City, State 12345"
              className={form.formState.errors.address ? "border-red-500" : ""}
            />
            {form.formState.errors.address && (
              <p className="text-xs text-red-600">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date *</Label>
              <Input
                id="appointmentDate"
                type="date"
                {...form.register("appointmentDate")}
                min={format(new Date(), "yyyy-MM-dd")}
                className={form.formState.errors.appointmentDate ? "border-red-500" : ""}
              />
              {form.formState.errors.appointmentDate && (
                <p className="text-xs text-red-600">{form.formState.errors.appointmentDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Appointment Time *</Label>
              <Select {...form.register("appointmentTime")}>
                <SelectTrigger className={form.formState.errors.appointmentTime ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(`2000-01-01T${time}:00`), "h:mm a")}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.appointmentTime && (
                <p className="text-xs text-red-600">{form.formState.errors.appointmentTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service Required *</Label>
            <Select {...form.register("service")}>
              <SelectTrigger className={form.formState.errors.service ? "border-red-500" : ""}>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.service && (
              <p className="text-xs text-red-600">{form.formState.errors.service.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Any special requirements, access instructions, or additional information..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAppointmentMutation.isPending}
              className="flex-1 bg-crawlguard-primary hover:bg-crawlguard-primary/90"
            >
              {createAppointmentMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Scheduling...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Appointment</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}