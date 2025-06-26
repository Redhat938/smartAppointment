import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, Calendar, Clock, Users, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const serviceFormSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Price must be a valid positive number",
  }),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  bookingType: z.enum(["token", "timeslot", "service", "teleconsult"]),
  dailyCapacity: z.number().min(1, "Daily capacity must be at least 1"),
  bufferTime: z.number().min(0, "Buffer time cannot be negative"),
  availableDays: z.array(z.number()).min(1, "Select at least one day"),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }),
  paymentMode: z.enum(["online", "offline", "both"]),
  paymentPolicy: z.enum(["advance", "optional", "post_service"]),
  waiveFeeOnReturn: z.boolean(),
  waiverPeriodDays: z.number().min(0),
  walkInEnabled: z.boolean(),
  advancePaymentRequired: z.boolean(),
  isActive: z.boolean(),
});

type ServiceForm = z.infer<typeof serviceFormSchema>;

const BOOKING_TYPES = [
  { value: "token", label: "Token Queue", description: "First-come-first-serve with token numbers" },
  { value: "timeslot", label: "Time Slots", description: "Fixed appointment time slots" },
  { value: "service", label: "Service Booking", description: "Service-specific scheduling" },
  { value: "teleconsult", label: "Teleconsultation", description: "Online video consultation" },
];

const PAYMENT_MODES = [
  { value: "online", label: "Online Only" },
  { value: "offline", label: "Offline Only" },
  { value: "both", label: "Both Online & Offline" },
];

const PAYMENT_POLICIES = [
  { value: "advance", label: "Advance Payment Required" },
  { value: "optional", label: "Optional Payment" },
  { value: "post_service", label: "Payment After Service" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function ProviderServices() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Redirect if not a provider
  if (user && user.role !== 'provider') {
    setLocation('/dashboard');
    return null;
  }

  // Get provider services
  const { data: services, isLoading } = useQuery({
    queryKey: [`/api/providers/${user?.provider?.id}/services`],
    enabled: !!user?.provider?.id,
  });

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      duration: 30,
      bookingType: "timeslot",
      dailyCapacity: 10,
      bufferTime: 15,
      availableDays: [1, 2, 3, 4, 5],
      workingHours: { start: "09:00", end: "17:00" },
      paymentMode: "both",
      paymentPolicy: "advance",
      waiveFeeOnReturn: false,
      waiverPeriodDays: 30,
      walkInEnabled: true,
      advancePaymentRequired: false,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      const serviceData = {
        ...data,
        price: parseFloat(data.price),
        workingHours: JSON.stringify(data.workingHours),
        availableDays: JSON.stringify(data.availableDays),
      };
      return await apiRequest("POST", `/api/providers/${user?.provider?.id}/services`, serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${user?.provider?.id}/services`] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      const serviceData = {
        ...data,
        price: parseFloat(data.price),
        workingHours: JSON.stringify(data.workingHours),
        availableDays: JSON.stringify(data.availableDays),
      };
      return await apiRequest("PATCH", `/api/services/${editingService.id}`, serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${user?.provider?.id}/services`] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      return await apiRequest("DELETE", `/api/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${user?.provider?.id}/services`] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceForm) => {
    if (editingService) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration,
      bookingType: service.bookingType,
      dailyCapacity: service.dailyCapacity,
      bufferTime: service.bufferTime,
      availableDays: JSON.parse(service.availableDays || "[]"),
      workingHours: JSON.parse(service.workingHours || '{"start":"09:00","end":"17:00"}'),
      paymentMode: service.paymentMode,
      paymentPolicy: service.paymentPolicy,
      waiveFeeOnReturn: service.waiveFeeOnReturn,
      waiverPeriodDays: service.waiverPeriodDays,
      walkInEnabled: service.walkInEnabled,
      advancePaymentRequired: service.advancePaymentRequired,
      isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (serviceId: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteMutation.mutate(serviceId);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "token": return "outline";
      case "timeslot": return "default";
      case "service": return "secondary";
      case "teleconsult": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Services</h1>
          <p className="text-gray-600 mt-2">Create and manage your service offerings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingService(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Create New Service"}
              </DialogTitle>
              <DialogDescription>
                Configure your service details, pricing, and booking rules.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., General Consultation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your service..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bookingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BOOKING_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dailyCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bufferTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer Time (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_MODES.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Policy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_POLICIES.map((policy) => (
                              <SelectItem key={policy.value} value={policy.value}>
                                {policy.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="waiveFeeOnReturn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Waive Fee on Return Visit</FormLabel>
                          <FormDescription>
                            Waive consultation fee for returning patients within specified period
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("waiveFeeOnReturn") && (
                    <FormField
                      control={form.control}
                      name="waiverPeriodDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waiver Period (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="walkInEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Walk-ins</FormLabel>
                          <FormDescription>
                            Allow walk-in appointments for this service
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Service</FormLabel>
                          <FormDescription>
                            Service is available for booking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                     editingService ? "Update Service" : "Create Service"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {services && services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Start by creating your first service offering. Each service can have its own pricing,
              booking rules, and payment options.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service: any) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getBadgeVariant(service.bookingType)}>
                        {service.bookingType}
                      </Badge>
                      {!service.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-sm text-gray-600">{service.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">₹{service.price}</span>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}min
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {service.dailyCapacity}/day
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    {service.paymentMode}
                  </div>
                </div>

                {service.waiveFeeOnReturn && (
                  <div className="flex items-center text-sm text-green-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Fee waived for {service.waiverPeriodDays} days
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Buffer: {service.bufferTime}min</span>
                    <span>Walk-ins: {service.walkInEnabled ? "Yes" : "No"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}