import { IsString, IsEnum, IsOptional } from 'class-validator';

// Este Enum debe coincidir EXACTAMENTE con el de prisma.schema
export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderDto {
  @IsString()
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}