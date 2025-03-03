// src/app/loading.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading/Loading';

export default function LoadingFallback({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Duración del splash: 10 segundos (ajustable)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || showSplash) {
    return <Loading />;
  }

  return <>{children}</>;
}
