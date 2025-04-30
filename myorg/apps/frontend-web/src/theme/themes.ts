// src/theme/themes.ts
import { createTheme } from '@mui/material/styles';

export const theme1 = createTheme({
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

export const theme2 = createTheme({
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
/*
export const theme3 = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4CAF50" },
    secondary: { main: "#FFC107" },
    background: { default: "#f0fff0", paper: "#ffffff" }, // Ejemplo de fondo muy claro
  },
});

export const theme4 = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#9C27B0" },
    secondary: { main: "#FF4081" },
    background: { default: "#181818", paper: "#303030" },
  },
});

export const theme5 = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#FF5722" },
    secondary: { main: "#795548" },
    background: { default: "#fff8e1", paper: "#ffffff" },
  },
});

export const theme6 = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#607D8B" },
    secondary: { main: "#FF9800" },
    background: { default: "#ECEFF1", paper: "#ffffff" },
  },
});

export const theme7 = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#E91E63" },
    secondary: { main: "#03A9F4" },
    background: { default: "#121212", paper: "#424242" },
  },
});
*/
export const themes = [theme1, theme2/*, theme3, theme4, theme5, theme6, theme7*/];

export const getDailyTheme = () => themes[0] ?? theme1;
