import './globals.css';
import { AutoConnectUI } from '@/components/auto-connect-ui';
import { LinkUI } from '@/components/link-ui';
import { Menu } from '@/components/menu';

export const metadata = {
  title: 'Krmx Starter',
  description: 'A starter for Krmx React applications.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className='mx-auto min-h-[100svh] bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50'>
        <AutoConnectUI />
        <LinkUI />
        <Menu />
        {children}
      </body>
    </html>
  );
}
