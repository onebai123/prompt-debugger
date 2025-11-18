/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_NAME: 'Prompt Debugger',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // 优化配置
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack配置
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },
}

module.exports = nextConfig
