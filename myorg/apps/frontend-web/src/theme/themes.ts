// src/theme/themes.ts
import { createTheme } from '@mui/material/styles';

export const theme1 = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0038A8' },
    secondary: { main: '#0057D9' },
    background: { default: '#F5F7FA', paper: '#F5F7FA' }, // Fondo blanco
    text: { primary: '#1E1E1E', secondary: '#4A4A4A' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif !important',
  },
  components: {
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#6adbef' } } },
  },
});

export const theme2 = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1A4DB7' },
    secondary: { main: '#297CDA' },
    background: { default: '#121212', paper: '#424242' },
    text: { primary: '#B0B0B0', secondary: '#b0bec5' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif !important',
  }
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
