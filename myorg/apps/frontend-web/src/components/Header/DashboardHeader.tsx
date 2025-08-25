// src/components/Header/DashboardHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { BASE_URL } from '@/api/http';
import {
  getNotificationHistory,
  markNotificationAsRead,
} from '@/api/notifications';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

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
    padding: 0,
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
  // Estado para abrir el modal de editar perfil
  const [openProfile, setOpenProfile] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeContext();
  const router = useRouter();

  // Notificaciones
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      body?: string;
      date?: string;
      isRead?: boolean;
    }>
  >([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      setNotifError(null);
      const userId = (user as any).sub ?? user.id;
  
      const raw = await getNotificationHistory(userId);
      const normalized = (Array.isArray(raw) ? raw : []).map((n: any) => ({
        id: String(n.id),
        title: n.title ?? n.subject ?? 'Notificación',
        body: n.body ?? n.message ?? '',
        // intenta tomar la fecha del campo disponible en tu API
        date: n.date ?? n.createdAt ?? n.timestamp ?? n.created_at ?? null,
        isRead: Boolean(n.isRead ?? n.read ?? (n.status === 'READ')),
      }));
  
      normalized.sort((a: any, b: any) => {
        // 1) no leídas primero
        if (!!a.isRead !== !!b.isRead) return a.isRead ? 1 : -1;
        // 2) dentro del mismo grupo, más recientes primero
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });
  
      setNotifications(normalized);
    } catch (e: any) {
      setNotifError(e?.message ?? 'Error al cargar notificaciones');
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => {
        const next = prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        next.sort((a, b) => {
          if (!!a.isRead !== !!b.isRead) return a.isRead ? 1 : -1;
          const ta = a.date ? new Date(a.date).getTime() : 0;
          const tb = b.date ? new Date(b.date).getTime() : 0;
          return tb - ta;
        });
        return next;
      });
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle del popover
  const handleNotifButton = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl((prev) => (prev ? null : e.currentTarget));
  };
  const notifOpen = Boolean(notifAnchorEl);

  // Eventos de UI
  const handleUserClick = () => setOpenProfile(true);
  const handleProfileClose = () => setOpenProfile(false);

  return (
    <>
      <HeaderContainer $sidebarWidth={sidebarWidth}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" onClick={toggleDrawer}>
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <LogoContainer style={{ cursor: 'pointer' }}>
            <img
              src="/logos/mycard-logo.svg"
              alt="MyCard Logo"
              style={{ height: 40 }}
            />
          </LogoContainer>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserInfoContainer onClick={handleUserClick}>
            <UserAvatar
              src={
                user?.profile_image
                  ? `${BASE_URL}/uploads/${user.profile_image}`
                  : '/logos/users.webp'
              }
              alt={user?.username}
            />
            <UserName>{user?.username || 'Usuario'}</UserName>
          </UserInfoContainer>

          <ThemedSwitch checked={isDarkMode} onChange={toggleTheme} />

          {/* Botón de campana */}
          <IconButton
            color="inherit"
            onClick={handleNotifButton}
            aria-label="Notificaciones"
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              overlap="circular"
              max={99}
            >
              {unreadCount > 0 ? (
                <NotificationsActiveIcon htmlColor="#fff" />
              ) : (
                <NotificationsNoneIcon htmlColor="#fff" />
              )}
            </Badge>
          </IconButton>

          {/* Popover hermano del botón */}
          <Popover
            open={notifOpen}
            anchorEl={notifAnchorEl}
            onClose={() => setNotifAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              style: { borderRadius: 12, width: 380, maxHeight: 460 },
            }}
            // disablePortal // opcional: mejora click-away en ciertos layouts
          >
            <NotifContainer>
              <NotifHeader>
                <span>Notificaciones</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {unreadCount > 0 && (
                    <UnreadPill>{unreadCount} nuevas</UnreadPill>
                  )}
                  <Tooltip title="Recargar">
                    <IconButton size="small" onClick={fetchNotifications}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </NotifHeader>

              {loadingNotifs ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: 20,
                  }}
                >
                  <CircularProgress size={22} />
                </div>
              ) : notifError ? (
                <EmptyState>{notifError}</EmptyState>
              ) : notifications.length === 0 ? (
                <EmptyState>Sin notificaciones por ahora</EmptyState>
              ) : (
                <NotifList as={List}>
                  {notifications.map((n, idx) => (
                    <React.Fragment key={n.id}>
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          !n.isRead && (
                            <Tooltip title="Marcar como leída">
                              <IconButton
                                edge="end"
                                onClick={() => handleMarkAsRead(n.id)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                        style={{
                          borderRadius: 10,
                          background: n.isRead
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.14)',
                          margin: '4px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        <ListItemIcon>
                          {n.isRead ? (
                            <NotificationsNoneIcon />
                          ) : (
                            <NotificationsActiveIcon />
                          )}
                        </ListItemIcon>

                        <ListItemText
                          primary={
                            <span style={{ fontWeight: 600 }}>{n.title}</span>
                          }
                          secondary={
                            <>
                              {n.body && (
                                <span
                                  style={{ display: 'block', opacity: 0.9 }}
                                >
                                  {n.body}
                                </span>
                              )}
                              {n.date && (
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: 12,
                                    opacity: 0.7,
                                    marginTop: 4,
                                  }}
                                >
                                  {n.date}
                                </span>
                              )}
                            </>
                          }
                          primaryTypographyProps={{
                            component: 'span',
                            style: { color: '#fff' },
                          }}
                          secondaryTypographyProps={{
                            component: 'span',
                            style: { color: '#fff' },
                          }}
                        />
                      </ListItem>
                      {idx < notifications.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </NotifList>
              )}
            </NotifContainer>
          </Popover>

          {/*<SupportLogo src="/images/support.svg" alt="Soporte Técnico" />*/ }
        </div>
      </HeaderContainer>

      {openProfile && user && (
        <EditProfileModal
          user={{ ...user, id: String(user.id) }}
          onClose={handleProfileClose}
        />
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

const NotifContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
`;
const NotifHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  padding: 4px 6px 8px;
`;
const UnreadPill = styled.span`
  background: #ff3b30;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 24px 8px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;
const NotifList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
`;
const NotifFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 4px 2px;
`;
const FooterBtn = styled.button`
  all: unset;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`;
