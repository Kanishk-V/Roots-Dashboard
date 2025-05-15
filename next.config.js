/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add a fallback for the 'fs' module which is used by mapbox-gl
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
