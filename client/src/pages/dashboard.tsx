import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import AppointmentCard from "@/components/appointment-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  Star,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  BarChart3
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: appointments = [], error: appointmentsError } = useQuery({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ["/api/appointments/upcoming"],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Appointment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update appointment status.",
        variant: "destructive",
      });
    },
  });

  if (appointmentsError && isUnauthorizedError(appointmentsError)) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const isProvider = user?.role === 'provider';
  
  // Calculate stats
  const pendingAppointments = appointments.filter((apt: any) => apt.status === 'pending');
  const confirmedAppointments = appointments.filter((apt: any) => apt.status === 'confirmed');
  const completedAppointments = appointments.filter((apt: any) => apt.status === 'completed');
  const todayAppointments = upcomingAppointments.filter((apt: any) => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.scheduledDate).toDateString();
    return today === aptDate;
  });

  const handleStatusUpdate = (appointmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isProvider ? 'Provider Dashboard' : 'My Dashboard'}
            </h1>
            <p className="text-slate-600">
              {isProvider 
                ? 'Manage your appointments and practice' 
                : 'Track your appointments and bookings'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {isProvider && (
              <Button onClick={() => setLocation('/provider-setup')} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
            <Button onClick={() => setLocation(isProvider ? '/provider-setup' : '/search')}>
              <Plus className="h-4 w-4 mr-2" />
              {isProvider ? 'Update Profile' : 'Book Appointment'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {isProvider ? 'Pending Requests' : 'Pending Appointments'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{pendingAppointments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Confirmed</p>
                  <p className="text-2xl font-bold text-slate-900">{confirmedAppointments.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today</p>
                  <p className="text-2xl font-bold text-slate-900">{todayAppointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {isProvider ? 'Total Completed' : 'Completed'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{completedAppointments.length}</p>
                </div>
                {isProvider ? (
                  <TrendingUp className="h-8 w-8 text-primary" />
                ) : (
                  <Star className="h-8 w-8 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-6">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming appointments</h3>
                    <p className="text-slate-600 mb-4">
                      {isProvider 
                        ? "Your schedule is clear for the coming days."
                        : "You don't have any upcoming appointments."
                      }
                    </p>
                    <Button onClick={() => setLocation(isProvider ? '/provider-setup' : '/search')}>
                      {isProvider ? 'Manage Availability' : 'Book Appointment'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        isProvider={isProvider}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No pending appointments</h3>
                    <p className="text-slate-600">All appointments have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        isProvider={isProvider}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {completedAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No completed appointments</h3>
                    <p className="text-slate-600">
                      {isProvider 
                        ? "You haven't completed any appointments yet."
                        : "You haven't had any appointments yet."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        isProvider={isProvider}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No appointments</h3>
                    <p className="text-slate-600">
                      {isProvider 
                        ? "You haven't received any appointment requests yet."
                        : "You haven't booked any appointments yet."
                      }
                    </p>
                    <Button 
                      onClick={() => setLocation(isProvider ? '/provider-setup' : '/search')}
                      className="mt-4"
                    >
                      {isProvider ? 'Set Up Profile' : 'Find Providers'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment: any) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        isProvider={isProvider}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
