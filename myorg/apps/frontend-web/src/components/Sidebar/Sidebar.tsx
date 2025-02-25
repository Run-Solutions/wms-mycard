import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Drawer,
  ListItemButton,
  ListItemText,
  Button,
  Box,
  Tooltip,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { sidebarItems } from "@/config/sidebarItems";

const drawerOpenWidth = 200;
const collapsedWidth = 60;
const headerHeight = 64;

export interface SidebarProps {
  open: boolean;
  onNavigate: (label: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onNavigate,
  onLogout,
}) => {
  const drawerPaperRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useLayoutEffect(() => {
    if (drawerPaperRef.current) {
      // Forzamos el reflow
      void drawerPaperRef.current.offsetWidth;
    }
    // Usamos un pequeño retraso para activar la transición después del primer repintado
    setTimeout(() => {
      setInitialLoad(false);
    }, 50);
  }, []);

  return (
    <Drawer
      variant="persistent"
      open={true} // Siempre visible; el ancho se ajusta según el estado
      PaperProps={{
        ref: drawerPaperRef,
      }}
      sx={{
        width: open ? drawerOpenWidth : collapsedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": (theme: any) => ({
          width: open ? drawerOpenWidth : collapsedWidth,
          boxSizing: "border-box",
          // Si es el primer render, desactivamos la transición
          transition: initialLoad
            ? "none"
            : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "width",
          overflowX: "hidden",
          background: theme.palette.primary.main,
          color: "#fff",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }),
      }}
    >
      <Box sx={{ height: headerHeight }} />
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        {sidebarItems.map((item) => (
          <ListItemButton
            key={item.label}
            sx={{
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              transition: "background-color 0.3s",
              justifyContent: open ? "initial" : "center",
              paddingX: open ? 2 : 0,
              borderRadius: "4px",
              margin: "4px",
            }}
            onClick={() => onNavigate(item.label)}
          >
            <img
              src={item.logo}
              alt={item.label}
              style={{
                width: "32px",
                height: "32px",
                objectFit: "contain",
              }}
            />
            {open && (
              <ListItemText
                primary={item.label}
                sx={{
                  ml: 2,
                  "& .MuiTypography-root": {
                    fontWeight: "bold",
                    color: "#fff",
                  },
                }}
              />
            )}
          </ListItemButton>
        ))}
      </Box>
      {open ? (
        <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.3)" }}>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={onLogout}
            startIcon={<ExitToAppIcon sx={{ color: "#fff" }} />}
            sx={{
              borderColor: "#fff",
              color: "#fff",
              fontWeight: "bold",
              "&:hover": {
                borderColor: "#fff",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            p: 1,
            borderTop: "1px solid rgba(255,255,255,0.3)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tooltip title="Cerrar sesión" placement="right">
            <Button
              variant="outlined"
              color="inherit"
              onClick={onLogout}
              sx={{
                minWidth: 0,
                padding: "6px",
                borderColor: "#fff",
                color: "#fff",
                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ExitToAppIcon sx={{ color: "#fff" }} />
            </Button>
          </Tooltip>
        </Box>
      )}
    </Drawer>
  );
};
