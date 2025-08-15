import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@shared/schema';

interface MonthlyCalendarProps {
  leads: Lead[];
  onDateClick?: (date: Date) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function MonthlyCalendar({ leads, onDateClick, onLeadClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  // Filter leads for current month
  const monthLeads = leads.filter((lead: Lead) => {
    if (!lead.scheduledDate) return false;
    const leadDate = new Date(lead.scheduledDate);
    return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
  });

  // Get leads for specific date
  const getLeadsForDate = (date: Date) => {
    return monthLeads.filter((lead: Lead) => {
      if (!lead.scheduledDate) return false;
      const leadDate = new Date(lead.scheduledDate);
      return leadDate.toDateString() === date.toDateString();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    return date < today && !isToday(date);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-crawlguard-dark">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="border-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-24 p-1"></div>;
            }

            const dayLeads = getLeadsForDate(date);
            const isCurrentDay = isToday(date);
            const isPast = isPastDate(date);

            return (
              <div
                key={index}
                className={`h-24 p-1 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
                  isCurrentDay ? 'bg-crawlguard-primary/10 border-crawlguard-primary' : ''
                } ${isPast ? 'bg-gray-50' : ''}`}
                onClick={() => onDateClick?.(date)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-crawlguard-primary font-bold' : 
                  isPast ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayLeads.slice(0, 2).map((lead: Lead, leadIndex: number) => (
                    <div
                      key={leadIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeadClick?.(lead);
                      }}
                      className="text-xs p-1 rounded bg-crawlguard-primary/20 text-crawlguard-primary hover:bg-crawlguard-primary/30 cursor-pointer transition-colors truncate"
                      title={`${lead.name} - ${lead.service}`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-2 w-2" />
                        <span className="truncate">
                          {new Date(lead.scheduledDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="truncate font-medium">{lead.name}</div>
                    </div>
                  ))}
                  
                  {dayLeads.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayLeads.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-crawlguard-primary/20 rounded"></div>
            <span>Scheduled Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-crawlguard-primary/10 border border-crawlguard-primary rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}