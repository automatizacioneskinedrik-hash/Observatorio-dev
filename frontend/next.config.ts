import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  // Añadimos esto para corregir el error de rutas de Turbopack
  experimental: {
    // @ts-ignore
    turbo: {
      root: '.',
    },
  },
};

export default nextConfig;