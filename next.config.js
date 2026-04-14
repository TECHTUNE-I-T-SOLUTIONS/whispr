/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
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
}

module.exports = nextConfig;
