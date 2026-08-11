'use client';

import { useState, useEffect } from 'react';

interface PublicPostPageProps {
  initialPost?: Post | null
}

export default function PublicPostPage({ initialPost }: PublicPostPageProps) {
  import Link from 'next/link';
  import { useParams, useRouter } from 'next/navigation';
  import dynamic from ''
