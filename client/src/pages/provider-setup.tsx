import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Briefcase, 
  Calendar, 
  Clock,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const providerFormSchema = z.object({
  businessName: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  specialty: z.string().min(1, "Specialty is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  hourlyRate: z.string().min(1, "Hourly rate is required").transform((val) => val),
  experience: z.string().transform(Number).optional(),
  isVideoCallEnabled: z.boolean().default(true),
  isInPersonEnabled: z.boolean().default(true),
});

const availabilitySchema = z.object({
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean(),
});

type ProviderForm = z.infer<typeof providerFormSchema>;
type AvailabilitySlot = z.infer<typeof availabilitySchema>;

interface DaySchedule {
  dayOfWeek: number;
  isAvailable: boolean;
  timeSlots: { startTime: string; endTime: string; }[];
}

export default function ProviderSetup() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

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

    if (!isLoading && user && user.role !== 'provider') {
      // Update user role to provider first
      updateRoleMutation.mutate('provider');
    }
  }, [user, isLoading, toast]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: [`/api/providers/search`],
    queryFn: async () => {
      const response = await fetch(`/api/providers/search?userId=${user?.id}`);
      if (!response.ok) return null;
      const providers = await response.json();
      return providers.find((p: any) => p.userId === user?.id) || null;
    },
    enabled: !!user,
  });

  const { data: availability = [] } = useQuery({
    queryKey: [`/api/providers/${provider?.id}/availability`],
    enabled: !!provider?.id,
  });

  const form = useForm<ProviderForm>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      businessName: "",
      category: "",
      specialty: "",
      bio: "",
      location: "",
      address: "",
      phone: "",
      website: "",
      hourlyRate: "",
      experience: "",
      isVideoCallEnabled: true,
      isInPersonEnabled: true,
    },
  });

  // Initialize form with existing data
  useEffect(() => {
    if (provider) {
      form.reset({
        businessName: provider.businessName || "",
        category: provider.category || "",
        specialty: provider.specialty || "",
        bio: provider.bio || "",
        location: provider.location || "",
        address: provider.address || "",
        phone: provider.phone || "",
        website: provider.website || "",
        hourlyRate: provider.hourlyRate?.toString() || "",
        experience: provider.experience?.toString() || "",
        isVideoCallEnabled: provider.isVideoCallEnabled ?? true,
        isInPersonEnabled: provider.isInPersonEnabled ?? true,
      });
    }
  }, [provider, form]);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest("PATCH", "/api/auth/user/role", { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: ProviderForm) => {
      return await apiRequest("POST", "/api/providers", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Created",
        description: "Your provider profile has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setActiveTab("availability");
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
        title: "Error",
        description: error.message || "Failed to create provider profile.",
        variant: "destructive",
      });
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (data: ProviderForm) => {
      return await apiRequest("PUT", `/api/providers/${provider.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your provider profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
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
        title: "Error",
        description: error.message || "Failed to update provider profile.",
        variant: "destructive",
      });
    },
  });

  // Enhanced availability state with multiple time slots per day
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    if (availability.length > 0) {
      // Group availability records by day
      const groupedByDay = availability.reduce((acc: any, slot: any) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = {
            dayOfWeek: slot.dayOfWeek,
            isAvailable: true,
            timeSlots: []
          };
        }
        acc[slot.dayOfWeek].timeSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime
        });
        return acc;
      }, {});

      // Create schedule array for all 7 days
      const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => {
        return groupedByDay[dayOfWeek] || {
          dayOfWeek,
          isAvailable: false,
          timeSlots: [{ startTime: "09:00", endTime: "17:00" }]
        };
      });
      setWeeklySchedule(schedule);
    } else {
      // Initialize default schedule
      const defaultSchedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5, // Monday to Friday
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }]
      }));
      setWeeklySchedule(defaultSchedule);
    }
  }, [availability]);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (schedule: AvailabilitySlot[]) => {
      return await apiRequest("POST", `/api/providers/${provider.id}/availability`, schedule);
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your availability has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${provider?.id}/availability`] });
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
        title: "Error",
        description: error.message || "Failed to update availability.",
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: ProviderForm) => {
    if (provider) {
      updateProviderMutation.mutate(data);
    } else {
      createProviderMutation.mutate(data);
    }
  };

  const onSubmitAvailability = () => {
    if (!provider?.id) {
      toast({
        title: "Error",
        description: "Please create your profile first.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert DaySchedule format to flat AvailabilitySlot format
    const availabilitySlots: AvailabilitySlot[] = [];
    weeklySchedule.forEach(day => {
      if (day.isAvailable) {
        day.timeSlots.forEach(slot => {
          availabilitySlots.push({
            dayOfWeek: day.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: true
          });
        });
      }
    });
    
    updateAvailabilityMutation.mutate(availabilitySlots);
  };

  const updateDayAvailability = (dayOfWeek: number, isAvailable: boolean) => {
    setWeeklySchedule(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { ...day, isAvailable }
          : day
      )
    );
  };

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, index) => 
                index === slotIndex 
                  ? { ...slot, [field]: value }
                  : slot
              )
            }
          : day
      )
    );
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setWeeklySchedule(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? {
              ...day,
              timeSlots: [...day.timeSlots, { startTime: "09:00", endTime: "17:00" }]
            }
          : day
      )
    );
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setWeeklySchedule(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? {
              ...day,
              timeSlots: day.timeSlots.filter((_, index) => index !== slotIndex)
            }
          : day
      )
    );
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoading || providerLoading) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {provider ? 'Update Profile' : 'Provider Setup'}
            </h1>
            <p className="text-slate-600">
              {provider ? 'Update your professional profile and availability' : 'Complete your professional profile to start accepting appointments'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Profile
              {provider && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="availability" disabled={!provider} className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Availability
              {availability.length > 0 && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="businessName">Business Name (Optional)</Label>
                      <Input
                        id="businessName"
                        placeholder="Your business or practice name"
                        {...form.register("businessName")}
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={form.watch("category")} 
                        onValueChange={(value) => form.setValue("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.category.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialty">Specialty *</Label>
                      <Input
                        id="specialty"
                        placeholder="Your area of specialization"
                        {...form.register("specialty")}
                      />
                      {form.formState.errors.specialty && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.specialty.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="City, State"
                        {...form.register("location")}
                      />
                      {form.formState.errors.location && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.location.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (₹ INR) *</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        placeholder="1500"
                        {...form.register("hourlyRate")}
                      />
                      {form.formState.errors.hourlyRate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.hourlyRate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="10"
                        {...form.register("experience")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        {...form.register("phone")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        {...form.register("website")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, State 12345"
                      {...form.register("address")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Bio *</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell potential clients about your background, experience, and approach..."
                      rows={4}
                      {...form.register("bio")}
                    />
                    {form.formState.errors.bio && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Meeting Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="videoCall"
                        checked={form.watch("isVideoCallEnabled")}
                        onCheckedChange={(checked) => 
                          form.setValue("isVideoCallEnabled", checked as boolean)
                        }
                      />
                      <Label htmlFor="videoCall">Offer video consultations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inPerson"
                        checked={form.watch("isInPersonEnabled")}
                        onCheckedChange={(checked) => 
                          form.setValue("isInPersonEnabled", checked as boolean)
                        }
                      />
                      <Label htmlFor="inPerson">Offer in-person appointments</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="submit"
                      disabled={createProviderMutation.isPending || updateProviderMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createProviderMutation.isPending || updateProviderMutation.isPending
                        ? "Saving..."
                        : provider 
                        ? "Update Profile"
                        : "Create Profile"
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Weekly Availability
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Set your working hours for each day. You can add multiple time slots per day to accommodate breaks 
                  (e.g., 9:00 AM - 12:00 PM and 1:00 PM - 5:00 PM for a lunch break).
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {weeklySchedule.map((day) => (
                    <div key={day.dayOfWeek} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`day-${day.dayOfWeek}`}
                            checked={day.isAvailable}
                            onCheckedChange={(checked) => 
                              updateDayAvailability(day.dayOfWeek, checked as boolean)
                            }
                          />
                          <Label htmlFor={`day-${day.dayOfWeek}`} className="font-medium cursor-pointer text-lg">
                            {dayNames[day.dayOfWeek]}
                          </Label>
                        </div>
                        
                        {day.isAvailable && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(day.dayOfWeek)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Time Slot
                          </Button>
                        )}
                      </div>
                      
                      {day.isAvailable ? (
                        <div className="space-y-3 pl-6">
                          {day.timeSlots.map((slot, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium">From:</Label>
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => 
                                    updateTimeSlot(day.dayOfWeek, index, "startTime", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium">To:</Label>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => 
                                    updateTimeSlot(day.dayOfWeek, index, "endTime", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </div>
                              {day.timeSlots.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(day.dayOfWeek, index)}
                                  className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {day.timeSlots.length === 0 && (
                            <div className="text-slate-500 italic text-sm pl-3">
                              Click "Add Time Slot" to set your working hours
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pl-6 text-slate-500 italic">
                          Unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={onSubmitAvailability}
                    disabled={updateAvailabilityMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Card */}
        {provider && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  {provider.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">Profile Status</p>
                    <p className="text-sm text-slate-600">
                      {provider.isActive ? "Active - Accepting appointments" : "Inactive"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {provider.isVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">Verification</p>
                    <p className="text-sm text-slate-600">
                      {provider.isVerified ? "Verified professional" : "Verification pending"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
