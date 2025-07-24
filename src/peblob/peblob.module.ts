import { Module } from '@nestjs/common';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';

@Module({
  controllers: [PeblobController],
  providers: [PeblobService]
})
export class PeblobModule {}
