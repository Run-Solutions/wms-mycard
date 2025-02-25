"use client";
import React from "react";
import { Grid, Box } from "@mui/material";
import FlipCard from "@/components/Card/FlipCard";

const DashboardPage: React.FC = () => {
  const cards = [
    {
      title: "users",
      description: "Gestiona y administra los usuarios del sistema.",
      imageName: "users.jpg",
      logoName: "users.webp",
    },
    {
      title: "picking",
      description: "Optimiza la selección de productos en el almacén.",
      imageName: "picking.jpg",
      logoName: "picking.webp",
    },
    {
      title: "slotting",
      description: "Organiza el almacenamiento de productos de forma óptima.",
      imageName: "slotting.jpg",
      logoName: "slotting.webp",
    },
    {
      title: "dashboards",
      description: "Visualiza reportes y métricas en tiempo real.",
      imageName: "dashboard.jpg",
      logoName: "dashboard.webp",
    },
    {
      title: "packing",
      description: "Coordina el empaque y preparación de pedidos.",
      imageName: "packing.jpg",
      logoName: "packing.webp",
    },
    {
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
    },
  ];

  return (
    <Box sx={{ width: "100%", px: 2, mt: -10 }}>
      <Grid container rowSpacing={1} columnSpacing={2} justifyContent="center">
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <FlipCard
              title={card.title}
              description={card.description}
              imageName={card.imageName}
              logoName={card.logoName}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
