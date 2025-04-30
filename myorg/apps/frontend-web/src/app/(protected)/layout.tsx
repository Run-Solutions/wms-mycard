// src/app/(protected)/layout.tsx
'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/Header/DashboardHeader';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useThemeContext } from '@/components/ThemeContext';

export default function ProtectedLayout({ children }: { children: React.ReactNode; }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleDrawer = () => setSidebarOpen(!sidebarOpen);
  const headerHeight = 130;
  const { currentTheme, changeTheme, theme } = useThemeContext();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.palette.background.default }}>
      <Sidebar open={sidebarOpen} onLogout={() => { /* lógica de logout */ }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader
          toggleDrawer={toggleDrawer}
          drawerOpen={sidebarOpen}
          onThemeChange={changeTheme}
          currentTheme={currentTheme}
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
