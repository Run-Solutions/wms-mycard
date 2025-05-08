'use client';

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { AuthProvider } from '@/context/AuthContext';
import Notification from '../components/Notification/Notification';
import { ThemeProviderClient, useThemeContext } from '@/components/ThemeContext';
import { ToastContainer } from 'react-toastify';
import dynamic from 'next/dynamic';
import 'react-toastify/dist/ReactToastify.css';

interface ClientProvidersProps {
  children: React.ReactNode;
}

const ToastContainerDynamic = dynamic(
  () => import('react-toastify').then((mod) => mod.ToastContainer),
  { ssr: false }
);

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProviderClient>
          <InnerProviders>{children}</InnerProviders>
        </ThemeProviderClient>
      </AuthProvider>
    </Provider>
  );
}

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
      {isClient && (
        <ToastContainerDynamic position='top-right' autoClose={5000} />
      )}
        <Notification />
        {children}
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}
