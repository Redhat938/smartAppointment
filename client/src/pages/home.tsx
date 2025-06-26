import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Video, User, Briefcase } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: upcomingAppointments = [], error: appointmentsError } = useQuery({
    queryKey: ["/api/appointments/upcoming"],
    retry: false,
  });

  if (appointmentsError && isUnauthorizedError(appointmentsError)) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const isProvider = user?.role === 'provider';

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-slate-600">
            {isProvider 
              ? "Manage your appointments and grow your practice" 
              : "Book appointments with trusted professionals"
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/search')}>
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Find Providers</h3>
              <p className="text-sm text-slate-600">Browse and book with professionals</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/dashboard')}>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">My {isProvider ? 'Schedule' : 'Appointments'}</h3>
              <p className="text-sm text-slate-600">View and manage your {isProvider ? 'calendar' : 'bookings'}</p>
            </CardContent>
          </Card>

          {isProvider && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/provider-setup')}>
              <CardContent className="p-6 text-center">
                <Briefcase className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">Profile Setup</h3>
                <p className="text-sm text-slate-600">Complete your provider profile</p>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">History</h3>
              <p className="text-sm text-slate-600">View past appointments</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Appointments</span>
              <Button variant="outline" size="sm" onClick={() => setLocation('/dashboard')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming appointments</h3>
                <p className="text-slate-600 mb-4">
                  {isProvider 
                    ? "Your calendar is clear. Patients will be able to book with you once you set up your availability."
                    : "You don't have any appointments scheduled. Find a provider to get started."
                  }
                </p>
                <Button onClick={() => setLocation(isProvider ? '/provider-setup' : '/search')}>
                  {isProvider ? 'Set Up Availability' : 'Find Providers'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {appointment.type === 'video' ? (
                          <Video className="h-6 w-6 text-blue-600" />
                        ) : (
                          <MapPin className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{appointment.title}</h4>
                        <p className="text-sm text-slate-600">{appointment.description}</p>
                        <p className="text-sm text-blue-600">
                          {new Date(appointment.scheduledDate).toLocaleDateString()}, {appointment.startTime} - {appointment.type === 'video' ? 'Video Call' : 'In Person'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={`status-${appointment.status}`}>
                        {appointment.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {appointment.type === 'video' && appointment.status === 'confirmed' ? 'Join Call' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
