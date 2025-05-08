// src/theme/themes.ts
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0038A8' },        
    secondary: { main: '#007FFF' },     
    background: { default: '#F9FAFB', paper: '#FFFFFF' },
    text: { primary: '#202124', secondary: '#5F6368' },
    error: { main: '#D32F2F' },
    success: { main: '#388E3C' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0038A8',  
          color: '#FFFFFF',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0038A8' },       
    secondary: { main: '#5C9DED' },     
    background: { default: '#121212', paper: '#1E1E1E' },
    text: { primary: '#E0E0E0', secondary: '#B0BEC5' },
    error: { main: '#EF5350' },
    success: { main: '#66BB6A' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0038A8',    
          color: '#FFFFFF',
        },
      },
    },
  },
});