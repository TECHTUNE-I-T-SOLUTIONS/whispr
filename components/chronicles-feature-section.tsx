'use client';

import { useState } from 'react';
import { ChroniclesFeatureModal } from '@/components/chronicles-feature-modal';
import { ChroniclesFeatureBanner } from '@/components/chronicles-feature-banner';

export function ChroniclesFeatureSection() {
  const [chroniclesModalOpen, setChroniclesModalOpen] = useState(false);

  return (
    <>
      <ChroniclesFeatureModal isOpen={chroniclesModalOpen} onClose={() => setChroniclesModalOpen(false)} />
      <ChroniclesFeatureBanner onOpenModal={() => setChroniclesModalOpen(true)} />
    </>
  );
}
