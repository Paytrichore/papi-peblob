import { Module } from '@nestjs/common';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Peblob, PeblobSchema } from './schemas/peblob.schema';
import { WebhookSignatureService } from './webhook-signature.service';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: Peblob.name, schema: PeblobSchema }]),
  ],
  controllers: [PeblobController],
  providers: [PeblobService, WebhookSignatureService],
})
export class PeblobModule {}
