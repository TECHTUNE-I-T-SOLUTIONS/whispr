'use client';

import React, { ReactNode } from 'react';
import ChroniclesHeader from '@/components/chronicles-header';
import { usePathname } from 'next/navigation';

interface ChroniclesLayoutProps {
  children: ReactNode;
}

export default function ChroniclesLayout({ children }: ChroniclesLayoutProps) {
  const pathname = usePathname();

  // Public pages (feed, explore) are handled by ConditionalLayout with normal Header
  const isPublicPage =
    pathname.startsWith('/chronicles/login') ||
    pathname.startsWith('/chronicles/signup') ||
    pathname.startsWith('/chronicles/onboarding') ||
    pathname.startsWith('/chronicles/verify') ||
    pathname.startsWith('/chronicles/forgot') ||
    pathname.startsWith('/chronicles/reset-password') ||
    pathname.startsWith('/chronicles/feed') ||
    pathname.startsWith('/chronicles/explore') ||
    pathname === '/chronicles' || pathname === '/chronicles/';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {!isPublicPage && <ChroniclesHeader />}
      <main>
        {children}
      </main>
    </div>
  );
}
