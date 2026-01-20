import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercelでは外部URLへのリライトができないため、API Routesを使用
  // ローカル開発時もAPI Routes経由で動作する（環境変数BACKEND_URLが設定されていない場合はデフォルトでlocalhost:8000を使用）
};

export default nextConfig;
