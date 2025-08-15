import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, X, Save, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { WorkingHours, TimeBlock, InsertWorkingHours, InsertTimeBlock } from '@shared/schema';

interface AvailabilityManagerProps {
  userId: string;
}

export function AvailabilityManager({ userId }: AvailabilityManagerProps) {
  const [isWorkingHoursDialogOpen, setIsWorkingHoursDialogOpen] = useState(false);
  const [isTimeBlockDialogOpen, setIsTimeBlockDialogOpen] = useState(false);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch working hours
  const { data: workingHours = [] } = useQuery<WorkingHours[]>({
    queryKey: ['/api/working-hours', userId],
  });

  // Fetch time blocks
  const { data: timeBlocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ['/api/time-blocks', userId],
  });

  // Working hours mutations
  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (data: { dayOfWeek: string; hours: Partial<InsertWorkingHours> }) => {
      const response = await fetch(`/api/working-hours/${data.dayOfWeek}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.hours),
      });
      if (!response.ok) throw new Error('Failed to update working hours');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/working-hours', userId] });
      toast({ title: 'Working hours updated successfully' });
    },
  });

  // Time block mutations
  const createTimeBlockMutation = useMutation({
    mutationFn: async (data: InsertTimeBlock) => {
      const response = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create time block');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-blocks', userId] });
      setIsTimeBlockDialogOpen(false);
      toast({ title: 'Time block created successfully' });
    },
  });

  const updateTimeBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTimeBlock> }) => {
      const response = await fetch(`/api/time-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update time block');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-blocks', userId] });
      setIsTimeBlockDialogOpen(false);
      setSelectedTimeBlock(null);
      toast({ title: 'Time block updated successfully' });
    },
  });

  const deleteTimeBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/time-blocks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete time block');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-blocks', userId] });
      toast({ title: 'Time block deleted successfully' });
    },
  });

  const daysOfWeek = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  const blockTypes = [
    { value: 'personal', label: 'Personal Time', color: '#ef4444' },
    { value: 'maintenance', label: 'Equipment Maintenance', color: '#f97316' },
    { value: 'break', label: 'Break/Lunch', color: '#84cc16' },
    { value: 'travel', label: 'Travel Time', color: '#06b6d4' },
    { value: 'admin', label: 'Administrative', color: '#8b5cf6' },
    { value: 'other', label: 'Other', color: '#6b7280' },
  ];

  const getWorkingHoursForDay = (dayOfWeek: string) => {
    return workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getBlockTypeInfo = (blockType: string) => {
    return blockTypes.find(bt => bt.value === blockType) || blockTypes[blockTypes.length - 1];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="working-hours" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="working-hours" data-testid="tab-working-hours">
            <Clock className="w-4 h-4 mr-2" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="time-blocks" data-testid="tab-time-blocks">
            <Calendar className="w-4 h-4 mr-2" />
            Time Blocks
          </TabsTrigger>
        </TabsList>

        {/* Working Hours Tab */}
        <TabsContent value="working-hours" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Weekly Working Hours</h3>
            <Dialog open={isWorkingHoursDialogOpen} onOpenChange={setIsWorkingHoursDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-edit-working-hours">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Hours
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configure Working Hours</DialogTitle>
                </DialogHeader>
                <WorkingHoursForm 
                  workingHours={workingHours}
                  onSave={(dayOfWeek, hours) => {
                    updateWorkingHoursMutation.mutate({ dayOfWeek, hours });
                  }}
                  onClose={() => setIsWorkingHoursDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daysOfWeek.map((day) => {
              const dayHours = getWorkingHoursForDay(day.value);
              return (
                <Card key={day.value} data-testid={`working-hours-${day.value}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{day.label}</h4>
                      <Switch 
                        checked={dayHours?.isActive ?? false}
                        onCheckedChange={(checked) => {
                          updateWorkingHoursMutation.mutate({
                            dayOfWeek: day.value,
                            hours: { 
                              isActive: checked,
                              startTime: dayHours?.startTime || '09:00',
                              endTime: dayHours?.endTime || '17:00'
                            }
                          });
                        }}
                        data-testid={`switch-day-active-${day.value}`}
                      />
                    </div>
                    {dayHours?.isActive ? (
                      <div className="text-sm text-muted-foreground">
                        {formatTime(dayHours.startTime)} - {formatTime(dayHours.endTime)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Closed</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Time Blocks Tab */}
        <TabsContent value="time-blocks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Blocked Time Periods</h3>
            <Dialog open={isTimeBlockDialogOpen} onOpenChange={setIsTimeBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-time-block">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedTimeBlock ? 'Edit Time Block' : 'Add Time Block'}
                  </DialogTitle>
                </DialogHeader>
                <TimeBlockForm
                  timeBlock={selectedTimeBlock}
                  onSave={(data) => {
                    if (selectedTimeBlock) {
                      updateTimeBlockMutation.mutate({ id: selectedTimeBlock.id, data });
                    } else {
                      createTimeBlockMutation.mutate(data);
                    }
                  }}
                  onClose={() => {
                    setIsTimeBlockDialogOpen(false);
                    setSelectedTimeBlock(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {timeBlocks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No time blocks configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add time blocks to reserve periods for personal tasks or commitments
                  </p>
                </CardContent>
              </Card>
            ) : (
              timeBlocks
                .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                .map((block) => {
                  const blockTypeInfo = getBlockTypeInfo(block.blockType);
                  return (
                    <Card key={block.id} data-testid={`time-block-${block.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: blockTypeInfo.color }}
                              />
                              <h4 className="font-medium">{block.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {blockTypeInfo.label}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {new Date(block.startDateTime).toLocaleDateString()} • {' '}
                              {new Date(block.startDateTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })} - {' '}
                              {new Date(block.endDateTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </div>
                            {block.description && (
                              <p className="text-sm text-muted-foreground">{block.description}</p>
                            )}
                            {block.isRecurring && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Recurring {block.recurringPattern}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTimeBlock(block);
                                setIsTimeBlockDialogOpen(true);
                              }}
                              data-testid={`button-edit-time-block-${block.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTimeBlockMutation.mutate(block.id)}
                              data-testid={`button-delete-time-block-${block.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Working Hours Form Component
function WorkingHoursForm({ 
  workingHours, 
  onSave, 
  onClose 
}: {
  workingHours: WorkingHours[];
  onSave: (dayOfWeek: string, hours: Partial<InsertWorkingHours>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, { startTime: string; endTime: string; isActive: boolean }>>(() => {
    const initial: Record<string, { startTime: string; endTime: string; isActive: boolean }> = {};
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = i.toString();
      const existing = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
      initial[dayOfWeek] = {
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '17:00',
        isActive: existing?.isActive ?? true,
      };
    }
    return initial;
  });

  const daysOfWeek = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  const handleSaveAll = () => {
    Object.entries(formData).forEach(([dayOfWeek, data]) => {
      onSave(dayOfWeek, data);
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      {daysOfWeek.map((day) => (
        <div key={day.value} className="flex items-center gap-4">
          <div className="w-20 text-sm font-medium">{day.label}</div>
          <Switch
            checked={formData[day.value]?.isActive}
            onCheckedChange={(checked) => {
              setFormData(prev => ({
                ...prev,
                [day.value]: { ...prev[day.value], isActive: checked }
              }));
            }}
            data-testid={`switch-working-hours-${day.value}`}
          />
          {formData[day.value]?.isActive && (
            <>
              <Input
                type="time"
                value={formData[day.value]?.startTime}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    [day.value]: { ...prev[day.value], startTime: e.target.value }
                  }));
                }}
                className="w-24"
                data-testid={`input-start-time-${day.value}`}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={formData[day.value]?.endTime}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    [day.value]: { ...prev[day.value], endTime: e.target.value }
                  }));
                }}
                className="w-24"
                data-testid={`input-end-time-${day.value}`}
              />
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSaveAll} data-testid="button-save-working-hours">
          <Save className="w-4 h-4 mr-2" />
          Save All
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Time Block Form Component
function TimeBlockForm({ 
  timeBlock, 
  onSave, 
  onClose 
}: {
  timeBlock: TimeBlock | null;
  onSave: (data: InsertTimeBlock) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: timeBlock?.title || '',
    description: timeBlock?.description || '',
    startDateTime: timeBlock?.startDateTime ? 
      new Date(timeBlock.startDateTime).toISOString().slice(0, 16) : 
      new Date().toISOString().slice(0, 16),
    endDateTime: timeBlock?.endDateTime ? 
      new Date(timeBlock.endDateTime).toISOString().slice(0, 16) : 
      new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    blockType: timeBlock?.blockType || 'personal',
    isRecurring: timeBlock?.isRecurring || false,
    recurringPattern: timeBlock?.recurringPattern || 'weekly',
    color: timeBlock?.color || '#ef4444',
  });

  const blockTypes = [
    { value: 'personal', label: 'Personal Time' },
    { value: 'maintenance', label: 'Equipment Maintenance' },
    { value: 'break', label: 'Break/Lunch' },
    { value: 'travel', label: 'Travel Time' },
    { value: 'admin', label: 'Administrative' },
    { value: 'other', label: 'Other' },
  ];

  const recurringPatterns = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startDateTime: new Date(formData.startDateTime),
      endDateTime: new Date(formData.endDateTime),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Lunch break, Personal appointment"
          required
          data-testid="input-time-block-title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about this time block"
          data-testid="textarea-time-block-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDateTime">Start Date & Time</Label>
          <Input
            id="startDateTime"
            type="datetime-local"
            value={formData.startDateTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
            required
            data-testid="input-start-datetime"
          />
        </div>
        <div>
          <Label htmlFor="endDateTime">End Date & Time</Label>
          <Input
            id="endDateTime"
            type="datetime-local"
            value={formData.endDateTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
            required
            data-testid="input-end-datetime"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="blockType">Block Type</Label>
        <Select 
          value={formData.blockType} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, blockType: value }))}
        >
          <SelectTrigger data-testid="select-block-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {blockTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
          data-testid="switch-is-recurring"
        />
        <Label htmlFor="isRecurring">Recurring</Label>
      </div>

      {formData.isRecurring && (
        <div>
          <Label htmlFor="recurringPattern">Recurring Pattern</Label>
          <Select 
            value={formData.recurringPattern} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPattern: value }))}
          >
            <SelectTrigger data-testid="select-recurring-pattern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recurringPatterns.map((pattern) => (
                <SelectItem key={pattern.value} value={pattern.value}>
                  {pattern.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" data-testid="button-save-time-block">
          <Save className="w-4 h-4 mr-2" />
          {timeBlock ? 'Update' : 'Create'} Time Block
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}