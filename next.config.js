/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ship smaller client bundles: only the icons/modules actually imported get
  // pulled in, instead of whole package barrels.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@radix-ui/react-icons",
      "sonner",
      "cmdk",
    ],
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Localhost development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '10.0.2.2',
      },
      {
        protocol: 'http',
        hostname: '10.0.2.2',
        port: '3000',
      },
      // Supabase storage
      {
        protocol: 'https',
        hostname: 'vkftywhuaxwbknlrymnr.supabase.co',
        pathname: '/storage/v1/object/public/media/**',
      },
      {
        protocol: 'https',
        hostname: 'vkftywhuaxwbknlrymnr.supabase.co',
        pathname: '/storage/v1/object/public/chronicles-profiles/**',
      },
      {
        protocol: 'https',
        hostname: 'vkftywhuaxwbknlrymnr.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      // Allow common image hosting services
      {
        protocol: 'https',
        hostname: 'wallpapers.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pics.unsplash.com',
      },
      // Wildcard for any HTTPS image in development
      {
        protocol: 'https',
        hostname: '*.com',
      },
      {
        protocol: 'https',
        hostname: '*.org',
      },
      {
        protocol: 'https',
        hostname: '*.net',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Let AI answer engines read and cite, but not train on, our pages.
          { key: 'Content-Usage', value: 'search=yes, ai-train=no' },
        ],
      },
      {
        source: '/data/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/:file(robots.txt|llms.txt|sitemap.xml)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' }],
      },
    ]
  },
}

module.exports = nextConfig;
