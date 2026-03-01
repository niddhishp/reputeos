import type { NextConfig } from 'next';

/**
 * Enhanced Next.js Configuration
 * 
 * This configuration includes:
 * - Security headers
 * - Image optimization
 * - Performance optimizations
 * - Bundle analysis
 * - Experimental features
 */

const nextConfig: NextConfig = {
  // ==========================================================================
  // Security Headers
  // ==========================================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.openai.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ==========================================================================
  // Image Optimization
  // ==========================================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.reputeos.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ==========================================================================
  // Redirects
  // ==========================================================================
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },

  // ==========================================================================
  // Rewrites
  // ==========================================================================
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/robots',
      },
    ];
  },

  // ==========================================================================
  // Experimental Features
  // ==========================================================================
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-icons',
    ],
    // Enable server actions (now default in Next.js 15)
    // serverActions: {},
  },

  // ==========================================================================
  // TypeScript & ESLint
  // ==========================================================================
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ==========================================================================
  // Production Settings
  // ==========================================================================
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,

  // ==========================================================================
  // Webpack Configuration
  // ==========================================================================
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle splitting
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for chart libraries
          charts: {
            test: /[\\/]node_modules[\\/](recharts|chart\.js|d3)[\\/]/,
            name: 'charts',
            chunks: 'async',
            priority: 20,
          },
          // Separate chunk for PDF generation
          pdf: {
            test: /[\\/]node_modules[\\/](jspdf|pptxgenjs)[\\/]/,
            name: 'pdf',
            chunks: 'async',
            priority: 20,
          },
          // Separate chunk for AI/ML libraries
          ai: {
            test: /[\\/]node_modules[\\/](openai|@anthropic-ai)[\\/]/,
            name: 'ai',
            chunks: 'async',
            priority: 20,
          },
        },
      };
    }

    // Add alias for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    };

    return config;
  },

  // ==========================================================================
  // Logging
  // ==========================================================================
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
