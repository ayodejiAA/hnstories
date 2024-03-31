import { Module } from '@nestjs/common';
import { HnstoriesService } from './hnstories.service';
import { HnstoriesController } from './hnstories.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [HnstoriesController],
  providers: [HnstoriesService],
})
export class HnstoriesModule {}
