import React from 'react';
import './ToggleSwitch.css'; // Asegúrate de que la ruta sea correcta

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  return (
    <div style={{ transform: 'scale(0.5)', margin: '0 auto' }}>
      <label>
        <input className='slider' type='checkbox' checked={checked} onChange={onChange} />
        <div className='switch'>
          <div className='suns'></div>
          <div className='moons'>
            <div className='star star-1'></div>
            <div className='star star-2'></div>
            <div className='star star-3'></div>
            <div className='star star-4'></div>
            <div className='star star-5'></div>
            <div className='first-moon'></div>
          </div>
          <div className='sand'></div>
          <div className='bb8'>
            <div className='ball'>
            </div>
            <div className='shadow'></div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default ToggleSwitch;
