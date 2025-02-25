import React from "react";
import styled from "styled-components";

// Contenedor principal del header con el mismo gradiente que el formulario
const HeaderContainer = styled.header`
  background: linear-gradient(45deg, #6adbef, #5ce1e6);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// Contenedor para el logo y el nombre de la app
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;


// Nombre de la app con letras más robustas y contorno en las letras
const AppName = styled.h1`
  font-size: 28px;
  font-weight: 800; /* Fuente más gruesa */
  color: #fff;
  margin: 0;
  -webkit-text-stroke: 2px #fffff; /* Contorno más grueso */
  letter-spacing: 2px;
`;

// Imagen para el logo de soporte técnico
const SupportLogo = styled.img`
  height: 40px;
  width: auto;
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <LogoContainer>
        <AppName>APOLOWARE</AppName>
      </LogoContainer>
      {/* Ajusta la ruta del logo de soporte técnico */}
      <SupportLogo src="/images/support.svg" alt="Soporte Técnico" />
    </HeaderContainer>
  );
};

export default Header;
