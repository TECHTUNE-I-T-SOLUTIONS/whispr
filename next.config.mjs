/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
<<<<<<< HEAD
    unoptimized: true,
  },
}

export default nextConfig
=======
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vkftywhuaxwbknlrymnr.supabase.co',
        pathname: '/storage/v1/object/public/media/**',
      },
    ],
  }
}

export default nextConfig
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
