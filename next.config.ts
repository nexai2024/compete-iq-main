import type { NextConfig } from "next";

const CspHeader = `
    default-src 'self';
    script-src 'self' https://*.clerk.com;
    connect-src 'self' https://*.clerk.com;
    img-src 'self' https://*.clerk.com https://img.clerk.com;
    style-src 'self' 'unsafe-inline' https://*.clerk.com;
    frame-src https://*.clerk.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();


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
                key: 'Content-Security-Policy-Report-Only',
                value: CspHeader,
            }
        ],
      },
    ];
  },
};

export default nextConfig;
