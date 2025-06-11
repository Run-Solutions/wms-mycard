import API from './http';

export interface ModuleFromApi {
  id: number;
  name: string;
  logoName: string;
  description: string;
}

export const getModules = async (): Promise<ModuleFromApi[]> => {
  const response = await API.get('/dashboard/modules');
  return response.data.modules;
};

export const updateUserProfile = async (userId: string, formData: FormData): Promise<any> => {
  try {
    const response = await API.patch(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando perfil:', error?.response?.data || error);
    throw error;
  }
};