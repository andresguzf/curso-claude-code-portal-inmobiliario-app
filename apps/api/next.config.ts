import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El paquete de contratos se distribuye como TypeScript sin compilar.
  transpilePackages: ["@portal/contracts"],
};

export default nextConfig;
