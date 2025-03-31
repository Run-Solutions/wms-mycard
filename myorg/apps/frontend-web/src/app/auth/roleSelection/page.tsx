// myorg\apps\frontend-web\src\app\auth\roleSelection\page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled, {keyframes, createGlobalStyle} from 'styled-components';
import { toast } from 'react-toastify';
import Header from '@/components/Header/Header';

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

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(to right, #0038A8 0%, #0038A8 100%);
  width: 450px;
  padding: 30px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 1s ease-out;
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputForm = styled.div`
  border: 1.5px solid #ecedec;
  border-radius: 10em;
  height: 50px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  transition: 0.2s ease-in-out;
  background-color: #486fbb;

  &:focus-within {
    border: 1.5px solid orange;
  }
`;

const InputField = styled.input`
  margin-left: 10px;
  border-radius: 10rem;
  border: none;
  width: 100%;
  height: 100%;
  outline: none;
  color: black;
  background-color: inherit;
  &::placeholder {
    color: #aaa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

const Select = styled.select`
  border: 1.5px solid #ecedec;
  border-radius: 10em;
  height: 50px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  transition: 0.2s ease-in-out;
  &:focus-within {
    border: 1.5px solid orange;
  }
  color: black;
`;

const Button = styled.button`
  padding: 15px 30px;
  text-align: center;
  letter-spacing: 1px;
  background: transparent;
  transition: ease-out 0.5s;
  border: 2px solid;
  border-radius: 10em;
  box-shadow: inset 0 0 0 0 blue;
  margin: 20px 0 10px 0;
  color: white;
  font-size: 15px;
  font-weight: 500;
  height: 50px;
  flex: 1;
  cursor: pointer;

  &:hover {
    color: white;
    box-shadow: inset 0 -100px 0 0 royalblue;
  }

  &:active {
    transform: scale(0.9);
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

const RoleSelection = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<{ username: string; email: string; password: string } | null>(null);
  
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  
  const [areas_operator, setAreasOperator] = useState<{ id: string; name: string }[]>([]);
  const [selectedAreasOperator, setSelectedAreasOperator] = useState('');

  // Cargar datos desde localStorage
  useEffect(() => {
    try{
      const storedUser = localStorage.getItem('pendingUser');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      } else {
        router.push('/auth/register');
      }
    }
    catch (error) {
      console.error('Error al obtener pendingUser:', error);
      router.push('/auth/register');
    }
  }, [router]);

  // Obtener los roles desde la BD
  useEffect(() => {
    fetch('http://localhost:3000/auth/roles')
      .then((res) => res.json())
      .then((data) => setRoles(data || []))
      .catch((err) => {
        console.error('Error obteniendo roles', err);
        setRoles([]); // Asegurar que roles no sea undefined en caso de error
      });
  }, []);

  // Obtener las areas desde la BD
  useEffect(() => {

    if (!selectedRole) return;
  
    // Verificar si el rol seleccionado es 'Operador'
    const role = roles.find(role => String(role.id) === String(selectedRole));

    if (role?.name !== 'Operador'){
      fetch('http://localhost:3000/auth/areas_operator')
        .then((res) => res.json())
        .then((data) => setAreasOperator(data || []))
        .catch((err) => console.error('Error obteniendo áreas de operador', err));
    } else {
      setAreasOperator([]);
    }
  }, [selectedRole, roles]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error('Debes seleccionar un rol');
      return;
    }
    
    const selectedRoleObject = roles.find(role => String(role.id) === String(selectedRole));
    if(selectedRoleObject?.name === 'Operador' && !selectedAreasOperator){
      toast.error('Debes seleccionar un área');
      return;
    }

    const payload: any = {
      ...userData,
      role_id: parseInt(selectedRole, 10),
    };

    if (selectedRole === '2'){
      payload.areas_operator_id = Number(selectedAreasOperator);
    }
    console.log('Enviando datos al backend:', payload); // Verificar que se envían los datos correctos

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Respuesta del backend', data);

      if (res.ok) {
        localStorage.removeItem('pendingUser');
        toast.success('Registro exitoso');
        router.push('/auth/login');
      } else {
        toast.error(data.message || 'Error en registro');
      }
    } catch (err) {
      toast.error('Error al registrar');
      console.error('Error:', err);
    }
  };

  return (
    <>
      <GlobalStyle />
      <Header />
      <PageContainer>
        <FormContainer onSubmit={handleSubmit}>
        <FlexColumn>
          <label style={{ color: 'white', fontWeight: 600 }}>Username</label>
        </FlexColumn>
        <InputForm>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            viewBox='0 0 32 32'
            height='20'
          >
            <g data-name='Layer 3' id='Layer_3'>
              <path d='m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z' />
            </g>
          </svg>
          <InputField type='text' value={userData?.username || ''} disabled />
        </InputForm>
        <FlexColumn>
          <label style={{ color: 'white', fontWeight: 600 }}>Email</label>
        </FlexColumn> 
        <InputForm>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            viewBox='0 0 32 32'
            height='20'
          >
            <g data-name='Layer 3' id='Layer_3'>
              <path d='m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z' />
            </g>
          </svg>
          <InputField type='email' value={userData?.email || ''} disabled />

        </InputForm> 
        <FlexColumn>
          <label style={{ color: 'white', fontWeight: 600 }}>Rol</label>
        </FlexColumn>
          <Select value={selectedRole} onChange={(e) => {
            console.log('Rol seleccionado:', e.target.value);
            setSelectedRole(e.target.value);
          }}>
            <option value=''>Selecciona un rol</option>
            {roles?.length > 0 &&
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
            ))}
          </Select>

          {/* Solo muestra el área si el usuario es operador */}
          {selectedRole === '2' && areas_operator.length > 0 && (
            <>
              <FlexColumn>
                <label style={{ color: 'white', fontWeight: 600 }}>Área de operación</label>
              </FlexColumn>
              <Select value={selectedAreasOperator} onChange={(e) => {
                console.log('Area seleccionada:', e.target.value);
                setSelectedAreasOperator(e.target.value);
              }}>
              <option value=''>Selecciona un área</option>
              {areas_operator
              .sort((a, b) => Number(a.id) - Number(b.id))
              .map((area: { id: string; name: string }) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </Select>
            </>
          )}
          <Button type='submit'>Confirmar Registro</Button>
        </FormContainer>
      </PageContainer>
      <Footer>
        © 2025 Run Solutions Services |{' '}
        <a href='#'>About us</a> | <a href='#'>MIT License</a>
      </Footer>
    </>
  );
};

export default RoleSelection