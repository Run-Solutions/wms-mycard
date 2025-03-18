/*myorg\apps\backend\src\auth\auth.service.ts*/
// myorg/apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();
  private readonly jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

  constructor(private readonly notificationsService: NotificationsService) {}

  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    const { username, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { 
        role: { 
          include: { 
            permissions: { 
              include: { module: true }  // ✅ Asegúrate de incluir el módulo
            } 
          } 
        } 
      },
    }) as {
      id: number;
      username: string;
      password: string;
      role?: {
        id: number;
        name: string;
        permissions?: { module?: { name: string } }[];
      };
    } | null;;
    
    

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Emitir notificación de error en login (opcional)
      this.notificationsService.sendNotification({
        type: 'error',
        message: 'Credenciales inválidas',
        timestamp: new Date().getTime(),
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokenPayload: Record<string, unknown> = {
      sub: user.id,
      username: user.username,
      role: user.role?.name,
      role_id: user.role?.id,
      modules: user.role?.permissions?.map((p) => p.module?.name) || [],
    };
    
    /*if (user.role?.name === 'operador' && user.areasOperator) {
      tokenPayload.areasOperator = {
        id: user.areasOperator.id,
        name: user.areasOperator.name,
      };
    }*/
    
    const token = jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: '1h' });
    
    return { token, user };
  }

  async register(registerDto: RegisterDto): Promise<{ token: string; user: any }> {
    console.log('Datos recibidos en el backend:', registerDto);
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    console.log('Validando role_id');
    if (!registerDto.role_id) {
      throw new BadRequestException('El role_id es obligatorio.');
    }

    const roleExists = await this.prisma.role.findUnique({ where: { id: registerDto.role_id } });
    if (!roleExists) {
      throw new BadRequestException(`El role_id ${registerDto.role_id} no existe.`);
    }

    // Si se envía área operatoria, la validamos
    if (registerDto.areas_operator_id) {
      const areaExists = await this.prisma.areasOperator.findUnique({
        where: { id: registerDto.areas_operator_id },
      });
      if (!areaExists) {
        throw new BadRequestException(`El areas_operator_id ${registerDto.areas_operator_id} no existe.`);
      }
    }

    console.log('Intentando crear usuario');
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          password: hashedPassword,
          role: { connect: { id: registerDto.role_id } },
          areasOperator: registerDto.areas_operator_id
            ? { connect: { id: registerDto.areas_operator_id } }
            : undefined,
        },
        include: {
          role: { select: { name: true } },
          areasOperator: { select: { name: true } },
        },
      });

      this.notificationsService.sendNotification({
        type: 'success',
        message: `Nuevo usuario registrado: ${newUser.username}`,
        timestamp: new Date().getTime(),
      });

      const token = jwt.sign(
        { sub: newUser.id, username: newUser.username, role: newUser.role.name },
        this.jwtSecret,
        { expiresIn: '1h' },
      );
      return { token, user: newUser };
    } catch (error: unknown) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === 'P2002') {
        const target = (prismaError.meta?.target as string[]) || [];
        if (target.includes('User_username_key')) {
          throw new BadRequestException('El nombre de usuario ya existe');
        }
        if (target.includes('User_email_key')) {
          throw new BadRequestException('El correo ya existe');
        }
      }
      throw new BadRequestException('Error al registrar el usuario');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email no encontrado');
    }
    return { message: 'Se ha enviado un correo para restablecer la contraseña.' };
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          select: {
            id: true,
            module: true,
          },
        },
      },
    });
  }

  async getAreasOperator(): Promise<{ id: number; name: string }[]> {
    // Agregamos await para cumplir la regla require-await
    return await this.prisma.areasOperator.findMany();
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

  async checkRoleExists(role_id: number): Promise<boolean> {
    const role = await this.prisma.role.findUnique({ where: { id: role_id } });
    return !!role;
  }
}
