'use client';

import React from 'react';
import styles from './Loading.module.css';

const Loading = () => {
  return (
    <div className={styles.loader}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="300"
        height="300"
        viewBox="0 0 64 64"
      >
        <g transform="rotate(-15 32 32)">
          <rect
            x="8"
            y="16"
            width="48"
            height="32"
            rx="4"
            fill="#3B82F6"
            stroke="#000"
            strokeWidth="3"
          />
          <rect
            x="10"
            y="18"
            width="44"
            height="6"
            fill="#60A5FA"
            stroke="#000"
            strokeWidth="2"
          />
          <rect
            x="44"
            y="28"
            width="8"
            height="6"
            fill="#FACC15"
            stroke="#000"
            strokeWidth="2"
          />
          <line
            x1="12"
            y1="36"
            x2="30"
            y2="36"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="40"
            x2="24"
            y2="40"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <p className={styles.loadingText}>Cargando...</p>
    </div>
  );
};

export default Loading;