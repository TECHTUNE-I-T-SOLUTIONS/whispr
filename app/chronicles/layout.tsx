'use client';

import React, { ReactNode } from 'react';
import ChroniclesHeader from '@/components/chronicles-header';

interface ChroniclesLayoutProps {
  children: ReactNode;
}

export default function ChroniclesLayout({ children }: ChroniclesLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ChroniclesHeader />
      <main>
        {children}
      </main>
    </div>
  );
}
