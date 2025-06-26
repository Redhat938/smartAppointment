import { format, addMinutes, isSameDay, parseISO } from "date-fns";

export interface BookingProvider {
  id: number;
  bookingType: "token" | "timeslot" | "service" | "teleconsult";
  dailyCapacity: number;
  slotDuration: number;
  bufferTime: number;
  autoEta: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface BookingCalculation {
  availableSlots: TimeSlot[];
  estimatedWaitTime?: number;
  tokensInQueue?: number;
  dailyCapacityUsed: number;
  dailyCapacityRemaining: number;
}

// Calculate ETA for token-based bookings
export function calculateTokenETA(
  provider: BookingProvider,
  currentQueue: number,
  historicalAverageDuration?: number
): number {
  if (provider.autoEta && historicalAverageDuration) {
    return (historicalAverageDuration + provider.bufferTime) * currentQueue;
  }
  
  // Fallback to slot duration + buffer
  const estimatedDuration = provider.slotDuration + provider.bufferTime;
  return estimatedDuration * currentQueue;
}

// Generate available time slots for timeslot/service/teleconsult bookings
export function generateTimeSlots(
  provider: BookingProvider,
  date: Date,
  availability: Array<{ startTime: string; endTime: string; dayOfWeek: number }>,
  existingAppointments: Array<{ scheduledDate: string; startTime: string; endTime: string }>
): BookingCalculation {
  const dayOfWeek = date.getDay();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Find availability for this day
  const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek);
  
  if (dayAvailability.length === 0) {
    return {
      availableSlots: [],
      dailyCapacityUsed: 0,
      dailyCapacityRemaining: provider.dailyCapacity,
    };
  }

  // Count existing appointments for this date
  const existingAppointmentsToday = existingAppointments.filter(apt => 
    isSameDay(parseISO(apt.scheduledDate), date)
  );
  
  const dailyCapacityUsed = existingAppointmentsToday.length;
  const dailyCapacityRemaining = Math.max(0, provider.dailyCapacity - dailyCapacityUsed);

  const availableSlots: TimeSlot[] = [];
  
  // Generate slots for each availability period
  dayAvailability.forEach(period => {
    const startTime = parseTimeString(period.startTime);
    const endTime = parseTimeString(period.endTime);
    const totalSlotTime = provider.slotDuration + provider.bufferTime;
    
    let currentSlotStart = startTime;
    
    while (currentSlotStart + provider.slotDuration <= endTime) {
      const slotStartStr = formatTimeFromMinutes(currentSlotStart);
      const slotEndStr = formatTimeFromMinutes(currentSlotStart + provider.slotDuration);
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointmentsToday.some(apt => {
        const aptStart = parseTimeString(apt.startTime);
        const aptEnd = parseTimeString(apt.endTime);
        
        return (currentSlotStart < aptEnd && (currentSlotStart + provider.slotDuration) > aptStart);
      });
      
      // Check daily capacity
      const capacityExceeded = dailyCapacityUsed >= provider.dailyCapacity;
      
      availableSlots.push({
        time: slotStartStr,
        available: !hasConflict && !capacityExceeded,
        reason: hasConflict ? 'Slot occupied' : capacityExceeded ? 'Daily capacity reached' : undefined
      });
      
      currentSlotStart += totalSlotTime;
    }
  });

  return {
    availableSlots,
    dailyCapacityUsed,
    dailyCapacityRemaining,
  };
}

// Convert "HH:MM" to minutes since midnight
function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to "HH:MM"
function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if provider is at capacity warning threshold (80% by midday)
export function shouldShowCapacityWarning(
  provider: BookingProvider,
  dailyCapacityUsed: number
): boolean {
  const currentHour = new Date().getHours();
  const capacityUsagePercentage = (dailyCapacityUsed / provider.dailyCapacity) * 100;
  
  return currentHour >= 12 && capacityUsagePercentage >= 80;
}

// Calculate average duration from historical appointments
export function calculateAverageDuration(
  completedAppointments: Array<{ duration: number }>
): number {
  if (completedAppointments.length === 0) return 30; // Default fallback
  
  const totalDuration = completedAppointments.reduce((sum, apt) => sum + apt.duration, 0);
  return Math.round(totalDuration / completedAppointments.length);
}

// Validate booking settings
export function validateBookingSettings(settings: Partial<BookingProvider>): string[] {
  const errors: string[] = [];
  
  if (settings.dailyCapacity !== undefined && settings.dailyCapacity < 1) {
    errors.push("Daily capacity must be at least 1");
  }
  
  if (settings.slotDuration !== undefined && settings.slotDuration < 5) {
    errors.push("Slot duration must be at least 5 minutes");
  }
  
  if (settings.bufferTime !== undefined && settings.bufferTime < 0) {
    errors.push("Buffer time cannot be negative");
  }
  
  if (settings.dailyCapacity !== undefined && settings.dailyCapacity > 100) {
    errors.push("Daily capacity seems unreasonably high (max 100)");
  }
  
  if (settings.slotDuration !== undefined && settings.slotDuration > 480) {
    errors.push("Slot duration cannot exceed 8 hours");
  }
  
  return errors;
}