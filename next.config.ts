import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/dual-currency-calculator' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/dual-currency-calculator/' : '',
};

export default nextConfig;
