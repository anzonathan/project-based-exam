/** @type {import('next').NextConfig} */
const apiProxyTarget =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000/api/:path*"
    : "https://cinequest.up.railway.app/api/:path*";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: apiProxyTarget,
      },
    ];
  },
};

module.exports = nextConfig;
