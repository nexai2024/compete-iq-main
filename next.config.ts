import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            // Allow scripts from self and Clerk, and allow inline styles for Next.js and other libraries.
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' *.clerk.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.clerk.com; connect-src 'self' *.clerk.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
