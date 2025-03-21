// src/app/dashboard/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import FlipCard from '@/components/Card/FlipCard';
import { useRouter } from 'next/navigation';

interface Module {
  id: number;
  name: string;
  description: string;
  imageName: string;
  logoName: string;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        // Se recupera el token del user logeado
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('⛔ No se ha leído el token')
        }

        const response = await fetch('http://localhost:3000/dashboard/modules', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('⛔ Error al obtener módulos');
        }

        const data = await response.json();
        console.log('Modulos:', data.modules);

        // Actualizar el estado con los modulos obtenidos 
        setModules(data.modules)
      } catch (error) {
        console.error(error);
      } finally {
        // Cerrar la carga de los modulos cuando finalice
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Para redireccionar a la pagina correpondiente
  const toCamelCase = (str: string) =>
    str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.toUpperCase()
      )
      .replace(/\s+/g, '')

  const handleCardClick = (name: string) => {
    let redirect_page = toCamelCase(name);
    console.log(redirect_page);
    router.push(`/${redirect_page}`);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 }, mt: -5 }}>
      {loading ? (
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container rowSpacing={3} columnSpacing={2} justifyContent='center'>
          {modules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Box onClick={() => handleCardClick(module.name)} sx={{ cursor: 'pointer' }}>
                <FlipCard
                  title={module.name}
                  description={module.description}
                  imageName={module.imageName}
                  logoName={module.logoName}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;
