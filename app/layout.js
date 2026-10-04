import '@/styles/sahaj.scss';

export const metadata = {
  title: 'Sahaj Optical',
  description: 'Sahaj Optical Store & Admin',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon/favicon-32x32.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sahaj Optical',
  },
};

export const viewport = {
  themeColor: '#973481',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
