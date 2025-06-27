import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Navbar from "@/components/navbar";
import AvailabilityCalendar from "@/components/availability-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Star, 
  MapPin, 
  Clock, 
  Video, 
  User, 
  Check, 
  Calendar,
  DollarSign,
  MessageCircle,
  Award,
  X
} from "lucide-react";

export default function ProviderProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Booking state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentType, setAppointmentType] = useState<"video" | "in_person">("video");

  // Booking mutation
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
      // Reset form and hide booking
      setShowBookingForm(false);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedServiceId("");
      setTitle("");
      setDescription("");
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



  const { data: provider, isLoading } = useQuery({
    queryKey: [`/api/providers/${id}`],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/providers/${id}/reviews`],
    enabled: !!id,
  });

  const { data: availability = [] } = useQuery({
    queryKey: [`/api/providers/${id}/availability`],
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: [`/api/providers/${id}/services`],
    enabled: !!id,
  });

  // Get selected service (after services are loaded)
  const selectedService = services.find((s: any) => s.id.toString() === selectedServiceId);

  // Handle booking submission
  const handleBooking = () => {
    const requiresTimeSlot = selectedService?.bookingType !== 'token';
    
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
    const startTime = selectedTime || "00:00";
    const durationMinutes = selectedService.duration;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTimeHours = Math.floor((hours * 60 + minutes + durationMinutes) / 60);
    const endTimeMinutes = (hours * 60 + minutes + durationMinutes) % 60;
    const endTime = `${String(endTimeHours).padStart(2, '0')}:${String(endTimeMinutes).padStart(2, '0')}`;

    const appointmentTitle = selectedService.bookingType === 'token'
      ? `${selectedService.name} - ${new Date(selectedDate).toLocaleDateString()}`
      : title;

    const bookingData = {
      providerId: parseInt(id!),
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

  if (isLoading) {
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
            <p className="text-slate-600">The provider you're looking for doesn't exist or has been removed.</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleViewServices = () => {
    setLocation(`/booking/${provider.id}`);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const availabilityByDay = availability.reduce((acc: any, slot: any) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const displayName = provider.businessName || `${provider.firstName || ''} ${provider.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Provider Header */}
        <Card className="overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-blue-50 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={provider.profileImageUrl} />
                <AvatarFallback className="text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{displayName}</h1>
                <p className="text-xl text-primary font-semibold mb-2">{provider.specialty}</p>
                <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(provider.rating || 0) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-slate-600">
                      {provider.rating || '0.0'} ({provider.totalReviews || 0} reviews)
                    </span>
                  </div>
                  {provider.experience && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{provider.experience}+ years experience</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-slate-600">
                  {provider.location && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {provider.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Usually responds in {provider.responseTime || 60} minutes
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900 mb-4">
                  Service-Based Pricing
                </div>
                <Button onClick={handleViewServices} size="lg" className="w-full">
                  View Services & Book
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About {displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {provider.bio || "This provider hasn't added a bio yet."}
                </p>
                
                {provider.isVerified && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Award className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">Verified Professional</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services & Meeting Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Specialization</h4>
                    <Badge variant="secondary" className="text-sm">
                      {provider.specialty}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Category</h4>
                    <Badge variant="secondary" className="text-sm">
                      {provider.category}
                    </Badge>
                  </div>
                </div>

                {/* Services List */}
                <div className="mb-6">
                  <h4 className="font-medium text-slate-900 mb-3">Available Services</h4>
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No services configured yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-slate-900">{service.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {service.bookingType}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {service.duration} min
                              </span>
                              {service.returnVisitWaiver && (
                                <span className="text-green-600">Return visit waiver available</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-slate-900">₹{service.price}</div>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedServiceId(service.id.toString());
                                setShowBookingForm(true);
                                // Auto-select video/in-person based on provider capabilities
                                if (provider.isVideoCallEnabled) setAppointmentType("video");
                                else if (provider.isInPersonEnabled) setAppointmentType("in_person");
                              }}
                              className="mt-2"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meeting Options */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Meeting Options</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {provider.isVideoCallEnabled && (
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-slate-900">Video Consultation</div>
                          <div className="text-sm text-slate-600">Meet virtually from anywhere</div>
                        </div>
                      </div>
                    )}
                    {provider.isInPersonEnabled && (
                      <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-slate-900">In-Person Visit</div>
                          <div className="text-sm text-slate-600">Visit their office or location</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inline Booking Form */}
            {showBookingForm && selectedService && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Book {selectedService.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedService.bookingType === 'token' 
                        ? 'Select your preferred date for queue-based service'
                        : 'Choose your appointment details'
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedServiceId("");
                      setSelectedDate("");
                      setSelectedTime("");
                      setTitle("");
                      setDescription("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Details */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{selectedService.name}</h4>
                      <div className="text-xl font-bold text-primary">₹{selectedService.price}</div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {selectedService.duration} min
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedService.bookingType}
                      </Badge>
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      {selectedService.bookingType === 'token' ? 'Select Date' : 'Select Date & Time'}
                    </h4>
                    <AvailabilityCalendar
                      providerId={parseInt(id!)}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onDateSelect={setSelectedDate}
                      onTimeSelect={setSelectedTime}
                      hideTimeSelection={selectedService.bookingType === 'token'}
                    />
                  </div>

                  {/* Appointment Details */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      {selectedService.bookingType === 'token' ? 'Visit Details' : 'Appointment Details'}
                    </h4>
                    <div className="space-y-4">
                      {selectedService.bookingType === 'token' ? (
                        <div>
                          <Label>Auto-generated Title</Label>
                          <div className="mt-1 p-3 bg-slate-50 rounded-md border text-slate-700">
                            {selectedService.name} - {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="title">Appointment Title *</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Consultation, Follow-up, etc."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
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
                              ? "Any specific symptoms, concerns, or notes..."
                              : "Describe what you'd like to discuss..."
                          }
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
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
                    </div>
                  </div>

                  {/* Booking Summary & Action */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold">₹{selectedService.price}</span>
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="border-b border-slate-200 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(review.user?.firstName || 'Anonymous')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-slate-900">
                                {review.user?.firstName || 'Anonymous'}
                              </span>
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-600">{review.comment}</p>
                            <p className="text-sm text-slate-500 mt-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(availabilityByDay).length === 0 ? (
                  <p className="text-slate-600 text-sm">No availability set</p>
                ) : (
                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                      const daySlots = availabilityByDay[dayOfWeek] || [];
                      return (
                        <div key={dayOfWeek} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-900">
                            {dayNames[dayOfWeek]}
                          </span>
                          <div className="text-sm text-slate-600">
                            {daySlots.length === 0 ? (
                              <span className="text-slate-400">Unavailable</span>
                            ) : (
                              daySlots.map((slot: any, index: number) => (
                                <span key={index} className="inline-block mr-2">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Response Time:</span>
                    <span className="font-medium">{provider.responseTime || 60} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Completed Appointments:</span>
                    <span className="font-medium">{provider.completedAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Rebooking Rate:</span>
                    <span className="font-medium">{provider.rebookingRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services CTA */}
            <Card className="bg-primary text-white">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-4 opacity-80" />
                <h3 className="font-semibold mb-2">Ready to book?</h3>
                <p className="text-sm opacity-90 mb-4">
                  Choose from {services.length || 'various'} services offered by {displayName}
                </p>
                <Button 
                  variant="secondary" 
                  onClick={handleViewServices}
                  className="w-full"
                >
                  View Services & Book
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
