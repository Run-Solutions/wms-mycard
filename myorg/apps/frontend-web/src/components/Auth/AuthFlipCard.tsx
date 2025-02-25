"use client";
import React, { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ToggleSwitch from "./ToggleSwitch";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import { loginUser, registerUser } from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";

// GlobalStyle con fondo casi blanco
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

// Layout de dos columnas: logo a la izquierda, formulario a la derecha
const PageContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const LogoContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

// Contenedor del toggle: centrado horizontalmente para que se posicione sobre el formulario
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
  shouldForwardProp: (prop: string) => prop !== "transparent",
})<CardProps>`
  width: 300px;
  border-radius: 22px;
  transition: all 0.3s;
  background: ${(props) =>
    props.transparent
      ? "transparent"
      : "linear-gradient(163deg, #00ff75 0%, #3700ff 100%)"};
  ${(props) => props.transparent && `box-shadow: none;`}
`;

// Se eliminó el efecto hover para evitar el movimiento extraño
const CardContent = styled.div`
  border-radius: 0;
  transition: all 0.2s;
`;

const AuthFlipCard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [isFlipped, setIsFlipped] = useState(false);

  // Estados para login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estados para registro
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await dispatch(loginUser({ username: loginEmail, password: loginPassword })).unwrap();
      router.push("/dashboard");
    } catch (err: any) {
      setLoginError(err.message || "Error al iniciar sesión");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setRegError("Las contraseñas no coinciden");
      return;
    }
    try {
      await dispatch(registerUser({ username: regUsername, email: regEmail, password: regPassword })).unwrap();
      router.push("/auth/login");
    } catch (err: any) {
      setRegError(err.message || "Error al registrarse");
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
          <FlipCardInner style={{ transform: isFlipped ? "rotateY(180deg)" : "none" }}>
            <FlipCardFront>
              <Card>
                <CardContent>
                  <LoginForm
                    loginEmail={loginEmail}
                    loginPassword={loginPassword}
                    onEmailChange={(e) => setLoginEmail(e.target.value)}
                    onPasswordChange={(e) => setLoginPassword(e.target.value)}
                    onSubmit={handleLoginSubmit}
                    error={loginError}
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
                    onConfirmPasswordChange={(e) => setRegConfirmPassword(e.target.value)}
                    onSubmit={handleRegisterSubmit}
                    error={regError}
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
