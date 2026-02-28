import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderGateway } from './order.gateway';

@Injectable()
export class OrderService {
    constructor(
    private prisma: PrismaService,
    private orderGateway: OrderGateway 
  ) {}

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
            tenantId: tenantId, 
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
          price: product.price, 
        });
      }

      // 2. Crear la Orden Principal
      const order = await tx.order.create({
        data: {
          tenantId,
          // CORRECCIÓN: Mapeamos el parámetro 'userId' a la columna 'customerId' de la DB
          customerId: userId, 
          total: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate, 
          },
        },
        include: {
          items: true, 
        },
      });

      return order;
    });
  }

    async findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            product: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }
  
  async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string) {
    // 1. Verificar
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    // 2. Actualizar
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: updateOrderDto.status },
    });

    // 3. NOTIFICAR (Ojo: Si OrderGateway no está configurado, esto crasheará el backend)
    // Si te da error de red más tarde, comenta esta línea temporalmente
    this.orderGateway.notifyOrderUpdate(updatedOrder);

    return updatedOrder;
  }
}