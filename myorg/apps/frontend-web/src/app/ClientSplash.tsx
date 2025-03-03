'use client';

import React, { useState, useEffect } from "react";
import Loading from "@/components/Loading/Loading";

export default function ClientSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); // Ajusta el tiempo del splash según lo necesites
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || showSplash) {
    return <Loading />;
  }

  return <>{children}</>;
}
