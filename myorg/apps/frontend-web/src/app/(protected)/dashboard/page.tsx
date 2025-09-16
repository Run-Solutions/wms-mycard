// myorg/apps/frontend-web/src/app/(protected)/dashboard/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import MuiGrid from '@mui/material/Grid';
import FlipCard from '@/components/Card/FlipCard';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '@/api/http';
import { getWorkOrdersWithInconformidad } from '@/api/inconformidades';
import { fetchPendingOrders } from '@/api/vistosBuenos';

interface Module {
  id: number;
  name: string;
  description: string;
  imageName: string;
  logoName: string;
}

type CountMap = Record<string, number>;

// Tipos de respuesta tolerantes
type PendingObj = { pendingOrders: any[] };

// Helper seguro (acepta arreglo o objeto con pendingOrders)
const getPendingCount = (data: unknown): number => {
  if (Array.isArray(data)) return data.length;                  
  if (data && typeof data === 'object' && 'pendingOrders' in data) {
    const po = (data as PendingObj).pendingOrders;
    return Array.isArray(po) ? po.length : 0;                      
  }
  return 0;
};

// 🔹 Normaliza nombres por si cambian mayúsculas/acentos
const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// 🔹 Resolvers que devuelven el conteo por módulo
const COUNT_RESOLVERS: Partial<Record<string, () => Promise<number>>> = {
  inconformidades: async () => {
    try {
      const data = await getWorkOrdersWithInconformidad();
      return getPendingCount(data);
    } catch {
      return 0;
    }
  },
  'liberar producto': async () => {
    try {
      const data = await fetchPendingOrders();
      return getPendingCount(data);
    } catch {
      return 0;
    }
  },
  // 'ordenes de trabajo': async () => { ... },
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<CountMap>({});

  const toCamelCase = (str: string) =>
    str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
        index === 0 ? match.toLowerCase() : match.toUpperCase()
      )
      .replace(/\s+/g, '');

  const handleCardClick = (name: string) => {
    const redirect_page = toCamelCase(name);
    router.push(`/${redirect_page}`);
  };

  useEffect(() => {
    const fetchModulesAndCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('⛔ No se ha leído el token');

        // 1) Módulos
        const resp = await fetch(`${BASE_URL}/dashboard/modules`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) throw new Error('⛔ Error al obtener módulos');

        const data = await resp.json();
        const fetchedModules: Module[] = data.modules ?? [];
        setModules(fetchedModules);

        // 2) Conteos por resolver (si existe); default 0
        const pairs = await Promise.all(
          fetchedModules.map(async (m) => {
            const key = normalize(m.name);
            const resolver = COUNT_RESOLVERS[key];
            const count = resolver ? await resolver() : 0;
            return [m.name, count] as const;
          })
        );
        setCounts(Object.fromEntries(pairs));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndCounts();
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 }, mt: -5 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <MuiGrid container rowSpacing={3} columnSpacing={2} justifyContent="center">
          {modules.map((module) => (
            <MuiGrid item xs={12} sm={6} md={4} key={module.id}>
              <Box onClick={() => handleCardClick(module.name)} sx={{ cursor: 'pointer' }}>
                <FlipCard
                  title={module.name}
                  description={module.description}
                  imageName={module.imageName}
                  logoName={module.logoName}
                  badgeCount={counts[module.name] ?? 0}  // <- badge dentro del FlipCard
                />
              </Box>
            </MuiGrid>
          ))}
        </MuiGrid>
      )}
    </Box>
  );
};

export default DashboardPage;