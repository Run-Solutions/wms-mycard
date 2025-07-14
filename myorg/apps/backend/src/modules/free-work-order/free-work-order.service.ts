import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateImpressResponseDto,
  CreateCorteResponseDto,
  CreateLaminacionResponseDto,
  CreatePrepressResponseDto,
  CreateEmpalmeResponseDto,
} from './dto/response.dto';
import { CreateFormAnswerImpressionDto } from './dto/form-answers.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class FreeWorkOrderService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /*
    Envía una notificación a los auditores avisando de una orden disponible.
  */
  private async notifyAuditors(
    tx: Prisma.TransactionClient,
    workOrderFlowId: number,
  ) {
    const workOrderFlow = await tx.workOrderFlow.findUnique({
      where: { id: workOrderFlowId },
      select: { work_order_id: true },
    });

    const workOrderNotification = await tx.workOrder.findUnique({
      where: { id: workOrderFlow?.work_order_id },
      select: { ot_id: true },
    });

    const workOrderId = workOrderNotification?.ot_id;

    await this.notificationsService.createAndSendNotificationToRole(
      'auditor',
      'Nueva orden disponible',
      'Hay una orden pendiente de aceptación',
      { workOrderId },
    );
  }
  // Para obtener los WorkOrderFlowEnProceso
  async getInProgressWorkOrders(userId: number, statuses: string[]) {
    console.log('Buscando ordenes en Proceso...');
    if (!userId) {
      throw new Error('No se proporcionan areas validas');
    }
    const inProgressOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: statuses,
        },
        assigned_user: userId,
      },
      include: {
        partialReleases: true,
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                user: true,
                area: true,
                partialReleases: true,
              },
            },
          },
        },
      },
    });
    if (inProgressOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.' };
    }
    console.log(
      'Ordenes pendientes desde work-orders services',
      inProgressOrders,
    );
    return inProgressOrders;
  }

  // Para obtener una Orden de Trabajo En Proceso por ID
  async getWorkOrderFlowById(id: string, areasOperatorIds: number) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        workOrder: {
          is: {
            ot_id: id,
          },
        },
        area_id: areasOperatorIds,
      },
      include: {
        partialReleases: true,
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
                user: true,
                workOrder: true,
                partialReleases: true,
                areaResponse: {
                  include: {
                    prepress: true,
                    impression: true,
                    serigrafia: true,
                    empalme: true,
                    laminacion: true,
                    corte: true,
                    colorEdge: true,
                    hotStamping: true,
                    millingChip: true,
                    personalizacion: true,
                  },
                },
                answers: true,
              },
            },
          },
        },
        area: {
          include: {
            formQuestions: true,
          },
        },
        answers: true,
      },
    });
    if (!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.' };
    }
    return workOrderFlow;
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createPrepressResponse(dto: CreatePrepressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      // Crear AreasResponse si no existe
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      // Crear PrepressResponse
      await tx.prepressResponse.create({
        data: {
          plates: dto.plates,
          positives: dto.positives,
          testType: dto.testType,
          comments: dto.comments,
          areas_response_id: response.id,
        },
      });

      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Completado',
        },
      });

      // Buscar el siguiente flujo (por id mayor y mismo work_order)
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: {
            gt: dto.workOrderFlowId,
          },
          status: 'En espera',
        },
        orderBy: {
          id: 'asc',
        },
      });

      // Si hay un siguiente flujo, se actualiza a pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      }
      return { message: 'Respuesta guardada con exito' };
    });
  }

  // Guardar las respuestas del formulario
  async saveFormAnswers(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear siempre un nuevo FormAnswer
        const newFormAnswer = await tx.formAnswer.create({
          data: {
            user_id,
            area_id,
            sample_quantity,
            work_order_id,
            reviewed: reviewed ?? false,
            work_order_flow_id,
          },
        });

        const formAnswerId = newFormAnswer.id;

        // Crear las respuestas nuevas
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));

        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });

        // Actualizar estado del WorkOrderFlow
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
      throw new Error('Error al guardar respuestas');
    }
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersImpression(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      frente,
      vuelta,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar si ya existe un FormAnswer con ese work_order_flow_id
        const existingFormAnswer = await tx.formAnswer.findFirst({
          where: {
            work_order_flow_id,
          },
        });

        let formAnswerId: number;

        if (existingFormAnswer) {
          // Si existe, actualizar los datos
          const updatedFormAnswer = await tx.formAnswer.update({
            where: { id: existingFormAnswer.id },
            data: {
              user_id,
              area_id,
              sample_quantity,
              work_order_id,
              reviewed: reviewed ?? false,
            },
          });

          formAnswerId = updatedFormAnswer.id;

          // Eliminar las respuestas anteriores
          await tx.formAnswerResponse.deleteMany({
            where: { form_answer_id: formAnswerId },
          });
        } else {
          // Si no existe, crear el FormAnswer
          const newFormAnswer = await tx.formAnswer.create({
            data: {
              user_id,
              area_id,
              sample_quantity,
              work_order_id,
              reviewed: reviewed ?? false,
              work_order_flow_id,
            },
          });

          formAnswerId = newFormAnswer.id;
        }
        // Mapear las respuestas de cada pregunta, primero del frente
        const respuestasFrente = question_id
          .filter((_, index) => frente[index])
          .map((questionId, index) => ({
            question_id: questionId,
            response_operator: frente[index],
            form_answer_id: formAnswerId,
          }));
        // Mapear las respuestas de cada pregunta, luego de vuelta
        const respuestasVuelta = question_id
          .filter((_, index) => vuelta[index])
          .map((questionId, index) => ({
            question_id: questionId,
            response_operator: vuelta[index],
            form_answer_id: formAnswerId,
          }));
        // Crear todas las respuestas
        await tx.formAnswerResponse.createMany({
          data: [...respuestasFrente, ...respuestasVuelta],
        });
        // Actualizar el estado del WorkOrderFlow a Enviado a CQM
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersLaminacion(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      finish_validation,
      valor_anclaje,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear siempre un nuevo FormAnswer
        const newFormAnswer = await tx.formAnswer.create({
          data: {
            user_id,
            area_id,
            sample_quantity,
            finish_validation,
            valor_anclaje,
            work_order_id,
            reviewed: reviewed ?? false,
            work_order_flow_id,
          },
        });

        const formAnswerId = newFormAnswer.id;

        // Crear las respuestas nuevas
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));
        // Crear todas las respuestas
        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });
        // Actualizar el estado del WorkOrderFlow a Enviado a CQM
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersHotStamping(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      color_foil,
      revisar_posicion,
      imagen_holograma,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar si ya existe un FormAnswer con ese work_order_flow_id
        const existingFormAnswer = await tx.formAnswer.findFirst({
          where: {
            work_order_flow_id,
          },
        });

        let formAnswerId: number;

        if (existingFormAnswer) {
          // Si existe, actualizar los datos
          const updatedFormAnswer = await tx.formAnswer.update({
            where: { id: existingFormAnswer.id },
            data: {
              user_id,
              area_id,
              sample_quantity,
              color_foil,
              work_order_id,
              revisar_posicion,
              imagen_holograma,
              reviewed: reviewed ?? false,
            },
          });

          formAnswerId = updatedFormAnswer.id;

          // Eliminar las respuestas anteriores
          await tx.formAnswerResponse.deleteMany({
            where: { form_answer_id: formAnswerId },
          });
        } else {
          // Si no existe, crear el FormAnswer
          const newFormAnswer = await tx.formAnswer.create({
            data: {
              user_id,
              area_id,
              sample_quantity,
              color_foil,
              work_order_id,
              revisar_posicion,
              imagen_holograma,
              reviewed: reviewed ?? false,
              work_order_flow_id,
            },
          });

          formAnswerId = newFormAnswer.id;
        }

        // Mapear las nuevas respuestas
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));

        // Crear todas las respuestas nuevas
        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });

        // Actualizar el estado del WorkOrderFlow a 'Enviado a CQM'
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
      throw new Error('Error al guardar respuestas de hot stamping');
    }
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersMillingChip(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      revisar_tecnologia,
      validar_kvc,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar si ya existe un FormAnswer con ese work_order_flow_id
        const existingFormAnswer = await tx.formAnswer.findFirst({
          where: {
            work_order_flow_id,
          },
        });

        let formAnswerId: number;

        if (existingFormAnswer) {
          // Si existe, actualizar los datos
          const updatedFormAnswer = await tx.formAnswer.update({
            where: { id: existingFormAnswer.id },
            data: {
              user_id,
              area_id,
              sample_quantity,
              revisar_tecnologia,
              work_order_id,
              validar_kvc,
              reviewed: reviewed ?? false,
            },
          });

          formAnswerId = updatedFormAnswer.id;

          // Eliminar las respuestas anteriores
          await tx.formAnswerResponse.deleteMany({
            where: { form_answer_id: formAnswerId },
          });
        } else {
          // Si no existe, crear el FormAnswer
          const newFormAnswer = await tx.formAnswer.create({
            data: {
              user_id,
              area_id,
              sample_quantity,
              revisar_tecnologia,
              work_order_id,
              validar_kvc,
              reviewed: reviewed ?? false,
              work_order_flow_id,
            },
          });

          formAnswerId = newFormAnswer.id;
        }
        // Mapear las respuestas de cada pregunta
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));
        // Crear todas las respuestas
        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });
        // Actualizar el estado del WorkOrderFlow a Enviado a CQM
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersPersonalizacion(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      tipo_personalizacion,
      verificar_etiqueta,
      color_personalizacion,
      codigo_barras,
      verificar_script,
      validar_kvc_perso,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar si ya existe un FormAnswer con ese work_order_flow_id
        const existingFormAnswer = await tx.formAnswer.findFirst({
          where: {
            work_order_flow_id,
          },
        });

        let formAnswerId: number;

        if (existingFormAnswer) {
          // Si existe, actualizar los datos
          const updatedFormAnswer = await tx.formAnswer.update({
            where: { id: existingFormAnswer.id },
            data: {
              user_id,
              area_id,
              sample_quantity,
              tipo_personalizacion,
              work_order_id,
              verificar_etiqueta,
              color_personalizacion,
              codigo_barras,
              verificar_script,
              validar_kvc_perso,
              reviewed: reviewed ?? false,
            },
          });

          formAnswerId = updatedFormAnswer.id;

          // Eliminar las respuestas anteriores
          await tx.formAnswerResponse.deleteMany({
            where: { form_answer_id: formAnswerId },
          });
        } else {
          // Si no existe, crear el FormAnswer
          const newFormAnswer = await tx.formAnswer.create({
            data: {
              user_id,
              area_id,
              sample_quantity,
              tipo_personalizacion,
              work_order_id,
              verificar_etiqueta,
              color_personalizacion,
              codigo_barras,
              verificar_script,
              validar_kvc_perso,
              reviewed: reviewed ?? false,
              work_order_flow_id,
            },
          });

          formAnswerId = newFormAnswer.id;
        }
        // Mapear las respuestas de cada pregunta
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));
        // Crear todas las respuestas
        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });
        // Actualizar el estado del WorkOrderFlow a Enviado a CQM
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Para guardar respuesta de liberacion de Impresion
  async createImpressResponse(dto: CreateImpressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Obtener el siguiente flujo (mayor id del mismo work_order)
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: { gt: dto.workOrderFlowId },
        },
        orderBy: { id: 'asc' },
      });
      // Obtener cantidad solicitada de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // Obtener liberaciones parciales previas
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });

      const totalLiberadoPrevio = partials.reduce(
        (total, partial) => total + (partial.quantity ?? 0),
        0,
      );
      const totalLiberadoActual = totalLiberadoPrevio + dto.releaseQuantity;
      // 🟡 Caso parcial: aún no se completa la orden
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.releaseQuantity,
            observation: dto.comments,
          },
        });
        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Parcial' },
        });
        if (nextFlow) {
          await tx.workOrderFlow.update({
            where: { id: nextFlow.id },
            data: { status: 'Pendiente parcial' },
          });
        }
        return { message: 'Liberación parcial registrada con éxito' };
      }
      // ✅ Caso completo: ya se alcanzó o superó la cantidad
      // Crear o recuperar AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear impressionResponse
      await tx.impressionResponse.create({
        data: {
          release_quantity: totalLiberadoActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
        },
      });
      // Marcar flujo como Completado
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Completado' },
      });
      // Si hay siguiente flujo, marcarlo como Pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente' },
        });
      }
      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Impresion
  async createSerigrafiaResponse(dto: CreateImpressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Obtener el siguiente flujo (mayor id del mismo work_order)
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: { gt: dto.workOrderFlowId },
        },
        orderBy: { id: 'asc' },
      });
      // Obtener cantidad solicitada de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // Obtener liberaciones parciales previas
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });

      const totalLiberadoPrevio = partials.reduce(
        (total, partial) => total + (partial.quantity ?? 0),
        0,
      );
      const totalLiberadoActual = totalLiberadoPrevio + dto.releaseQuantity;
      // 🟡 Caso parcial: aún no se completa la orden
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.releaseQuantity,
            observation: dto.comments,
          },
        });
        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Parcial' },
        });
        if (nextFlow) {
          await tx.workOrderFlow.update({
            where: { id: nextFlow.id },
            data: { status: 'Pendiente parcial' },
          });
        }
        return { message: 'Liberación parcial registrada con éxito' };
      }
      // ✅ Caso completo: ya se alcanzó o superó la cantidad
      // Crear o recuperar AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear serigrafiaResponse
      await tx.serigrafiaResponse.create({
        data: {
          release_quantity: totalLiberadoActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
        },
      });
      // Marcar flujo como Completado
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Completado' },
      });
      // Si hay siguiente flujo, marcarlo como Pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente' },
        });
      }
      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createEmpalmeResponse(dto: CreateEmpalmeResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Obtener el siguiente flujo (mayor id del mismo work_order)
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: { gt: dto.workOrderFlowId },
        },
        orderBy: { id: 'asc' },
      });
      // Obtener cantidad solicitada de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // Obtener liberaciones parciales previas
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });

      const totalLiberadoPrevio = partials.reduce(
        (total, partial) => total + (partial.quantity ?? 0),
        0,
      );
      const totalLiberadoActual = totalLiberadoPrevio + dto.releaseQuantity;
      // 🟡 Caso parcial: aún no se completa la orden
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.releaseQuantity,
            observation: dto.comments,
          },
        });
        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Parcial' },
        });
        if (nextFlow) {
          await tx.workOrderFlow.update({
            where: { id: nextFlow.id },
            data: { status: 'Pendiente parcial' },
          });
        }
        return { message: 'Liberación parcial registrada con éxito' };
      }
      // ✅ Caso completo: ya se alcanzó o superó la cantidad
      // Crear o recuperar AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear empalmeResponse
      await tx.empalmeResponse.create({
        data: {
          release_quantity: totalLiberadoActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
        },
      });
      // Marcar flujo como Completado
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Completado' },
      });
      // Si hay siguiente flujo, marcarlo como Pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente' },
        });
      }
      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createLaminacionResponse(dto: CreateLaminacionResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Obtener el siguiente flujo (mayor id del mismo work_order)
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: { gt: dto.workOrderFlowId },
        },
        orderBy: { id: 'asc' },
      });
      // Obtener cantidad solicitada de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // Obtener liberaciones parciales previas
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });

      const totalLiberadoPrevio = partials.reduce(
        (total, partial) => total + (partial.quantity ?? 0),
        0,
      );
      const totalLiberadoActual = totalLiberadoPrevio + dto.releaseQuantity;
      // 🟡 Caso parcial: aún no se completa la orden
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.releaseQuantity,
            observation: dto.comments,
          },
        });
        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Parcial' },
        });
        if (nextFlow) {
          await tx.workOrderFlow.update({
            where: { id: nextFlow.id },
            data: { status: 'Pendiente parcial' },
          });
        }
        return { message: 'Liberación parcial registrada con éxito' };
      }
      // ✅ Caso completo: ya se alcanzó o superó la cantidad
      // Crear o recuperar AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear LaminacionResponse
      await tx.laminacionResponse.create({
        data: {
          release_quantity: totalLiberadoActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
        },
      });
      // Marcar flujo como Completado
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Completado' },
      });
      // Si hay siguiente flujo, marcarlo como Pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente' },
        });
      }
      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createCorteResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener cantidad de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // 2. Calcular totales previos
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });
      const totalLiberadoPrevio = partials.reduce(
        (sum, p) => sum + (p.quantity ?? 0),
        0,
      );
      const totalBadPrevio = partials.reduce(
        (sum, p) => sum + (p.bad_quantity ?? 0),
        0,
      );
      const totalExcessPrevio = partials.reduce(
        (sum, p) => sum + (p.excess_quantity ?? 0),
        0,
      );
      // 3. Calcular nuevos totales
      const totalLiberadoActual = totalLiberadoPrevio + dto.goodQuantity;
      const totalBadActual = totalBadPrevio + dto.badQuantity;
      const totalExcessActual = totalExcessPrevio + dto.excessQuantity;
      // 4. Si NO se alcanza la cantidad solicitada => solo crear liberación parcial
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.goodQuantity,
            bad_quantity: dto.badQuantity,
            excess_quantity: dto.excessQuantity,
            observation: dto.comments,
          },
        });

        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Enviado a auditoria parcial' },
        });
        await this.notifyAuditors(tx, dto.workOrderFlowId);

        return { message: 'Liberación parcial registrada con éxito' };
      }
      // 5. Si ya se alcanzó o superó la cantidad => crear respuestas finales
      // Buscar o crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear FormAuditory
      const formAuditory = await tx.formAuditory.create({
        data: { reviewed_by_id: null },
      });
      // Crear CorteResponse
      await tx.corteResponse.create({
        data: {
          good_quantity: totalLiberadoActual,
          bad_quantity: totalBadActual,
          excess_quantity: totalExcessActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      // Actualizar estado final
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Enviado a Auditoria' },
      });
      await this.notifyAuditors(tx, dto.workOrderFlowId);
      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Guardar las respuestas del formulario
  async saveFormAnswersColorEdge(dto: CreateFormAnswerImpressionDto) {
    const {
      question_id,
      work_order_id,
      color_edge,
      response,
      user_id,
      area_id,
      sample_quantity,
      reviewed,
      work_order_flow_id,
    } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Buscar si ya existe un FormAnswer con ese work_order_flow_id
        const existingFormAnswer = await tx.formAnswer.findFirst({
          where: {
            work_order_flow_id,
          },
        });

        let formAnswerId: number;

        if (existingFormAnswer) {
          // Si existe, actualizar los datos
          const updatedFormAnswer = await tx.formAnswer.update({
            where: { id: existingFormAnswer.id },
            data: {
              user_id,
              area_id,
              sample_quantity,
              color_edge,
              work_order_id,
              reviewed: reviewed ?? false,
            },
          });

          formAnswerId = updatedFormAnswer.id;

          // Eliminar las respuestas anteriores
          await tx.formAnswerResponse.deleteMany({
            where: { form_answer_id: formAnswerId },
          });
        } else {
          // Si no existe, crear el FormAnswer
          const newFormAnswer = await tx.formAnswer.create({
            data: {
              user_id,
              area_id,
              sample_quantity,
              color_edge,
              work_order_id,
              reviewed: reviewed ?? false,
              work_order_flow_id,
            },
          });

          formAnswerId = newFormAnswer.id;
        }
        // Mapear las respuestas de cada pregunta
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswerId,
        }));
        // Crear todas las respuestas
        await tx.formAnswerResponse.createMany({
          data: respuestas,
        });
        // Actualizar el estado del WorkOrderFlow a Enviado a CQM
        await tx.workOrderFlow.update({
          where: {
            id: work_order_flow_id,
          },
          data: {
            status: 'Enviado a CQM',
          },
        });

        const workOrderFlow = await this.prisma.workOrderFlow.findUnique({
          where: { id: work_order_flow_id },
          select: { assigned_user: true, work_order_id: true },
        });
        const workOrder = await this.prisma.workOrder.findUnique({
          where: { id: workOrderFlow?.work_order_id },
          select: { ot_id: true },
        });
        const workOrderId = workOrder?.ot_id;
        await this.notificationsService.createAndSendNotificationToRole(
          'calidad',
          'Nueva orden disponible',
          'Hay una orden pendiente de aceptación',
          { workOrderId },
        );

        return { message: 'Respuestas guardadas exitosamente' };
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createColorEdgeResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener cantidad de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // 2. Calcular totales previos
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });
      const totalLiberadoPrevio = partials.reduce(
        (sum, p) => sum + (p.quantity ?? 0),
        0,
      );
      const totalBadPrevio = partials.reduce(
        (sum, p) => sum + (p.bad_quantity ?? 0),
        0,
      );
      const totalExcessPrevio = partials.reduce(
        (sum, p) => sum + (p.excess_quantity ?? 0),
        0,
      );
      // 3. Calcular nuevos totales
      const totalLiberadoActual = totalLiberadoPrevio + dto.goodQuantity;
      const totalBadActual = totalBadPrevio + dto.badQuantity;
      const totalExcessActual = totalExcessPrevio + dto.excessQuantity;
      // 4. Si NO se alcanza la cantidad solicitada => solo crear liberación parcial
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.goodQuantity,
            bad_quantity: dto.badQuantity,
            excess_quantity: dto.excessQuantity,
            observation: dto.comments,
          },
        });

        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Enviado a auditoria parcial' },
        });
        await this.notifyAuditors(tx, dto.workOrderFlowId);

        return { message: 'Liberación parcial registrada con éxito' };
      }
      // 5. Si ya se alcanzó o superó la cantidad => crear respuestas finales
      // Buscar o crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear FormAuditory
      const formAuditory = await tx.formAuditory.create({
        data: { reviewed_by_id: null },
      });
      // Crear PersonalizacionResponse
      await tx.colorEdgeResponse.create({
        data: {
          good_quantity: totalLiberadoActual,
          bad_quantity: totalBadActual,
          excess_quantity: totalExcessActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      // Actualizar estado final
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Enviado a Auditoria' },
      });
      await this.notifyAuditors(tx, dto.workOrderFlowId);

      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createHotStampingResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener cantidad de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // 2. Calcular totales previos
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });
      const totalLiberadoPrevio = partials.reduce(
        (sum, p) => sum + (p.quantity ?? 0),
        0,
      );
      const totalBadPrevio = partials.reduce(
        (sum, p) => sum + (p.bad_quantity ?? 0),
        0,
      );
      const totalExcessPrevio = partials.reduce(
        (sum, p) => sum + (p.excess_quantity ?? 0),
        0,
      );
      // 3. Calcular nuevos totales
      const totalLiberadoActual = totalLiberadoPrevio + dto.goodQuantity;
      const totalBadActual = totalBadPrevio + dto.badQuantity;
      const totalExcessActual = totalExcessPrevio + dto.excessQuantity;
      // 4. Si NO se alcanza la cantidad solicitada => solo crear liberación parcial
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.goodQuantity,
            bad_quantity: dto.badQuantity,
            excess_quantity: dto.excessQuantity,
            observation: dto.comments,
          },
        });

        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Enviado a auditoria parcial' },
        });
        await this.notifyAuditors(tx, dto.workOrderFlowId);

        return { message: 'Liberación parcial registrada con éxito' };
      }
      // 5. Si ya se alcanzó o superó la cantidad => crear respuestas finales
      // Buscar o crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear FormAuditory
      const formAuditory = await tx.formAuditory.create({
        data: { reviewed_by_id: null },
      });
      // Crear PersonalizacionResponse
      await tx.hotStampingResponse.create({
        data: {
          good_quantity: totalLiberadoActual,
          bad_quantity: totalBadActual,
          excess_quantity: totalExcessActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      // Actualizar estado final
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Enviado a Auditoria' },
      });
      await this.notifyAuditors(tx, dto.workOrderFlowId);

      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createMillingChipResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener cantidad de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // 2. Calcular totales previos
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });
      const totalLiberadoPrevio = partials.reduce(
        (sum, p) => sum + (p.quantity ?? 0),
        0,
      );
      const totalBadPrevio = partials.reduce(
        (sum, p) => sum + (p.bad_quantity ?? 0),
        0,
      );
      const totalExcessPrevio = partials.reduce(
        (sum, p) => sum + (p.excess_quantity ?? 0),
        0,
      );
      // 3. Calcular nuevos totales
      const totalLiberadoActual = totalLiberadoPrevio + dto.goodQuantity;
      const totalBadActual = totalBadPrevio + dto.badQuantity;
      const totalExcessActual = totalExcessPrevio + dto.excessQuantity;
      // 4. Si NO se alcanza la cantidad solicitada => solo crear liberación parcial
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.goodQuantity,
            bad_quantity: dto.badQuantity,
            excess_quantity: dto.excessQuantity,
            observation: dto.comments,
          },
        });

        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Enviado a auditoria parcial' },
        });
        await this.notifyAuditors(tx, dto.workOrderFlowId);

        return { message: 'Liberación parcial registrada con éxito' };
      }
      // 5. Si ya se alcanzó o superó la cantidad => crear respuestas finales
      // Buscar o crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear FormAuditory
      const formAuditory = await tx.formAuditory.create({
        data: { reviewed_by_id: null },
      });
      // Crear PersonalizacionResponse
      await tx.millingChipResponse.create({
        data: {
          good_quantity: totalLiberadoActual,
          bad_quantity: totalBadActual,
          excess_quantity: totalExcessActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      // Actualizar estado final
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Enviado a Auditoria' },
      });
      await this.notifyAuditors(tx, dto.workOrderFlowId);

      return { message: 'Respuesta guardada con éxito' };
    });
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createPersonalizacionResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener cantidad de la orden
      const workOrder = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
        select: { quantity: true },
      });
      if (!workOrder) throw new Error('Work Order no encontrada');
      // 2. Calcular totales previos
      const partials = await tx.partialRelease.findMany({
        where: { work_order_flow_id: dto.workOrderFlowId },
      });
      const totalLiberadoPrevio = partials.reduce(
        (sum, p) => sum + (p.quantity ?? 0),
        0,
      );
      const totalBadPrevio = partials.reduce(
        (sum, p) => sum + (p.bad_quantity ?? 0),
        0,
      );
      const totalExcessPrevio = partials.reduce(
        (sum, p) => sum + (p.excess_quantity ?? 0),
        0,
      );
      // 3. Calcular nuevos totales
      const totalLiberadoActual = totalLiberadoPrevio + dto.goodQuantity;
      const totalBadActual = totalBadPrevio + dto.badQuantity;
      const totalExcessActual = totalExcessPrevio + dto.excessQuantity;
      // 4. Si NO se alcanza la cantidad solicitada => solo crear liberación parcial
      if (totalLiberadoActual < workOrder.quantity) {
        await tx.partialRelease.create({
          data: {
            work_order_flow_id: dto.workOrderFlowId,
            quantity: dto.goodQuantity,
            bad_quantity: dto.badQuantity,
            excess_quantity: dto.excessQuantity,
            observation: dto.comments,
          },
        });

        await tx.workOrderFlow.update({
          where: { id: dto.workOrderFlowId },
          data: { status: 'Enviado a auditoria parcial' },
        });
        await this.notifyAuditors(tx, dto.workOrderFlowId);

        return { message: 'Liberación parcial registrada con éxito' };
      }
      // 5. Si ya se alcanzó o superó la cantidad => crear respuestas finales
      // Buscar o crear AreasResponse
      let response = await tx.areasResponse.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
        },
      });
      if (!response) {
        response = await tx.areasResponse.create({
          data: {
            work_order_id: dto.workOrderId,
            work_order_flow_id: dto.workOrderFlowId,
            area_id: dto.areaId,
            assigned_user: dto.assignedUser,
          },
        });
      }
      // Asociar AreaResponse al flujo
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { area_response_id: response.id },
      });
      // Crear FormAuditory
      const formAuditory = await tx.formAuditory.create({
        data: { reviewed_by_id: null },
      });
      // Crear PersonalizacionResponse
      await tx.personalizacionResponse.create({
        data: {
          good_quantity: totalLiberadoActual,
          bad_quantity: totalBadActual,
          excess_quantity: totalExcessActual,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      // Actualizar estado final
      await tx.workOrderFlow.update({
        where: { id: dto.workOrderFlowId },
        data: { status: 'Enviado a Auditoria' },
      });
      await this.notifyAuditors(tx, dto.workOrderFlowId);

      return { message: 'Respuesta guardada con éxito' };
    });
  }
}
