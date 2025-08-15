import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead } from '@shared/schema';

interface WeeklyCalendarProps {
  leads: Lead[];
  onDateClick?: (date: Date) => void;
  onLeadClick?: (lead: Lead) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function WeeklyCalendar({ leads, onDateClick, onLeadClick, onTimeSlotClick }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get start of the week (Sunday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Time slots from 6 AM to 10 PM
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 6);

  // Filter leads for current week
  const weekLeads = leads.filter((lead: Lead) => {
    if (!lead.scheduledDate) return false;
    const leadDate = new Date(lead.scheduledDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return leadDate >= startOfWeek && leadDate <= endOfWeek;
  });

  // Get leads for specific date and hour
  const getLeadsForDateTime = (date: Date, hour?: number) => {
    return weekLeads.filter((lead: Lead) => {
      if (!lead.scheduledDate) return false;
      const leadDate = new Date(lead.scheduledDate);
      const sameDay = leadDate.toDateString() === date.toDateString();
      if (hour !== undefined) {
        return sameDay && leadDate.getHours() === hour;
      }
      return sameDay;
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastTime = (date: Date, hour: number) => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousWeek}
            data-testid="button-previous-week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextWeek}
            data-testid="button-next-week"
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
        <h3 className="text-lg font-semibold" data-testid="text-week-range">
          {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
          {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
      </div>

      {/* Weekly Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 min-h-[600px]">
            {/* Time column */}
            <div className="border-r bg-muted/30">
              <div className="h-16 border-b flex items-center justify-center font-medium text-sm">
                Time
              </div>
              {timeSlots.map((hour) => (
                <div 
                  key={hour} 
                  className="h-16 border-b flex items-center justify-center text-xs text-muted-foreground px-2"
                  data-testid={`text-time-slot-${hour}`}
                >
                  {formatTime(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((date, dayIndex) => (
              <div key={dayIndex} className="border-r last:border-r-0">
                {/* Day header */}
                <div 
                  className={cn(
                    "h-16 border-b flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                    isToday(date) && "bg-primary/10 border-primary/20"
                  )}
                  onClick={() => onDateClick?.(date)}
                  data-testid={`button-day-${dayIndex}`}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary"
                  )}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    isToday(date) && "text-primary"
                  )}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Time slots */}
                {timeSlots.map((hour) => {
                  const slotLeads = getLeadsForDateTime(date, hour);
                  const hasPastTime = isPastTime(date, hour);
                  
                  return (
                    <div 
                      key={hour} 
                      className={cn(
                        "h-16 border-b relative cursor-pointer hover:bg-muted/30 transition-colors",
                        hasPastTime && "bg-muted/20"
                      )}
                      onClick={() => onTimeSlotClick?.(date, hour)}
                      data-testid={`button-time-slot-${dayIndex}-${hour}`}
                    >
                      {slotLeads.length > 0 ? (
                        <div className="p-1 space-y-1">
                          {slotLeads.map((lead) => (
                            <div
                              key={lead.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onLeadClick?.(lead);
                              }}
                              className="bg-primary/90 text-primary-foreground text-xs p-1.5 rounded cursor-pointer hover:bg-primary transition-colors truncate"
                              data-testid={`card-appointment-${lead.id}`}
                            >
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span className="font-medium truncate">{lead.name}</span>
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(lead.scheduledDate!).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </span>
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
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Week Summary */}
      <Card>
        <CardHeader>
          <h4 className="text-sm font-medium">Week Summary</h4>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span>Total Appointments: <strong>{weekLeads.length}</strong></span>
            <div className="flex space-x-4">
              <span>New: <strong>{weekLeads.filter(l => l.status === 'new').length}</strong></span>
              <span>In Progress: <strong>{weekLeads.filter(l => l.status === 'in-progress').length}</strong></span>
              <span>Completed: <strong>{weekLeads.filter(l => l.status === 'completed').length}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}