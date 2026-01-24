import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Base CSP script-src directive
    let scriptSrc = "'self' 'unsafe-inline' *.clerk.com";
    if (isDevelopment) {
      // 'unsafe-eval' is required for Next.js's Fast Refresh in development
      scriptSrc += " 'unsafe-eval'";
    }

    return [
      {
        // Apply these headers to all routes in your application.
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // A more secure Content-Security-Policy.
          // 'unsafe-eval' is only allowed in development for React's Fast Refresh.
          // For more information, see: https://nextjs.org/docs/advanced-features/security-headers
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.clerk.com; connect-src 'self' *.clerk.com;`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
