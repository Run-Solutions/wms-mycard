// src/app/(protected)/ordenesDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

const UsersPage: React.FC = () => {
  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Cerrar Orden de Trabajo</Title>
      </TitleWrapper>
      
    </PageContainer>
  );
};

export default UsersPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -70px;
`;

const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 4rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FlipCard = styled.div`
  background-color: transparent;
  width: 245px;
  height: 270px;
  perspective: 1000px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  cursor: pointer;

  &:hover .flip-card-inner {
    transform: rotateY(180deg);
  }
`;

const FlipCardInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
`;

interface FlipCardSideProps {
  theme: any;
}

const FlipCardFront = styled.div<FlipCardSideProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  border-radius: 2em;
  backface-visibility: hidden;
  background-color: ${props => props.theme.palette.primary.main};
  border: 4px solid ${props => props.theme.palette.secondary.main};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ProfileImage = styled.img`
  border-radius: 50%;
  width: 120px;
  height: 120px;
  object-fit: cover;
  margin-bottom: 1rem;
`;

const UserName = styled.div<{ theme: any }>`
  font-size: 22px;
  color: ${props => props.theme.palette.secondary.main};
  font-weight: bold;
  text-transform: uppercase;
`;

const FlipCardBack = styled.div<FlipCardSideProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  border-radius: 2em;
  backface-visibility: hidden;
  background-color: ${props => props.theme.palette.primary.main};
  border: 4px solid ${props => props.theme.palette.secondary.main};
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const InfoItem = styled.div`
  font-size: 14px;
  color: white;
  margin: 0.2rem 0;
`;

const CardActions = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 1em;
  cursor: pointer;
  background-color: ${props => props.theme.palette.secondary.main};
  color: white;
  font-weight: bold;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.theme.palette.secondary.dark || '#000'};
  }
`;
