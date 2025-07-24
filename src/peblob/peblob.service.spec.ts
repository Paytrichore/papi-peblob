import { Test, TestingModule } from '@nestjs/testing';
import { PeblobService } from './peblob.service';

describe('PeblobService', () => {
  let service: PeblobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PeblobService],
    }).compile();

    service = module.get<PeblobService>(PeblobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
