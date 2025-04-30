import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFormExtraDto } from './dto/create-form-extra.dto';
import { CreateFormExtraEmpalDto } from './dto/create-form-extra.dto';
import { CreateFormExtraMillingDto } from './dto/create-form-extra.dto';
import { CreateFormExtraPersonalizacionDto } from './dto/create-form-extra.dto';

@Injectable()
export class FreeReviewsService {
  constructor(private prisma: PrismaService){}

  // Para obtener los WorkOrders en Calidad
  async getInCQMWorkOrders(userId: number, statuses: string[]){
    console.log('Buscando ordenes en Calidad');
    if(!userId){
      throw new Error('No se proporcionan areas validas');
    }
    const inCQMOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: statuses,
        },
        answers: {
          some: {
            reviewed_by_id: userId
          }
        },
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
    if(inCQMOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', inCQMOrders);
    return inCQMOrders;
  }

  // Para obtener una Orden de Trabajo En Calidad por ID
  async getWorkOrderFlowById(id: string) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        workOrder: {
          is: {
            ot_id: id,
          }
        },
        status: 'En calidad',
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
        answers: {
          include: {
            FormAnswerResponse: true,
          }
        },
        user: true,
      },
    });
    if(!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrderFlow;
  } 
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtra(dto: CreateFormExtraDto) {
    const { form_answer_id, checkboxes, radio } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: radio.value,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...checkboxes.map(cb =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: cb.question_id },
            },
            response_cqm: cb.answer,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtraImpresion(dto: CreateFormExtraDto) {
    const { form_answer_id, frente, vuelta, radio } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: radio.value,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...frente.map(q =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: q.question_id },
            },
            response_cqm: true,
            response_operator: false, 
          },
        })
      ),
      ...vuelta.map(q =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: q.question_id },
            },
            response_cqm: true,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtraSeri(dto: CreateFormExtraDto) {
    const { form_answer_id, checkboxes } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: null,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...checkboxes.map(cb =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: cb.question_id },
            },
            response_cqm: cb.answer,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtraEmpal(dto: CreateFormExtraEmpalDto) {
    const { form_answer_id, checkboxes } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: null,
          validar_inlays: dto.extra_data.validar_inlays,
          magnetic_band: dto.radio.magnetic_band,
          track_type: dto.radio.track_type,
          color: dto.extra_data.color,
          holographic_type: dto.extra_data.holographic_type,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...checkboxes.map(cb =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: cb.question_id },
            },
            response_cqm: cb.answer,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtraMilling(dto: CreateFormExtraMillingDto) {
    const { form_answer_id, checkboxes, localizacion_contactos, altura_chip } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: null,
          localizacion_contactos,
          altura_chip,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...checkboxes.map(cb =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: cb.question_id },
            },
            response_cqm: cb.answer,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
  // Para adjuntar las respuestas de calidad 
  async postFormExtraPersonalizacion(dto: CreateFormExtraPersonalizacionDto) {
    const { form_answer_id, checkboxes, validar_kvc_perso, verificar_script, apariencia_quemado, carga_aplicacion } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          testtype_cqm: null,
          validar_kvc_perso: validar_kvc_perso ?? null,
          verificar_script: verificar_script ?? null,
          apariencia_quemado: apariencia_quemado ?? null,
          carga_aplicacion: carga_aplicacion ?? null,
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
  
      ...(checkboxes ?? []).map(cb =>
        this.prisma.formAnswerResponse.create({
          data: {
            formAnswer: {
              connect: { id: form_answer_id }
            },
            question: {
              connect: { id: cb.question_id },
            },
            response_cqm: cb.answer,
            response_operator: false, 
          },
        })
      )
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }

  // Para adjuntar las respuestas de calidad 
  async postFormExtraColorEdge(dto: CreateFormExtraDto) {
    const { form_answer_id } = dto;
  
    const formAnswer = await this.prisma.formAnswer.findUnique({
      where: { id: form_answer_id },
      select: { work_order_flow_id: true },
    });
  
    // Agrupamos todo en una transacción
    await this.prisma.$transaction([
      this.prisma.formAnswer.update({
        where: { id: form_answer_id },
        data: {
          accepted: true,
          reviewed: true,
        },
      }),
  
      this.prisma.workOrderFlow.update({
        where: { id: formAnswer?.work_order_flow_id },
        data: {
          status: 'Listo',
        },
      }),
    ]);
  
    return { message: 'Datos guardados correctamente' };
  }
  
}
