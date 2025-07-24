import { Test, TestingModule } from '@nestjs/testing';
import { PeblobService } from './peblob.service';
import { getModelToken } from '@nestjs/mongoose';

describe('PeblobService', () => {
  let service: PeblobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeblobService,
        {
          provide: getModelToken('Peblob'),
          useValue: {}, // mock simple, à adapter si besoin
        },
      ],
    }).compile();

    service = module.get<PeblobService>(PeblobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
