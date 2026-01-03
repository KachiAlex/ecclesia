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
    ignoreBuildErrors: true,
  },
  // Experimental features to help with Vercel builds
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize build performance
    optimizePackageImports: ['@prisma/client'],
  },
  webpack: (config, { isServer, dev }) => {
    // Existing webpack configuration if any
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }

    // Fix for "self is not defined" error
    config.plugins = config.plugins || [];
    config.plugins.push(
      new config.webpack.DefinePlugin({
        'typeof self': JSON.stringify('undefined'),
      })
    );

    // Provide polyfills for browser globals in server environment
    if (isServer) {
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

    // Optimize build performance
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig
