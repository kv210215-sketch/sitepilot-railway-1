import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'SitePilot', template: '%s · SitePilot' },
  description: 'Керуюча платформа для solomiya-energy.com',
  robots: { index: false, follow: false }, // внутрішній інструмент
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head />
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111318',
              color: '#e8eaf0',
              border: '1px solid #2e3340',
              borderRadius: '10px',
              fontSize: '13.5px',
            },
            success: { iconTheme: { primary: '#2dd98f', secondary: '#000' } },
            error:   { iconTheme: { primary: '#ff4d4d', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
