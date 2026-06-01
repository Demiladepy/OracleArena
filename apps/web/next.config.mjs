/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oracle-arena/config', '@oracle-arena/types', '@somnia-chain/streams'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
