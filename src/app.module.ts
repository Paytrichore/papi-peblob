import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PeblobModule } from './peblob/peblob.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PeblobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
