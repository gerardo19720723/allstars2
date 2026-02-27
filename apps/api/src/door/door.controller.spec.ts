import { Test, TestingModule } from '@nestjs/testing';
import { DoorController } from './door.controller';
import { DoorService } from './door.service';

describe('DoorController', () => {
  let controller: DoorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoorController],
      providers: [DoorService],
    }).compile();

    controller = module.get<DoorController>(DoorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
