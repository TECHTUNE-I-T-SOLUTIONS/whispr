import ChroniclesPage from '@/components/chronicles/ChroniclesPage';

export const metadata = {
  alternates: { canonical: 'https://whisprwords.com/chronicles' },
  title: 'Chronicles — Creator Portfolios & Serialized Writing',
  description:
    'Whispr Chronicles is the creator side of Whispr: pen-name portfolios, serialized stories, chains of linked entries and analytics for writers who publish regularly.',
  openGraph: {
    title: 'Chronicles — Creator Portfolios & Serialized Writing',
    description:
      'Pen-name portfolios, serialized stories and analytics for writers who publish regularly on Whispr.',
    url: 'https://whisprwords.com/chronicles',
    siteName: 'Whispr',
    type: 'website',
  },
}

export default function Page() {
  return <ChroniclesPage />
}
