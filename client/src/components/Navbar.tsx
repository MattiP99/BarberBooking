import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Menu, X, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.fullName) return "U";
    
    const names = user.fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Scissors className="h-8 w-8 text-amber-600" />
              <span className="ml-2 text-xl font-bold tracking-wider">BARBESHOP</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link href="/">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
                  Home
                </a>
              </Link>
              <Link href="/booking">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/booking" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
                  Book Now
                </a>
              </Link>
              {user && user.role !== 'client' && (
                <Link href="/dashboard">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/dashboard" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
                    Dashboard
                  </a>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {!user ? (
              <div className="flex space-x-2">
                <Link href="/login">
                  <a className="px-4 py-2 text-sm font-medium text-white hover:bg-primary-light rounded-md">
                    Login
                  </a>
                </Link>
                <Link href="/register">
                  <a className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700">
                    Register
                  </a>
                </Link>
              </div>
            ) : (
              <div className="ml-3 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 bg-amber-600">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-none">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'client' && (
                      <DropdownMenuItem asChild>
                        <Link href="/booking">
                          <a className="w-full cursor-pointer">My Appointments</a>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'client' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <a className="w-full cursor-pointer">Dashboard</a>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer" 
                      onClick={logout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-dark hover:text-white hover:bg-primary-light focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
              Home
            </a>
          </Link>
          <Link href="/booking">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/booking" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
              Book Now
            </a>
          </Link>
          {user && user.role !== 'client' && (
            <Link href="/dashboard">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/dashboard" ? "text-white bg-primary-light" : "text-neutral-dark hover:text-white hover:bg-primary-light"}`}>
                Dashboard
              </a>
            </Link>
          )}
        </div>
        
        {user && (
          <div className="pt-4 pb-3 border-t border-primary-light">
            <div className="flex items-center px-5">
              <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                <span className="text-white font-medium">{getUserInitials()}</span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user.fullName || user.username}</div>
                <div className="text-sm font-medium text-neutral-dark">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {user.role === 'client' && (
                <Link href="/booking">
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-neutral-dark hover:text-white hover:bg-primary-light">
                    My Appointments
                  </a>
                </Link>
              )}
              <button
                onClick={logout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-dark hover:text-white hover:bg-primary-light"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
