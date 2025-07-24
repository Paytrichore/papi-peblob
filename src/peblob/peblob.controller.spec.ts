import { Test, TestingModule } from '@nestjs/testing';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';
import { getModelToken } from '@nestjs/mongoose';

describe('PeblobController', () => {
  let controller: PeblobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeblobController],
      providers: [
        PeblobService,
        {
          provide: getModelToken('Peblob'),
          useValue: {}, // mock simple, à adapter si besoin
        },
      ],
    }).compile();

    controller = module.get<PeblobController>(PeblobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
