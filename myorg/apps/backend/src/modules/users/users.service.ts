/* myorg\apps\backend\src\modules\users\users.service.ts */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDto } from '../../auth/dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async getUsers() {
    return await this.prisma.user.findMany({
      include: { role: true }, // Incluir la info del rol
    });
  }

  async getUsersAndRoles() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        profile_image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    return users.map((user) => ({
      ...user,
      role: user.role.name,
    }));
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      // 1) Extrae role y password explícitamente
      const { role, password, ...rest } = updateUserDto;
      void role; // 2) marca 'role' como usado de forma explícita (silencia no-unused-vars sin hacks)

      // 3) Construye 'data' tipado sin usar 'any'
      //    - Si viene password no vacía, la hasheas y la incluyes
      //    - Si no viene, simplemente no la pones en 'data'
      const data: Omit<UpdateUserDto, 'role' | 'password'> & {
        password?: string;
      } = {
        ...rest,
        ...(password && password.trim().length > 0
          ? { password: await bcrypt.hash(password, SALT_ROUNDS) }
          : {}),
      };

      return await this.prisma.user.update({
        where: { id: Number(id) },
        data, // sólo campos permitidos + password hasheada si aplicó
      });
    } catch (error) {
      console.error('Error en el servicio updateUser:', error);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      const deletedUser = await this.prisma.user.delete({
        where: { id: parseInt(id) },
      });
      return deletedUser;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }
}
