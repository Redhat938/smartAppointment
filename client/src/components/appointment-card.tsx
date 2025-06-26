import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Video, 
  MapPin, 
  Clock, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign
} from "lucide-react";

interface Appointment {
  id: number;
  title: string;
  description?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'video' | 'in_person';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meetingLink?: string;
  amount?: string;
  currency?: string;
  // Provider or User info depending on perspective
  provider?: {
    id: number;
    businessName?: string;
    firstName?: string;
    lastName?: string;
    specialty?: string;
    profileImageUrl?: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
}

interface AppointmentCardProps {
  appointment: Appointment;
  isProvider: boolean;
  onStatusUpdate?: (appointmentId: number, status: string) => void;
}

export default function AppointmentCard({ 
  appointment, 
  isProvider, 
  onStatusUpdate 
}: AppointmentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const otherParty = isProvider ? appointment.user : appointment.provider;
  const displayName = isProvider 
    ? `${otherParty?.firstName || ''} ${otherParty?.lastName || ''}`.trim() || otherParty?.email || 'User'
    : otherParty?.businessName || `${otherParty?.firstName || ''} ${otherParty?.lastName || ''}`.trim() || 'Provider';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isUpcoming = new Date(appointment.scheduledDate) > new Date();
  const canJoin = appointment.type === 'video' && 
                  appointment.status === 'confirmed' && 
                  appointment.meetingLink;

  const handleStatusUpdate = (newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(appointment.id, newStatus);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={otherParty?.profileImageUrl} />
              <AvatarFallback>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {appointment.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">
                    with {displayName}
                  </p>
                  {!isProvider && appointment.provider?.specialty && (
                    <p className="text-xs text-primary font-medium">
                      {appointment.provider.specialty}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.replace('_', ' ')}
                  </Badge>
                  {onStatusUpdate && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {appointment.status === 'pending' && isProvider && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate('confirmed')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </DropdownMenuItem>
                          </>
                        )}
                        {appointment.status === 'confirmed' && isUpcoming && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate('completed')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && !isProvider && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              
              {appointment.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {appointment.description}
                </p>
              )}
              
              <div className="flex items-center flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(appointment.scheduledDate)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </div>
                <div className="flex items-center">
                  {appointment.type === 'video' ? (
                    <Video className="h-4 w-4 mr-1" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-1" />
                  )}
                  {appointment.type === 'video' ? 'Video Call' : 'In-Person'}
                </div>
                {appointment.amount && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {appointment.amount} {appointment.currency || 'USD'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            {canJoin && (
              <Button size="sm" asChild>
                <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Join Call
                </a>
              </Button>
            )}
            {appointment.status === 'completed' && !isProvider && (
              <Button size="sm" variant="outline">
                Leave Review
              </Button>
            )}
          </div>
          
          <div className="text-xs text-slate-500">
            {appointment.duration} minutes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
