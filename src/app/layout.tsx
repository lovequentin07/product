import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://datazip.net"),
  title: {
    default: "DataZip — 아파트 관리비·실거래가 비교",
    template: "%s | DataZip",
  },
  description: "우리 아파트 관리비가 동네·구·서울 전체 대비 어느 수준인지 확인하고, 실거래가까지 한눈에 조회하세요. K-apt·국토부 공공데이터 기반.",
  keywords: ['아파트 관리비', '관리비 비교', '아파트 실거래가', '서울 아파트', 'K-apt'],
  openGraph: {
    siteName: "DataZip",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataZip — 아파트 관리비·실거래가 비교",
    description: "우리 아파트 관리비가 동네·구·서울 전체 대비 어느 수준인지 확인하고, 실거래가까지 한눈에 조회하세요.",
  },
  other: {
    'naver-site-verification': '5098c8f688adf3e28c89a3f09e53a8a65ffbf83c',
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DataZip",
  url: "https://datazip.net",
  description: "아파트 관리비·실거래가 비교 서비스",
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head suppressHydrationWarning>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7470215059416865"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}

        {clarityId && (
          <Script id="clarity-init" strategy="afterInteractive">{`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}</Script>
        )}

      </body>
    </html>
  );
}
