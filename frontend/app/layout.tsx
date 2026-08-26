import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geist = { variable: GeistSans.variable, className: GeistSans.className };

export const metadata: Metadata = {
  title: "BUMDESMARTNUKITA — Dari Desa, Untuk Semua",
  description: "Platform marketplace digital UMKM Desa Lengkong, Kecamatan Bojongsoang, Kabupaten Bandung. Temukan produk lokal berkualitas, dukung ekonomi desa.",
  keywords: ["UMKM desa", "marketplace desa", "BUMDes", "produk lokal", "Lengkong", "Bojongsoang", "Bandung"],
  authors: [{ name: "BUMDESMARTNUKITA" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://bumdesmartnukita.com",
    siteName: "BUMDESMARTNUKITA",
    title: "BUMDESMARTNUKITA — Dari Desa, Untuk Semua",
    description: "Platform marketplace digital UMKM Desa Lengkong. Belanja produk lokal, bayar aman via Midtrans, dukung ekonomi desa.",
    images: [{ url: "/logo-with-text.png", width: 1200, height: 630, alt: "BUMDESMARTNUKITA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BUMDESMARTNUKITA — Dari Desa, Untuk Semua",
    description: "Platform marketplace digital UMKM desa. Belanja produk lokal, dukung ekonomi desa.",
    images: ["/logo-with-text.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#2D6A4F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BUMDESMARTNUKITA" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>
{children}
        </ToastProvider>
      </body>
    </html>
  );
}

