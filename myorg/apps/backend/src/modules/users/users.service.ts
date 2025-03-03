import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDto } from '../../auth/dto/update-user.dto';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async getUsers() {
    return await this.prisma.user.findMany();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Extraemos el campo "role" para descartarlo y dejamos el resto en "data"
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
}
