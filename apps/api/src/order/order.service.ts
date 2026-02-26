import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
    async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string) {
    // 1. Verificar que la orden existe y pertenece al tenant
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // 2. Actualizar el estado
    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
      },
    });
  }
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, tenantId: string, userId?: string) {
    // Usamos una transacción para asegurar que todo se guarde o nada se guarde
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsToCreate: { productId: string; quantity: number; price: any }[] = [];

      // 1. Iterar los items para validar productos y calcular total
      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            tenantId: tenantId, // Seguridad: No puedo pedir productos de otro antro
          },
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        orderItemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price, // Guardamos el precio de HOY
        });
      }

      // 2. Crear la Orden Principal
      const order = await tx.order.create({
        data: {
          tenantId,
          userId,
          total: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate, // Crear los items en cascada
          },
        },
        include: {
          items: true, // Devolver los items en la respuesta
        },
      });

      return order;
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: { items: true }, // Incluir detalles
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }
  
  // Update y Delete los dejamos pendientes por ahora para avanzar
}