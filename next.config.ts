import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
  domains: [
    'res.cloudinary.com',
    'cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net',
  ],    
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;