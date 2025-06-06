
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        port: '',
        pathname: '/account123/**',
      },
      {
        protocol: 'https',
        hostname: 'idiprojects.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'istjaq.edu.pe',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
