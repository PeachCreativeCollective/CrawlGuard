import { useState } from 'react';
import { Calendar, Clock, ExternalLink, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar, type CalendarEvent } from '@/hooks/use-google-calendar';

export function GoogleCalendarIntegration() {
  const [showRecentEvents, setShowRecentEvents] = useState(false);
  const {
    isAuthenticated,
    isConnecting,
    statusLoading,
    eventsLoading,
    upcomingEvents,
    connectCalendar,
    isConnectingMutation,
  } = useGoogleCalendar();

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>Sync your appointments with Google Calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-crawlguard-primary" />
            <span className="ml-2 text-gray-600">Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Automatically sync your appointments with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">Connected</p>
                    <p className="text-sm text-gray-600">Google Calendar is connected and ready</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-700">Not Connected</p>
                    <p className="text-sm text-gray-600">Connect to automatically sync appointments</p>
                  </div>
                </>
              )}
            </div>
            
            {!isAuthenticated && (
              <Button
                onClick={connectCalendar}
                disabled={isConnecting || isConnectingMutation}
                className="bg-crawlguard-primary hover:bg-crawlguard-primary/90"
                data-testid="button-connect-calendar"
              >
                {isConnecting || isConnectingMutation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Connect Calendar
                  </>
                )}
              </Button>
            )}
          </div>

          {isAuthenticated && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  New appointments will automatically be added to your Google Calendar
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecentEvents(!showRecentEvents)}
                  data-testid="button-toggle-events"
                >
                  {showRecentEvents ? 'Hide' : 'Show'} Recent Events
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calendar Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Automatic Sync</h4>
                <p className="text-sm text-gray-600">
                  New appointments are automatically added to your calendar
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Email Invitations</h4>
                <p className="text-sm text-gray-600">
                  Clients automatically receive calendar invitations
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Smart Reminders</h4>
                <p className="text-sm text-gray-600">
                  Automatic reminders 24 hours and 30 minutes before
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Rich Details</h4>
                <p className="text-sm text-gray-600">
                  Includes client info, service type, and location
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events Card */}
      {isAuthenticated && showRecentEvents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Calendar Events
            </CardTitle>
            <CardDescription>
              Your next {upcomingEvents.length > 0 ? upcomingEvents.length : 'few'} appointments from Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-crawlguard-primary mr-2" />
                <span className="text-gray-600">Loading events...</span>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    data-testid={`calendar-event-${event.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.summary}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.start.dateTime), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start.dateTime), 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.htmlLink, '_blank')}
                        className="text-crawlguard-primary hover:text-crawlguard-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {upcomingEvents.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                      And {upcomingEvents.length - 5} more events...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming events found</p>
                <p className="text-sm text-gray-500">
                  Schedule some appointments to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}