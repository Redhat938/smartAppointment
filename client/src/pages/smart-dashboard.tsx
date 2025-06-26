import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import UserDashboard from "./user-dashboard";
import ProviderDashboard from "./provider-dashboard";

export default function SmartDashboard() {
  const { user, isLoading } = useAuth();

  // Check if user has a provider profile
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/my-profile"],
    queryFn: async () => {
      const response = await fetch('/api/providers/my-profile');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch provider profile: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  if (isLoading || providerLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If user has a provider profile, show provider dashboard
  // Otherwise, show user dashboard
  return provider ? <ProviderDashboard /> : <UserDashboard />;
}