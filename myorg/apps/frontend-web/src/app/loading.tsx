// app/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading/Loading';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Aquí defines el tiempo que deseas que dure el splash.
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!mounted || showSplash) {
    return (
      <html>
        <body>
          <Loading />
        </body>
      </html>
    );
  }

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
