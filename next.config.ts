import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental features (Next.js 15 compatible)
  experimental: {
    // serverActions is now default in Next.js 15, no need to enable
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint — skipped during builds; TypeScript strict mode provides type safety.
  // Run `npx eslint .` locally to lint. This avoids eslint-config-next version
  // conflicts between ESLint 8/9 and different Next.js versions on CI.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Production source maps (disable for security in sensitive apps)
  productionBrowserSourceMaps: false,

  // Powered by header (remove for security)
  poweredByHeader: false,
};

export default nextConfig;
