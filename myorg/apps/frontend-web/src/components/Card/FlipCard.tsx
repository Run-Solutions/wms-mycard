'use client';
import React from 'react';
import styled from 'styled-components';

// Contenedor de la tarjeta con perspectiva
const CardWrapper = styled.div`
  width: 300px;
  height: 250px;
  perspective: 1000px;
`;

// Contenedor interno que realiza el flip
const Content = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  will-change: transform;
  border-radius: 5px;
  box-shadow: 0px 0px 10px 1px #000000ee;
  transform: translateZ(0);
  &:hover {
    transform: rotateY(180deg);
  }
`;

// Estilo base para las dos caras de la tarjeta
const Face = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  will-change: transform;
  transform: translateZ(0);
`;

// Parte frontal: el fondo se genera a partir del theme y se fuerza texto blanco y en negrita
const Front = styled(Face)`
  background: ${({ theme }) =>
    `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`};
  color: #fff;
  & * {
    font-weight: bold;
    color: #fff;
  }
`;

// Propiedad transient para la imagen de fondo
interface BackProps {
  $backgroundUrl: string;
}
const Back = styled(Face)<BackProps>`
  background: ${({ theme, $backgroundUrl }) =>
    `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${$backgroundUrl}) no-repeat center center`};
  background-size: cover;
  color: #fff;
  transform: rotateY(180deg);
  position: relative;
`;

// Contenedor para el ícono (o logo)
const IconContainer = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
  img {
    width: 50px;
    height: auto;
  }
`;

// Etiqueta para el título: texto blanco y negrita
const TitleBadge = styled.div`
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  text-transform: uppercase;
  color: #fff;
  font-weight: bold;
`;

// Texto en la parte trasera: forzamos texto blanco y en negrita
const BackText = styled.p`
  text-align: center;
  font-size: 14px;
  margin: 0;
  color: #fff;
  font-weight: bold;
`;

interface FlipCardProps {
  title: string;
  description: string;
  imageName: string;
  logoName: string;
  frontIcon?: React.ReactNode;
}

const FlipCard: React.FC<FlipCardProps> = ({
  title,
  description,
  imageName,
  logoName,
  frontIcon,
}) => {
  const backgroundUrl = `/images/${imageName}`;
  const logoUrl = `/logos/${logoName}`;

  return (
    <CardWrapper>
      <Content>
        <Front>
          <IconContainer>
            {frontIcon ? frontIcon : <img src={logoUrl} alt={`${title} logo`} />}
          </IconContainer>
          <TitleBadge>{title}</TitleBadge>
        </Front>
        <Back $backgroundUrl={backgroundUrl}>
          <BackText>{description}</BackText>
        </Back>
      </Content>
    </CardWrapper>
  );
};

export default FlipCard;
