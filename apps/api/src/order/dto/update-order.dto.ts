import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderDto {
  @IsString()
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}