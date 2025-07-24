import { Test, TestingModule } from '@nestjs/testing';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';

describe('PeblobController', () => {
  let controller: PeblobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeblobController],
      providers: [PeblobService],
    }).compile();

    controller = module.get<PeblobController>(PeblobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
