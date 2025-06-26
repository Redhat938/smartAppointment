import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/navbar";
import AvailabilityCalendar from "@/components/availability-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  ArrowLeft,
  Star,
  DollarSign
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Booking() {
  const { providerId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<"video" | "in_person">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: [`/api/providers/${providerId}`],
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/appointments", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been successfully scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setLocation("/dashboard");
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
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded mb-6"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center">
            <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Provider not found</h3>
            <p className="text-slate-600">Unable to load provider information.</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !title) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
    const startTime = selectedTime;
    const durationMinutes = parseInt(duration);
    const endTimeDate = new Date(scheduledDate.getTime() + durationMinutes * 60000);
    const endTime = endTimeDate.toTimeString().slice(0, 5);

    const bookingData = {
      providerId: parseInt(providerId!),
      title,
      description,
      scheduledDate,
      startTime,
      endTime,
      duration: durationMinutes,
      type: appointmentType,
      amount: parseFloat(provider.hourlyRate || "0"),
      currency: provider.currency || "USD",
    };

    bookingMutation.mutate(bookingData);
  };

  const displayName = provider.businessName || `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/provider/${providerId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Book Appointment</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={provider.profileImageUrl} />
                    <AvatarFallback className="text-lg">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{displayName}</h3>
                    <p className="text-primary font-medium">{provider.specialty}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-slate-600 ml-1">
                          {provider.rating || '0.0'} ({provider.totalReviews || 0} reviews)
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        ${provider.hourlyRate}/hr
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Appointment Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Consultation, Follow-up, etc."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you'd like to discuss or any specific questions you have..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Duration</Label>
                  <RadioGroup value={duration} onValueChange={setDuration} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="30" id="30min" />
                      <Label htmlFor="30min">30 minutes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="60" id="60min" />
                      <Label htmlFor="60min">60 minutes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="90" id="90min" />
                      <Label htmlFor="90min">90 minutes</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Meeting Type</Label>
                  <RadioGroup 
                    value={appointmentType} 
                    onValueChange={(value: "video" | "in_person") => setAppointmentType(value)}
                    className="mt-2"
                  >
                    {provider.isVideoCallEnabled && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video" className="flex items-center">
                          <Video className="h-4 w-4 mr-2" />
                          Video Call
                        </Label>
                      </div>
                    )}
                    {provider.isInPersonEnabled && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in_person" id="in_person" />
                        <Label htmlFor="in_person" className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          In-Person
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityCalendar
                  providerId={parseInt(providerId!)}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={setSelectedTime}
                />
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Select date"}
                      </div>
                      <div className="text-sm text-slate-600">Date</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {selectedTime || "Select time"}
                      </div>
                      <div className="text-sm text-slate-600">{duration} minutes</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {appointmentType === "video" ? (
                      <Video className="h-5 w-5 text-slate-400" />
                    ) : (
                      <MapPin className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <div className="font-medium text-slate-900">
                        {appointmentType === "video" ? "Video Call" : "In-Person"}
                      </div>
                      <div className="text-sm text-slate-600">Meeting type</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Duration:</span>
                    <span className="font-medium">{duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Rate:</span>
                    <span className="font-medium">${provider.hourlyRate}/hour</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="flex items-center">
                      <DollarSign className="h-5 w-5" />
                      {((parseFloat(provider.hourlyRate || "0") * parseInt(duration)) / 60).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !title || bookingMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  You'll receive a confirmation email after booking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
