/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Desactiva optimizaciones que pueden causar problemas
    optimizeCss: false,
  },
  
  webpack: (config, { dev, isServer }) => {
    // Fix para CSS en desarrollo
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;