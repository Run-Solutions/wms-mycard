import { IsString, IsNotEmpty } from 'class-validator';

export class AttachFilesDto {
  @IsString()
  @IsNotEmpty()
  type!: string;
}