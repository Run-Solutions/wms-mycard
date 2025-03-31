// src/app/(protected)/ordenesDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const WorkOrdersPage: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({ ot_id: '', mycard_id: '', quantity: '', areasOperatorIds: [] as string[], priority: false, files: [] as File[], });
  const [message, setMessage] = useState('');
  const [areasOperator, setAreasOperator] = useState<{ id: number; name: string }[]>([]);
  const [dropdownCount, setDropdownCount] = useState(5);
  const [files, setFiles] = useState<{ ot: File | null; sku: File | null; op: File | null }>({ ot: null, sku: null, op: null, });
  
  // Para obtener las areas de operacion
  useEffect(() => {
    fetch('http://localhost:3000/auth/areas_operator')
      .then((res) => res.json())
      .then((data) => setAreasOperator(data || []))
      .catch((err) => console.log('Error al obtener las areas de operacion', err));
  }, []);
  console.log("areasOperator:", areasOperator);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, areaIndex?: number) => {
    const { name, value } = e.target;
  
    if (areaIndex !== undefined) {
      setFormData((prev) => {
        const updatedFlows = [...prev.areasOperatorIds];
  
        // Evita valores duplicados 
        if (updatedFlows.includes(value)) {
          const duplicateIndex = updatedFlows.indexOf(value);
          updatedFlows[duplicateIndex] = ""; // Si hay duplicado
        }
  
        updatedFlows[areaIndex] = value || "";  // Asignamos el valor al índice correspondiente
        const filteredFlows = updatedFlows.filter(area => area !== "");
        return { ...prev, areasOperatorIds: filteredFlows };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Para obtener solo las areas disponibles
  const getAvailableAreas = (index: number) => {
    const selectedIds = formData.areasOperatorIds.slice(0, index).filter(Boolean).map((id) => Number(id));
    const lastSelectedId = selectedIds.length > 0 ? Math.max(...selectedIds) : null;

    return areasOperator
      .sort((a, b) => Number(a.id) - Number(b.id)) // Asegura el orden
      .filter((area) => {
        const areaId = Number(area.id);
        const isAlreadySelected = selectedIds.includes(areaId);  // Filtra las ya seleccionadas
        const isLowerThanLastSelected = lastSelectedId !== null && Number(area.id) <= lastSelectedId;
        return !isAlreadySelected && !isLowerThanLastSelected;  // Solo áreas disponibles
      });
  };
  
  const addDropdown = () => {
    setDropdownCount((prev) => prev + 1);
  };

  const removeDropdown = (index: number) => {
    if (dropdownCount > 0) {
      setDropdownCount(dropdownCount - 1);
      setFormData((prev) => {
        const updatedAreas = [...prev.areasOperatorIds];
        updatedAreas.splice(index, 1);  // Eliminar el valor correspondiente al índice
        return { ...prev, areasOperatorIds: updatedAreas };
      });
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ot' | 'sku' | 'op') => {
    const file = e.target.files?.[0]; // Obtener solo el primer file
    if (!file) return; // Si no hay archivos, salimos de la función
  
    setFiles((prevFiles) => ({
      ...prevFiles,
      [type]: file, // Asignar el archivo al tipo correspondiente
    }));
  };

  const removeFile = (index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      files: prevData.files.filter((_, i) => i !== index), // Elimina el archivo en la posición index
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.ot || !files.sku || !files.op) {
      alert('Todos los archivos (OT, SKU, OP) son obligatorios.');
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append('ot', files.ot);  // Envia el archivo 'ot'
    formDataToSend.append('sku', files.sku); // Envia el archivo 'sku'
    formDataToSend.append('op', files.op);  // Envia el archivo 'op'

    // Agregar otros datos del formulario
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formDataToSend.append(key, v));
      } else {
        formDataToSend.append(key, value.toString());
      }
    });
    console.log('Enviando archivos: ', { ot: files.ot.name, sku: files.sku.name, op: files.op.name });
    console.log("Datos enviados:", formData.areasOperatorIds);

    try {
      // se verifica token
      const token = localStorage.getItem('token');
      if(!token) {
        console.error('No se encontro el token en localStorage');
        return;
      }
      const response = await fetch('http://localhost:3000/work-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error del servidor: ${response.status}`, errorText);
        return;
      }
      const result = await response.json();
      setMessage(result.message);
    } catch (error) {
      setMessage('Error al crear la orden de trabajo');
    }
  };

  return (
    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Crear nueva orden de trabajo</Title>
      </TitleWrapper>

      <FormWrapper onSubmit={handleSubmit}>
        <DataWrapper>
          <Auxiliar>
            <Label>Número de Orden:</Label>
            <Input type="text" name="ot_id" value={formData.ot_id} onChange={handleChange} required />
          </Auxiliar>
          <Auxiliar>
            <Label>ID del Presupuesto:</Label>
            <Input type="text" name="mycard_id" value={formData.mycard_id} onChange={handleChange} required />
          </Auxiliar>
          <Auxiliar>
            <Label>Cantidad:</Label>
            <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
          </Auxiliar>
        </DataWrapper>
        <OperationWrapper>
          <Auxiliar>
            <Label>Flujo Asignado:</Label>
            <Selects style={{ marginRight: '40px' }}>
              {Array.from({ length: Math.ceil(dropdownCount / 5) }).map((_, rowIndex) => (
                <SelectRow key={rowIndex} style={{ display: "flex", alignItems: "center", height: '50px' }}>
                  {Array.from({ length: 5 }).map((_, colIndex) => {
                    const index = rowIndex * 5 + colIndex;
                    return index < dropdownCount ? (
                      <SelectWrapper key={index} style={{ display: "flex", alignItems: "center" }}>
                        {colIndex > 0 && <Arrow>➡</Arrow>}
                        <Select name={`area-${index}`} onChange={(e) => handleChange(e, index)} value={formData.areasOperatorIds[index] || ''} style={{ height: '100%' }}>
                          <option value=''>Selecciona un área</option>
                          {getAvailableAreas(index).map((area) => (
                              <option key={area.id} value={area.id}>{area.name}</option>
                            ))
                          }
                        </Select>
                      </SelectWrapper>
                    ) : null;
                  })}
                  {dropdownCount > rowIndex * 5 && dropdownCount <= (rowIndex + 1) * 5 && (
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: '0px', padding: '0', minWidth: '40px' }}>
                      <IconButton type="button" onClick={addDropdown} style={{ height: "20px", borderRadius: "40em", padding: '0' }}>+</IconButton>
                      <IconButton aria-label="delete" type="button" onClick={() => removeDropdown(rowIndex * 5 + 4)} style={{ height: "20px", borderRadius: "40em", marginTop: "5px", padding: '0' }}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  )}
                </SelectRow>
              ))}
            </Selects>
          </Auxiliar>
          <Auxiliar>
            <Label>Subir OT (PDF):</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'ot')} />
            <Label>Subir SKU (PDF):</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'sku')} />
            <Label>Subir OP (PDF):</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'op')} />
            <CheckboxWrapper>
              <Label>Prioridad:</Label>
              <input type="checkbox" name="priority" checked={formData.priority} onChange={handleChange} />
            </CheckboxWrapper>
          </Auxiliar>
        </OperationWrapper>
        <Button type="submit">Crear Orden</Button>
      </FormWrapper>

      {message && <Message>{message}</Message>}
    </PageContainer>
  );
};

