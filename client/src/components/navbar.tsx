import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  User,
  Briefcase
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isProvider = user?.role === 'provider';

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User';

  const navigation = [
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  if (isProvider) {
    navigation.push({ name: 'Profile Setup', href: '/provider-setup', icon: Settings });
  }

  const NavItems = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`${mobile ? "w-full justify-start" : ""} ${
                isActive ? "bg-primary text-white" : ""
              }`}
              onClick={onItemClick}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Calendar className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-slate-900">BookEase</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-4">
              <NavItems />
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Role Badge */}
                <Badge variant={isProvider ? "default" : "secondary"} className="hidden sm:inline-flex">
                  {isProvider ? (
                    <>
                      <Briefcase className="h-3 w-3 mr-1" />
                      Provider
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      User
                    </>
                  )}
                </Badge>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl} />
                        <AvatarFallback>
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{displayName}</p>
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isProvider && (
                      <DropdownMenuItem asChild>
                        <Link href="/provider-setup">
                          <Settings className="mr-2 h-4 w-4" />
                          Profile Setup
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden" size="sm">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                    <div className="flex flex-col space-y-4 mt-8">
                      <div className="flex items-center space-x-3 pb-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.profileImageUrl} />
                          <AvatarFallback>
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <Badge variant={isProvider ? "default" : "secondary"} className="text-xs">
                            {isProvider ? "Provider" : "User"}
                          </Badge>
                        </div>
                      </div>
                      <NavItems mobile onItemClick={() => setMobileMenuOpen(false)} />
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <Button onClick={() => window.location.href = "/api/login"}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
