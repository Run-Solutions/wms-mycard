/* myorg\apps\backend\src\modules\users\users.service.ts */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDto } from '../../auth/dto/update-user.dto';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async getUsers() {
    return await this.prisma.user.findMany({
      include: { role: true } // Incluir la info del rol
    });
  }

  async getUsersAndRoles() {
    const users= await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        profile_image: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
    return users.map(user => ({
      ...user,
      role: user.role.name
    }))
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Extraemos el campo 'role' para descartarlo y dejamos el resto en 'data'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role, ...data } = updateUserDto;

      const updatedUser = await this.prisma.user.update({
        where: { id: parseInt(id) },
        data, // Actualizamos solo con los campos permitidos
      });
      return updatedUser;
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
