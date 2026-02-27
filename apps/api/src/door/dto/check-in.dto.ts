import { IsString, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsString()
  identifier: string; // Puede ser un ID de reservación, un número de mesa o código VIP
}