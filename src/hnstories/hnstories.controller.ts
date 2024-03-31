import { Controller, Get } from '@nestjs/common';
import { HnstoriesService } from './hnstories.service';

@Controller('hnstories/titles')
export class HnstoriesController {
  constructor(private readonly hnstoriesService: HnstoriesService) {}

  @Get('top-words-last-25')
  getTopWordsInLast25() {
    return this.hnstoriesService.findTopWordsInLast25();
  }

  @Get('top-words-last-week')
  getTopWordsLastWeek() {
    return this.hnstoriesService.findTopWordsLastWeek();
  }

  @Get('top-words-by-karmas')
  getTopWordsInLast600ByKarma() {
    return this.hnstoriesService.findTopWordsInLast600ByKarma();
  }
}
