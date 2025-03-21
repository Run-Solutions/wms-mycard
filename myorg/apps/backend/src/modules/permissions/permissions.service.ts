// myorg\apps\backend\src\modules\permissions\permissions.service.ts
// lógica de negocio y la interacción con la base de datos mediante Prisma.
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // metodo para cambiar permiso de modulo al rol
  async togglePermission(roleId: number, moduleId: number, enabled: boolean) {
    try {
      const updated = await this.prisma.modulePermission.updateMany({
        where: { 
          role_id: Number(roleId), 
          module_id: Number(moduleId) 
        },
        data: { enabled },
      });
  
      if (updated.count === 0) {
        throw new Error('No se encontró el permiso para actualizar');
      }
  
      return { message: 'Permiso actualizado correctamente', updated };
    } catch (error) {
      throw new Error(`Error al actualizar el permiso: ${error}`);
    }
  }
  

  // obtener permiso del rol especifico
  async getPermissionByRole(roleId: number){
    return this.prisma.modulePermission.findMany({
      where: { role_id: roleId },
      include: { module: true },
    });
  }

  // obtener todos los permisos
  async getAllPermissions() {
    return this.prisma.modulePermission.findMany({
      include: {role: true, module: true}
    });
  }
}
