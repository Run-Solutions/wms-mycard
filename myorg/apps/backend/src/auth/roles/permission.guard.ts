// myorg\apps\backend\src\auth\roles\permission.guard.ts
// permite acceso al role 1 para habilitar o deshabilitra permisos en modulos 
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user?: { id: number; role_id?: number };
}

@Injectable()
export class PermissionGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request: RequestWithUser = context.switchToHttp().getRequest();
        
        console.log('Usuario en request: ', request.user);
        
        if(!request.user) {
            throw new UnauthorizedException('Usuario no autenticado');
        }

        if (typeof request.user.role_id === 'undefined') {
            console.log('⚠️ role_id no está definido en request.user:', request.user);
            throw new ForbiddenException('No tienes permisos para realizar esta acción (role_id no encontrado)');
        }

        if(request.user.role_id !== 1){
            throw new ForbiddenException('No tienes permisos para realizar esta accion');
        }

        return true;
    }
}