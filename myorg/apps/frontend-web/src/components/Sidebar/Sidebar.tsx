// src/components/Sidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, ListItemButton, ListItemText, Button, Box } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useRouter } from 'next/navigation';
import { sidebarItems } from '@/config/sidebarItems';
import { useAuthContext } from '@/context/AuthContext';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const drawerOpenWidth = 200;
const collapsedWidth = 60;
const headerHeight = 64;

export interface SidebarProps {
  open: boolean;
  onLogout: () => void;
}

interface Module {
  id: number;
  name: string;
  Description: string;
  imageName: string;
  logoName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onLogout }) => {
  const router = useRouter();
  const { user, setUser, setToken } = useAuthContext();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        // Se recupera el token del user logeado
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('⛔ No se la leído el token');
        }
        const response = await fetch('http://localhost:3000/dashboard/modules', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return; // salir del fetchModules
        }
        if (!response.ok) {
          throw new Error('⛔ Error al obtener módulos');
        }

        const data = await response.json();
        console.log('Modulos:', data.modules);

        // Actualizar el estado con los modulos obtenidos
        setModules(data.modules)
      } catch (error) {
        console.error(error);
      } finally {
        // Cerrar la carga de los modulos cuando finalice
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Para redireccionar correctamente
  const toCamelCase = (str: string) =>
    str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.toUpperCase()
    )
    .replace(/\s+/g, '')

  const handleCardClick = (name: string) => {
    let redirect_page = toCamelCase(name);
    console.log(redirect_page);
    router.push(`/${redirect_page}`);
  }

  const handleNavigate = (label: string) => {
    let route = '';
    if (label.toLowerCase() === 'home') {
      route = '/dashboard';
    } else if (label.toLowerCase() === 'dashboard') {
      route = '/graph';
    } else {
      route = `/${label.toLowerCase()}`;
    }
    router.push(route);
  };

  // Ejemplo de logout: borra el usuario y redirige a /auth/login
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    dispatch(logout());
    router.push('/auth/login');
  };

  return (
    <Drawer
      variant='persistent'
      open={true}
      sx={{
        width: open ? drawerOpenWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': (theme: any) => ({
          width: open ? drawerOpenWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: 'width 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          willChange: 'width',
          overflowX: 'hidden',
          background: theme.palette.primary.main,
          color: '#fff',
        }),
      }}
    >
      <Box sx={{ height: headerHeight }} />
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {sidebarItems.map((item) => (
          <ListItemButton
            key={item.name}
            onClick={() => handleCardClick(item.route)}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              justifyContent: open ? 'initial' : 'center',
              paddingX: open ? 2 : 0,
              borderRadius: '4px',
              margin: '4px',
            }}
          >
            <img
              src={`/logos/${item.logoName}`} alt={item.logoName}
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            {open && (
              <ListItemText
                primary={item.name}
                sx={{
                  ml: 2,
                  '& .MuiTypography-root': {
                    fontWeight: 'bold',
                    color: '#fff',
                  },
                }}
              />
            )}
          </ListItemButton>
        ))}
      </Box>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {modules.map((module) => (
          <ListItemButton
            key={module.name}
            onClick={() => handleCardClick(module.name)}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              justifyContent: open ? 'initial' : 'center',
              paddingX: open ? 2 : 0,
              borderRadius: '4px',
              margin: '4px',
            }}
          >
            <img
              src={`/logos/${module.logoName}`} alt={module.name}
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            {open && (
              <ListItemText
                primary={module.name}
                sx={{
                  ml: 2,
                  '& .MuiTypography-root': {
                    fontWeight: 'bold',
                    color: '#fff',
                  },
                }}
              />
            )}
          </ListItemButton>
        ))}
      </Box>
      <Box sx={{ mt:'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.3)', display: 'flex', justifyContent: open ? 'flex-start' : 'center', alignItems: 'center'}}>
        <Button
          variant='outlined'
          color='inherit'
          fullWidth = {open}
          onClick={handleLogout}
          startIcon={<ExitToAppIcon sx={{ color: '#fff' }} />}
          sx={{
            borderColor: '#fff',
            color: '#fff',
            fontWeight: 'bold',
            '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
            justifyContent: open ? 'flex-start' : 'center',
            display: 'flex',
            gap: 1,
            width: open ? '100%' : '80%',
          }}
        >
          {open && 'Cerrar sesión'}
        </Button>
      </Box>
    </Drawer>
  );
};
