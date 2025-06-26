import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Video, Calendar } from "lucide-react";

interface Provider {
  id: number;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  specialty: string;
  bio?: string;
  location?: string;
  hourlyRate?: string;
  rating?: string;
  totalReviews?: number;
  isVideoCallEnabled?: boolean;
  isInPersonEnabled?: boolean;
  experience?: number;
  responseTime?: number;
}

interface ProviderCardProps {
  provider: Provider;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const displayName = provider.businessName || 
    `${provider.firstName || ''} ${provider.lastName || ''}`.trim() ||
    'Professional';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const rating = parseFloat(provider.rating || '0');
  const isAvailableToday = true; // This could be calculated based on availability data

  return (
    <Card className="provider-card-hover overflow-hidden h-full">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Provider Header */}
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={provider.profileImageUrl} />
            <AvatarFallback className="text-lg">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {displayName}
              </h3>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-slate-600">
                  {rating > 0 ? rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
            <p className="text-primary font-medium text-sm mb-1">{provider.specialty}</p>
            {provider.experience && (
              <p className="text-slate-500 text-xs">
                {provider.experience}+ years experience
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">
          {provider.bio || "Professional service provider ready to help you."}
        </p>

        {/* Location and Rate */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">{provider.location || 'Location not specified'}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">
              ${provider.hourlyRate || '0'}
            </span>
            <span className="text-slate-600 text-sm">/hr</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isAvailableToday && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              Available Today
            </Badge>
          )}
          {provider.isVideoCallEnabled && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <Video className="h-3 w-3 mr-1" />
              Video Call
            </Badge>
          )}
          {provider.isInPersonEnabled && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              In-Person
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-500">Reviews</p>
            <p className="font-semibold text-slate-900">
              {provider.totalReviews || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Response</p>
            <p className="font-semibold text-slate-900">
              {provider.responseTime || 60}m
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/provider/${provider.id}`}>
          <Button className="w-full">
            View Profile & Book
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
