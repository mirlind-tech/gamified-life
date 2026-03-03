import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React 19 experimental features
  experimental: {
    // Partial Prerendering - Static shell with dynamic streaming
    ppr: true,
    
    // React 19 Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      '@react-three/fiber',
      '@react-three/drei',
      'framer-motion',
    ],
  },
  
  // Turbopack configuration
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005',
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration - removed from config, handled separately
  
  // Headers for security
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
        ],
      },
    ];
  },
  
  // Rewrites for API proxying (if needed)
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/gateway/:path*',
          destination: `${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005'}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
