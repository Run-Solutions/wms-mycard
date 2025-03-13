//myorg\apps\backend\src\auth\roles\roles.guard.tsmyorg\apps\backend\src\auth\roles\roles.guard.ts
// se ejecutan antes de que una solicitud llegue a un controlador y sirven para permitir o denegar el acceso según ciertas reglas.
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: {
    id: number;
    role_id?: number; // Verifica si esto es correcto según tu base de datos
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) return false;

    // Obtener el usuario con su rol desde la base de datos
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role_id: true }, // Asegúrate de que esto existe en la base de datos
    });

    if (!userWithRole?.role_id) return false;

    // Obtener permisos basados en el rol
    const path: string | undefined = (request.route as { path?: string })?.path; // Agregar '?' para evitar errores si `route` es undefined
    if (!path) return false;

    // Buscar permisos en la base de datos
    const hasPermission = await prisma.modulePermission.findFirst({
      where: {
        module: path,
        role_id: userWithRole.role_id, // Usar el role_id en lugar de un array
      },
    });

    return hasPermission !== null;
  }
}
