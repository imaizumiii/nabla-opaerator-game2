import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // バックエンドURLを環境変数から取得（デフォルトはローカル開発用）
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    return [
      {
        source: '/api/py/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
};

export default nextConfig;
