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
}

module.exports = nextConfig

