import { Test, TestingModule } from '@nestjs/testing';
import { DjSessionService } from './dj-session.service';

describe('DjSessionService', () => {
  let service: DjSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DjSessionService],
    }).compile();

    service = module.get<DjSessionService>(DjSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
