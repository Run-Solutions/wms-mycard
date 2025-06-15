import React from 'react';
import styled from 'styled-components';

export interface FieldConfig {
  label: string;
  name: string;
  value: string | number;
}

export interface AreaFormProps {
  areaName: string;
  fields: FieldConfig[];
  onSubmit: () => void;
  extras?: React.ReactNode;
  submitLabel?: string;
}

const AreaForm: React.FC<AreaFormProps> = ({ areaName, fields, onSubmit, extras, submitLabel = 'Enviar' }) => {
  return (
    <Container>
      <Title>Área: {areaName}</Title>
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
        {fields.map(field => (
          <InputGroup key={field.name}>
            <Label>{field.label}</Label>
            <Input value={field.value} name={field.name} readOnly />
          </InputGroup>
        ))}
        {extras}
        <SubmitButton type="submit">{submitLabel}</SubmitButton>
      </form>
    </Container>
  );
};

export default AreaForm;

const Container = styled.div`
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
`;

const InputGroup = styled.div`
  width: 100%;
  padding-top: 16px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  color: black;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  background-color: #f9fafb;
`;

const SubmitButton = styled.button`
  margin-top: 2rem;
  background-color: #0038A8;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
`;
