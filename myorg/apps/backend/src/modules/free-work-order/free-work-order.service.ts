import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateImpressResponseDto, CreateCorteResponseDto, CreateLaminacionResponseDto, CreatePrepressResponseDto, CreateEmpalmeResponseDto } from './dto/response.dto';
import { CreateFormAnswerImpressionDto } from './dto/form-answers.dto';

@Injectable()
export class FreeWorkOrderService {
  constructor(private prisma: PrismaService) {}
  
  // Para obtener los WorkOrderFlowEnProceso
  async getInProgressWorkOrders(userId: number, statuses: string[]) {
    console.log('Buscando ordenes en Proceso...');
    if(!userId){
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
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
              }
            },
          },
        },
      },
    });
    if(inProgressOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', inProgressOrders);
    return inProgressOrders;
  } 
  
  // Para obtener una Orden de Trabajo En Proceso por ID
  async getWorkOrderFlowById(id: string, areasOperatorIds: number) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        workOrder: {
          is: {
            ot_id: id,
          }
        },
        area_id: areasOperatorIds,
      },
      include: {
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
                areaResponse: {
                  include: {
                    prepress: true,
                  },
                },
              },
            },
          },
        },
        area: {
          include: {
            formQuestions: true,
          }
        },
        answers: true,
      },
    });
    if(!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrderFlow;
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createPrepressResponse(dto: CreatePrepressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

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
      if(nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      }
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
  // Guardar las respuestas del formulario
  async saveFormAnswers(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
          data: {
            user_id,
            area_id,
            sample_quantity,
            work_order_id,
            reviewed: reviewed ?? false,
            work_order_flow_id,
          },
        });
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }
  
  // Guardar las respuestas del formulario
  async saveFormAnswersLaminacion(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, finish_validation, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
          data: {
            user_id,
            area_id,
            sample_quantity,
            work_order_id,
            finish_validation,
            reviewed: reviewed ?? false,
            work_order_flow_id,
          },
        });
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }
  
  // Guardar las respuestas del formulario
  async saveFormAnswersHotStamping(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, color_foil, revisar_posicion, imagen_holograma, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
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
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }
  
  // Guardar las respuestas del formulario
  async saveFormAnswersMillingChip(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, revisar_tecnologia, validar_kvc, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
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
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }
  
  // Guardar las respuestas del formulario
  async saveFormAnswersPersonalizacion(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, tipo_personalizacion, verificar_etiqueta, color_personalizacion, codigo_barras, verificar_script, validar_kvc_perso, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
          data: {
            user_id,
            area_id,
            sample_quantity,
            tipo_personalizacion,
            verificar_etiqueta: verificar_etiqueta ?? null,
            color_personalizacion: color_personalizacion ?? null,
            codigo_barras: codigo_barras ?? null,
            verificar_script: verificar_script ?? null,
            validar_kvc_perso: validar_kvc_perso ?? null,
            work_order_id,
            reviewed: reviewed ?? false,
            work_order_flow_id,
          },
        });
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }


  // Para guardar respuesta de liberacion de Impresion
  async createImpressResponse(dto: CreateImpressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

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
      await tx.impressionResponse.create({
        data: {
          release_quantity: dto.releaseQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
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
      if(nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      }
      return { message: 'Respuesta guardada con exito'};
    })
  } 

  // Para guardar respuesta de liberacion de Preprensa
  async createEmpalmeResponse(dto: CreateEmpalmeResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      // Crear EmpalmeResponse
      await tx.empalmeResponse.create({
        data: {
          release_quantity: dto.releaseQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
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
      if(nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      }
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createLaminacionResponse(dto: CreateLaminacionResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      // Crear EmpalmeResponse
      await tx.laminacionResponse.create({
        data: {
          release_quantity: dto.releaseQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
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
      if(nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      }
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createCorteResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      //Crear el formauditory
      const formAuditory = await tx.formAuditory.create({
        data: {
          reviewed_by_id: null,
        }
      });

      // Crear EmpalmeResponse
      await tx.corteResponse.create({
        data: {
          good_quantity: dto.goodQuantity,
          bad_quantity: dto.badQuantity,
          excess_quantity: dto.badQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 

  // Guardar las respuestas del formulario
  async saveFormAnswersColorEdge(dto: CreateFormAnswerImpressionDto) {
    const { question_id, work_order_id, color_edge, response, user_id, area_id, sample_quantity, reviewed, work_order_flow_id } = dto;
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Crear el FormAnswerGeneral
        const formAnswer = await tx.formAnswer.create({
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
        // Mapear las respuestas de cada pregunta 
        const respuestas = question_id.map((questionId, index) => ({
          question_id: questionId,
          response_operator: response[index],
          form_answer_id: formAnswer.id,
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
        return { message: 'Respuestas guardadas exitosamente'}
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Para guardar respuesta de liberacion de Preprensa
  async createColorEdgeResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      //Crear el formauditory
      const formAuditory = await tx.formAuditory.create({
        data: {
          reviewed_by_id: null,
        }
      });
      // Crear EmpalmeResponse
      await tx.colorEdgeResponse.create({
        data: {
          good_quantity: dto.goodQuantity,
          bad_quantity: dto.badQuantity,
          excess_quantity: dto.badQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createHotStampingResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      //Crear el formauditory
      const formAuditory = await tx.formAuditory.create({
        data: {
          reviewed_by_id: null,
        }
      });
      // Crear EmpalmeResponse
      await tx.hotStampingResponse.create({
        data: {
          good_quantity: dto.goodQuantity,
          bad_quantity: dto.badQuantity,
          excess_quantity: dto.badQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createMillingChipResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      //Crear el formauditory
      const formAuditory = await tx.formAuditory.create({
        data: {
          reviewed_by_id: null,
        }
      });
      // Crear EmpalmeResponse
      await tx.millingChipResponse.create({
        data: {
          good_quantity: dto.goodQuantity,
          bad_quantity: dto.badQuantity,
          excess_quantity: dto.badQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 

  // Para guardar respuesta de liberacion de Preprensa
  async createPersonalizacionResponse(dto: CreateCorteResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Asociar el área response con el work order flow
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          area_response_id: response.id,
        },
      });

      //Crear el formauditory
      const formAuditory = await tx.formAuditory.create({
        data: {
          reviewed_by_id: null,
        }
      });
      // Crear EmpalmeResponse
      await tx.personalizacionResponse.create({
        data: {
          good_quantity: dto.goodQuantity,
          bad_quantity: dto.badQuantity,
          excess_quantity: dto.badQuantity,
          comments: dto.comments,
          form_answer_id: dto.formAnswerId,  // Pasamos el ID de FormAnswer
          areas_response_id: response.id,
          form_auditory_id: formAuditory.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 
  
}
