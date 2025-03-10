// src/app/dashboard/page.tsx
"use client";
import React from "react";
import { Grid, Box } from "@mui/material";
import FlipCard from "@/components/Card/FlipCard";
import { useRouter } from "next/navigation";

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const cards = [
    {
      title: "users",
      description: "Gestiona y administra los usuarios del sistema.",
      imageName: "users.jpg",
      logoName: "users.webp",
    },
    {
      title: "Ordenes de Trabajo",
      description: "Registra nuevas ordenes de trabajo.",
      imageName: "picking.jpg",
      logoName: "picking.webp",
    },
    {
      title: "Seguimiento OT's",
      description: "Organiza el almacenamiento de productos de forma óptima.",
      imageName: "slotting.jpg",
      logoName: "slotting.webp",
    },
    {
      title: "Dashboard",
      description: "Visualiza reportes y métricas.",
      imageName: "dashboard.jpg",
      logoName: "dashboard.webp",
    },
    {
      title: "Finalización",
      description: "Cerrar Ots que hayan completado el flujo asignado.",
      imageName: "packing.jpg",
      logoName: "packing.webp",
    }
    /*{
      title: "locations",
      description: "Gestiona las ubicaciones y zonas del almacén.",
      imageName: "ubication.jpg",
      logoName: "ubication.webp",
    },
    {
      title: "arrivals",
      description: "Controla la recepción y llegada de mercancías.",
      imageName: "arrivals.jpg",
      logoName: "arrivals.webp",
    },
    {
      title: "putaway",
      description: "Organiza el almacenaje de productos recibidos.",
      imageName: "putaway.jpg",
      logoName: "putaway.webp",
    },
    {
      title: "items",
      description: "Administra el inventario y detalles de productos.",
      imageName: "items.jpg",
      logoName: "items.webp",
    },*/
  ];

  const handleCardClick = (title: string) => {
    // Navega a la ruta correspondiente utilizando el título de la tarjeta
    router.push(`/${title.toLowerCase()}`);
  };

  return (
    <Box sx={{ width: "100%", px: 2, mt: -10 }}>
      <Grid container rowSpacing={1} columnSpacing={2} justifyContent="center">
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box onClick={() => handleCardClick(card.title)} sx={{ cursor: "pointer" }}>
              <FlipCard
                title={card.title}
                description={card.description}
                imageName={card.imageName}
                logoName={card.logoName}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
