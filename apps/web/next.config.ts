import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Força o Next.js a usar a pasta /apps/web como raiz e não a raiz do monorepo */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;