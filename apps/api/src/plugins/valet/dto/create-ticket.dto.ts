import { IsString, IsOptional } from 'class-validator';

export class CreateValetTicketDto {
  @IsString()
  plate: string;

  @IsString()
  @IsOptional()
  carModel?: string;
}