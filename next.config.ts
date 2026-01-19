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
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            // Allow scripts from self, Clerk, and Cloudflare; unsafe-inline/eval for dev compatibility.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://challenges.cloudflare.com; connect-src 'self' https://*.clerk.com; img-src 'self' https://img.clerk.com data:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; frame-src 'self' https://challenges.cloudflare.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
