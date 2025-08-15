import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, Phone, Mail, MapPin, Edit2, Trash2, UserPlus, GripVertical } from "lucide-react";
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

// Draggable Lead Card Component
function DraggableLeadCard({ lead, onEdit, onDelete }: { 
  lead: Lead; 
  onEdit: (lead: Lead) => void; 
  onDelete: (id: string) => void; 
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

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
      <Card className="mb-4 hover:shadow-md transition-shadow cursor-move">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <CardTitle className="text-lg">{lead.name}</CardTitle>
            </div>
            <div className="flex gap-1">
              <Badge className={priorityColors[lead.priority as keyof typeof priorityColors]}>
                {lead.priority}
              </Badge>
              <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                {lead.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{lead.address}</span>
              </div>
            )}
            {lead.service && (
              <div className="text-blue-600 font-medium">
                Service: {lead.service}
              </div>
            )}
            {lead.estimatedValue && (
              <div className="text-green-600 font-medium">
                Value: ${lead.estimatedValue.toLocaleString()}
              </div>
            )}
            {lead.notes && (
              <div className="text-gray-600 text-xs">
                {lead.notes}
              </div>
            )}
            {lead.scheduledDate && (
              <div className="flex items-center gap-2 text-purple-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(lead.scheduledDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(lead)}
              data-testid={`button-edit-lead-${lead.id}`}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(lead.id)}
              className="text-red-600 hover:text-red-700"
              data-testid={`button-delete-lead-${lead.id}`}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
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
  onDeleteLead 
}: {
  status: string;
  title: string;
  color: string;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-fit">
      <div className={`${color} border-2 rounded-lg p-4 min-h-[500px] ${isOver ? 'border-blue-400 bg-blue-100' : ''}`}>
        <h3 className="font-semibold text-sm text-gray-700 mb-4 flex items-center justify-between">
          {title}
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
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
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

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
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<ContactSubmission[]>({
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
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
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
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