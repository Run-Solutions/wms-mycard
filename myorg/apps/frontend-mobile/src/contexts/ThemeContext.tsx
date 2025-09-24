// myorg/apps/frontend-mobile/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const Ctx = createContext({ isDarkMode: false, toggleTheme: () => {} });
export const useThemeContext = () => useContext(Ctx);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isDarkMode, setDark] = useState(true);
  const toggleTheme = () => setDark((v) => !v);
  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  const value = useMemo(() => ({ isDarkMode, toggleTheme }), [isDarkMode]);

  return (
    <Ctx.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </Ctx.Provider>
  );
};