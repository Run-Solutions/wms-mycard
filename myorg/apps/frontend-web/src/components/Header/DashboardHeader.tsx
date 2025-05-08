// src/components/Header/DashboardHeader.tsx
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import EditProfileModal from './EditProfileModal';
import { useAuthContext } from '@/context/AuthContext'; 
import { Switch, SwitchProps } from '@mui/material';
import { useThemeContext } from '@/components/ThemeContext';
import { useRouter } from 'next/navigation';
import { Theme } from '@mui/material/styles';

interface DashboardHeaderProps {
  toggleDrawer: () => void;
  drawerOpen: boolean;
  onThemeChange: (index: number) => void;
  currentTheme: Theme;
  sidebarWidth: number;
}

interface HeaderContainerProps {
  $sidebarWidth: number;
}
// Estilo personalizado para el Switch con luna y sol dentro
const ThemedSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 58,
  height: 38,
  padding: 12,
  '& .MuiSwitch-switchBase': {
    padding: 0, // mejor que 9, porque en tu ajuste en DevTools no tenías padding
    right: 16,
    bottom: -4,
    width: 42,
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
        opacity: 1,
      },
      '& .MuiSwitch-thumb': {
        backgroundColor: '#1439ad',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24"><path fill='white' d='M12 3.75A8.25 8.25 0 0 0 3.75 12 8.25 8.25 0 0 0 12 20.25 8.25 8.25 0 0 0 20.25 12 8.25 8.25 0 0 0 12 3.75zm0 15A6.75 6.75 0 1 1 18.75 12 6.76 6.76 0 0 1 12 18.75z'/></svg>`
        )}")`,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#1439ad',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
    width: 24,
    height: 24,
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24"><path fill='white' d='M6.76 4.84l-1.8-1.79-1.42 1.42 1.79 1.8 1.43-1.43zm10.48 14.32l1.8 1.79 1.42-1.42-1.79-1.8-1.43 1.43zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-6h-2v3h2V2zm0 19h-2v3h2v-3zM2 12H5v-2H2v2zm19 0h-3v-2h3v2zm-3.24-7.76l-1.43 1.43 1.8 1.79 1.42-1.42-1.79-1.8zM6.76 19.16l1.43-1.43-1.8-1.79-1.42 1.42 1.79 1.8z'/></svg>`
    )}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  '& .MuiSwitch-track': {
    borderRadius: 20 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    opacity: 1,
  },
}));

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  toggleDrawer,
  drawerOpen,
  onThemeChange,
  currentTheme,
  sidebarWidth,
}) => {
  // Hook para el usuario real
  const { user } = useAuthContext();
  // Estado para el popover del tema
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  // Estado para abrir el modal de editar perfil
  const [openProfile, setOpenProfile] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeContext();
  
  const handleThemeButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };  
  // Al hacer click en el avatar se abre el modal de edición
  const handleUserClick = () => {
    setOpenProfile(true);
  };
  
  const handleProfileClose = () => {
    setOpenProfile(false);
  };
  const router = useRouter();
  // Selecciona el icono de la marca
  const handleLogoClick = (name: string) => {
    let redirect_page = name;
    router.push(`/${redirect_page}`)
  };
  
  return (
    <>
      <HeaderContainer $sidebarWidth={sidebarWidth}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color='inherit' onClick={toggleDrawer}>
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <LogoContainer onClick={() => handleLogoClick('dashboard')} style={{ cursor: 'pointer' }}>
            <img src='/logos/mycard-logo.svg' alt='MyCard Logo' style={{ height: 40 }} />
          </LogoContainer>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserInfoContainer onClick={handleUserClick}>
            <UserAvatar
              src={
                user?.profile_image
                ? `http://localhost:3000/uploads/${user.profile_image}`
                : '/logos/users.webp'
              }
              alt={user?.username}
              />
            <UserName>{user?.username || 'Usuario'}</UserName>
          </UserInfoContainer>
          <ThemedSwitch
            checked={isDarkMode}
            onChange={toggleTheme}
          />
          <SupportLogo src='/images/support.svg' alt='Soporte Técnico' />
        </div>
      </HeaderContainer>
      {openProfile && user && (
        <EditProfileModal user={{...user, id: String(user.id)}} onClose={handleProfileClose} />
      )}
    </>
  );
};

export default DashboardHeader;

// =========================== Styled Components ================================================================

const HeaderContainer = styled.header<HeaderContainerProps>`
  background: ${({ theme }) => theme.palette.primary.main};
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: ${({ $sidebarWidth }) => $sidebarWidth}px;
  width: calc(100% - ${({ $sidebarWidth }) => $sidebarWidth}px);
  z-index: 1100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 5px;
`;

const SupportLogo = styled.img`
  height: 40px;
  width: auto;
`;

const UserInfoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;
  cursor: pointer;
`;

const UserAvatar = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const UserName = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

