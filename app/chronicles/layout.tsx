'use client';

import React, { ReactNode } from 'react';
import ChroniclesHeader from '@/components/chronicles-header';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ChroniclesLayoutProps {
  children: ReactNode;
}

export default function ChroniclesLayout({ children }: ChroniclesLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  // Public pages (feed, explore) are handled by ConditionalLayout with normal Header
  const isPublicPage =
    pathname.startsWith('/chronicles/login') ||
    pathname.startsWith('/chronicles/signup') ||
    pathname.startsWith('/chronicles/waitlist') ||
    pathname.startsWith('/chronicles/onboarding') ||
    pathname.startsWith('/chronicles/verify') ||
    pathname.startsWith('/chronicles/forgot') ||
    pathname.startsWith('/chronicles/reset-password') ||
    pathname.startsWith('/chronicles/feed') ||
    pathname.startsWith('/chronicles/explore') ||
    pathname === '/chronicles' || pathname === '/chronicles/';

  React.useEffect(() => {
    if (isPublicPage) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) {
          router.push('/chronicles/login');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        router.push('/chronicles/login');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [pathname, isPublicPage, router]);

  // Prevent unauthorized layout flicker
  if (isAuthenticated === null && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      {!isPublicPage && <ChroniclesHeader />}
      <main>
        {children}
      </main>
    </div>
  );
}
