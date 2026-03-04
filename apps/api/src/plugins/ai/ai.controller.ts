import { Controller, Get, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-recipe')
  async suggestRecipe(@Body() body: { inventory: string[] }) {
    return this.aiService.suggestRecipe(body.inventory);
  }
}