import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FriendFlix — Hacé el trailer de tu grupo',
  description: 'Subí fotos de tus amigos y generá un trailer de cine con IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
