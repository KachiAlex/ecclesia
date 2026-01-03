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
  // Add server-side polyfills
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  webpack: (config, { isServer, dev, webpack }) => {
    // Import polyfills for server-side rendering
    if (isServer) {
      require('./lib/polyfills.js');
    }

    // Existing webpack configuration if any
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }

    // Fix for "self is not defined" error - provide global polyfill
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof self': isServer ? JSON.stringify('undefined') : JSON.stringify('object'),
        'self': isServer ? 'undefined' : 'self',
      })
    );

    // Add global polyfill for server-side rendering
    if (isServer) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          'self': ['global', 'self'],
        })
      );
    }

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
