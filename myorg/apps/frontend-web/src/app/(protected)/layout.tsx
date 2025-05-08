// src/app/(protected)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/Header/DashboardHeader';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useThemeContext } from '@/components/ThemeContext';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: React.ReactNode; }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleDrawer = () => setSidebarOpen(!sidebarOpen);
  const headerHeight = 130;
  const { toggleTheme, theme } = useThemeContext();
  const { token } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/auth/login'); // redirige si no hay token
    }
  }, [token, router]);
  if (!token) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.palette.background.default }}>
      <Sidebar open={sidebarOpen} onLogout={() => { /* lógica de logout */ }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader
          toggleDrawer={toggleDrawer}
          drawerOpen={sidebarOpen}
          onThemeChange={toggleTheme}
          currentTheme={theme}
          sidebarWidth={sidebarOpen ? 200 : 60}
        />
        <main
          style={{
            flexGrow: 1,
            padding: '1rem',
            marginTop: headerHeight,
            marginLeft: '-20px',
            backgroundColor: theme.palette.background.default,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
