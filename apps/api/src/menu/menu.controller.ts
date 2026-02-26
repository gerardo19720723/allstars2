import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator'; // <--- Importar el decorador mágico

@Controller('menu')
@UseGuards(JwtAuthGuard) // <--- Todo este controlador requiere Login
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  create(@Body() createMenuDto: CreateMenuDto, @TenantId() tenantId: string) {
    // @TenantId() extrae el ID del token automáticamente
    return this.menuService.create(createMenuDto, tenantId);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.menuService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.menuService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto, @TenantId() tenantId: string) {
    return this.menuService.update(id, updateMenuDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.menuService.remove(id, tenantId);
  }
}