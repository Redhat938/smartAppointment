import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Clock, Users, Timer, Zap } from "lucide-react";

interface BookingSettingsProps {
  provider: any;
}

export default function BookingSettings({ provider }: BookingSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    bookingType: provider.bookingType || "timeslot",
    dailyCapacity: provider.dailyCapacity || 20,
    slotDuration: provider.slotDuration || 30,
    bufferTime: provider.bufferTime || 10,
    autoEta: provider.autoEta || false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      return await apiRequest(`/api/providers/${provider.id}/booking-settings`, "PUT", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your booking settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", provider.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  const getBookingTypeDescription = (type: string) => {
    switch (type) {
      case "token":
        return "Queue-based system with estimated wait times";
      case "timeslot":
        return "Fixed time slots that customers can book";
      case "service":
        return "Service-based appointments with custom durations";
      case "teleconsult":
        return "Online consultation appointments";
      default:
        return "";
    }
  };

  const showCapacityWarning = () => {
    const currentHour = new Date().getHours();
    if (currentHour > 12) {
      // Mock calculation - in real app, you'd check actual bookings
      const estimatedUsage = Math.floor(Math.random() * 100);
      return estimatedUsage > 80;
    }
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Booking Settings
        </CardTitle>
        <CardDescription>
          Configure how customers can book appointments with you
        </CardDescription>
        {showCapacityWarning() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
            ⚠️ You've used over 80% of your daily capacity. Consider adjusting your settings for tomorrow.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Type */}
          <div className="space-y-2">
            <Label htmlFor="bookingType" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Booking Type
            </Label>
            <Select
              value={settings.bookingType}
              onValueChange={(value) => setSettings({ ...settings, bookingType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="token">Token Queue</SelectItem>
                <SelectItem value="timeslot">Time Slots</SelectItem>
                <SelectItem value="service">Service Booking</SelectItem>
                <SelectItem value="teleconsult">Teleconsultation</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              {getBookingTypeDescription(settings.bookingType)}
            </p>
          </div>

          {/* Daily Capacity */}
          <div className="space-y-2">
            <Label htmlFor="dailyCapacity" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daily Capacity
            </Label>
            <Input
              id="dailyCapacity"
              type="number"
              min="1"
              max="100"
              value={settings.dailyCapacity}
              onChange={(e) => setSettings({ ...settings, dailyCapacity: parseInt(e.target.value) || 1 })}
              placeholder="Maximum appointments per day"
            />
            <p className="text-sm text-slate-600">
              Maximum number of {settings.bookingType === "token" ? "tokens" : "appointments"} per day
            </p>
          </div>

          {/* Slot Duration - Hidden for token flow */}
          {settings.bookingType !== "token" && (
            <div className="space-y-2">
              <Label htmlFor="slotDuration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Slot Duration (minutes)
              </Label>
              <Input
                id="slotDuration"
                type="number"
                min="5"
                max="480"
                step="5"
                value={settings.slotDuration}
                onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) || 5 })}
                placeholder="Duration of each appointment"
              />
              <p className="text-sm text-slate-600">
                How long each appointment slot should be
              </p>
            </div>
          )}

          {/* Buffer Time */}
          <div className="space-y-2">
            <Label htmlFor="bufferTime" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Buffer Time (minutes)
            </Label>
            <Input
              id="bufferTime"
              type="number"
              min="0"
              max="60"
              step="5"
              value={settings.bufferTime}
              onChange={(e) => setSettings({ ...settings, bufferTime: parseInt(e.target.value) || 0 })}
              placeholder="Time between appointments"
            />
            <p className="text-sm text-slate-600">
              Break time between {settings.bookingType === "token" ? "tokens" : "appointments"} for preparation
            </p>
          </div>

          {/* Auto-ETA - Only for token flow */}
          {settings.bookingType === "token" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Auto-ETA Calculation
                  </Label>
                  <p className="text-sm text-slate-600">
                    Automatically calculate wait times based on historical data
                  </p>
                </div>
                <Switch
                  checked={settings.autoEta}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoEta: checked })}
                />
              </div>
              {settings.autoEta && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
                  ETAs will be calculated using your average appointment duration and current queue length.
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="flex-1"
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}