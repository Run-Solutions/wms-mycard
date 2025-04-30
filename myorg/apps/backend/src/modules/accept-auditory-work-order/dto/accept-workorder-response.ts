import { IsInt, IsNotEmpty } from 'class-validator';

export class AcceptAuditoryDto {
    @IsInt()
    @IsNotEmpty()
    sample_auditory: number;
}