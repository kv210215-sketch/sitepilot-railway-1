/** @type {import('next').NextConfig} */
const isWindows = process.platform === 'win32';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Use standalone only in Linux CI/container builds.
  ...(isWindows ? {} : { output: 'standalone' }),

  // Local Windows builds in this repo can stall forever during file tracing.
  ...(isWindows
    ? {
        experimental: {
          outputFileTracingExcludes: {
            '/*': ['./node_modules/**/*', './.next/cache/**/*'],
          },
        },
      }
    : {}),

  // Security headers
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Proxy API requests only in development to avoid freezing production rewrites at build time.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'app.solomiya-energy.com' },
      { protocol: 'https', hostname: 'solomiya-energy.com' },
    ],
  },
};

module.exports = nextConfig;
