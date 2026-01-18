import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pjfrrgfdgakqdpfwygeb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // 旧WordPressサイトの画像（移行中に使用）
      {
        protocol: "https",
        hostname: "partner-prop.com",
        pathname: "/wp-content/**",
      },
      // Lab記事の画像（/lab/wp-content/...パス）
      {
        protocol: "https",
        hostname: "partner-prop.com",
        pathname: "/lab/wp-content/**",
      },
      // 画像パス（/img/**）
      {
        protocol: "https",
        hostname: "partner-prop.com",
        pathname: "/img/**",
      },
      // すべてのpartner-prop.comの画像を許可
      {
        protocol: "https",
        hostname: "partner-prop.com",
      },
    ],
  },
};

export default nextConfig;
