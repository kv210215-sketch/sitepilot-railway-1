import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',          // оптимізований Docker образ
  reactStrictMode: true,
  poweredByHeader: false,

  // Проксі API запитів у dev (уникаємо CORS)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  images: {
    domains: ['localhost', 'app.solomiya-energy.com'],
  },
};

export default nextConfig;
