// src/components/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { themes } from '@/theme/themes';

interface ThemeContextType {
  currentTheme: number;
  theme: typeof themes[0];
  changeTheme: (index: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  const initialIndex = new Date().getDay();
  const [currentTheme, setCurrentTheme] = useState(initialIndex);
  const [theme, setTheme] = useState(themes[initialIndex]);

  const changeTheme = (index: number) => {
    setCurrentTheme(index);
    setTheme(themes[index]);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProviderClient');
  }
  return context;
}
