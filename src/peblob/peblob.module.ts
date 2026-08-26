import { Module } from '@nestjs/common';
import { PeblobController } from './peblob.controller';
import { PeblobService } from './peblob.service';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Peblob, PeblobSchema } from './schemas/peblob.schema';
import {
  DraftSession,
  DraftSessionSchema,
} from './schemas/draft-session.schema';
import { WebhookSignatureService } from './webhook-signature.service';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Peblob.name, schema: PeblobSchema },
      { name: DraftSession.name, schema: DraftSessionSchema },
    ]),
  ],
  controllers: [PeblobController],
  providers: [PeblobService, WebhookSignatureService],
})
export class PeblobModule {}
