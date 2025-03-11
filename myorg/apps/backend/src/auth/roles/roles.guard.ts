//myorg\apps\backend\src\auth\roles\roles.guard.tsmyorg\apps\backend\src\auth\roles\roles.guard.ts
// se ejecutan antes de que una solicitud llegue a un controlador y sirven para permitir o denegar el acceso según ciertas reglas.
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    void _context;
    return true;
  }
}
