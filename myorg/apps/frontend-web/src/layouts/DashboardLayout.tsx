'use client';

import React, { useState, useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import styled, { keyframes } from 'styled-components';
import DashboardHeader from '@/components/Header/DashboardHeader';
import { lightTheme, darkTheme } from '@/theme/themes';
import { useThemeContext } from '@/components/ThemeContext';
import { Sidebar } from '@/components/Sidebar/Sidebar';

// Dimensiones
const drawerOpenWidth = 200;
const collapsedWidth = 60;
const gapBetweenSidebarAndContent = -200; // Sin separación extra
const headerHeight = 64;

const fadeInSlide = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface MainContentProps {
  open: boolean;
}

const MainContent = styled.main<MainContentProps>`
  flex-grow: 1;
  padding: 24px;
  margin-top: ${headerHeight}px;
  margin-left: ${({ open }) =>
    open ? `${drawerOpenWidth + gapBetweenSidebarAndContent}px` : `${collapsedWidth}px`};
  transition: margin 0.3s ease;
  animation: ${fadeInSlide} 0.5s ease-out;
`;

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Controlamos que el componente ya esté montado en el cliente
  const [mounted, setMounted] = useState(false);
  const [themeIndex, setThemeIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const { toggleTheme, theme } = useThemeContext();
  const themes = [lightTheme, darkTheme];

  useEffect(() => {
    setMounted(true); // Se monta en el cliente
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedThemeIndex');
      let index = stored ? Number(stored) : -1;

      if (index < 0 || index >= themes.length) {
        index = 0;
      }
      setThemeIndex(index);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedThemeIndex', themeIndex.toString());
    }
  }, [themeIndex]);

  // Mientras no esté montado, no renderizamos nada para evitar desajustes
  if (!mounted) return null;

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const currentTheme = themes[themeIndex];

  const handleNavigation = (label: string) => {
    console.log(`Navegar a ${label}`);
    // Implementa la navegación según tus rutas
  };

  const handleLogout = () => {
    window.location.href = '/auth/login';
  };

  const currentSidebarWidth = drawerOpen ? drawerOpenWidth : collapsedWidth;

  return (
    <MuiThemeProvider theme={currentTheme}>
      <StyledThemeProvider theme={currentTheme}>
        <CssBaseline />
        {/* Header fijo, posicionado según el ancho del sidebar */}
        <DashboardHeader
          toggleDrawer={toggleDrawer}
          drawerOpen={drawerOpen}
          sidebarWidth={currentSidebarWidth}
          onThemeChange={(index: number) => setThemeIndex(index)}
          currentTheme={theme}
        />
        {/* Contenedor para Sidebar y contenido principal */}
        <Box sx={{ display: 'flex', marginTop: `${headerHeight}px` }}>
          <Sidebar open={drawerOpen} onLogout={handleLogout} />
          <MainContent open={drawerOpen}>{children}</MainContent>
        </Box>
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
};

export default DashboardLayout;
