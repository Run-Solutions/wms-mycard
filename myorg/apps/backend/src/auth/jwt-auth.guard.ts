// myorg\apps\backend\src\auth\jwt-auth.guard.ts
// validar el token en cada solicitud y lo agrega a request.user
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface RequestWithUser extends Request {
    user?: {
      id: number;
      role_id?: number; 
    };
}

interface TokenPayload extends jwt.JwtPayload {
    sub: string;
    role_id?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

    canActivate(context: ExecutionContext): boolean {
        const request: RequestWithUser = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        console.log('Encabezado Authorization:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;

            if (typeof decoded !== 'object' || !decoded.sub){
                throw new UnauthorizedException('Token Invalido')
            }

            request.user = {
                id: Number(decoded.sub),
                role_id: decoded.role_id
            };
            console.log(request.user)
            console.log('Usuario asignado a request.user:', request.user);
            return true;
        } catch {
            throw new UnauthorizedException('Token invalido o expirado');
        }
    }
}