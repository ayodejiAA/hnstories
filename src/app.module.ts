import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HnstoriesModule } from './hnstories/hnstories.module';

@Module({
  imports: [HnstoriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
