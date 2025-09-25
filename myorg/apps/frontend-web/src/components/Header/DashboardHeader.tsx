// src/components/Header/DashboardHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
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

type AppNotification = {
  id: string;
  title: string;
  body?: string;
  date?: string | null;
  isRead?: boolean;
  type?: string | null;
  payload?: {
    workOrderId?: string | null;
    inconformityId?: number | string | null;
  };
  inconformity?: {
    id: number;
    comments: string;
    reviewed: boolean;
  } | null;
};

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
  const theme = useTheme();
  // Estado para abrir el modal de editar perfil
  const [openProfile, setOpenProfile] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeContext();
  const router = useRouter();

  // Notificaciones
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [specialModalOpen, setSpecialModalOpen] = useState(false);
  const [specialAuditorOpen, setSpecialModalAuditorOpen] = useState(false);
  const [specialOpersOpen, setSpecialModalOpersOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(
    null
  );

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      setNotifError(null);
      const userId = (user as any).sub ?? user.id;

      const raw = await getNotificationHistory(userId);
      console.log('Notificaciones crudas:', raw);
      const normalized = (Array.isArray(raw) ? raw : []).map((n: any) => {
        const data = n.data ?? {};
        const type =
          data.type ??
          inferTypeFromTexts(n.title ?? n.subject, n.body ?? n.message);
          console.log("Texto notificación:", n.title, n.body, "=> type:", type);

        const workOrderId =
          data.workOrderId ??
          extractWorkOrderId(n.body ?? n.message, n.title ?? n.subject);

        const inconformity = n.inconformity
          ? {
              id: n.inconformity.id,
              comments: n.inconformity.comments ?? '',
              reviewed: n.inconformity.reviewed ?? false,
            }
          : null;

        return {
          id: String(n.id),
          title: n.title ?? n.subject ?? 'Notificación',
          body: n.body ?? n.message ?? '',
          date: n.date ?? n.createdAt ?? n.timestamp ?? n.created_at ?? null,
          isRead: Boolean(n.isRead ?? n.read ?? n.status === 'READ'),
          type,
          payload: {
            workOrderId: workOrderId ?? null,
            inconformityId: data.inconformityId ?? n.inconformity?.id ?? null,
          },
          inconformity,
        } as AppNotification;
      });

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

  function shouldShowPlannerCqmModal(n: AppNotification, user: any): boolean {
    const roles = getUserRoles(user);
    return (
      roles.includes('planeador') &&
      (n.type ?? '').toLowerCase() === 'inconformidades_cqm_planeador'
    );
  }

  function shouldShowPlannerAuditorModal(n: AppNotification, user: any): boolean {
    const roles = getUserRoles(user);
    return (
      roles.includes('planeador') &&
      (n.type ?? '').toLowerCase() === 'inconformidades_auditor_planeador'
    );
  }
  
  function shouldShowPlannerOpersModal(n: AppNotification, user: any): boolean {
    const roles = getUserRoles(user);
    console.log('Evaluando shouldShowPlannerOpersModal');
    return (
      roles.includes('planeador') &&
      (n.type ?? '').toLowerCase() === 'inconformidades_operadores_planeador'
    );
  }

// 🔧 Utilidad para normalizar (quita tildes y espacios duplicados)
function normalize(txt?: string) {
  return (txt ?? '')
    .toLowerCase()
    .normalize('NFD')                  // separa diacríticos
    .replace(/\p{Diacritic}/gu, '')    // elimina diacríticos (tildes)
    .replace(/\s+/g, ' ')              // colapsa espacios
    .trim();
}

function inferTypeFromTexts(title?: string, body?: string): string | null {
  const raw = `${title ?? ''} ${body ?? ''}`;
  const txt = normalize(raw);

  // 🧠 Orden IMPORTA: primero lo más específico

  // ——— AUDITORÍA (con/sin tilde, distintas redacciones) ———
  if (
    txt.includes('inconformidad de auditoria') ||
    txt.includes('inconformidad auditoria') ||
    txt.includes('auditoria reporta una inconformidad') ||
    txt.includes('tiene una inconformidad de auditoria') ||
    // por si llega en título sin cuerpo claro:
    (txt.includes('nueva inconformidad auditoria') || txt.includes('inconformidad auditoria'))
  ) {
    return 'inconformidades_auditor_planeador';
  }

  // ——— CQM ———
  if (
    txt.includes('inconformidad cqm') ||
    txt.includes('reporta una inconformidad cqm') ||
    txt.includes('cqm te ha reportado')
  ) {
    return 'inconformidades_cqm_planeador';
  }

  if (
    txt.includes('reporta una inconformidad del area receptora o auditoria a area previa') 
  ) {
    return 'inconformidades_operadores_planeador';
  }

  // ——— Vistos buenos ———
  if (txt.includes('pendiente de aceptacion en recepcion de vistos buenos')) {
    return 'recepcion_vistos_buenos';
  }

  // ——— Liberar producto ———
  if (txt.includes('estado listo')) {
    return 'liberar_producto';
  }

  // ——— Rechazos ———
  if (txt.includes('inconformidad de auditoria por parte del usuario')) {
    return 'rechazos';
  }

  // ——— Genérico (dejarlo al final para no “robar” los casos específicos) ———
  if (txt.includes('tiene una inconformidad') || txt.includes('nueva inconformidad')) {
    return 'inconformidades';
  }

  return null;
}

  function extractWorkOrderId(body?: string, title?: string): string | null {
    const haystack = `${title ?? ''} ${body ?? ''}`;
    const m = haystack.match(/orden\s+(\d+)/i);
    return m?.[1] ?? null;
  }

  console.log('Usuario para roles:', user);

  // ✅ Versión defensiva de roles (soporta role/roles en varios formatos)
  function getUserRoles(user: any): string[] {
    if (!user) return [];
    const raw = (user.roles ?? user.role ?? []);
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr
      .map((r: any) => (typeof r === 'string' ? r : r?.name))
      .filter(Boolean)
      .map((s: string) => s.toLowerCase());
  }

  function getNotificationRoute(n: AppNotification, user: any): string | null {
    const roles = getUserRoles(user);
    const ot = n.payload?.workOrderId;
    console.log('Roles del usuario:', roles);

    if (roles.includes('calidad')) {
      switch ((n.type ?? '').toLowerCase()) {
        case 'recepcion_vistos_buenos':
          return ot ? `/recepcionDeVistosBuenos` : '/recepcionDeVistosBuenos';
        case 'workorder_updated':
          return ot ? `/seguimientoDeOts/${ot}` : '/seguimientoDeOts';
        default:
          return '/dashboard';
      }
    }

    if (roles.includes('operador')) {
      switch ((n.type ?? '').toLowerCase()) {
        case 'liberar_producto':
          return ot ? `/liberarProducto` : '/liberarProducto';
        case 'inconformidades':
          return ot ? `/inconformidades` : '/inconformidades';
        default:
          return '/dashboard';
      }
    }

    if (roles.includes('auditor')) {
      switch ((n.type ?? '').toLowerCase()) {
        case 'rechazos':
          return ot ? `/rechazos` : '/rechazos';
        default:
          return '/dashboard';
      }
    }

    return null;
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
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
  console.log('Notifaciones', unreadCount);

  useEffect(() => {
    fetchNotifications();
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
                <NotificationsActiveIcon />
              ) : (
                <NotificationsNoneIcon />
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
              sx: {
                borderRadius: 2,
                width: 380,
                maxHeight: 460,
                bgcolor: 'background.paper',
                color: 'text.primary',
              },
            }}
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
                                onClick={(e) => {
                                  e.stopPropagation(); // <-- importantísimo
                                  handleMarkAsRead(n.id);
                                }}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                        sx={(theme) => ({
                          borderRadius: 1.25,
                          bgcolor: n.isRead
                            ? theme.palette.action.selected
                            : theme.palette.action.hover,
                          m: '4px 6px',
                          cursor: 'pointer',
                        })}
                        onClick={() => {
                          // Caso especial: planeador + CQM => modal
                          if (shouldShowPlannerCqmModal(n as any, user)) {
                            console.log('Abriendo modal especial para', n);
                            setNotifAnchorEl(null); // 👈 cerrar popover
                            setSelectedNotif(n as any);
                            setSpecialModalOpen(true);
                            if (!n.isRead) handleMarkAsRead(n.id);
                            return; 
                          } else if (shouldShowPlannerAuditorModal(n as any, user)) {
                            console.log('Abriendo modal especial para', n);
                            setNotifAnchorEl(null); // 👈 cerrar popover
                            setSelectedNotif(n as any);
                            setSpecialModalAuditorOpen(true);
                            if (!n.isRead) handleMarkAsRead(n.id);
                            return; 
                          } else if (shouldShowPlannerOpersModal(n as any, user)) {
                            console.log('Abriendo modal especial para', n);
                            setNotifAnchorEl(null);
                            setSelectedNotif(n as any);
                            setSpecialModalOpersOpen(true);
                            if (!n.isRead) handleMarkAsRead(n.id);
                            return; 
                          }

                          const route = getNotificationRoute(n as any, user);
                          if (route) {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setNotifAnchorEl(null);
                            router.push(route);
                          }
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
                                  style={{
                                    display: 'block',
                                    opacity: 0.9,
                                    color: theme.palette.text.primary,
                                  }}
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
                                  {new Date(n.date).toLocaleString()}
                                </span>
                              )}
                            </>
                          }
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

          {/*<SupportLogo src="/images/support.svg" alt="Soporte Técnico" />*/}
        </div>
      </HeaderContainer>

      {specialModalOpen && selectedNotif && (
        <ModalOverlay>
          <ModalContent>
            <Label style={{ margin: 0 }}>Inconformidad CQM</Label>
            <p style={{ marginTop: 12 }}>{selectedNotif.body}</p>

            <Label>Comentarios</Label>
            <Input>
              {selectedNotif.inconformity?.comments ?? 'Sin comentarios'}
            </Input>

            <Label>Inconformidad aceptada</Label>
            <Input>
              {selectedNotif.inconformity
                ? selectedNotif.inconformity.reviewed
                  ? 'Si'
                  : 'En espera de revisión'
                : 'En espera de revisión'}
            </Input>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20,
              }}
            >
              <RechazarButton onClick={() => setSpecialModalOpen(false)}>
                Cerrar
              </RechazarButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {specialAuditorOpen && selectedNotif && (
        <ModalOverlay>
          <ModalContent>
            <Label style={{ margin: 0 }}>Inconformidad Auditoría</Label>
            <p style={{ marginTop: 12 }}>{selectedNotif.body}</p>

            <Label>Comentarios</Label>
            <Input>
              {selectedNotif.inconformity?.comments ?? 'Sin comentarios'}
            </Input>

            <Label>Inconformidad aceptada</Label>
            <Input>
              {selectedNotif.inconformity
                ? selectedNotif.inconformity.reviewed
                  ? 'Si'
                  : 'En espera de revisión'
                : 'En espera de revisión'}
            </Input>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20,
              }}
            >
              {/* ✅ Cierra el modal correcto */}
              <RechazarButton onClick={() => setSpecialModalAuditorOpen(false)}>
                Cerrar
              </RechazarButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
     
      {specialOpersOpen && selectedNotif && (
        <ModalOverlay>
          <ModalContent>
            <Label style={{ margin: 0 }}>Inconformidad Operaciones</Label>
            <p style={{ marginTop: 12 }}>{selectedNotif.body}</p>

            <Label>Comentarios</Label>
            <Input>
              {selectedNotif.inconformity?.comments ?? 'Sin comentarios'}
            </Input>

            <Label>Inconformidad aceptada</Label>
            <Input>
              {selectedNotif.inconformity
                ? selectedNotif.inconformity.reviewed
                  ? 'Si'
                  : 'En espera de revisión'
                : 'En espera de revisión'}
            </Input>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20,
              }}
            >
              {/* ✅ Cierra el modal correcto */}
              <RechazarButton onClick={() => setSpecialModalOpersOpen(false)}>
                Cerrar
              </RechazarButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

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
  color: ${({ theme }) =>
    theme.palette.getContrastText(theme.palette.primary.main)};
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
  color: ${({ theme }) =>
    theme.palette.getContrastText(theme.palette.primary.main)};
`;

const NotifContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px 8px;
  color: ${({ theme }) => theme.palette.text.secondary};
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

const NotifList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${({ theme }) => theme.palette.text.primary};
  padding: 4px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400; /* ⬆️ por encima del Popover de MUI */
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  margin: 1rem;
  border-radius: 10px;
  width: 400px;
  text-align: left;
`;

const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
  width: 50%;
`;

const Input = styled.div`
  width: 100%;
  color: black;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;

const RechazarButton = styled.button<{ disabled?: boolean }>`
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
    outline: none;
  }
`;