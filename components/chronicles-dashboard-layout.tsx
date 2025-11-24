'use client';

import { useState, useEffect } from 'react';
import ChroniclesHeader from '@/components/chronicles-header';

interface ChroniclesDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ChroniclesDashboardLayout({
  children,
}: ChroniclesDashboardLayoutProps) {
  const [creatorName, setCreatorName] = useState('Creator');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      try {
        const res = await fetch('/api/chronicles/creator/stats');
        if (res.ok) {
          const data = await res.json();
          setCreatorName(data.penName || 'Creator');
          setProfileImage(data.profileImageUrl);
        }
      } catch (error) {
        console.error('Error fetching creator info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorInfo();
  }, []);

  return (
    <>
      <ChroniclesHeader creatorName={creatorName} profileImage={profileImage} />
      <div className="lg:ml-64 min-h-[calc(100vh-64px)]">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </>
  );
}
