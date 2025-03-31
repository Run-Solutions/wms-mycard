// src/app/(protected)/permisos/page.tsx
'use client';

import { Switch } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

interface Permission {
  id: number;
  role_id: number;
  role_name: string;
  module_id: number;
  module_name: string;
  enabled: boolean;
  module?: {
    id:number;
    name: string;
  };
  role?: {
    id: number;
    name: string;
  };
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const theme = useTheme();

  useEffect(() => {
    async function fetchPermissions() {
      try {
        // se verifica token
        const token = localStorage.getItem('token');
        if(!token) {
          console.error('No se encontro el token en localStorage');
          return;
        }
        console.log('Token enviado a headers: ', token)

        const res = await fetch('http://localhost:3000/permissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if(!res.ok) {
          throw new Error(`Error al obtener permisos: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('Datos obtenidos: ', data);

        if(Array.isArray(data)) {
          setPermissions(data);
        } else {
          console.error('Formato de datos inesperado: ', data);
        }
      } catch (err) {
        console.error(err);
        console.error('Error en fetchPermissions:', err);
      }
    }
    fetchPermissions();
  }, []);
  
  console.log('Ejemplo de primer permiso:', permissions[0]);

  // transformar la estructura de datos · agrupar permisos por rol
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const roleId = perm.role_id;
    const roleName = perm.role?.name || `Role ${roleId}`;
    const moduleName = perm.module?.name || `Module ${perm.module_id}`;

    console.log(`Procesando permiso: ${roleName} -> ${moduleName}`);
    
    if(!acc[roleId]) {
      acc[roleId] = {
        id: roleId,
        name: roleName,
        modules: [],
      };
    }
    
    acc[roleId].modules.push({
      id: perm.module_id,
      name: moduleName,
      enabled: perm.enabled ?? false,
    });
    return acc;
  }, {} as Record<number, { id: number; name: string; modules: { id: number; name: string; enabled: boolean }[] }>);
  
  const formattedPermissions = Object.values(groupedPermissions)
  console.log('Formatted permissions', formattedPermissions);

  const toggleModule = async (roleId: number, moduleId: number) => {
    try {
      // se verifica token
      const token = localStorage.getItem('token');
      if(!token) {
        console.error('No se encontro el token en localStorage');
        return;
      }

      // encuentra el permiso especifico
      const togglePermission = permissions.find(
        (perm) => perm.role_id === roleId && perm.module_id === moduleId
      );

      if(!togglePermission) {
        console.error('No se encontró el permiso para actualizar');
        return;
      }

      // Nuevo estado
      const newEnabledState = !togglePermission.enabled;

      console.log('Token enviado a headers: ', token)

      // llamada al backend para actualizar el estado
      const res = await fetch(`http://localhost:3000/permissions/${togglePermission.role_id}/${togglePermission.module_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newEnabledState }),
      });

      if(!res.ok) {
        throw new Error (`Error al actualizar permiso: ${res.status} ${res.statusText}`);
      }

      //Actualizar el estado local solo si se responde correctamente
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.role_id === togglePermission.role_id && perm.module_id === togglePermission.module_id
            ? { ...perm, enabled: newEnabledState } 
            : perm
      )
    );
    console.log(`Permiso actualizado: ${togglePermission.id}, enabled ${newEnabledState}`);
  } catch (error) {
    console.log('Error al actualizar el permiso: ', error);
    
    }
  };
  
  return (
    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Gestion de roles y permisos</Title>
      </TitleWrapper>
      <FormWrapper>
      <CardsContainer>
        {formattedPermissions.map((permission) => (
          <PermissionCard key={permission.id} theme={theme}>
            <CardTitle>{permission.name}</CardTitle>
            <ModulesList>
              {permission.modules.map((mod) => (
                <ModuleItem key={mod.id}>
                  <span>{mod.name}</span>
                  <Switch checked={mod.enabled} onChange={() => toggleModule(permission.id, mod.id)}></Switch>
                </ModuleItem>
              ))}
            </ModulesList>
          </PermissionCard>
        ))}
      </CardsContainer>
      </FormWrapper>
    </PageContainer>
  );
};
export default PermissionsPage;

// =========================== Styled Components ================================================================

const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -70px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
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

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 10px;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 3rem;
  margin: 0 auto;
`;
const PermissionCard = styled.div<{ theme: any }>`
  background-color: ${(props) => props.theme.palette.primary.light};
  padding: 1.5rem;
  border-radius: 4em;
  border: 3px solid ${(props) => props.theme.palette.secondary.main};
  width: 300px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); // Sombra ligera
`;
const CardTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: white;
`;

const ModulesList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ModuleItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  border-radius: 0.5em;
  margin-bottom: 0.5rem;
  color: white;
`;