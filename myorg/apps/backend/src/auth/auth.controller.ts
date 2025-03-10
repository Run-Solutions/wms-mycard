/* myorg\apps\backend\src\auth\auth.controller.ts */

import { BadRequestException, Body, Controller, Post, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('roles')
  async getRoles(){
    return this.authService.getRoles(); // Llama al servicio para obtener los roles
  }
  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }


  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    console.log("Recibiendo datos en /register:", registerDto);
    //Validar role_id
    if (registerDto.role_id) {
      const role_id = parseInt(registerDto.role_id.toString(),10);

      if (isNaN(role_id)) {
        throw new BadRequestException(`El role_id ${registerDto.role_id} no existe.`)
      }

      try {
        const roleExists = await this.authService.checkRoleExists(role_id);
        if (!roleExists) {
          throw new BadRequestException(`El role_id ${role_id} no existe.`)
        }
      } catch (error) {
        throw new BadRequestException('Error al verificar role_id')
      }
    }
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}
