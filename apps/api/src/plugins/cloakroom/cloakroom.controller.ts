import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { CloakroomService } from './cloakroom.service';

@Controller('cloakroom')
export class CloakroomController {
  constructor(private readonly service: CloakroomService) {}

  /**
   * Obtener lista de Cubículos (Bins) para el Grid.
   * Ahora pide la sección (A, B, C).
   */
  @Get('bins/:section')
  getBins(@Param('section') section: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.getBins(tenantId, section);
  }

  /**
   * Ampliar el guardarropa (Añadir más cubículos).
   */
  @Post('add-bins')
  addBins(@Headers('x-tenant-id') tenantId: string, @Body() body: { section: string; count: number }) {
    return this.service.addBins(tenantId, body.section, body.count);
  }

  /**
   * ASIGNAR CUBÍCULO (Guardar Prenda).
   * Renombrado de 'store' a 'assign' para coincidir con el Servicio.
   */
  @Post('assign')
  assign(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { 
      binId: string; // ID del cubículo seleccionado en el Grid
      description: string; 
      quantity: number;
      customerName?: string; 
      customerId?: string 
    }
  ) {
    return this.service.assignBin(tenantId, body.binId, {
      description: body.description,
      quantity: body.quantity,
      customerName: body.customerName,
      customerId: body.customerId,
    });
  }

  /**
   * LIBERAR CUBÍCULO (Entregar Prenda).
   * Renombrado de 'retrieve' a 'release'.
   */
  @Post('release/:itemId')
  release(@Param('itemId') itemId: string) {
    return this.service.releaseBin(itemId);
  }

  /**
   * SOLICITAR PRENDA (Alertar al Staff).
   */
  @Post('request')
  request(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { ticketCode: string }
  ) {
    return this.service.requestItem(body.ticketCode, tenantId);
  }
}