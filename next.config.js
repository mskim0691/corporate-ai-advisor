/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static page generation cache for admin pages
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
}

module.exports = nextConfig
