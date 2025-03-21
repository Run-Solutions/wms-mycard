'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { AuthProvider } from '@/context/AuthContext';
import Notification from '../components/Notification/Notification';
import { ThemeProviderClient, useThemeContext } from '@/components/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ClientProvidersProps {
  children: React.ReactNode;
}

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
  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <ToastContainer position='top-right' autoClose={5000} />
        <Notification />
        {children}
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}
