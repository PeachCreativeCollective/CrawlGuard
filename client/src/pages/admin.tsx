import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, Phone, Mail, MapPin, Edit2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/lead-form";
import { CalendarIntegration } from "@/components/calendar-integration";
import { SEOHead } from "@/components/seo-head";
import type { Lead, ContactSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800", 
  scheduled: "bg-purple-100 text-purple-800",
  quoted: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
} as const;

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
} as const;

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const queryClient = useQueryClient();

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
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/contact-submissions"]
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-submissions"] });
    }
  });

  // Update lead status
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

  const getStatusStats = () => {
    const stats = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: "New Leads", value: stats.new || 0, color: "text-blue-600" },
      { label: "Scheduled", value: stats.scheduled || 0, color: "text-purple-600" },
      { label: "Quoted", value: stats.quoted || 0, color: "text-orange-600" },
      { label: "Won", value: stats.won || 0, color: "text-green-600" },
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
        robots="noindex, nofollow"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-crawlguard-dark" data-testid="admin-title">
              CrawlGuard Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage leads, track opportunities, and schedule appointments</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {getStatusStats().map((stat) => (
              <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-6">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leads" data-testid="leads-tab">Lead Management</TabsTrigger>
              <TabsTrigger value="submissions" data-testid="submissions-tab">Contact Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              {/* Lead Management Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-leads"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="filter-status">
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
                    <Button className="bg-crawlguard-primary hover:bg-teal-600" data-testid="add-lead-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
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

              {/* Leads Grid */}
              {leadsLoading ? (
                <div className="text-center py-8">Loading leads...</div>
              ) : leads.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No leads found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {leads.map((lead: Lead) => (
                    <Card key={lead.id} className="hover:shadow-lg transition-shadow" data-testid={`lead-card-${lead.id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{lead.name}</CardTitle>
                            <p className="text-sm text-gray-600 capitalize">{lead.service}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={priorityColors[lead.priority as keyof typeof priorityColors]}>
                              {lead.priority}
                            </Badge>
                            <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                              {lead.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{formatPhone(lead.phone)}</span>
                            </div>
                          )}
                          {lead.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{lead.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Created: {formatDate(lead.createdAt)}</span>
                          </div>
                          {lead.scheduledDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-crawlguard-primary" />
                              <span className="text-crawlguard-primary font-medium">
                                Scheduled: {formatDate(lead.scheduledDate)}
                              </span>
                            </div>
                          )}
                        </div>

                        {lead.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{lead.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsLeadFormOpen(true);
                            }}
                            data-testid={`edit-lead-${lead.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLeadMutation.mutate(lead.id)}
                            data-testid={`delete-lead-${lead.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <CalendarIntegration lead={lead} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-crawlguard-dark">Contact Form Submissions</h2>
              </div>

              {submissionsLoading ? (
                <div className="text-center py-8">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No contact submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission: ContactSubmission) => (
                    <Card key={submission.id} data-testid={`submission-card-${submission.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{submission.name}</h3>
                            <div className="text-sm text-gray-600 space-y-1 mt-2">
                              <p>Email: {submission.email}</p>
                              {submission.phone && <p>Phone: {formatPhone(submission.phone)}</p>}
                              {submission.service && <p>Service: {submission.service}</p>}
                              <p>Submitted: {formatDate(submission.createdAt)}</p>
                            </div>
                            {submission.message && (
                              <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-700">{submission.message}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => convertToLeadMutation.mutate(submission.id)}
                            disabled={convertToLeadMutation.isPending}
                            data-testid={`convert-submission-${submission.id}`}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Convert to Lead
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}