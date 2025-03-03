"use client";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import AuthFlipCard from "../../../components/Auth/AuthFlipCard";
import Header from "../../../components/Header/Header";

const GlobalStyle = createGlobalStyle`
  html, body, #__next {
    height: 100%;
    margin: 0;
    padding: 0;
    background: linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)),
                url('/images/apolopaper.jpg') no-repeat center center fixed;
    background-size: cover;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

const PageContainer = styled.div`
  position: relative;
  width: 100vw;
  height: calc(100vh - 60px); /* Descontamos la altura del header */
`;

// El logo ocupará la mitad izquierda de la pantalla y se centrará en esa área
const LogoContainer = styled.div`
  position: absolute;
  left: 0;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  transform: translateY(-50%);
`;

// El formulario se posiciona en la mitad derecha, un poco más arriba (top: 45%),
// y se separa del borde con un padding-left.
const FormContainer = styled.div`
  position: absolute;
  right: 0;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  top: 45%;
  transform: translateY(-50%);
  padding-left: 50px;
`;

const Footer = styled.footer`
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: #000; /* Texto negro */
  padding: 5px 0;

  a {
    color: #000;
    text-decoration: underline;
    margin: 0 5px;
  }
`;

const AuthPage: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Header />
      <PageContainer>
        <LogoContainer>
          <img src="/images/rocket.svg" alt="Logo" style={{ width: "150px" }} />
        </LogoContainer>
        <FormContainer>
          <AuthFlipCard />
        </FormContainer>
        <Footer>
          © 2025 Run Solutions Services |{" "}
          <a href="#">About us</a> | <a href="#">MIT License</a>
        </Footer>
      </PageContainer>
    </>
  );
};

const LoginPage: React.FC = () => {
  return <AuthPage />;
};

export default LoginPage;

