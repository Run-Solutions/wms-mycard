import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AcceptReviewsService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFlowPendientes
  async getPendingWorkOrders() {
    console.log('Buscando ordenes pendientes...');
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: 'Enviado a CQM',
      },
      include: {
        user: true,
        area: true,
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                answers: true,
                area: true,
                areaResponse: true,
              },
            },
          },
        },
        areaResponse: {
          include: {
            prepress: true,
            user: true,
          },
        },
        answers: true,
      },
    });

    if (pendingOrders.length === 0) {
      return { message: 'No hay ordenes pendientes por revisar.' };
    }
    console.log('Ordenes pendientes desde accept-reviews service');
    return pendingOrders;
  }

  // Para obtener los WorkOrderFlowPendientes
  async getFormQuestions() {
    console.log('Buscando ordenes pendientes...');
    const pendingForms = await this.prisma.formQuestion.findMany({
      include: {
        role: true,
        areas: true,
      },
    });
    if (pendingForms.length === 0) {
      return { message: 'No hay ordenes pendientes por revisar.' };
    }
    console.log('Ordenes pendientes desde accept-reviews service');
    return pendingForms;
  }

  // Para obtener una Orden de Trabajo En Proceso por ID
  async getFormQuestionFlowById(areaId: number) {
    const AreaFormQuestions = await this.prisma.formQuestion.findMany({
      where: {
        areas: {
          some: {
            id: areaId,
          },
        },
      },
      include: {
        role: true,
        areas: true,
      },
    });

    if (!AreaFormQuestions.length) {
      return { message: 'No se encontraron formularios para esta área.' };
    }

    return AreaFormQuestions;
  }

  async updateQuestionTitleById(id: number, updatedTitle: string) {
    const FormQuestionTitle = await this.prisma.formQuestion.findFirst({
      where: {
        id: id,
      },
    });
    if (!FormQuestionTitle) {
      return { message: 'Titulo de pregunta no encontrada.' };
    }
    if (FormQuestionTitle.title === updatedTitle) {
      return { message: 'El título no ha cambiado.' };
    }
    const updatedQuestion = await this.prisma.formQuestion.update({
      where: { id: id },
      data: {
        title: updatedTitle,
      },
    });
    return updatedQuestion;
  }

  async deleteQuestionById(id: number) {
    const question = await this.prisma.formQuestion.findFirst({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException('Pregunta no encontrada.');
    }
    await this.prisma.formQuestion.delete({
      where: { id },
    });
    return { message: 'Pregunta eliminada correctamente.' };
  }

  // Para que el operador calidad acepte la orden
  async acceptWorkOrderFlowCQM(id: number, userId: number) {
    console.log('Asignando orden al operador...');

    // Se actualiza el formAnswer
    const updated = await this.prisma.formAnswer.update({
      where: {
        id: id, // Aquí debes usar el 'id' que es la clave primaria
      },
      data: {
        reviewed_by_id: userId,
        reviewer_assigned_at: new Date(),
      },
      include: {
        reviewer: true,
      },
    });

    // Se actualiza el status del WorkOrderFlow
    await this.prisma.workOrderFlow.update({
      where: {
        id: updated.work_order_flow_id,
      },
      data: {
        status: 'En Calidad',
      },
    });
    return updated;
  }
}
