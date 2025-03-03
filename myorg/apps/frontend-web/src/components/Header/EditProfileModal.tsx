// src/components/Header/EditProfileModal.tsx
'use client';

import React, { useRef, useState } from "react";
import styled, { useTheme } from "styled-components";
import EditIcon from "@mui/icons-material/Edit";

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  profileImage?: string; // Debe contener solo el nombre del archivo
}

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose }) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("role", role);
    if (password) formData.append("password", password);
    if (profileImage) formData.append("profileImage", profileImage);

    try {
      const res = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        onClose();
        window.location.reload();
      } else {
        console.error("Error actualizando perfil:", res.status, data);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  // Cuando se hace clic en el contenedor de la imagen, se activa el input oculto
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <ModalOverlay>
      <ModalContainer theme={theme}>
        <HeaderSection theme={theme}>
          <AvatarContainer onClick={handleAvatarClick}>
            <ProfileLogo
              src={
                user.profileImage
                  ? `http://localhost:3000/uploads/${user.profileImage}`
                  : "/logos/default-avatar.png"
              }
              alt={user.username}
            />
            <EditIconContainer>
              <EditIcon style={{ fontSize: "1.2rem", color: "#fff" }} />
            </EditIconContainer>
            {/* Input oculto para subir imagen */}
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/jpg"
            />
          </AvatarContainer>
          <HeaderTitle theme={theme}>Editar Perfil</HeaderTitle>
        </HeaderSection>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <label>Nombre</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <label>Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <label>Rol</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </InputGroup>
          <ButtonGroup>
            <SubmitButton type="submit" theme={theme}>
              Guardar
            </SubmitButton>
            <CancelButton type="button" onClick={onClose} theme={theme}>
              Cancelar
            </CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default EditProfileModal;

// ======================= Styled Components =======================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const ModalContainer = styled.div<{ theme: any }>`
  background: ${props => props.theme.palette.primary.main};
  padding: 2rem;
  border-radius: 1rem;
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: ${props => props.theme.palette.text.primary};
`;

const HeaderSection = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.palette.divider};
  padding-bottom: 1rem;
`;

const AvatarContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const ProfileLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

const EditIconContainer = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  padding: 2px;
`;

const HeaderTitle = styled.h2<{ theme: any }>`
  font-size: 1.8rem;
  color: ${props => props.theme.palette.text.primary};
  margin-left: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: ${props => props.theme.palette.text.primary};
  }
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    color: #000; /* La información escrita siempre será negra */
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SubmitButton = styled.button<{ theme: any }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background-color: ${props => props.theme.palette.secondary.main};
  color: white;
  font-weight: bold;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.theme.palette.secondary.dark || "#000"};
  }
`;

const CancelButton = styled.button<{ theme: any }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background-color: ${props => props.theme.palette.error.main};
  color: white;
  font-weight: bold;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.theme.palette.error.dark || "#000"};
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;
