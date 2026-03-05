'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  LogOut,
  Home,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  User,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';



export interface ChroniclesHeaderProps {
  creatorName?: string;
  profileImage?: string;
}

export default function ChroniclesHeader({
  creatorName = 'Creator',
  profileImage,
}: ChroniclesHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [profile, setProfile] = useState<{ pen_name?: string; profile_image_url?: string } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch creator profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/chronicles/creator/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.creator || data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/chronicles/creator/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    { label: 'Feed', href: '/chronicles/feed', icon: Home },
    { label: 'Posts', href: '/chronicles/posts', icon: BookOpen },
    { label: 'Chains', href: '/chronicles/chains', icon: BarChart3 },
    { label: 'Dashboard', href: '/chronicles/dashboard', icon: TrendingUp },
    { label: 'Write Post', href: '/chronicles/write', icon: BookOpen },
    { label: 'Analytics', href: '/chronicles/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/chronicles/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call logout API and wait for response
      const response = await fetch('/api/chronicles/auth/logout', { 
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Close the modal
      setLogoutModalOpen(false);
      
      // Clear any client-side storage (if using localStorage/sessionStorage)
      localStorage.clear();
      sessionStorage.clear();

      // Force a hard page reload to the login page
      // Using window.location ensures the browser clears all cached data
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      // Still redirect even if logout API fails
      window.location.href = '/auth/login';
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Logo & Branding */}
          <Link href="/chronicles" className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-transparent rounded-full w-12 h-12 flex items-center justify-center">
              {mounted && (
                <Image
                  src={resolvedTheme === 'dark' ? '/lightlogo.png' : '/darklogo.png'}
                  alt="Chronicles Logo"
                  width={82}
                  height={82}
                  priority
                  className="object-contain"
                />
              )}
            </div>

            <span className="hidden sm:inline font-bold text-lg">Chronicles</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  isActive(item.href)
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button 
              onClick={() => router.push('/chronicles/notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mounted && (profile?.profile_image_url || profileImage) && (
                  <Image
                    src={profile?.profile_image_url || profileImage || ''}
                    alt={profile?.pen_name || creatorName}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                {!mounted || (!profile?.profile_image_url && !profileImage) && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(profile?.pen_name || creatorName).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                  {profile?.pen_name || creatorName}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <Link
                    href="/chronicles/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <Link
                    href="/chronicles/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  {profile?.pen_name && (
                    <Link
                      href={`/chronicles/portfolio/${profile.pen_name}`}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <BookOpen className="w-4 h-4" />
                      Portfolio
                    </Link>
                  )}
                  <hr className="my-1 border-gray-200 dark:border-slate-700" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                isActive(item.href)
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      {mounted && sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-16 z-20 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            ref={sidebarRef}
            className="w-64 h-full bg-white dark:bg-slate-900 shadow-lg animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    isActive(item.href)
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <hr className="my-2 border-gray-200 dark:border-slate-700" />
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-bold">Confirm Logout</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to log out? You'll need to sign in again to access your dashboard.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLogoutModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        :global(.animate-slideIn) {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
