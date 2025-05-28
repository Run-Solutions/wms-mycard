import API from "./http";

export const getAllPermissions = async () => API.get<[]>("/permissions");

export const changeEnabledPermission = async (roleId: number, moduleId: number, enabled: boolean) => {
 try {
    return API.patch(`/permissions/${roleId}/${moduleId}`, { enabled });
 } catch (error) {
    console.error('Error al cambiar permiso:', error);
    throw error;
 }
}