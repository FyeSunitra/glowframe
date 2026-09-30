import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
