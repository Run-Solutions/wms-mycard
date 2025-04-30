// myorg/apps/backend/src/modules/free-work-order/dto/form-answers.dto.ts
import { IsArray, IsInt, IsBoolean, IsOptional, IsNotEmpty, IsString } from 'class-validator';

export class CreateFormAnswerImpressionDto {
    @IsArray()
    @IsInt({ each: true })
    question_id: number[];
  
    @IsInt()
    @IsNotEmpty()
    area_id: number;
  
    @IsArray()
    @IsBoolean({ each: true })
    response: boolean[];
    
    @IsArray()
    @IsBoolean({ each: true })
    frente: boolean[];
    
    @IsArray()
    @IsBoolean({ each: true })
    vuelta: boolean[];
  
    @IsBoolean()
    @IsOptional()
    reviewed: boolean = false; // Valor por defecto
  
    @IsInt()
    @IsNotEmpty()
    user_id: number;
  
    @IsInt()
    @IsNotEmpty()
    sample_quantity: number;
    
    @IsString()
    @IsNotEmpty()
    finish_validation: string;
    
    @IsString()
    @IsNotEmpty()
    color_edge: string;

    @IsString()
    @IsNotEmpty()
    color_foil: string;

    @IsString()
    @IsNotEmpty()
    revisar_posicion: string;
    
    @IsString()
    @IsNotEmpty()
    imagen_holograma: string;

    @IsString()
    @IsNotEmpty()
    revisar_tecnologia: string;

    @IsString()
    @IsNotEmpty()
    validar_kvc: string;
    
    @IsString()
    @IsNotEmpty()
    tipo_personalizacion: string;
    
    @IsString()
    @IsNotEmpty()
    verificar_etiqueta: string;
    
    @IsString()
    @IsNotEmpty()
    color_personalizacion: string;
    
    @IsString()
    @IsNotEmpty()
    codigo_barras: string;
   
    @IsString()
    @IsNotEmpty()
    verificar_script: string;
    
    @IsString()
    @IsNotEmpty()
    validar_kvc_perso: string;

    @IsInt()
    @IsNotEmpty()
    work_order_flow_id: number;

    @IsInt()
    @IsNotEmpty()
    work_order_id: number;
}