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
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  ArrowLeft,
  Star
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Booking() {
  const { providerId, serviceId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<"video" | "in_person">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceId || "");

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: [`/api/providers/${providerId}`],
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/providers/${providerId}/services`],
    enabled: !!providerId,
  });

  const selectedService = selectedServiceId ? services.find((s: any) => s.id === parseInt(selectedServiceId)) : null;

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
    // For token-based services, time selection is not required
    const requiresTimeSlot = selectedService?.bookingType !== 'token';
    
    // Check required fields based on service type
    if (!selectedDate || !selectedServiceId) {
      toast({
        title: "Missing Information",
        description: "Please select a date and service.",
        variant: "destructive",
      });
      return;
    }

    if (requiresTimeSlot && !selectedTime) {
      toast({
        title: "Time Required",
        description: "Please select a time slot for this appointment.",
        variant: "destructive",
      });
      return;
    }

    // For non-token services, title is required. For token services, auto-generate
    if (!title && selectedService?.bookingType !== 'token') {
      toast({
        title: "Title Required",
        description: "Please enter an appointment title.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedService) {
      toast({
        title: "Service Required",
        description: "Please select a service to book.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDate = new Date(`${selectedDate}T00:00:00`);
    const startTime = selectedTime || "00:00"; // Default for token-based
    const durationMinutes = selectedService.duration;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTimeHours = Math.floor((hours * 60 + minutes + durationMinutes) / 60);
    const endTimeMinutes = (hours * 60 + minutes + durationMinutes) % 60;
    const endTime = `${String(endTimeHours).padStart(2, '0')}:${String(endTimeMinutes).padStart(2, '0')}`;

    // Auto-generate title for token-based services
    const appointmentTitle = selectedService.bookingType === 'token'
      ? `${selectedService.name} - ${new Date(selectedDate).toLocaleDateString()}`
      : title;

    const bookingData = {
      providerId: parseInt(providerId!),
      serviceId: parseInt(selectedServiceId),
      title: appointmentTitle,
      description,
      scheduledDate: scheduledDate.toISOString(),
      startTime,
      endTime,
      duration: durationMinutes,
      type: appointmentType,
      amount: parseFloat(selectedService.price || "0"),
      currency: "₹",
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
                      {selectedService && (
                        <span className="text-lg font-bold text-slate-900">
                          ₹{selectedService.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicesLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-slate-600">No services available from this provider.</p>
                ) : (
                  <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    {services.map((service: any) => (
                      <div key={service.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                        <RadioGroupItem value={service.id.toString()} id={`service-${service.id}`} />
                        <Label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-slate-600">{service.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-slate-500">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {service.duration} min
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {service.bookingType}
                                </Badge>
                              </div>
                            </div>
                            <span className="font-bold text-lg">₹{service.price}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Appointment Details - Conditional based on service type */}
            {selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedService.bookingType === 'token' ? 'Visit Details' : 'Appointment Details'}
                  </CardTitle>
                  {selectedService.bookingType === 'token' && (
                    <p className="text-sm text-slate-600">
                      Your appointment title will be auto-generated. You can add notes about your visit.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedService.bookingType === 'token' ? (
                    // Token-based: Auto-generate title, optional description
                    <div>
                      <Label>Auto-generated Title</Label>
                      <div className="mt-2 p-3 bg-slate-50 rounded-md border">
                        <span className="text-slate-700">
                          {selectedService.name} - {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Title is automatically created based on service and date
                      </p>
                    </div>
                  ) : (
                    // Regular booking: Manual title
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
                  )}

                  <div>
                    <Label htmlFor="description">
                      {selectedService.bookingType === 'token' ? 'Visit Notes (Optional)' : 'Description (Optional)'}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={
                        selectedService.bookingType === 'token' 
                          ? "Any specific symptoms, concerns, or notes for your visit..."
                          : "Describe what you'd like to discuss or any specific questions you have..."
                      }
                      value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {selectedService && (
                  <div>
                    <Label>Service Duration</Label>
                    <div className="flex items-center space-x-2 mt-2 p-3 bg-slate-50 rounded-lg">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900 font-medium">{selectedService.duration} minutes</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedService.bookingType}
                      </Badge>
                    </div>
                  </div>
                )}

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
            )}

            {/* Date & Time Selection - Conditional based on service type */}
            {selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedService.bookingType === 'token' ? 'Select Date' : 'Select Date & Time'}
                  </CardTitle>
                  {selectedService.bookingType === 'token' && (
                    <p className="text-sm text-slate-600">
                      You'll receive a token number for queue-based service. No specific time slot required.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedService.bookingType === 'token' ? (
                    // Token-based booking: Only date selection
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <AvailabilityCalendar
                          providerId={parseInt(providerId!)}
                          selectedDate={selectedDate}
                          selectedTime=""
                          onDateSelect={setSelectedDate}
                          onTimeSelect={() => {}}
                          hideTimeSelection={true}
                        />
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Queue-based Service</h4>
                        <p className="text-sm text-blue-700">
                          • You'll get a token number upon arrival<br/>
                          • Service provided in order of arrival<br/>
                          • Estimated wait time will be provided
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Regular timeslot booking
                    <AvailabilityCalendar
                      providerId={parseInt(providerId!)}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onDateSelect={setSelectedDate}
                      onTimeSelect={setSelectedTime}
                    />
                  )}
                </CardContent>
              </Card>
            )}
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
                      <div className="text-sm text-slate-600">
                        {selectedService ? `${selectedService.duration} minutes` : "Select service"}
                      </div>
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

                {selectedService && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Service:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-medium">{selectedService.duration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="flex items-center">
                        ₹{selectedService.price}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleBooking}
                  disabled={
                    !selectedDate || 
                    !selectedService || 
                    (selectedService?.bookingType !== 'token' && !selectedTime) ||
                    (selectedService?.bookingType !== 'token' && !title) ||
                    bookingMutation.isPending
                  }
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
