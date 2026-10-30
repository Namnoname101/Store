/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "https://modelapi.vn/v1/:path*",
      },
      {
        source: "/gw/:path*",
        destination: "https://1gw.gwai.cloud/:path*",
      },
    ];
  },
};

export default nextConfig;
