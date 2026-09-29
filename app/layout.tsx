import type { Metadata } from 'next';
import { Caveat, Poppins, Noto_Sans_Thai } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-sans-thai',
  subsets: ['thai'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://glowframe-rent.com'),
  title: 'GlowFrame - บริการถ่ายภาพ ครบจบในที่เดียว',
  description: 'แพลตฟอร์มที่รวมบริการถ่ายภาพหลากหลายรูปแบบไว้ในที่เดียว',
  icons: {
    icon: [{ url: '/images/favicon.png', type: 'image/png' }],
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'GlowFrame - บริการถ่ายภาพ ครบจบในที่เดียว',
    description: 'แพลตฟอร์มที่รวมบริการถ่ายภาพหลากหลายรูปแบบไว้ในที่เดียว',
    url: 'https://glowframe-rent.com/',
    siteName: 'GlowFrame',
    images: [{ url: '/images/glowframe-logo.png', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${caveat.variable} ${poppins.variable} ${notoSansThai.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
        <div
          id="gf-toast"
          aria-live="polite"
          className="fixed bottom-[26px] left-[50%] [transform:translateX(-50%)_translateY(20px)] bg-gf-brown-900 text-gf-pink-100 [padding:13px_24px] rounded-full text-[14px] font-semibold opacity-[0] [transition:all_.3s_ease] z-[200] [box-shadow:var(--gf-shadow)] pointer-events-none"
        />
        <style>{`
          #gf-toast.gf-toast--show {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) !important;
          }
        `}</style>
      </body>
    </html>
  );
}
