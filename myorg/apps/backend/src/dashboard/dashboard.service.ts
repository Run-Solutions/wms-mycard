import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getModulesByUser(userId: number) {
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                enabled: true,
              },
              include: {
                module: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    imageName: true,
                    logoName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  
    if (!userWithRole?.role) {
      return { message: 'Usuario no encontrado', modules: [] };
    }
  
    const modules = userWithRole.role.permissions
      .map((perm) => perm.module)
      .filter(Boolean);
    
    console.log('Para depurar .. Modules obtenidos:', modules); // Para depuración
    return { modules };
  }
  
  getKPIs() {
    return {
      stock: 150,
      orders: 20,
      incidents: 2,
      averageProcessingTime: '1h 30m',
    };
  }

  getNotifications() {
    return [
      {
        id: 1,
        message: 'Nuevo pedido recibido',
        timestamp: new Date(),
      },
      {
        id: 2,
        message: 'Incidencia reportada en recepción',
        timestamp: new Date(),
      },
    ];
  }
}
