// myorg\apps\backend\src\modules\permissions\permissions.service.ts
// lógica de negocio y la interacción con la base de datos mediante Prisma.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateModulePermissionDto } from './dto/create-module-permission.dto';
import { UpdateModulePermissionDto } from './dto/update-module-permission.dto';

const prisma = new PrismaClient();

@Injectable()
export class PermissionsService {
  // metodo para obtener todos los permisos
  async findAll() {
    return prisma.modulePermission.findMany();
  }

  // metodo para obtener un permiso por id
  async findOne(id: number){
    return prisma.modulePermission.findUnique({ where: { id }, });
  }

  // metodo para crear/actualizar/eliminar un permiso
  async create(createDto: CreateModulePermissionDto){
    // validar que el role_id exista
    const roleExists = await prisma.role.findUnique({ where: { id: createDto.role_id } });
    if (!roleExists) throw new NotFoundException('El rol especificado no existe');
    
    return prisma.modulePermission.create({
      data: {
        module: { connect: { id: Number(createDto.module) } },
        role: { connect: { id: createDto.role_id } },
      },
    });
  }
  
  async update(id: number, updateDto: UpdateModulePermissionDto){
    if (updateDto.role_id){
      const roleExists = await prisma.role.findUnique({ where: { id: updateDto.role_id } });
      if (!roleExists) throw new NotFoundException('El rol especificado no existe');
    }
    
    return prisma.modulePermission.update({
      where: { id },
      data: {
        module: updateDto.module ? { connect: { id: Number(updateDto.module) } } : undefined,
        role: updateDto.role_id ? { connect: { id: updateDto.role_id } } : undefined,
      },
    });
  }

  async remove(id: number){
    return prisma.modulePermission.delete({
      where: { id },
    });
  }
}
