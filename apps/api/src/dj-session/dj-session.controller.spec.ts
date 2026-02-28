import { Test, TestingModule } from '@nestjs/testing';
import { DjSessionController } from './dj-session.controller';
import { DjSessionService } from './dj-session.service';

describe('DjSessionController', () => {
  let controller: DjSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DjSessionController],
      providers: [DjSessionService],
    }).compile();

    controller = module.get<DjSessionController>(DjSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
