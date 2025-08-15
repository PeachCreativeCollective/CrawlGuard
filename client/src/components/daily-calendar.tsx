import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead } from '@shared/schema';

interface DailyCalendarProps {
  leads: Lead[];
  onDateClick?: (date: Date) => void;
  onLeadClick?: (lead: Lead) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function DailyCalendar({ leads, onDateClick, onLeadClick, onTimeSlotClick }: DailyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Time slots from 6 AM to 10 PM in 30-minute intervals
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push({ hour, minute: 0 });
    if (hour < 22) timeSlots.push({ hour, minute: 30 });
  }

  // Filter leads for current day
  const dayLeads = leads.filter((lead: Lead) => {
    if (!lead.scheduledDate) return false;
    const leadDate = new Date(lead.scheduledDate);
    return leadDate.toDateString() === currentDate.toDateString();
  }).sort((a, b) => {
    const dateA = new Date(a.scheduledDate!);
    const dateB = new Date(b.scheduledDate!);
    return dateA.getTime() - dateB.getTime();
  });

  // Get leads for specific time slot
  const getLeadsForTimeSlot = (hour: number, minute: number) => {
    return dayLeads.filter((lead: Lead) => {
      if (!lead.scheduledDate) return false;
      const leadDate = new Date(lead.scheduledDate);
      const leadHour = leadDate.getHours();
      const leadMinute = leadDate.getMinutes();
      
      // Check if appointment falls within this 30-minute slot
      return leadHour === hour && (
        (minute === 0 && leadMinute < 30) || 
        (minute === 30 && leadMinute >= 30)
      );
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastTime = (hour: number, minute: number) => {
    const now = new Date();
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    return slotTime < now;
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    if (now.toDateString() !== currentDate.toDateString()) return null;
    
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < 6 || hour > 22) return null;
    
    const slotIndex = (hour - 6) * 2 + (minute >= 30 ? 1 : 0);
    const minuteOffset = minute >= 30 ? minute - 30 : minute;
    const percentage = (minuteOffset / 30) * 100;
    
    return {
      slotIndex,
      percentage
    };
  };

  const currentTimePos = getCurrentTimePosition();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getServiceIcon = (service: string) => {
    // You can customize these based on your services
    switch (service) {
      case 'crawl-space-encapsulation': return '🏠';
      case 'vapor-barriers': return '🛡️';
      case 'mold-remediation': return '🧽';
      case 'basement-waterproofing': return '💧';
      case 'insulation-dehumidification': return '🌡️';
      case 'consultation': return '💬';
      default: return '🔧';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousDay}
            data-testid="button-previous-day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextDay}
            data-testid="button-next-day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            data-testid="button-today"
          >
            Today
          </Button>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold" data-testid="text-current-date">
            {formatDate(currentDate)}
          </h3>
          {isToday(currentDate) && (
            <Badge variant="secondary" className="mt-1">Today</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                {/* Current time indicator */}
                {currentTimePos && (
                  <div 
                    className="absolute left-0 right-0 z-10 border-t-2 border-red-500"
                    style={{
                      top: `${(currentTimePos.slotIndex * 60) + (currentTimePos.percentage * 0.6)}px`
                    }}
                  >
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-r">
                      Now
                    </div>
                  </div>
                )}

                {timeSlots.map((slot, index) => {
                  const slotLeads = getLeadsForTimeSlot(slot.hour, slot.minute);
                  const hasPastTime = isPastTime(slot.hour, slot.minute);
                  
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "h-15 border-b flex hover:bg-muted/30 transition-colors relative",
                        hasPastTime && "bg-muted/20"
                      )}
                      data-testid={`container-time-slot-${slot.hour}-${slot.minute}`}
                    >
                      {/* Time label */}
                      <div className="w-20 flex-shrink-0 border-r bg-muted/30 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTime(slot.hour, slot.minute)}
                        </span>
                      </div>

                      {/* Appointment area */}
                      <div 
                        className="flex-1 relative cursor-pointer p-2"
                        onClick={() => onTimeSlotClick?.(currentDate, slot.hour)}
                        data-testid={`button-time-slot-${slot.hour}-${slot.minute}`}
                      >
                        {slotLeads.length > 0 ? (
                          <div className="space-y-1">
                            {slotLeads.map((lead) => (
                              <div
                                key={lead.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLeadClick?.(lead);
                                }}
                                className="bg-primary/90 text-primary-foreground p-2 rounded cursor-pointer hover:bg-primary transition-colors"
                                data-testid={`card-appointment-${lead.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">{getServiceIcon(lead.service)}</span>
                                    <div>
                                      <div className="font-medium text-sm">{lead.name}</div>
                                      <div className="text-xs opacity-90">
                                        {new Date(lead.scheduledDate!).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className={cn("w-2 h-2 rounded-full", getPriorityColor(lead.priority))} />
                                </div>
                                <div className="text-xs mt-1 opacity-90 capitalize">
                                  {lead.service.replace(/-/g, ' ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Summary & Agenda */}
        <div className="space-y-4">
          {/* Day Summary */}
          <Card>
            <CardHeader>
              <h4 className="text-sm font-medium">Day Summary</h4>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Total Appointments:</span>
                  <strong>{dayLeads.length}</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-green-600">
                    {dayLeads.filter(l => l.status === 'completed').length}
                  </div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">
                    {dayLeads.filter(l => l.status === 'in-progress').length}
                  </div>
                  <div className="text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-600">
                    {dayLeads.filter(l => l.status === 'new').length}
                  </div>
                  <div className="text-muted-foreground">New</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agenda List */}
          <Card>
            <CardHeader>
              <h4 className="text-sm font-medium">Today's Agenda</h4>
            </CardHeader>
            <CardContent>
              {dayLeads.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No appointments scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {dayLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick?.(lead)}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      data-testid={`card-agenda-item-${lead.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{getServiceIcon(lead.service)}</span>
                            <span className="font-medium text-sm">{lead.name}</span>
                            <div className={cn("w-2 h-2 rounded-full", getPriorityColor(lead.priority))} />
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(lead.scheduledDate!).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.address && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{lead.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 capitalize">
                        {lead.service.replace(/-/g, ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}