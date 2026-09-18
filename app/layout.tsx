import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/settings/preferences';

const thai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-thai',
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://physics-is-easy.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Physics is Easy — เรียนฟิสิกส์ ม.4–ม.6 ให้เข้าใจจริง',
    template: '%s · Physics is Easy',
  },
  description:
    'แพลตฟอร์มเรียนฟิสิกส์ ม.4–ม.6 ครบทุกบทตามหลักสูตร สสวท. พร้อมเครื่องจำลองที่คำนวณจากสมการฟิสิกส์จริง ปรับค่าได้ เห็นผลทันที และแบบทดสอบพร้อมเฉลยละเอียด',
  keywords: [
    'ฟิสิกส์',
    'ฟิสิกส์ ม.ปลาย',
    'ฟิสิกส์ ม.4',
    'ฟิสิกส์ ม.5',
    'ฟิสิกส์ ม.6',
    'สสวท',
    'simulation',
    'physics',
    'เรียนฟิสิกส์ออนไลน์',
  ],
  authors: [{ name: 'Narawit Luekhajon' }],
  creator: 'Narawit Luekhajon',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'Physics is Easy',
    title: 'Physics is Easy — เรียนฟิสิกส์ ม.4–ม.6 ให้เข้าใจจริง',
    description:
      'เรียน ทดลอง และทดสอบความเข้าใจฟิสิกส์ ม.ปลาย ด้วยเครื่องจำลองที่คำนวณตามสมการจริง',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fc' },
    { media: '(prefers-color-scheme: dark)', color: '#070a12' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={thai.variable}>
      <head>
        {/* Applies the stored theme before first paint — prevents a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <a href="#main" className="pie-skip">
            ข้ามไปยังเนื้อหาหลัก
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="min-h-[70dvh] outline-none">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
