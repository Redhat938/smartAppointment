import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import ProviderProfile from "@/pages/provider-profile";
import Booking from "@/pages/booking";
import Dashboard from "@/pages/dashboard";
import ProviderSetup from "@/pages/provider-setup";
import ProviderServices from "@/pages/provider-services";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/search" component={Search} />
          <Route path="/provider/:id" component={ProviderProfile} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/provider/:id" component={ProviderProfile} />
          <Route path="/booking/:providerId" component={Booking} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/provider-setup" component={ProviderSetup} />
          <Route path="/provider-services" component={ProviderServices} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
