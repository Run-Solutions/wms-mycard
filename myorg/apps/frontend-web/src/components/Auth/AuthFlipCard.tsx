// src/components/Auth/AuthFlipCard.tsx
'use client';

import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ToggleSwitch from './ToggleSwitch';
import { useAuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { login } from '@/api/auth';
import { verifyUsername } from '@/api/auth';

const AuthFlipCard: React.FC = () => {
  const router = useRouter();
  const { setUser, setToken } = useAuthContext();
  
  // Estados para login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estados para registro
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await login(loginEmail, loginPassword); // usa el método de auth.ts
      const data = res.data; // axios guarda el payload aquí
  
      console.log('Respuesta de data desde el back:', data);
  
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        console.log('Token almacenado:', data.token);
      } else {
        console.error('⛔ No se ha recibido el token');
      }
  
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
  
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en login');
      console.error('Error en login:', err);
    }
  };
  
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const safeUsername = regUsername.trim();
  
    // Validar campos vacíos
    if (!safeUsername || !regEmail || !regPassword || !regConfirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
  
    // Validar caracteres válidos para el nombre de usuario
    const isValidUsername = /^[a-zA-Z0-9._-]+$/.test(safeUsername);
    if (!isValidUsername) {
      toast.error('El nombre de usuario solo puede contener letras, números, ".", "-", y "_" (sin espacios)');
      return;
    }
  
    try {
      const response = await verifyUsername(safeUsername);
      const exists = await response.data;
      if (exists) {
        toast.error(`El nombre de usuario "${safeUsername}" ya está en uso`);
        return;
      }
  
      if (regPassword !== regConfirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
  
      const pendingUser = {
        username: safeUsername,
        email: regEmail,
        password: regPassword,
      };
  
      // Guardar en sessionStorage para recuperar luego en roleSelection
      sessionStorage.setItem('username', safeUsername);
      sessionStorage.setItem('email', regEmail);
      sessionStorage.setItem('password', regPassword);
  
      // También en localStorage si quieres persistencia
      localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
      localStorage.setItem('user', JSON.stringify({ ...pendingUser, role: 'pending', id: Date.now().toString() }));
  
      // Opcional: despachar al authSlice
 
      router.push('/auth/roleSelection');
    } catch (err: any) {
      toast.error('Error al verificar el nombre de usuario');
    }
  };
  
  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <FormContainer>
          <ToggleContainer>
            <ToggleSwitch
              checked={isFlipped}
              onChange={(e) => setIsFlipped(e.target.checked)}
              />
          </ToggleContainer>
          <FlipCardInner
            style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}
            >
            <FlipCardFront>
              <Card>
                <CardContent>
                  <LoginForm
                    loginEmail={loginEmail}
                    loginPassword={loginPassword}
                    onEmailChange={(e) => setLoginEmail(e.target.value)}
                    onPasswordChange={(e) => setLoginPassword(e.target.value)}
                    onSubmit={handleLoginSubmit}
                    onSignUpClick={() => setIsFlipped(true)}
                    />
                </CardContent>
              </Card>
            </FlipCardFront>
            <FlipCardBack>
              <Card transparent>
                <CardContent>
                  <RegisterForm
                    regUsername={regUsername}
                    regEmail={regEmail}
                    regPassword={regPassword}
                    regConfirmPassword={regConfirmPassword}
                    onUsernameChange={(e) => setRegUsername(e.target.value)}
                    onEmailChange={(e) => setRegEmail(e.target.value)}
                    onPasswordChange={(e) => setRegPassword(e.target.value)}
                    onConfirmPasswordChange={(e) =>
                      setRegConfirmPassword(e.target.value)
                    }
                    onSubmit={handleRegisterSubmit}
                    onLoginClick={() => setIsFlipped(false)}
                    />
                </CardContent>
              </Card>
            </FlipCardBack>
          </FlipCardInner>
        </FormContainer>
      </PageContainer>
    </>
  );
};

export default AuthFlipCard;

// =================== Styled Components ===================
const GlobalStyle = createGlobalStyle`
  html, body, #__next {
    height: 100%;
    margin: 0;
    padding: 0;
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
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: auto;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  margin-left: 140px;
`;

const FlipCardInner = styled.div`
  width: 300px;
  height: 472px;
  position: relative;
  perspective: 1000px;
  transition: transform 0.8s;
  transform-style: preserve-3d;
`;

const FlipCardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FlipCardFront = styled(FlipCardSide)`
  z-index: 2;
`;

const FlipCardBack = styled(FlipCardSide)`
  transform: rotateY(180deg);
  z-index: 1;
`;

interface CardProps {
  transparent?: boolean;
}

const Card = styled.div.withConfig({
  shouldForwardProp: (prop: string) => prop !== 'transparent',
})<CardProps>`
  width: 300px;
  border-radius: 22px;
  transition: all 0.3s;
  background: ${(props) =>
    props.transparent
      ? 'transparent'
      : 'linear-gradient(163deg, #00ff75 0%, #3700ff 100%)'};
  ${(props) => props.transparent && `box-shadow: none;`}
`;

const CardContent = styled.div`
  border-radius: 0;
  transition: all 0.2s;
`;
