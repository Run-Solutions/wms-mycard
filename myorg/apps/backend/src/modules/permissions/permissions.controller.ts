// myorg\apps\backend\src\modules\permissions\permissions.controller.ts
import { Controller, Patch, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/roles/permission.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService){}
  
  // para asignar permisos a ubn rol sobre un modulo 
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch(':roleId/:moduleId')
  async togglePermission(
    @Param('roleId') roleId: string, 
    @Param('moduleId') moduleId: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.permissionsService.togglePermission(
      parseInt(roleId), 
      parseInt(moduleId), 
      enabled);
  }

  // para obtener permisos de un rol especifico
  @UseGuards(JwtAuthGuard)
  @Get(':roleId')
  async getPermissionByRole(@Param('roleId') roleId: number) {
    return this.permissionsService.getPermissionByRole(roleId);
  }

  // para obtener todos los permisos
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }
}