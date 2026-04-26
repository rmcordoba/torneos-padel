import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  webpack(config, { dev }) {
    if (dev) {
      // Ignora archivos del sistema Windows que generan EINVAL en watchpack
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules|\.git|hiberfil\.sys|pagefile\.sys|swapfile\.sys/,
      };
    }
    return config;
  },
};

export default nextConfig;
