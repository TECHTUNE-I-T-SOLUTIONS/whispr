/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
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
    ],
  },
}

module.exports = nextConfig;