export default WorkOrdersPage;

// =================== Styled Components ===================
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
  color: ${({ theme }) => theme.palette.text.primary};
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 10px;
  background: #f8f9fa; // Color de fondo suave
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); // Sombra ligera
`;

const DataWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 3rem;
  margin: 0 auto;
`;

const OperationWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
`;

const Selects = styled.div`
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const SelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
`;

const SelectRow  = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Arrow = styled.div`
  font-size: 1.2rem;
  color: #333; /* Ajusta el color según tu diseño */
`;

const Auxiliar = styled.div`
  display: flex;
  flex-direction: column; // Pone el Label arriba del Input
  flex: 1; // Permite que todos los campos ocupen el mismo espacio
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  font-weight: 600;
  margin-bottom: 5px;
  color: #000000;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 10rem;
  border: 1px solid #ccc;
  width: 100%;
  height: 40px;
  outline: none;
  color: black;
  &::placeholder {
    color: #aaa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 10rem;
  min-width: 150px;
  flex-grow: 1;
  color: #000000;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 15px 30px;
  text-align: center;
  background-color: ${({ theme }) => theme.palette.primary.main};
  border: 2px solid ${({ theme }) => theme.palette.primary.main};
  border-radius: 10em;
  color: white;
  font-size: 15px;
  font-weight: 600;
  height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.dark};
    transform: scale(1.05); // Pequeño efecto de crecimiento
  }
`;

const Message = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: green;
  font-weight: bold;
`;

