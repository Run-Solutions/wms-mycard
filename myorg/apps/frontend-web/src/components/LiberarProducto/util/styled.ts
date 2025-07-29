import styled from 'styled-components';
import { TableCell } from '@mui/material';

export const Timeline = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  width: 100%;
  gap: 18px;
  box-sizing: border-box;
`;

export const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 65px;
`;

export const Circle = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    ![
      '$isActive',
      '$isCompleted',
      '$isCalidad',
      '$isParcial',
      '$isInconforme',
    ].includes(prop),
})<{
  $isActive?: boolean;
  $isCompleted?: boolean;
  $isCalidad?: boolean;
  $isParcial?: boolean;
  $isInconforme?: boolean;
}>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial, $isInconforme }) =>
    $isCompleted
      ? '#22c55e'
      : $isCalidad
      ? '#facc15'
      : $isInconforme
      ? '#a855f7'
      : $isActive
      ? '#4a90e2'
      : $isParcial
      ? '#f5945c'
      : '#d1d5db'};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

export const Line = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isLast',
})<{ $isLast: boolean }>`
  position: absolute;
  top: 14px;
  left: 50%;
  height: 2px;
  width: 80px;
  background-color: #d1d5db;
  z-index: 0;
  display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
`;

export const AreaName = styled.span.withConfig({
  shouldForwardProp: (prop) =>
    !['$isActive', '$isCompleted', '$isCalidad', '$isParcial', '$isInconforme'].includes(prop),
})<{
  $isActive?: boolean;
  $isCompleted?: boolean;
  $isCalidad?: boolean;
  $isParcial?: boolean;
  $isInconforme?: boolean;
}>`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
  color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial, $isInconforme }) =>
    $isCompleted
      ? '#22c55e'
      : $isCalidad
      ? '#facc15'
      : $isInconforme
      ? '#a855f7'
      : $isActive
      ? '#4a90e2'
      : $isParcial
      ? '#f5945c'
      : '#6b7280'};
  text-align: center;
  max-width: 80px;
  text-transform: capitalize;
`;

export const CircleLegend = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
`;

export const CustomTableCell = styled(TableCell)`
  color: black !important;
  font-size: 1rem;
`;

export const textFieldStyle = {
  maxWidth: 200,
  '& .MuiInputBase-input': { color: '#8a8686' },
  '& .MuiInputLabel-root': { color: '#8a8686' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#8a8686' },
    '&:hover fieldset': { borderColor: '#b0adad' },
    '&.Mui-focused fieldset': { borderColor: '#90caf9' },
  },
};

export const containerStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  mt: 4,
  borderRadius: '1rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  maxWidth: '100%',
  minWidth: '800px',
  marginX: 'auto',
};

export const sortLabelStyle = {
  color: 'black',
  '&.Mui-active': {
    color: 'black',
    '& .MuiTableSortLabel-icon': { color: 'black', opacity: 1 },
  },
  '& .MuiTableSortLabel-icon': { color: 'black', opacity: 1 },
};

export const fileButtonStyle = {
  border: '1px solid #c2c2c2',
  borderRadius: '20px',
  padding: '4px 12px',
  backgroundColor: '#f7f7f7',
  cursor: 'pointer',
  fontSize: '0.75rem',
  transition: 'all 0.2s ease-in-out',
};

export const paginationStyle = {
  color: 'black',
  '& .MuiTablePagination-actions svg': { color: 'black' },
  '& .MuiInputBase-root': { color: 'black' },
  '& .MuiSelect-icon': { color: 'black' },
};

export const clickableCell = {
  color: 'black',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline' },
};