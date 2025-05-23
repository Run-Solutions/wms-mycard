import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './http';

interface ModuleFromApi {
  id: number;
  name: string;
  logoName: string;
  description: string;
  // agrega aquí cualquier otra propiedad que tenga el módulo
}

export const useModules = () => {
  const [modules, setModules] = useState<ModuleFromApi[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');

        const response = await API.get('/dashboard/modules', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setModules(response.data.modules);
      } catch (err) {
        console.error('Error al obtener módulos:', err);
      }
    };

    fetchModules();
  }, []);

  return modules;
};