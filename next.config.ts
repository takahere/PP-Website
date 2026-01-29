import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 旧JPG画像 → WebP変換リダイレクト
      // img_evaluation01-16
      ...Array.from({ length: 16 }, (_, i) => ({
        source: `/img/img_evaluation${String(i + 1).padStart(2, '0')}.jpg`,
        destination: `/img/img_evaluation${String(i + 1).padStart(2, '0')}.webp`,
        permanent: true,
      })),
      // img_security01-05
      ...Array.from({ length: 5 }, (_, i) => ({
        source: `/img/img_security${String(i + 1).padStart(2, '0')}.jpg`,
        destination: `/img/img_security${String(i + 1).padStart(2, '0')}.webp`,
        permanent: true,
      })),
      // img_evaluation_api_01-03
      ...Array.from({ length: 3 }, (_, i) => ({
        source: `/img/img_evaluation_api_${String(i + 1).padStart(2, '0')}.jpg`,
        destination: `/img/img_evaluation_api_${String(i + 1).padStart(2, '0')}.webp`,
        permanent: true,
      })),
      // icon_leader
      {
        source: '/img/icon_leader.jpg',
        destination: '/img/icon_leader.webp',
        permanent: true,
      },
      {
        source: '/wp-content/uploads/icon_leader.jpg',
        destination: '/img/icon_leader.webp',
        permanent: true,
      },
    ]
  },
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
  async headers() {
    return [
      {
        // 全ページに適用するセキュリティヘッダー
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        // 静的アセットのキャッシュ設定
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JS/CSSファイルのキャッシュ設定
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
