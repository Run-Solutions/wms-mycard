// myorg\apps\backend\src\modules\permissions\permissions.controller.ts
// endpoints para gestionar los permisos (crear, leer, actualizar y eliminar).
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreateModulePermissionDto } from './dto/create-module-permission.dto';
import { UpdateModulePermissionDto } from './dto/update-module-permission.dto';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@Controller('permissions')
@UseGuards(RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService){}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id')id:string){
    return this.permissionsService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateModulePermissionDto){
    return this.permissionsService.create(createDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateModulePermissionDto,
  ){
    return this.permissionsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove (@Param('id') id: string){
    return this.permissionsService.remove(+id);
  }

}
