import { Test, TestingModule } from '@nestjs/testing';
import { PeblobService } from './peblob.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from '../user/user.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { Peblob } from './schemas/peblob.schema';
import {
  FindUserPeblobsQueryDto,
  PeblobSortOrder,
} from './dto/find-user-peblobs-query.dto';

type MockPeblob = {
  _id: string;
  userId: string;
  structure: { r: number; g: number; b: number }[][];
  name?: string;
  dominantColor?: string;
};

type MockQuery<Result> = {
  sort: jest.MockedFunction<
    (value: Record<string, number>) => MockQuery<Result>
  >;
  skip: jest.MockedFunction<(value: number) => MockQuery<Result>>;
  limit: jest.MockedFunction<(value: number) => MockQuery<Result>>;
  exec: jest.MockedFunction<() => Promise<Result>>;
};

type MockPeblobModel = jest.Mock & {
  find: jest.MockedFunction<
    (filter: Record<string, unknown>) => MockQuery<MockPeblob[]>
  >;
  countDocuments: jest.MockedFunction<
    (filter: Record<string, unknown>) => Pick<MockQuery<number>, 'exec'>
  >;
  findByIdAndDelete: jest.MockedFunction<
    (id: string) => Pick<MockQuery<MockPeblob>, 'exec'>
  >;
  findByIdAndUpdate: jest.MockedFunction<
    (
      id: string,
      update: Record<string, unknown>,
      options: { new: boolean },
    ) => Pick<MockQuery<MockPeblob>, 'exec'>
  >;
};

describe('PeblobService', () => {
  let service: PeblobService;

  const mockUserService = {
    notifyPeblobDraftCreated: jest.fn(),
    getUserProfiles: jest
      .fn()
      .mockResolvedValue([{ id: 'user-1', username: 'camille' }]),
  };

  const savedDoc = {
    _id: 'peblob-id-1',
    userId: 'user-1',
    structure: [[{ r: 1, g: 1, b: 1 }]],
  };

  const findQuery: MockQuery<MockPeblob[]> = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([savedDoc]),
  };
  const countQuery: Pick<MockQuery<number>, 'exec'> = {
    exec: jest.fn().mockResolvedValue(1),
  };
  const updateQuery: Pick<MockQuery<MockPeblob>, 'exec'> = {
    exec: jest.fn().mockResolvedValue({ ...savedDoc, name: 'Nom propre' }),
  };

  const mockPeblobModel = Object.assign(
    jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedDoc),
    })),
    {
      find: jest.fn().mockReturnValue(findQuery),
    },
    {
      countDocuments: jest.fn().mockReturnValue(countQuery),
    },
    {
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(savedDoc),
      }),
    },
    {
      findByIdAndUpdate: jest.fn().mockReturnValue(updateQuery),
    },
  ) as MockPeblobModel;

  beforeEach(async () => {
    jest.clearAllMocks();
    findQuery.exec.mockResolvedValue([savedDoc]);
    countQuery.exec.mockResolvedValue(1);
    updateQuery.exec.mockResolvedValue({ ...savedDoc, name: 'Nom propre' });

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

  it('loads unique peblob IDs with one database query', async () => {
    const result = await service.findByIds(['peblob-id-1', 'peblob-id-1']);

    expect(mockPeblobModel.find).toHaveBeenCalledWith({
      _id: { $in: ['peblob-id-1'] },
    });
    expect(result).toEqual([{ ...savedDoc, ownerName: 'camille' }]);
  });

  it('loads a filtered page with the requested date sort', async () => {
    const pageItem = { ...savedDoc, dominantColor: 'BLUE' };
    findQuery.exec.mockResolvedValue([pageItem]);
    countQuery.exec.mockResolvedValue(3);
    const query: FindUserPeblobsQueryDto = {
      page: 1,
      pageSize: 2,
      color: 'BLUE' as FindUserPeblobsQueryDto['color'],
      sortOrder: PeblobSortOrder.ASC,
    };

    const result = await service.findByUserIdPaginated('user-1', query);

    expect(mockPeblobModel.find).toHaveBeenCalledWith({
      userId: 'user-1',
      dominantColor: 'BLUE',
    });
    expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(findQuery.skip).toHaveBeenCalledWith(0);
    expect(findQuery.limit).toHaveBeenCalledWith(2);
    expect(mockPeblobModel.countDocuments).toHaveBeenCalledWith({
      userId: 'user-1',
      dominantColor: 'BLUE',
    });
    expect(result).toEqual({
      items: [pageItem],
      total: 3,
      page: 1,
      pageSize: 2,
    });
  });

  it('skips previous pages and sorts newest first by default', async () => {
    const query: FindUserPeblobsQueryDto = {
      page: 3,
      pageSize: 5,
      sortOrder: PeblobSortOrder.DESC,
    };

    await service.findByUserIdPaginated('user-1', query);

    expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(findQuery.skip).toHaveBeenCalledWith(10);
    expect(findQuery.limit).toHaveBeenCalledWith(5);
  });

  it('returns an empty page when no peblobs match', async () => {
    findQuery.exec.mockResolvedValue([]);
    countQuery.exec.mockResolvedValue(0);

    const result = await service.findByUserIdPaginated('user-1', {
      page: 2,
      pageSize: 20,
      sortOrder: PeblobSortOrder.DESC,
    });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 2,
      pageSize: 20,
    });
  });

  it('trims a name before updating a peblob', async () => {
    await service.update('peblob-id-1', { name: '  Nom propre  ' });

    expect(mockPeblobModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'peblob-id-1',
      expect.objectContaining({ name: 'Nom propre' }),
      { new: true },
    );
  });

  it('removes an empty name during update', async () => {
    await service.update('peblob-id-1', { name: '   ' });

    expect(mockPeblobModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'peblob-id-1',
      expect.objectContaining({ name: undefined }),
      { new: true },
    );
  });
});
