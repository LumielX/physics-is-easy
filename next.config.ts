import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 3D libraries ship large ES modules; transpiling lets Next tree-shake them per route.
  transpilePackages: ['three'],

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    // Keeps the initial JS payload small by splitting barrel imports of these packages.
    optimizePackageImports: ['@react-three/drei', 'three'],
  },

  async headers() {
    return [
      {
        // Static 3D assets and fonts are content-hashed at build time in /public/models.
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
