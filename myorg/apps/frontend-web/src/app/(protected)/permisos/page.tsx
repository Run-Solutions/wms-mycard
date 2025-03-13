// src/app/(protected)/permisos/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Permission {
  id: number;
  name: string;
  enabled: boolean;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('http://localhost:3000/auth/roles');
        const data = await res.json();

        // Aseguramos que permissions tenga la estructura correcta
        const formattedData: Role[] = data.map((role: any) => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions.map((perm: any) => ({
            id: perm.id,
            name: perm.module, // La API usa "module" en lugar de "name"
            enabled: true, // Inicializamos como habilitado por defecto
          })),
        }));

        setRoles(formattedData);
      } catch (err) {
        console.error('Error al obtener los roles:', err);
      }
    }
    fetchRoles();
  }, []);

  const togglePermission = async (roleId: number, permissionId: number, enabled: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/auth/roles/${roleId}/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (!res.ok) throw new Error('Error al actualizar el permiso');

      setRoles(prevRoles =>
        prevRoles.map(role =>
          role.id === roleId
            ? {
                ...role,
                permissions: role.permissions.map(perm =>
                  perm.id === permissionId ? { ...perm, enabled: !enabled } : perm
                ),
              }
            : role
        )
      );
    } catch (err) {
      console.error('Error al actualizar el permiso:', err);
    }
  };

  return (
    <Container>
      <h1>Gestión de Roles y Permisos</h1>
      <Table>
        <thead>
          <tr>
            <th>Rol</th>
            <th>Permisos</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id}>
              <td>{role.name}</td>
              <td>
                {role.permissions.length > 0 ? (
                  role.permissions.map(permission => (
                    <PermissionItem key={permission.id}>
                      {permission.name}
                      <ToggleButton
                        onClick={() => togglePermission(role.id, permission.id, permission.enabled)}
                        enabled={permission.enabled}
                      >
                        {permission.enabled ? 'Desactivar' : 'Activar'}
                      </ToggleButton>
                    </PermissionItem>
                  ))
                ) : (
                  <span>Sin permisos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default RolesPage;

// =================== Styled Components ===================
const Container = styled.div`
  padding: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f4f4f4;
  }
`;

const PermissionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ToggleButton = styled.button<{ enabled: boolean }>`
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: ${({ enabled }) => (enabled ? '#ff6b6b' : '#4caf50')};
  color: white;
  font-size: 12px;
`;
