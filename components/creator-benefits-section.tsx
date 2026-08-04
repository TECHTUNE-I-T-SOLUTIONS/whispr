'use client';

import { useState } from 'react';
import { CreatorBenefitsModal } from '@/components/creator-benefits-modal';
import { CreatorBenefitsBanner } from '@/components/creator-benefits-banner';

export function CreatorBenefitsSection() {
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  return (
    <>
      <CreatorBenefitsModal isOpen={creatorModalOpen} onClose={() => setCreatorModalOpen(false)} />
      <CreatorBenefitsBanner onOpenModal={() => setCreatorModalOpen(true)} />
    </>
  );
}
