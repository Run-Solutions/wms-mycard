// src/components/FloatingChatButton.tsx
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useThemeContext } from '../ThemeContext';

// Componente para la ventana de chat
const ChatWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Estado para simular mensajes (puedes integrar una API real)
  const [messages, setMessages] = useState<string[]>([
    '¡Hola! ¿En qué puedo ayudarte?',
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() !== '') {
      // Agrega el mensaje enviado y simula una respuesta de IA
      setMessages(prev => [...prev, input, 'Esta es una respuesta de demo de la IA.']);
      setInput('');
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <h3>Chat Demo</h3>
        <CloseButton onClick={onClose}>X</CloseButton>
      </ChatHeader>
      <ChatMessages>
        {messages.map((msg, index) => (
          <Message key={index}>{msg}</Message>
        ))}
      </ChatMessages>
      <ChatInputContainer>
        <ChatInput
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Escribe un mensaje...'
        />
        <SendButton onClick={handleSend}>Enviar</SendButton>
      </ChatInputContainer>
    </ChatContainer>
  );
};

const FloatingChatButton: React.FC = () => {
  const { theme } = useThemeContext();
  const [chatOpen, setChatOpen] = useState(false);

  // Nota: Este botón no se mostrará en el login.
  // Puedes condicionar su renderizado según la ruta o incluirlo solo en el layout protegido.
  return (
    <>
      {/*<Button onClick={() => setChatOpen(!chatOpen)}>
        <IconSvg stroke='none' viewBox='0 0 24 24' fill='currentColor'>
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z'
          />
        </IconSvg>
        <TextSpan>AI</TextSpan>
      </Button>*/}
      {chatOpen && <ChatWindow onClose={() => setChatOpen(false)} />}
    </>
  );
};

// ======================= Styled Components =======================

const Button = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  outline: 0;
  --sz-btn: 68px;
  --space: calc(var(--sz-btn) / 5.5);
  --gen-sz: calc(var(--space) * 2);
  --sz-text: calc(var(--sz-btn) - var(--gen-sz));
  height: var(--sz-btn);
  width: var(--sz-btn);
  border: 1px solid transparent;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.2s;
  &:active {
    transform: scale(0.95);
  }
  background: linear-gradient(
    45deg,
    ${props => props.theme.palette.primary.main},
    ${props => props.theme.palette.secondary.main}
  );
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3),
              0 2px 6px rgba(60, 64, 50, 0.2),
              0 30px 60px -30px rgba(0, 0, 0, 0.3),
              0 -2px 6px inset rgba(52, 52, 52, 0.35);
`;

const IconSvg = styled.svg`
  position: absolute;
  z-index: 10;
  overflow: visible;
  transition: all 0.3s;
  color: ${props => props.theme.palette.text.secondary};
  top: calc(var(--sz-text) / 7);
  left: calc(var(--sz-text) / 7);
  height: var(--gen-sz);
  width: var(--gen-sz);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  ${Button}:hover & {
    height: var(--sz-text);
    width: var(--sz-text);
    left: calc(var(--sz-text) / 4);
    top: calc(var(--gen-sz) / 2);
  }
`;

const TextSpan = styled.span`
  font-size: var(--sz-text);
  font-weight: 800;
  line-height: 1;
  color: white;
  transition: all 0.2s;
  opacity: 1;
  ${Button}:hover & {
    opacity: 0;
  }
`;

// ChatWindow

const ChatContainer = styled.div`
  position: fixed;
  bottom: 100px; /* Ajusta la posición vertical según prefieras */
  right: 20px;
  width: 320px;
  max-height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 2100;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme.palette.primary.main};
  color: white;
  padding: 0.5rem 1rem;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: #f5f5f5;
`;

const Message = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #333;
`;

const ChatInputContainer = styled.div`
  display: flex;
  padding: 0.5rem;
  border-top: 1px solid #ccc;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: none;
  outline: none;
`;

const SendButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.theme.palette.secondary.main};
  color: white;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
`;

export default FloatingChatButton;
