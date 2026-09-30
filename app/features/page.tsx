'use client'

import { useState } from 'react'
import { 
  Shield, 
  FileText, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Share2, 
  Heart, 
  Zap,
  Lock,
  Globe,
  Clock,
  Target,
  BarChart3,
  Palette,
  Mic,
  Video,
  Radio,
  Calendar,
  Archive,
  Settings,
  Search,
  Filter,
  Download,
  ExternalLink,
  X,
  Bell,
  Briefcase,
  Gamepad2,
  Smartphone,
  Book
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Feature {
  id: string
  title: string
  description: string
  icon: any
  category: string
  location: string
  fullDescription: string
  benefits: string[]
  isNew?: boolean
  isComingSoon?: boolean
}

const features: Feature[] = [
  {
    id: 'copyright-protection',
    title: 'Content Copyright Protection',
    description: 'Advanced copyright protection with SHA-256 fingerprinting and verification system',
    icon: Shield,
    category: 'Content Protection',
    location: 'All published articles',
    fullDescription: 'Whispr provides enterprise-grade copyright protection for all published content. Every article receives a unique Article ID (WHP-XXXXXXXX) and SHA-256 fingerprint that proves originality and ownership.',
    benefits: [
      'Unique Article ID for every published piece',
      'SHA-256 content fingerprinting',
      'Version history tracking',
      'PDF certificate generation',
      'Public verification system',
      'AI crawler protection'
    ],
    isNew: true
  },
  {
    id: 'chronicles',
    title: 'Chronicles',
    description: 'Creator platform for writers to publish, engage, and monetize their content',
    icon: BookOpen,
    category: 'Creator Platform',
    location: '/chronicles',
    fullDescription: 'Chronicles is Whispr\'s creator platform that empowers writers to build their audience, publish content, and earn from their work. Features include analytics, monetization options, and community engagement tools.',
    benefits: [
      'Custom pen names and profiles',
      'Content analytics and insights',
      'Monetization opportunities',
      'Community engagement',
      'Writing chains and collaborations',
      'Creator program benefits'
    ]
  },
  {
    id: 'ai-studio',
    title: 'AI Studio',
    description: 'AI-powered content creation tools for enhanced writing and media generation',
    icon: Sparkles,
    category: 'AI Tools',
    location: '/admin/ai-studio',
    fullDescription: 'The AI Studio provides powerful AI tools for content creation, including text generation, image creation, text-to-speech, and video planning. All AI tools are designed to assist creators while maintaining content authenticity.',
    benefits: [
      'AI writing assistance',
      'Image generation',
      'Text-to-speech conversion',
      'Video content planning',
      'Content authenticity checking',
      'Smart suggestions'
    ]
  },
  {
    id: 'content-analytics',
    title: 'Content Analytics',
    description: 'Comprehensive analytics dashboard to track content performance and audience engagement',
    icon: BarChart3,
    category: 'Analytics',
    location: '/admin/analytics, /chronicles/analytics',
    fullDescription: 'Detailed analytics dashboards provide insights into content performance, audience demographics, engagement metrics, and growth trends. Track views, likes, comments, shares, and more.',
    benefits: [
      'Real-time performance metrics',
      'Audience demographics',
      'Engagement tracking',
      'Content performance comparison',
      'Growth trends analysis',
      'Export capabilities'
    ]
  },
  {
    id: 'comments-system',
    title: 'Comments System',
    description: 'Engaging comments system with reactions and moderation tools',
    icon: MessageSquare,
    category: 'Engagement',
    location: 'All article pages',
    fullDescription: 'A robust comments system that allows readers to engage with content. Features include nested comments, reactions, moderation tools, and spam protection to maintain quality discussions.',
    benefits: [
      'Nested comment threads',
      'Reaction system',
      'Moderation tools',
      'Spam protection',
      'Email notifications',
      'User authentication'
    ]
  },
  {
    id: 'sharing-social',
    title: 'Social Sharing',
    description: 'Easy sharing across multiple social media platforms',
    icon: Share2,
    category: 'Engagement',
    location: 'All article pages',
    fullDescription: 'Integrated social sharing buttons make it easy for readers to share content across platforms including Twitter, Facebook, LinkedIn, and more. Custom sharing messages and preview images enhance engagement.',
    benefits: [
      'Multi-platform sharing',
      'Custom sharing messages',
      'Preview image generation',
      'Share tracking analytics',
      'Mobile-optimized sharing',
      'Copy link functionality'
    ]
  },
  {
    id: 'reactions',
    title: 'Content Reactions',
    description: 'Reaction system for quick audience feedback and engagement',
    icon: Heart,
    category: 'Engagement',
    location: 'All article pages',
    fullDescription: 'A flexible reaction system that allows readers to quickly express their feelings about content. Multiple reaction types provide nuanced feedback beyond simple likes.',
    benefits: [
      'Multiple reaction types',
      'Quick engagement',
      'Reaction analytics',
      'User reaction history',
      'Mobile-friendly interface',
      'Real-time updates'
    ]
  },
  {
    id: 'stories',
    title: 'Stories',
    description: 'Long-form storytelling with chapter organization and reading tracking',
    icon: BookOpen,
    category: 'Content',
    location: '/stories',
    fullDescription: 'The Stories feature enables creators to publish long-form content organized into chapters. Readers can track their progress, bookmark their place, and receive notifications for new chapters.',
    benefits: [
      'Chapter organization',
      'Reading progress tracking',
      'Bookmark functionality',
      'Chapter notifications',
      'Series management',
      'Reading time estimates'
    ]
  },
  {
    id: 'media-player',
    title: 'Media Player',
    description: 'Integrated media player for audio, video, and interactive content',
    icon: Video,
    category: 'Media',
    location: 'All article pages',
    fullDescription: 'A versatile media player that supports audio files, video content, and interactive media. Features include custom controls, download options, and responsive design for all devices.',
    benefits: [
      'Audio playback',
      'Video streaming',
      'Custom controls',
      'Download options',
      'Responsive design',
      'Accessibility features'
    ]
  },
  {
    id: 'search',
    title: 'Smart Search',
    description: 'Advanced search functionality with filters and AI-powered results',
    icon: Search,
    category: 'Discovery',
    location: 'Global search bar',
    fullDescription: 'Powerful search capabilities help users discover relevant content. Features include full-text search, category filtering, date ranges, and AI-powered result ranking for better discovery.',
    benefits: [
      'Full-text search',
      'Category filters',
      'Date range filtering',
      'AI-powered ranking',
      'Search suggestions',
      'Recent searches'
    ]
  },
  {
    id: 'notifications',
    title: 'Push Notifications',
    description: 'Real-time push notifications for content updates and engagement',
    icon: Bell,
    category: 'Engagement',
    location: 'Browser notifications',
    fullDescription: 'Keep readers engaged with real-time push notifications for new content, comments, likes, and other relevant updates. Users can customize their notification preferences.',
    benefits: [
      'Real-time updates',
      'Customizable preferences',
      'Content notifications',
      'Engagement alerts',
      'Cross-device sync',
      'Quiet hours support'
    ]
  },
  {
    id: 'community',
    title: 'Community Features',
    description: 'Community building tools for creators and readers',
    icon: Users,
    category: 'Community',
    location: '/community',
    fullDescription: 'Build and engage with your community through dedicated features. Creator profiles, follower systems, community posts, and discussion forums help foster meaningful connections.',
    benefits: [
      'Creator profiles',
      'Follower system',
      'Community posts',
      'Discussion forums',
      'Direct messaging',
      'Community events'
    ]
  },
  {
    id: 'rss-feeds',
    description: 'RSS feed generation for content syndication',
    icon: Radio,
    category: 'Distribution',
    location: '/api/rss/articles',
    fullDescription: 'Automatic RSS feed generation enables content syndication to RSS readers and other platforms. Support for multiple feed types and custom categories.',
    benefits: [
      'Automatic feed generation',
      'Multiple feed types',
      'Category-specific feeds',
      'RSS reader compatibility',
      'Feed customization',
      'Health monitoring'
    ],
    title: ''
  },
  {
    id: 'spoken-words',
    title: 'Spoken Words',
    description: 'Audio content platform for spoken word and podcast content',
    icon: Mic,
    category: 'Media',
    location: '/admin/spoken-words',
    fullDescription: 'Dedicated platform for audio content including spoken word performances, podcasts, and audio narratives. Features include audio management, episode organization, and distribution tools.',
    benefits: [
      'Audio content management',
      'Episode organization',
      'Podcast distribution',
      'Audio analytics',
      'Playlist creation',
      'Embeddable players'
    ]
  },
  {
    id: 'job-opportunities',
    title: 'Job Opportunities',
    description: 'Job board and career opportunities for writers and creators',
    icon: Briefcase,
    category: 'Resources',
    location: '/opportunities',
    fullDescription: 'Curated job board featuring opportunities for writers, creators, and content professionals. Filter by type, location, and requirements to find the perfect opportunity.',
    benefits: [
      'Curated job listings',
      'Advanced filtering',
      'Application tracking',
      'Email alerts',
      'Company profiles',
      'Salary information'
    ]
  },
  {
    id: 'games',
    title: 'Educational Games',
    description: 'Interactive educational games for learning and engagement',
    icon: Gamepad2,
    category: 'Education',
    location: '/community',
    fullDescription: 'Interactive educational games make learning engaging and fun. Features include vocabulary games, writing challenges, and creative exercises to enhance skills.',
    benefits: [
      'Interactive learning',
      'Skill development',
      'Progress tracking',
      'Achievement system',
      'Leaderboards',
      'Custom challenges'
    ]
  },
  {
    id: 'theme-system',
    title: 'Theme System',
    description: 'Light and dark theme support with automatic switching',
    icon: Palette,
    category: 'Design',
    location: 'Global',
    fullDescription: 'Beautiful light and dark themes with automatic system preference detection. Smooth transitions and consistent design across all components.',
    benefits: [
      'Light/dark themes',
      'Auto system detection',
      'Smooth transitions',
      'Consistent design',
      'Custom color schemes',
      'Accessibility support'
    ]
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'Progressive web app with mobile-optimized experience',
    icon: Smartphone,
    category: 'Platform',
    location: 'Mobile devices',
    fullDescription: 'Mobile-optimized progressive web app provides native-like experience on mobile devices. Offline support, push notifications, and touch-optimized interface.',
    benefits: [
      'Mobile-optimized UI',
      'Offline support',
      'Push notifications',
      'Touch gestures',
      'App-like experience',
      'Installable PWA'
    ]
  },
  {
    id: 'books-publishing',
    title: 'Books Publishing',
    description: 'Premium e-book publishing platform for creators to publish, sell, and distribute their books',
    icon: Book,
    category: 'Creator Platform',
    location: '/books (Coming Soon)',
    fullDescription: 'A comprehensive e-book publishing platform that allows creators and admins to publish professional e-books with rich formatting. Authors can organize content into chapters, set pricing, offer free samples, and sell their work with secure payment processing. Readers can enjoy books online or download in PDF/EPUB formats.',
    benefits: [
      'Rich text editor with formatting',
      'Chapter organization and management',
      'Free sample reading for readers',
      'Secure payment processing',
      'PDF and EPUB download generation',
      'Reading progress tracking',
      'Reviews and ratings system',
      'Cover image upload and management',
      'Wishlist functionality',
      'Copyright protection for all books'
    ],
    isComingSoon: true
  }
]

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = ['All', ...Array.from(new Set(features.map(f => f.category)))]

  const filteredFeatures = selectedCategory === 'All' 
    ? features 
    : features.filter(f => f.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-black/80">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Whispr Features
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover all the powerful features Whispr offers for content creators, readers, and community members
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="text-sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map(feature => (
            <Dialog key={feature.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        {feature.isNew && (
                          <Badge className="bg-green-500 hover:bg-green-600">New</Badge>
                        )}
                        {feature.isComingSoon && (
                          <Badge className="bg-red-500 hover:bg-red-600">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {feature.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {feature.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    {feature.isNew && (
                      <Badge className="bg-green-500 hover:bg-green-600">New</Badge>
                    )}
                    {feature.isComingSoon && (
                      <Badge className="bg-red-500 hover:bg-red-600">Coming Soon</Badge>
                    )}
                  </div>
                  <DialogTitle className="text-2xl">{feature.title}</DialogTitle>
                  <DialogDescription className="text-base">
                    {feature.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Full Description */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Overview</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {feature.fullDescription}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      <strong>Location:</strong> {feature.location}
                    </span>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Key Benefits</h3>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{feature.category}</Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-12 bg-red-600/20 dark:bg-red-600/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">
              Have a Feature Request?
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              We're constantly improving Whispr. Share your ideas and feedback with our community.
            </p>
            <Button asChild>
              <a href="/feature-requests">Submit Feature Request</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
