import { Test, TestingModule } from '@nestjs/testing';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from '../user/user.service';
import { WebhookSignatureService } from './webhook-signature.service';

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
        {
          provide: getModelToken('DraftSession'),
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {
            notifyPeblobDraftCreated: jest.fn(),
          },
        },
        {
          provide: WebhookSignatureService,
          useValue: { assertValidSignature: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PeblobController>(PeblobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
