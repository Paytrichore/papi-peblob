import { Test, TestingModule } from '@nestjs/testing';
import { PeblobService } from './peblob.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from '../user/user.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { Peblob } from './schemas/peblob.schema';

describe('PeblobService', () => {
  let service: PeblobService;

  const mockUserService = {
    notifyPeblobDraftCreated: jest.fn(),
  };

  const savedDoc = {
    _id: 'peblob-id-1',
    userId: 'user-1',
    structure: [[{ r: 1, g: 1, b: 1 }]],
  };

  const mockPeblobModel = Object.assign(
    jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedDoc),
    })),
    {
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(savedDoc),
      }),
    },
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeblobService,
        {
          provide: getModelToken('Peblob'),
          useValue: mockPeblobModel,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<PeblobService>(PeblobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates peblob and notifies user webhook', async () => {
    mockUserService.notifyPeblobDraftCreated.mockResolvedValue(undefined);

    const result = await service.create({
      userId: 'user-1',
      structure: [[{ r: 1, g: 1, b: 1 }]],
    });

    expect(result).toEqual(savedDoc as unknown as Peblob);
    expect(mockUserService.notifyPeblobDraftCreated).toHaveBeenCalledTimes(1);
  });

  it('throws when webhook notification fails', async () => {
    mockUserService.notifyPeblobDraftCreated.mockRejectedValue(
      new Error('network error'),
    );

    await expect(
      service.create({
        userId: 'user-1',
        structure: [[{ r: 1, g: 1, b: 1 }]],
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(mockPeblobModel.findByIdAndDelete).toHaveBeenCalledWith(
      savedDoc._id,
    );
  });
});
