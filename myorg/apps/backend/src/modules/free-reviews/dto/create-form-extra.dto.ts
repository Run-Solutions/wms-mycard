export class CheckboxDto {
  question_id: number;
  answer: boolean;
}
  
export class RadioDto {
  value: string;
}
export class RadioEmpalDto {
  magnetic_band: string;
  track_type: string;
}

export class ExtraDataEmpalDto {
  color: string;
  validar_inlays: string;
  holographic_type: string;
}
  
export class CreateFormExtraDto {
  form_answer_id: number;
  frente: CheckboxDto[];
  vuelta: CheckboxDto[];
  checkboxes: CheckboxDto[];
  radio: RadioDto;
}

export class CreateFormExtraEmpalDto {
  form_answer_id: number;
  checkboxes: CheckboxDto[];
  radio: RadioEmpalDto;
  extra_data: ExtraDataEmpalDto;
}

export class CreateFormExtraMillingDto {
  form_answer_id: number;
  checkboxes: CheckboxDto[];
  localizacion_contactos: string;
  altura_chip: string;
}

export class CreateFormExtraPersonalizacionDto {
  form_answer_id: number;
  checkboxes: CheckboxDto[];
  apariencia_quemado: string;
  validar_kvc_perso: string;
  verificar_script: string;
  carga_aplicacion: string;
}
  