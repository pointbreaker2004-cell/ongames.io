import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'OnGames.io - Free Online Party Games for Phones',
  description: 'Play One Night Werewolf, Codewords, Spyfall, Secret Sith, and Love Letter with friends on your phone.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: '#f5f7fa', color: '#111827' }}>
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="w-full border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-gray-600">
              <span className="font-black text-gray-800">OnGames<span className="text-indigo-600">.io</span></span>
              <span>&bull;</span>
              <span>Free real-time phone multiplayer games</span>
            </div>
            <p>&copy; {new Date().getFullYear()} OnGames &bull; Pure browser fun for remote and couch game nights.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
