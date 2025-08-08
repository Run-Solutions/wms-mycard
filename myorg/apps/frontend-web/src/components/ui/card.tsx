// components/ui/card.tsx
import * as React from 'react';

export function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`bg-white rounded-xl shadow ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}