// src/contexts/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
  } from 'react';
  
  export interface User {
    id: number;
    username: string;
    email: string;
    phone?: string;
    role: {id: number, name: string, createdAt:string, updateAt: string};
    profile_image?: string;
  }
  
  interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    token: string | null;
    setToken: React.Dispatch<React.SetStateAction<string | null>>;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
  
    useEffect(() => {
      // Intenta obtener el usuario autenticado desde localStorage o desde tu API de autenticación
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken((storedToken));
      }
      // Si no se encuentra usuario, dejamos null y esperamos el proceso de login
    }, []);
  
    return (
      <AuthContext.Provider value={{ user, setUser, token, setToken }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }
  