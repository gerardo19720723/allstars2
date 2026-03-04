import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {

  // TODO: Lógica de Bartender AI (Recetas basadas en inventario)
  async suggestRecipe(inventoryItems: string[]) {
    console.log(`[AI] Suggesting recipe for items: ${inventoryItems.join(', ')}`);
    return { recipe: 'Mojito Especial', ingredients: inventoryItems };
  }

  // TODO: Predicción de ventas
  async predictSales(tenantId: string) {
    return { prediction: 'High traffic expected tonight' };
  }
}