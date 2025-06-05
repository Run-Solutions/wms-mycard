/* myorg\apps\backend\src\auth\auth.controller.ts */

import { Body, Controller, Post, Get, UsePipes, ValidationPipe, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto} from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('roles')
  async getRoles(){
    return this.authService.getRoles(); // Llama al servicio para obtener los roles
  }
  @Get('areas_operator')
  async getAreasOperator(){
  return await this.authService.getAreasOperator(); // Llama al servicio en lugar de usar this.prisma directamente
  }
  @Get('check-role/:role')
  async checkRole(@Param('role') role: string): Promise<boolean> {
    return this.authService.checkRoleExists(parseInt(role, 10)); // Llama al servicio para obtener los roles
  }

  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('biometric-challenge')
  generateChallenge(@Body('username') username: string) {
    const challenge = this.authService.generateBiometricChallenge(username);
    return { challenge };
  }

  @Post('login/biometric')
  async biometricLogin(@Body() body: {
    username: string;
    challenge: string;
    signature: string;
    deviceId: string;
  }) {
    return this.authService.biometricLogin(body);
  }

  @Post('biometric/register')
  async registerBiometricKey(@Body() body: { username: string, publicKey: string, deviceId: string }) {
    return this.authService.registerBiometricKey(body.username, body.publicKey);
  }

  /*@Patch('biometric-key')
  async updateBiometricKey(@Body() body: UpdateBiometricKeyDto) {
    return this.authService.updateBiometricKey(body.username, body.publicKey);
  }*/

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    console.log('DTO recibido en el backend:', registerDto);
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
  @Get('verify-username/:username')
  async verifyUsername(@Param('username') username: string): Promise<boolean> {
    return this.authService.verifyUsername(username);
  }
}
