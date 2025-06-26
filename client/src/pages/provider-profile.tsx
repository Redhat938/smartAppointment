import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
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
  Award
} from "lucide-react";

export default function ProviderProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

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

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
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
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  ${provider.hourlyRate || '0'}
                </div>
                <div className="text-slate-600 mb-4">per hour</div>
                <Button onClick={handleBookAppointment} size="lg" className="w-full">
                  Book Appointment
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

                <h4 className="font-medium text-slate-900 mb-3">Meeting Options</h4>
                <div className="space-y-3">
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
              </CardContent>
            </Card>

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

            {/* Book Appointment CTA */}
            <Card className="bg-primary text-white">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-4 opacity-80" />
                <h3 className="font-semibold mb-2">Ready to book?</h3>
                <p className="text-sm opacity-90 mb-4">
                  Schedule your appointment with {displayName} today
                </p>
                <Button 
                  variant="secondary" 
                  onClick={handleBookAppointment}
                  className="w-full"
                >
                  Book Now - ${provider.hourlyRate}/hr
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
