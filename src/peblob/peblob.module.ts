import { Module } from '@nestjs/common';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PeblobController],
  providers: [PeblobService],
})
export class PeblobModule {}
