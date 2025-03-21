// myorg\apps\backend\src\auth\roles\roles.guard.ts
// para filtrar los modulos viisbles para el usuario de acuerdo al rol
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service'; // Importa PrismaService
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: number };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModules = this.reflector.get<string[]>('modules', context.getHandler());
    if (!requiredModules) return true;

    const request: RequestWithUser = context.switchToHttp().getRequest();
    if(!request.user) throw new UnauthorizedException('Usuario no autenticado.')
    
      const userWithRole = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      include: {
        role: { include: { permissions: { include: { module: true } } } },
      },
    });

    if (!userWithRole?.role?.permissions.length) {
      throw new ForbiddenException('No tienes permisos para acceder');
    }

    const userModules = userWithRole.role.permissions.map((perm) => perm.module?.name).filter(Boolean);

    return requiredModules.some((module) => userModules.includes(module));
  }
}
