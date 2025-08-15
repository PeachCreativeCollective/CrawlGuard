import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  status: string;
  htmlLink: string;
}

export function useGoogleCalendar() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if Google Calendar is connected
  const { data: calendarStatus, isLoading: statusLoading, refetch: checkStatus } = useQuery<{ authenticated: boolean }>({
    queryKey: ['/api/calendar/status'],
    retry: false,
  });

  // Get upcoming calendar events
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events'],
    enabled: calendarStatus?.authenticated === true,
    retry: false,
  });

  // Initialize calendar connection
  const initCalendar = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/calendar/init');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/status'] });
      if (data.authenticated) {
        toast({
          title: "Calendar Connected",
          description: "Google Calendar is already connected and ready to use.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initialize Google Calendar connection.",
        variant: "destructive",
      });
    },
  });

  // Connect to Google Calendar
  const connectCalendar = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/calendar/auth-url');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        setIsConnecting(true);
        // Open Google OAuth in a popup window
        const popup = window.open(
          data.authUrl,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close or send a message
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            // Check status after popup closes
            setTimeout(() => {
              checkStatus();
            }, 1000);
          }
        }, 1000);

        // Listen for postMessage from popup (if implemented)
        window.addEventListener('message', (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
            handleAuthCallback(event.data.code);
          } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
            popup?.close();
            clearInterval(checkClosed);
            setIsConnecting(false);
            toast({
              title: "Authorization Failed",
              description: "Failed to authorize Google Calendar access.",
              variant: "destructive",
            });
          }
        });
      }
    },
    onError: (error: Error) => {
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate Google Calendar connection.",
        variant: "destructive",
      });
    },
  });

  // Handle OAuth callback
  const handleAuthCallback = async (code: string) => {
    try {
      const response = await apiRequest('POST', '/api/calendar/callback', { code });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Calendar Connected!",
          description: "Google Calendar has been successfully connected to your CrawlGuard account.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      }
    } catch (error: any) {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to complete Google Calendar authorization.",
        variant: "destructive",
      });
    }
  };

  // Create appointment in Google Calendar
  const createAppointmentEvent = useMutation({
    mutationFn: async (appointmentData: {
      clientName: string;
      email?: string;
      phone?: string;
      address?: string;
      service: string;
      appointmentDate: string;
      appointmentTime: string;
      notes?: string;
      estimatedValue?: number;
    }) => {
      const response = await apiRequest('POST', '/api/calendar/appointment', appointmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Calendar Event Created",
        description: "Appointment has been added to your Google Calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Calendar Error",
        description: error.message || "Failed to create calendar event.",
        variant: "destructive",
      });
    },
  });

  // Get events in date range
  const getEventsInRange = async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    try {
      const response = await apiRequest('GET', `/api/calendar/events/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return response.json();
    } catch (error) {
      console.error('Error fetching events in range:', error);
      return [];
    }
  };

  // Initialize on mount
  useEffect(() => {
    initCalendar.mutate();
  }, []);

  return {
    // Status
    isAuthenticated: calendarStatus?.authenticated === true,
    isConnecting,
    statusLoading,
    eventsLoading,

    // Data
    upcomingEvents: upcomingEvents || [],

    // Actions
    connectCalendar: () => connectCalendar.mutate(),
    createAppointmentEvent: createAppointmentEvent.mutate,
    getEventsInRange,
    checkStatus,

    // Loading states
    isConnectingMutation: connectCalendar.isPending,
    isCreatingEvent: createAppointmentEvent.isPending,
  };
}