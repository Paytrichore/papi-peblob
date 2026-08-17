import {
  IsISO8601,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class PlacementEventDto {
  @IsIn(['peblob-placement-requested'])
  eventType: 'peblob-placement-requested';

  @IsUUID()
  eventId: string;

  @IsISO8601()
  occurredAt: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  peblobId: string;

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsUUID()
  correlationId: string;
}

export class PlacementCompensationEventDto {
  @IsIn(['peblob-placement-compensation'])
  eventType: 'peblob-placement-compensation';

  @IsUUID()
  eventId: string;

  @IsISO8601()
  occurredAt: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  peblobId: string;

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsUUID()
  correlationId: string;
}
