// src/components/Header/DashboardHeader.tsx
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Grid from '@mui/material/Grid';
import EditProfileModal from './EditProfileModal';
import { useAuthContext } from '@/context/AuthContext'; 
import { themes } from '@/theme/themes';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  toggleDrawer: () => void;
  drawerOpen: boolean;
  onThemeChange: (index: number) => void;
  currentTheme: number;
  sidebarWidth: number;
}

interface HeaderContainerProps {
  $sidebarWidth: number;
}

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

const AppName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
  font-family: Arial, sans-serif !important;
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

const ThemeSwatch = styled.div`
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 50px;
  height: 50px;
`;

const PrimarySwatch = styled.div`
  flex: 1;
`;

const SecondarySwatch = styled.div`
  flex: 1;
`;

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

  const handleThemeButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  // Al hacer click en el avatar se abre el modal de edición
  const handleUserClick = () => {
    setOpenProfile(true);
  };

  const handleProfileClose = () => {
    setOpenProfile(false);
  };

  const openPopover = Boolean(anchorEl);
  const popoverId = openPopover ? 'theme-popover' : undefined;

  // Selecciona el icono del tema según currentTheme
  const ThemeIcon = currentTheme % 2 === 0 ? Brightness4Icon : Brightness7Icon;

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
          <IconButton
            color='inherit'
            onClick={handleThemeButtonClick}
            style={{ marginLeft: 8 }}
          >
          <ThemeIcon />
          </IconButton>
          <SupportLogo src='/images/support.svg' alt='Soporte Técnico' />
        </div>
      </HeaderContainer>
      <Popover
        id={popoverId}
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Grid container spacing={1} style={{ padding: 10 }}>
          {themes.map((themeOption, index) => (
            <Grid item key={index}>
              <ThemeSwatch
                onClick={() => {
                  onThemeChange(index);
                  handlePopoverClose();
                }}
              >
                <PrimarySwatch
                  style={{
                    backgroundColor: themeOption.palette.primary.main,
                  }}
                />
                <SecondarySwatch
                  style={{
                    backgroundColor: themeOption.palette.secondary.main,
                  }}
                />
              </ThemeSwatch>
            </Grid>
          ))}
        </Grid>
      </Popover>
      {openProfile && user && (
        <EditProfileModal user={{...user, id: String(user.id)}} onClose={handleProfileClose} />
      )}
    </>
  );
};

export default DashboardHeader;
