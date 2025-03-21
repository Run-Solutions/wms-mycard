// myorg\apps\frontend-web\src\app\auth\login\AuthPage.tsx
'use client';
import React from 'react';
import styled from 'styled-components';
import AuthFlipCard from '../../../components/Auth/AuthFlipCard';

const PageContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

const LogoContainer = styled.div`
  /* Ocupa la mitad izquierda y centra el contenido */
  position: absolute;
  left: 0;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  transform: translateY(-50%);
`;

const FormContainer = styled.div`
  /* El formulario se posiciona en la mitad derecha, un poco más arriba */
  position: absolute;
  left: 50%;
  top: 45%; /* Ajusta este valor para elevar o bajar el formulario */
  transform: translate(0, -50%);
`;

const AuthPage: React.FC = () => {
  return (
    <PageContainer>
      <LogoContainer>
        <img src='/images/card.svg' alt='Logo' style={{ width: '150px' }} />
      </LogoContainer>
      <FormContainer>
        <AuthFlipCard />
      </FormContainer>
    </PageContainer>
  );
};

export default AuthPage;
