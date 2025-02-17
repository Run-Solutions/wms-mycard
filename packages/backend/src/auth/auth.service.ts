import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  // Simulación de base de datos en memoria
  private users = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@example.com',
    },
  ];

  // Clave secreta para JWT (en producción, almacenar en variables de entorno)
  private readonly jwtSecret = 'your_jwt_secret';

  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    await Promise.resolve(); // dummy await para cumplir con la regla de async
    const { username, password } = loginDto;
    // Validación simple; en producción, usar encriptación y BD real
    const user = this.users.find(
      (u) => u.username === username && u.password === password,
    );
    if (!user) {
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
    await Promise.resolve();
    const newUser: {
      id: number;
      username: string;
      email: string;
      password: string;
      role: string;
    } = {
      id: this.users.length + 1,
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      role: registerDto.role ? registerDto.role : 'operator',
    };

    this.users.push(newUser);
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
    await Promise.resolve();
    const { email } = forgotPasswordDto;
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Email no encontrado');
    }
    // Aquí se enviaría un email/SMS para restablecer la contraseña
    return {
      message: 'Se ha enviado un correo para restablecer la contraseña.',
    };
  }
}
