/*myorg\apps\backend\src\auth\auth.service.ts*/
import { Injectable, UnauthorizedException, BadRequestException, } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  private readonly jwtSecret = 'your_jwt_secret';

  constructor(private readonly notificationsService: NotificationsService) {}

  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    const { username, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { role: true}, // Se incluye el rol para poder acceder a su nombre
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Emitir notificación de error en login (opcional)
      this.notificationsService.sendNotification({
        type: 'error',
        message: 'Credenciales inválidas',
        timestamp: new Date().getTime(),
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = jwt.sign(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { sub: user.id, username: user.username, role: user.role?.name },
      this.jwtSecret,
      { expiresIn: '1h' },
    );
    return { token, user };
  }

  async register( registerDto: RegisterDto): Promise<{ token: string; user: any }> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    if (!registerDto.role_id) {
      throw new BadRequestException('El role_id es obligatorio.');
    }
    const roleExists = await this.prisma.role.findUnique({ where: { id: registerDto.role_id } });
    if (!roleExists) {
      throw new BadRequestException(`El role_id ${registerDto.role_id} no existe.`);
    }
    let newUser;
    try {
      newUser = await this.prisma.user.create({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          password: hashedPassword,
          role: {
            connect: { id: registerDto.role_id || 1 },
          },
        },
        include: {role: { select: { name: true }} },
      });
    } catch (error) {
      // Validación para nombre de usuario duplicado
      if (error.code === 'P2002' && error.meta?.target?.includes('User_username_key')){
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.notificationsService.sendNotification({
          type: 'error',
          message: 'El nombre de usuario ya existe',
          timestamp: new Date().getTime(),
        });
        throw new BadRequestException('El nombre de usuario ya existe');
      }
      // Validación para correo duplicado
      if (error.code === 'P2002' && error.meta?.target?.includes('User_email_key')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.notificationsService.sendNotification({
          type: 'error',
          message: 'El correo ya existe',
          timestamp: new Date().getTime(),
        });
        throw new BadRequestException('El correo ya existe');
      }
      throw error;
    }

    // Emitir notificación de éxito en registro
    this.notificationsService.sendNotification({
      type: 'success',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: `Nuevo usuario registrado: ${newUser.username}`,
      timestamp: new Date().getTime(),
    });

    const token = jwt.sign(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      { sub: newUser.id, username: newUser.username, role: newUser.role.name },
      this.jwtSecret,
      { expiresIn: '1h' },
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { token, user: newUser };
  }

  async forgotPassword( forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // También podrías emitir una notificación de error aquí
      throw new UnauthorizedException('Email no encontrado');
    }
    return { message: 'Se ha enviado un correo para restablecer la contraseña.'};
  }

  async checkRoleExists(role_id: number): Promise<boolean> {
    const role = await this.prisma.role.findUnique({
      where: {id:role_id },
    });
    return !!role;
  }
  async getRoles(){
    return this.prisma.role.findMany();
  }
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: { select: { name: true } },
      },
    });
  }
  
}
