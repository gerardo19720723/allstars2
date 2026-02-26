import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0) // El precio no puede ser negativo
  price: number;

  @IsString()
  @IsOptional()
  description?: string;
}