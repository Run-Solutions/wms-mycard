// src/app/(protected)/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, Avatar, TextField, Box } from '@mui/material';
import styled, { useTheme } from 'styled-components';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: {id:number, name: string, createdAt: string, updateAt: string};
  profile_image?: string;
}

const UsersPage: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const theme = useTheme();

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/users');
      const data = await res.json();
  
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('Formato de datos inesperado:', data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (user: User) => {
    setDeleteUser(user);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', editingUser?.username || '');
    formData.append('email', editingUser?.email || '');
    formData.append('phone', editingUser?.phone || '');
    formData.append('role', editingUser?.role?.name || '');

    try {
      const response = await fetch(`http://localhost:3000/users/${editingUser?.id}`, {
        method: 'PATCH', // Cambié a PATCH para que coincida con tu controlador
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        await fetchUsers();  // recarga toda la lista desde el backend
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
    }
  };
  
  const handleFormDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/users/${deleteUser?.id}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        await fetchUsers();
        setDeleteUser(null);
      }
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
    }
  };

  return (
    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Usuarios</Title>
      </TitleWrapper>
      <TableContainer component={Paper} sx={{ backgroundColor: 'white', padding: '2rem', mt: 4, borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '100%', marginX: 'auto' }}>
        <Box color='black' display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <TextField label="Buscar OT" variant="outlined" size="small" value={searchValue} onChange={handleSearchChange} sx={{ '& label': { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' }, '&:hover fieldset': { borderColor: 'black' }, '&.Mui-focused fieldset': { borderColor: 'black' }, color: 'black', }, }} />
        </Box>

        {filteredUsers.length === 0 ? (
          <Typography sx={{ p: 2 }}>No hay usuarios para mostrar.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell><strong>Foto</strong></CustomTableCell>
                <CustomTableCell><strong>Usuario</strong></CustomTableCell>
                <CustomTableCell><strong>Email</strong></CustomTableCell>
                <CustomTableCell><strong>Teléfono</strong></CustomTableCell>
                <CustomTableCell><strong>Rol</strong></CustomTableCell>
                <CustomTableCell><strong>Acciones</strong></CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar
                      src={
                        user.profile_image
                          ? `http://localhost:3000/uploads/${user.profile_image}`
                          : '/logos/users.webp'
                      }
                      alt={user.username}
                    />
                  </TableCell>
                  <CustomTableCell>{user.username}</CustomTableCell>
                  <CustomTableCell>{user.email}</CustomTableCell>
                  <CustomTableCell>{user.phone || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{user.role?.name || 'Sin rol'}</CustomTableCell>
                  <CustomTableCell>
                    <Box display="flex" gap={1}>
                      <Button variant="contained" color="primary" onClick={() => handleEdit(user)}>Editar</Button>
                      <Button variant="contained" color="error" onClick={() => handleDelete(user)}>Eliminar</Button>
                    </Box>
                  </CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {editingUser && (
          <EditFormContainer>
            <EditFormContent>
              <h4 className='h4'>Editar Usuario</h4>
              <form onSubmit={handleFormSubmit}>
                <FormGroup>
                  <FormLabel>Nombre:</FormLabel>
                  <FormInput
                    type="text"
                    value={editingUser.username}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, username: e.target.value })
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Email:</FormLabel>
                  <FormInput
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Teléfono:</FormLabel>
                  <FormInput
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, phone: e.target.value })
                    }
                  />
                </FormGroup>
                <ButtonGroup>
                  <ActionButton type="submit" color="primary">Guardar</ActionButton>
                  <CancelButton type="button" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </CancelButton>
                </ButtonGroup>
              </form>
            </EditFormContent>
          </EditFormContainer>
        )}
        {deleteUser && (
        <EditFormContainer>
          <EditFormContent>
            <h4 className='h4'>Eliminar Usuario</h4>
            <p className='p'>¿Seguro que quieres eliminar a <strong>{deleteUser.username}</strong>?</p>
            <ButtonGroup>
              <ActionButton type="button" color="error" onClick={handleFormDelete}>Eliminar</ActionButton>
              <CancelButton type="button" onClick={() => setDeleteUser(null)}>Cancelar</CancelButton>
            </ButtonGroup>
          </EditFormContent>
        </EditFormContainer>
      )}
      </TableContainer>
    </PageContainer>
  );
};

export default UsersPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
  margin-top: -70px;
`;

const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const CustomTableCell = styled(TableCell)`
  color: black !important;
  font-size: 1rem;
`;

const EditFormContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const EditFormContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 90%;

  .h4 {
    color: black;
    font-size: 1.5rem;
  }
  .p {
    color: black;
    font-size: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: black;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  color: black;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const ActionButton = styled(Button)`
  && {
    background-color: #2563eb;
    color: white;
  }
`;

const CancelButton = styled(Button)`
  && {
    background-color: #9e9e9e;
    color: white;
  }
`;