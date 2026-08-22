import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  FindUserPeblobsQueryDto,
  PeblobSortOrder,
  PeblobStatus,
} from './find-user-peblobs-query.dto';
import { CreatePeblobDto, PeblobDominantColor } from './create-peblob.dto';

describe('FindUserPeblobsQueryDto', () => {
  it('uses safe defaults', () => {
    const query = new FindUserPeblobsQueryDto();

    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(20);
    expect(query.sortOrder).toBe(PeblobSortOrder.DESC);
  });

  it('accepts a valid color and transformed pagination values', async () => {
    const query = plainToInstance(FindUserPeblobsQueryDto, {
      page: '2',
      pageSize: '50',
      color: PeblobDominantColor.BLUE,
      sortOrder: PeblobSortOrder.ASC,
      status: PeblobStatus.ON_MAP,
    });

    expect(await validate(query)).toEqual([]);
    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(50);
    expect(query.status).toBe(PeblobStatus.ON_MAP);
  });

  it('rejects invalid colors and out-of-range page sizes', async () => {
    const query = plainToInstance(FindUserPeblobsQueryDto, {
      color: 'teal',
      page: 0,
      pageSize: 101,
      sortOrder: 'random',
      status: 'INVALID',
    });

    const errors = await validate(query);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'color',
        'page',
        'pageSize',
        'sortOrder',
        'status',
      ]),
    );
  });

  it('rejects an invalid dominant color on creation', async () => {
    const dto = plainToInstance(CreatePeblobDto, {
      userId: 'user-1',
      dominantColor: 'teal',
      structure: [[{ r: 1, g: 1, b: 1 }]],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('dominantColor');
  });
});
