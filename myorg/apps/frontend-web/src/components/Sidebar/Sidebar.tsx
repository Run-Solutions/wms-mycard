// src/components/Sidebar.tsx
'use client';

import React from "react";
import { Drawer, ListItemButton, ListItemText, Button, Box } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useRouter } from "next/navigation";
import { sidebarItems } from "@/config/sidebarItems";

const drawerOpenWidth = 200;
const collapsedWidth = 60;
const headerHeight = 64;

export interface SidebarProps {
  open: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onLogout }) => {
  const router = useRouter();

  const handleNavigate = (label: string) => {
    let route = "";
    if (label.toLowerCase() === "home") {
      route = "/dashboard";
    } else if (label.toLowerCase() === "dashboard") {
      route = "/graph";
    } else {
      route = `/${label.toLowerCase()}`;
    }
    router.push(route);
  };

  // Ejemplo de logout: borra el usuario y redirige a /auth/login
  const handleLogout = () => {
    localStorage.removeItem('user');
    onLogout(); // Llama a la función pasada como prop (si realiza acciones adicionales)
    router.push('/auth/login');
  };

  return (
    <Drawer
      variant="persistent"
      open={true}
      sx={{
        width: open ? drawerOpenWidth : collapsedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": (theme: any) => ({
          width: open ? drawerOpenWidth : collapsedWidth,
          boxSizing: "border-box",
          transition: "width 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
          willChange: "width",
          overflowX: "hidden",
          background: theme.palette.primary.main,
          color: "#fff",
        }),
      }}
    >
      <Box sx={{ height: headerHeight }} />
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        {sidebarItems.map((item) => (
          <ListItemButton
            key={item.label}
            onClick={() => handleNavigate(item.label)}
            sx={{
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              justifyContent: open ? "initial" : "center",
              paddingX: open ? 2 : 0,
              borderRadius: "4px",
              margin: "4px",
            }}
          >
            <img
              src={item.logo}
              alt={item.label}
              style={{ width: "32px", height: "32px", objectFit: "contain" }}
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
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.3)" }}>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={handleLogout}
          startIcon={<ExitToAppIcon sx={{ color: "#fff" }} />}
          sx={{
            borderColor: "#fff",
            color: "#fff",
            fontWeight: "bold",
            "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Drawer>
  );
};
