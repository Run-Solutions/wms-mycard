// myorg\apps\frontend-web\src\app\auth\register\page.tsx
"use client";

import React, { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { useDispatch } from "react-redux";
import { registerUser } from "../../../store/slices/authSlice";
import { AppDispatch } from "../../../store";
import { useRouter } from "next/navigation";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const GlobalStyle = createGlobalStyle`
  html, body, #__next {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

const BackgroundWrapper = styled.div`
  background: url('/images/server.jpg') no-repeat center center fixed;
  background-size: cover;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FormContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 1s ease-out;
  max-width: 400px;
  width: 100%;
`;

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      await dispatch(registerUser({ username, email, password })).unwrap();
      // Redirige a la ruta configurada (backend ya la tiene configurada)
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    }
  };

  return (
    <>
      <GlobalStyle />
      <BackgroundWrapper>
        <FormContainer>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ color: "#000" }}
            >
              Registro
            </Typography>
            <TextField
              label="Usuario"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              required
            />
            <TextField
              label="Correo electrónico"
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
            <TextField
              label="Confirmar Contraseña"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              required
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
            >
              Registrarse
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ marginTop: 1 }}
              onClick={() => alert("Registro con Google no implementado")}
            >
              Registrarse con Google
            </Button>
          </Box>
        </FormContainer>
      </BackgroundWrapper>
    </>
  );
};

export default RegisterPage;



