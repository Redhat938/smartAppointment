import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";

interface AvailabilityCalendarProps {
  providerId: number;
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export default function AvailabilityCalendar({
  providerId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect
}: AvailabilityCalendarProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const { data: availability = [] } = useQuery<AvailabilitySlot[]>({
    queryKey: [`/api/providers/${providerId}/availability`],
    enabled: !!providerId,
  });

  // Generate time slots based on availability
  const generateTimeSlots = (date: Date): string[] => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(
      slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );

    if (dayAvailability.length === 0) return [];

    const slots: string[] = [];
    
    dayAvailability.forEach(({ startTime, endTime }) => {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      // Generate 30-minute slots (more suitable for appointments)
      let current = new Date(start);
      while (current < end) {
        const timeString = current.toTimeString().slice(0, 5);
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    return slots.sort();
  };

  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return availability.some(
      slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );
  };

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    if (date < startOfDay(new Date())) return true;
    
    // Disable dates more than 3 months in advance
    const maxDate = addDays(new Date(), 90);
    if (date > maxDate) return true;
    
    // Disable dates with no availability
    return !isDateAvailable(date);
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
  const timeSlots = selectedDateObj ? generateTimeSlots(selectedDateObj) : [];

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateDisabled(date)) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
      onTimeSelect(''); // Reset time selection when date changes
    }
  };

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
  };

  return (
    <div className="space-y-6 xl:grid xl:grid-cols-2 xl:gap-6 xl:space-y-0">
      {/* Calendar */}
      <Card className="xl:min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDateObj || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              month={calendarDate}
              onMonthChange={setCalendarDate}
              className="rounded-md border w-full"
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-slate-300 rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card className="xl:min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Please select a date first</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No available time slots for this date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                const isPast = selectedDateObj && 
                  isSameDay(selectedDateObj, new Date()) && 
                  new Date(`${format(new Date(), 'yyyy-MM-dd')}T${time}`) < new Date();

                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isPast}
                    onClick={() => handleTimeSelect(time)}
                    className={`availability-slot ${isSelected ? 'selected' : ''} ${isPast ? 'unavailable' : ''}`}
                  >
                    {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedDate && selectedTime && (
        <div className="lg:col-span-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Selected Appointment</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="secondary">
                      {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                    </Badge>
                    <Badge variant="secondary">
                      {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDateSelect('');
                    onTimeSelect('');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
