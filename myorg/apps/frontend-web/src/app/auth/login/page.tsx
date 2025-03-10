// myorg\apps\frontend-web\src\app\auth\login\page.tsx
"use client";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import AuthFlipCard from "../../../components/Auth/AuthFlipCard";
import Header from "../../../components/Header/Header";

const GlobalStyle = createGlobalStyle`
  html, body, #__next {
    width: 100%;
    min-height: 100vh;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden; /* Evita desbordamiento horizontal */
    background: linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)),
                url('/images/items.jpg') no-repeat center center fixed;
    background-size: cover;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  min-height: 100vh; /* Garantiza que tome toda la pantalla */
  padding: 20px;
  margin: 0 auto;
  gap: 20px; /* Reduce el espacio entre el logo y el formulario */

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
    padding-top: 100px; /* Ajuste para evitar que el navbar cubra contenido */
    margin-bottom: 80px;
  }
`;

const LogoContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 400px;
  padding-right: 100px;
  img { width: 400px; }
  @media (max-width: 768px) {
    width: 100%;
    padding-bottom: 20px;

  }
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding-left: 0px;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Footer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: #000; /* Texto negro */
  padding: 10px;
  a {
    color: #000;
    text-decoration: underline;
    margin: 0 5px;
  }
  @media (max-width: 768px) {
    position: relative; /* Se mueve con el flujo normal en móviles */
  }
`;

const AuthPage: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Header />
      <PageContainer>
        <LogoContainer>
          <img src="/images/card.svg" alt="Logo" />
        </LogoContainer>
        <FormContainer>
          <AuthFlipCard />
        </FormContainer>
      </PageContainer>
      <Footer>
        © 2025 Run Solutions Services |{" "}
        <a href="#">About us</a> | <a href="#">MIT License</a>
      </Footer>
    </>
  );
};

const LoginPage: React.FC = () => {
  return <AuthPage />;
};

export default LoginPage;