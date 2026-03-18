const { cpSync, existsSync } = require('fs')
const { join } = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const prismaClientSrc = join(__dirname, 'node_modules/.prisma')
      const prismaClientDest = join(__dirname, '.next/server/.prisma')

      if (existsSync(prismaClientSrc)) {
        cpSync(prismaClientSrc, prismaClientDest, { recursive: true })
      }
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
        buffer: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig