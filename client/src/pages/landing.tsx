import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Shield, 
  Clock, 
  Check, 
  Star, 
  MapPin, 
  Video, 
  Users, 
  Briefcase,
  Heart,
  StethoscopeIcon as Stethoscope,
  Scale,
  GraduationCap,
  Bath,
  Laptop
} from "lucide-react";

const categoryIcons = {
  healthcare: Stethoscope,
  legal: Scale,
  education: GraduationCap,
  business: Briefcase,
  wellness: Bath,
  technology: Laptop,
};

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: featuredProviders = [] } = useQuery({
    queryKey: ["/api/providers/featured"],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCategory) params.set("category", searchCategory);
    if (searchLocation) params.set("location", searchLocation);
    setLocation(`/search?${params.toString()}`);
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-slate-900">BookEase</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-slate-600 hover:text-primary transition-colors">How it Works</a>
              <a href="#providers" className="text-slate-600 hover:text-primary transition-colors">For Providers</a>
              <a href="#features" className="text-slate-600 hover:text-primary transition-colors">Features</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin}>
                Sign In
              </Button>
              <Button onClick={handleLogin}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Book appointments with{" "}
                <span className="text-primary">professionals</span>{" "}
                effortlessly
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Connect with doctors, lawyers, tutors, and other service providers. Simple scheduling for everyone.
              </p>
              
              {/* Search Bar */}
              <Card className="p-6 mb-8 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      What service do you need?
                    </label>
                    <Select value={searchCategory} onValueChange={setSearchCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location
                    </label>
                    <Input
                      placeholder="Enter city or zip code"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSearch} className="px-8 py-3">
                      Search
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="flex items-center space-x-6 text-slate-600">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>Instant booking</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>Secure & verified</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional video consultation" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <Card className="absolute -bottom-6 -left-6 p-4 bg-white shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live appointments today</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Popular Categories</h2>
            <p className="text-xl text-slate-600">Find the right professional for your needs</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category: any) => {
              const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons] || Briefcase;
              return (
                <Card 
                  key={category.id}
                  className="category-card text-center p-6 cursor-pointer border-2 hover:border-primary"
                  onClick={() => setLocation(`/search?category=${category.id}`)}
                >
                  <CardContent className="p-0">
                    <div className={`w-16 h-16 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-8 w-8 text-${category.color}-600`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{category.name}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Providers</h2>
            <p className="text-xl text-slate-600">Highly rated professionals ready to help you</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProviders.slice(0, 3).map((provider: any) => (
              <Card key={provider.id} className="provider-card-hover overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {provider.businessName || `${provider.firstName} ${provider.lastName}`}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-slate-600 ml-1">
                        {provider.rating || "5.0"}
                      </span>
                    </div>
                  </div>
                  <p className="text-primary font-medium mb-2">{provider.specialty}</p>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{provider.bio}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {provider.location}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ${provider.hourlyRate}/hr
                    </span>
                  </div>
                  <div className="flex space-x-2 mb-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available Today
                    </Badge>
                    {provider.isVideoCallEnabled && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Video className="h-3 w-3 mr-1" />
                        Video Call
                      </Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => setLocation(`/provider/${provider.id}`)}
                  >
                    View Profile & Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setLocation("/search")}
            >
              View All Providers
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How BookEase Works</h2>
            <p className="text-xl text-slate-600">Simple, secure, and streamlined booking in three steps</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Search & Discover</h3>
              <p className="text-slate-600 leading-relaxed">
                Browse our verified professionals by category, location, and availability. Read reviews and compare services.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Book Instantly</h3>
              <p className="text-slate-600 leading-relaxed">
                Select your preferred date and time from their real-time availability. Choose between in-person or video appointments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Meet & Complete</h3>
              <p className="text-slate-600 leading-relaxed">
                Receive confirmation and reminders. Join your appointment seamlessly and manage everything from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Role CTA */}
      <section className="py-16 gradient-hero" id="providers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl font-bold mb-4">Join BookEase Today</h2>
            <p className="text-xl text-primary-foreground/80">Whether you're looking for services or providing them</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">I need services</h3>
              <p className="text-slate-600 mb-6">Find and book appointments with qualified professionals in your area.</p>
              <ul className="text-left text-slate-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Browse thousands of verified providers
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Real-time availability and instant booking
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Secure payment and appointment management
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Video and in-person options available
                </li>
              </ul>
              <Button className="w-full" size="lg" onClick={handleLogin}>
                Get Started as User
              </Button>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">I provide services</h3>
              <p className="text-slate-600 mb-6">Grow your practice with our powerful scheduling and client management tools.</p>
              <ul className="text-left text-slate-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Create your professional profile and showcase expertise
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Manage availability and accept bookings automatically
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Secure payment processing and client communication
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-3" />
                  Analytics and business insights dashboard
                </li>
              </ul>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600" size="lg" onClick={handleLogin}>
                Get Started as Provider
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Calendar className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold">BookEase</span>
              </div>
              <p className="text-slate-400 mb-6">
                Connecting service providers with clients through seamless appointment booking.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">For Users</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Browse Providers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Book Appointment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manage Bookings</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leave Reviews</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">For Providers</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Create Profile</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manage Calendar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accept Payments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400">© 2024 BookEase. All rights reserved.</p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-slate-400">Made with</span>
                <Heart className="h-4 w-4 text-red-400 fill-current" />
                <span className="text-slate-400">for better scheduling</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
