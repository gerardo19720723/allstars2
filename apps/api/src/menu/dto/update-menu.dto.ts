import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';

// PartialType hace que todos los campos de CreateMenuDto sean opcionales (?)
export class UpdateMenuDto extends PartialType(CreateMenuDto) {}