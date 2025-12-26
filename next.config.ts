import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpackDevMiddleware: (config) => {
    config.allowedHosts = [
      'organic-capybara-v6wrvp7qqg972pq6r-3000.app.github.dev'
    ];
    return config;
  },
};

export default nextConfig;
