import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  // Clave secreta para JWT (en producción, almacenar en variables de entorno)
  private readonly jwtSecret = 'your_jwt_secret';

  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    const { username, password } = loginDto;

    // Buscamos el usuario en la base de datos
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    // Validamos la contraseña (en producción, comparar hash)
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      { expiresIn: '1h' },
    );
    return { token, user };
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ token: string; user: any }> {
    // En producción, hashea la contraseña antes de guardarla
    const newUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password,
        role: registerDto.role ? registerDto.role : 'operator',
      },
    });

    const token = jwt.sign(
      { sub: newUser.id, username: newUser.username, role: newUser.role },
      this.jwtSecret,
      { expiresIn: '1h' },
    );
    return { token, user: newUser };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Email no encontrado');
    }
    // Aquí se enviaría un email/SMS para restablecer la contraseña
    return {
      message: 'Se ha enviado un correo para restablecer la contraseña.',
    };
  }
}
