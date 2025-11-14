// File: next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import withPWAInit from "@ducanh2912/next-pwa";


/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  // Enhanced workbox configuration for audio streaming
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Audio streaming - network first with range request support
      {
        urlPattern: /^https:\/\/.*\.mp3$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "audio-cache",
          rangeRequests: true,
          expiration: {
            maxEntries: 200,        // Increased from 50
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days instead of 7
            purgeOnQuotaError: true, // Automatically purge on quota errors
          },
          cacheableResponse: {
            statuses: [0, 200, 206], // Include 206 for range requests
          },
        },
      },
      // Album cover images - cache first
      {
        urlPattern: /^https:\/\/cdn-images\.dzcdn\.net\/images\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "album-covers",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            purgeOnQuotaError: true, // Automatically purge on quota errors
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // API responses - network first with fallback
      {
        urlPattern: /^https:\/\/api\.deezer\.com\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

/** @type {import("next").NextConfig} */
const config = {
  ...nextConfig,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "api.deezer.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
    ],
  },
};

export default withPWA(config);
