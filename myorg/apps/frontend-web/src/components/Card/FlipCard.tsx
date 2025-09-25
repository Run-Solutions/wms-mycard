"use client";
import React from "react";
import styled, { css } from "styled-components";

/**
 * MotionCard: reemplaza el flip 3D por una tarjeta estática
 * con animación sutil al hover (elevación, parallax del fondo
 * y brillo diagonal). Mantiene la lógica de props y el badgeCount,
 * ahora colocado DEBAJO del título.
 */

// ====== Tokens rápidos ======
const elevateShadow = `0 8px 24px rgba(0,0,0,0.25)`;
const baseShadow = `0 2px 10px rgba(0,0,0,0.25)`;

// Contenedor externo
const CardWrapper = styled.div<{ $clickable?: boolean }>`
  width: 300px;
  height: 250px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: ${baseShadow};
  transform: translateZ(0);
  background: ${({ theme }) => theme.palette.background.paper};
  transition: box-shadow 220ms ease, transform 220ms ease;
  will-change: transform, box-shadow;

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;
    `}

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-6px) scale(1.015);
      box-shadow: ${elevateShadow};
    }
  }

  // Accesibilidad: foco visible si es interactiva
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }

  // Respeto a usuarios con reducción de movimiento
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
      box-shadow: ${baseShadow};
    }
  }
`;

// Capa visual completa (sin 3D)
const Surface = styled.div<{ $hasImage: boolean; $isError: boolean; $badgeCount: number }>`
  position: absolute;
  inset: 0;

  /* Usa grid si quieres filas; si no, elimina grid-template-rows */
  display: grid;
  grid-template-rows: auto 1fr;

  /* Crea un stacking context para controlar capas internas */
  isolation: isolate;
  color: #fff;

  background: ${({ theme, $isError, $badgeCount }) =>
    $isError && $badgeCount > 0
      ? `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.primary.main})`
      : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`};

  /* Asegura que el contenido quede por encima de los overlays */
  > * {
    position: relative;
    z-index: 2;
  }

  /* Filtro/overlay para mejorar contraste del texto */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: ${({ $hasImage }) =>
      $hasImage
        ? "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.25))"
        : "linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.15))"};
    z-index: 0;
  }

  /* Brillo diagonal sutil */
  &::after {
    content: "";
    position: absolute;
    top: -60%;
    left: -60%;
    width: 120%;
    height: 220%;
    transform: rotate(20deg) translate3d(0,0,0);
    background: radial-gradient(ellipse at 30% 10%, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%);
    opacity: 0;
    transition: opacity 300ms ease, transform 500ms ease;
    z-index: 1;
    pointer-events: none;
  }

  @media (hover: hover) and (pointer: fine) {
    ${CardWrapper}:hover &::after {
      opacity: 1;
      transform: rotate(20deg) translate3d(8px, -6px, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &::after { transition: none; }
  }
`;

// Capa de imagen (parallax leve) – usa imageName
const BackgroundImage = styled.div<{ $url: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $url }) =>
    $url
      ? `url(${$url}) center/cover no-repeat`
      : "none"};
  transform: scale(1.06) translateZ(0);
  transition: transform 600ms ease;
  z-index: -1; // por debajo del overlay del Surface

  @media (hover: hover) and (pointer: fine) {
    ${CardWrapper}:hover & {
      transform: scale(1.12) translateY(-4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// Header con icono + título + badge debajo del título
const Header = styled.div`
  position: central;
  padding: 60px 16px 16px 16px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  grid-template-areas:
    "icon title"
    "icon badge";
  row-gap: 15px;
  align-items: center;
`;

const IconContainer = styled.div`
  grid-area: icon;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  backdrop-filter: blur(2px);
  background: rgba(255, 255, 255, 0.12);
  img { width: 36px; height: 36px; object-fit: contain; }
  svg { font-size: 36px; }
`;

const Title = styled.h3`
  grid-area: title;
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: #fff;
`;

interface CountBadgeProps {
  $isError: boolean;
}

const CountBadge = styled.span<CountBadgeProps>`
  grid-area: badge;
  align-self: center;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 10px;
  border-radius: 9999px;
  background: ${({ theme, $isError }) =>
    $isError ? theme.palette.error.main : theme.palette.secondary.main};
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
`;

// ====== Types ======
interface MotionCardProps {
  title: string;
  imageName: string;
  logoName: string;
  frontIcon?: React.ReactNode;
  badgeCount?: number; // mantiene la lógica
  onClick?: () => void; // opcional para hacerlo interactivo
}

const MotionCard: React.FC<MotionCardProps> = ({
  title,
  imageName,
  logoName,
  frontIcon,
  badgeCount = 0,
  onClick,
}) => {
  const backgroundUrl = `/images/${imageName}`;
  const logoUrl = `/logos/${logoName}`;
  const isError = ["inconformidades", "rechazos"].includes(title.toLowerCase());

  const clickable = Boolean(onClick);

  return (
    <CardWrapper
      $clickable={clickable}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Capa de imagen con parallax */}
      <BackgroundImage $url={backgroundUrl} />

      {/* Superficie con gradiente + brillo */}
      <Surface $hasImage={!!imageName} $isError={isError} $badgeCount={badgeCount}>
        <Header>
          <IconContainer>
            {frontIcon ? (
              frontIcon
            ) : (
              <img src={logoUrl} alt={`${title} logo`} />
            )}
          </IconContainer>

          <Title>{title}</Title>

          {badgeCount > 0 && <CountBadge $isError={isError}>{badgeCount}</CountBadge>}
        </Header>


      </Surface>
    </CardWrapper>
  );
};

export default MotionCard;

// ====== Ejemplo de uso ======
// <MotionCard
//   title="Recepción CQM"
//   description="Revisa y gestiona las recepciones pendientes de tu área."
//   imageName="recepcion.jpg"
//   logoName="cqm.svg"
//   badgeCount={7}
//   onClick={() => console.log("Abrir módulo")}
// />
