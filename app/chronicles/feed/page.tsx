import ChroniclesFeed from '@/components/chronicles/ChroniclesFeed';

export const metadata = {
  title: 'Chronicles Feed - Whispr',
  description: 'Latest posts from creators and admins',
};

export default function FeedPage() {
  return <ChroniclesFeed />;
}