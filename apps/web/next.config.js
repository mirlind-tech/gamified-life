const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config) => {
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'http://127.0.0.1:3000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
