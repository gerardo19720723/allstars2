import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto, tenantId: string) {
    // El producto se crea AUTOMÁTICAMENTE vinculado al tenant del usuario logueado
    return this.prisma.product.create({
      data: {
        ...createMenuDto,
        tenantId: tenantId, // <--- Aislamiento forzado
      },
    });
  }

  async findAll(tenantId: string) {
    // Solo devolvemos productos de ESTE tenant
    return this.prisma.product.findMany({
      where: {
        tenantId: tenantId, // <--- Filtro de seguridad
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    // Doble verificación: ¿Es tuyo este producto?
    return this.prisma.product.findFirst({
      where: {
        id: id,
        tenantId: tenantId, // <--- Seguridad
      },
    });
  }

    async update(id: string, updateMenuDto: UpdateMenuDto, tenantId: string) {
    // 1. Verificar que el producto es tuyo
    await this.prisma.product.findFirst({
      where: { id: id, tenantId: tenantId },
    });

    // 2. Actualizar, pero SELECCIONAR solo los campos necesarios (evita relaciones circulares)
    return this.prisma.product.update({
      where: {
        id: id,
      },
      data: updateMenuDto,
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        createdAt: true,
        // NO seleccionamos 'tenant' para evitar errores de JSON
      },
    });
  }

    async remove(id: string, tenantId: string) {
    // 1. Verificar permisos
    const product = await this.prisma.product.findFirst({
      where: { id: id, tenantId: tenantId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // 2. Borrar con Select explícito
    return this.prisma.product.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        createdAt: true,
      },
    });
  }
}