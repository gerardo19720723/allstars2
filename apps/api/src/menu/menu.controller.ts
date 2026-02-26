import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('menu') // <--- QUITAMOS EL GUARD DE AQUÍ
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // --- LECTURA PÚBLICA (Sin Token) ---
  @Get()
  findAll() {
    // Para leer el menú público, no filtramos por Tenant por ahora
    // (En el futuro, el slug del dominio determinará el menú)
    return this.menuService.findAllPublic(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOnePublic(id);
  }

  // --- ESCRITURA PRIVADA (Con Token) ---
  @UseGuards(JwtAuthGuard) // <--- LO PONEMOS AQUÍ
  @Post()
  create(@Body() createMenuDto: CreateMenuDto, @TenantId() tenantId: string) {
    return this.menuService.create(createMenuDto, tenantId);
  }

  @UseGuards(JwtAuthGuard) // <--- Y AQUÍ
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto, @TenantId() tenantId: string) {
    return this.menuService.update(id, updateMenuDto, tenantId);
  }

  @UseGuards(JwtAuthGuard) // <--- Y AQUÍ
  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.menuService.remove(id, tenantId);
  }
}