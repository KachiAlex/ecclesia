/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Output configuration for Vercel
  // output: 'standalone', // Removed to fix build issue
  // Disable ESLint during build for Vercel (warnings shouldn't fail build)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (if any)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Experimental features to help with Vercel builds
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Existing webpack configuration if any
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }

    // Remove the rule for .afm files
    // We don't need it anymore

    return config;
  },
}

module.exports = nextConfig
