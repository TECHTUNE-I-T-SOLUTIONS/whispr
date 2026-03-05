import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { Award, Flame, PenTool, Share2, Heart } from 'lucide-react';

interface CreatorProfile {
  id: string;
  pen_name: string;
  bio: string;
  profile_image_url?: string;
  social_links?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  content_type: string;
  preferred_categories: string[];
  status: string;
  avatar_url?: string;
  total_posts: number;
  total_followers: number;
  total_engagement: number;
  points: number;
  badges: string[];
  streak_count: number;
  longest_streak: number;
  total_poems: number;
  total_blog_posts: number;
  total_shares: number;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  post_type: string;
  published_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
}

export async function generateMetadata({ params }: { params: Promise<{ pen_name: string }> }): Promise<Metadata> {
  const { pen_name } = await params;
  const supabase = createSupabaseServer();
  // use case-insensitive match since Next may normalize params to lowercase
  console.log('fetching profile for', pen_name);
  const { data: creator } = await supabase
    .from('chronicles_creators')
    .select('pen_name, bio')
    .ilike('pen_name', pen_name)
    .single();

  if (!creator) return { title: 'Creator not found' };
  return { title: `${creator.pen_name} – Whispr` };
}

export default async function UserPage({ params }: { params: Promise<{ pen_name: string }> }) {
  const { pen_name } = await params;
  const supabase = createSupabaseServer();

  // fetch creator by pen_name with all available fields
  const { data: creator, error: creatorError } = await supabase
    .from('chronicles_creators')
    .select(
      `id, pen_name, bio, profile_image_url, avatar_url, total_posts, total_followers, total_engagement, 
       points, badges, streak_count, longest_streak, total_poems, total_blog_posts, total_shares, 
       role, is_verified, created_at, social_links, content_type, preferred_categories, status`
    )
    .ilike('pen_name', pen_name)
    .single();

  console.log('Portfolio fetch - pen_name:', pen_name, 'creator:', creator, 'error:', creatorError);

  // chains created by this user
  const { data: chainsCreated } = await supabase
    .from('chronicles_writing_chains')
    .select('id,title')
    .eq('created_by', creator?.id);

  // chains entries contributed
  const { data: chainsContrib } = await supabase
    .from('chronicles_chain_entries')
    .select('chain:chronicles_writing_chains(id,title)')
    .eq('added_by', creator?.id);

  // fetch creator achievements
  const { data: achievements } = await supabase
    .from('chronicles_creator_achievements')
    .select(`
      achievement:chronicles_achievements(id, name, description, icon_url, points_reward)
    `)
    .eq('creator_id', creator?.id)
    .limit(10);

  if (creatorError || !creator) {
    console.error('Creator not found or error:', { creatorError, creator });
    notFound();
  }

  const { data: posts } = await supabase
    .from('chronicles_posts')
    .select('id,title,slug,excerpt,post_type,published_at,likes_count,comments_count,views_count')
    .eq('creator_id', creator.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* cover */}
      <div className="relative h-28 bg-gradient-to-r from-gray-400 via-red-400 to-red-600"></div>
      
      <div className="max-w-5xl mx-auto px-4 mt-20 py-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-20 mb-8">
          <div className="flex-shrink-0">
            {creator.profile_image_url || creator.avatar_url ? (
              <Image
                src={creator.profile_image_url || creator.avatar_url || ''}
                alt={creator.pen_name}
                width={160}
                height={160}
                className="rounded-full border-4 border-white dark:border-slate-900 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white dark:border-slate-900 shadow-lg">
                {creator.pen_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {creator.pen_name}
              </h1>
              {creator.is_verified && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ Verified
                </span>
              )}
              {creator.role === 'creator' && (
                <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Creator
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Joined {new Date(creator.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {creator.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl">
                {creator.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>{creator.social_links?.twitter && `🐦 Twitter: @${creator.social_links.twitter}`}</span><br />
              <span>{creator.social_links?.instagram && `📸 Instagram: @${creator.social_links.instagram}`}</span>
              <span>{creator.social_links?.website && `🌐 Website: ${creator.social_links.website}`}</span>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-1">
                {creator.content_type === 'poet' ? '✨ Poet' : creator.content_type === 'blogger' ? '📝 Blogger' : creator.content_type === 'both' ? '✨📝 Poet & Blogger' : 'Creator'}
              </p>
              {creator.preferred_categories && creator.preferred_categories.length > 0 && (
                <p className="flex items-center gap-1">
                  🎯 {creator.preferred_categories.join(', ')}
                </p>
              )}
              <p className="flex items-center gap-1">
                {creator.status === 'active' ? '✅ Active' : creator.status === 'inactive' ? '⛔ Inactive' : creator.status === 'banned' ? '🚫 Banned' : 'Status unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">{creator.total_posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
            <div className="text-xs text-gray-500 mt-1">{creator.total_blog_posts} blogs, {creator.total_poems} poems</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-pink-600">{creator.total_followers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-orange-600">{creator.total_engagement}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-xl font-bold text-red-600">{creator.streak_count}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements & Badges */}
        {(creator.badges && creator.badges.length > 0) || (achievements && achievements.length > 0) ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements & Badges</h2>
            </div>
            {creator.badges && creator.badges.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.badges?.map((badge: string, idx: number) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm"
                    >
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {achievements && achievements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Unlocked Achievements</h3>
                <div className="space-y-2">
                  {achievements.map((ach: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      ✨ {ach.achievement?.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Chains Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {chainsCreated && chainsCreated.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
              <div className="flex items-center gap-2 mb-4">
                <PenTool className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Writing Chains Created</h3>
              </div>
              <ul className="space-y-2">
                {chainsCreated.map((c: any) => (
                  <li key={c.id}>
                    <Link 
                      href={`/chronicles/chains/${c.id}`} 
                      className="text-purple-600 hover:text-purple-700 dark:hover:text-purple-400 hover:underline font-medium"
                    >
                      → {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {chainsContrib && chainsContrib.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contributed to Chains</h3>
              </div>
              <ul className="space-y-2">
                {chainsContrib.map((c: any, idx: number) => (
                  <li key={idx}>
                    <Link 
                      href={`/chronicles/chains/${c.chain.id}`} 
                      className="text-pink-600 hover:text-pink-700 dark:hover:text-pink-400 hover:underline font-medium"
                    >
                      → {c.chain.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Posts Section */}
        {posts && posts.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Publications
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/chronicles/${post.slug}`}
                  className="group block p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg hover:border-l-4 hover:border-purple-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          post.post_type === 'poem' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {post.post_type === 'poem' ? '✨ Poem' : '📝 Blog'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {post.excerpt && (
                        <p className="mt-2 text-gray-700 dark:text-gray-300 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center shadow">
            <p className="text-gray-600 dark:text-gray-400">No published posts yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
