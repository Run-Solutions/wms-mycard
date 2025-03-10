/*myorg\apps\backend\src\auth\dto\register.dto.ts*/
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  // Campo opcional para definir el rol (si no se define, se asigna 'operator' en el servicio)
  @IsOptional()
  @IsInt()
  role_id?: number;
}
