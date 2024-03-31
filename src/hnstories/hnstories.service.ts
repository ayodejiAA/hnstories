import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  lastValueFrom,
  map,
  toArray,
  from,
  mergeMap,
  of,
  catchError,
  Observable,
  interval,
  takeWhile,
  filter,
} from 'rxjs';
import { HnstoryDto } from './dto/hnstory.dto';
import { plainToClass } from 'class-transformer';
import { computeOneWeekDateRange } from 'src/helpers';
import { HnsuserDto } from './dto/hnuser.dto';

@Injectable()
export class HnstoriesService {
  HN_API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Returns the top words in the last 25 Hacker News stories, sorted by frequency.
   *
   * @param limit - The maximum number of words to return.
   * @returns An array of objects, where each object contains the word and its frequency.
   */
  async findTopWordsInLast25(limit = 10) {
    const new25StoryIds = await this.fetchNewStoryIds(25);
    const titles = await this.fetchStoryTitles(new25StoryIds);

    return this.computeMostOccurringWords(titles, limit);
  }

  /**
   * Returns the top words in the last week, sorted by frequency.
   *
   * @param limit - The maximum number of words to return.
   * @returns An array of objects, where each object contains the word and its frequency.
   */
  async findTopWordsLastWeek(limit = 10) {
    const oneWeekFromNowTime = computeOneWeekDateRange();
    const newstoryIds = await this.fetchNewStoryIds();
    const lastNewStoryId = newstoryIds[newstoryIds.length - 1];

    const storyTitlesUntilLastWeek$ = interval().pipe(
      map((value) => lastNewStoryId - value - 1),
      takeWhile((value) => value >= 0),
      mergeMap(
        (storyId) =>
          this.httpService
            .get(`${this.HN_API_BASE_URL}/item/${storyId}.json`)
            .pipe(
              map((response) => {
                const data = response.data;
                return this.filterStoryFromItems(data);
              }),
              catchError(() => of(undefined)),
            ),
        null,
        500,
      ),
      filter((story) => story !== undefined),
      takeWhile((story) => {
        return story.time > oneWeekFromNowTime;
      }),
      map((story) => {
        return story.title;
      }),
      toArray(),
    );

    const storyTitlesUntilLastWeek = (
      await lastValueFrom(storyTitlesUntilLastWeek$)
    ).concat(await this.fetchStoryTitles(newstoryIds));

    return this.computeMostOccurringWords(storyTitlesUntilLastWeek, limit);
  }

  /**
   * Returns the top words in the last 600 Hacker News stories by karma, sorted by frequency.
   *
   * @param limit - The maximum number of words to return.
   * @param karma - The minimum karma required for a story to be included in the result.
   * @returns An array of objects, where each object contains the word and its frequency.
   */
  async findTopWordsInLast600ByKarma(limit = 10, karma = 10) {
    const newstoryIds = await this.fetchNewStoryIds();
    const lastNewStoryId = newstoryIds[newstoryIds.length - 1];
    const targetStories = 600;

    const newStoryTitlesBasedOnKarma$ = from(newstoryIds).pipe(
      mergeMap((storyId) =>
        this.httpService
          .get(`${this.HN_API_BASE_URL}/item/${storyId}.json`)
          .pipe(map((response) => plainToClass(HnstoryDto, response.data))),
      ),
      mergeMap((story) =>
        this.httpService
          .get(`${this.HN_API_BASE_URL}/user/${story.by}.json`)
          .pipe(
            map((response) => {
              const user = plainToClass(HnsuserDto, response.data);
              if (user.karma >= karma) return story;
            }),
          ),
      ),
      filter((story) => story !== undefined),
      map((story) => {
        return story.title;
      }),
      toArray(),
    );

    const newStoryTitlesBasedOnKarma = await lastValueFrom(
      newStoryTitlesBasedOnKarma$,
    );

    const remainingStoriesCount =
      targetStories - newStoryTitlesBasedOnKarma.length;

    let storyCount = 0;

    const remainingStoryTitles$ = interval().pipe(
      map((value) => lastNewStoryId - value - 1),
      takeWhile((value) => value >= 0),
      mergeMap(
        (storyId) =>
          this.httpService
            .get(`${this.HN_API_BASE_URL}/item/${storyId}.json`)
            .pipe(
              map((response) => {
                const data = response.data;
                return this.filterStoryFromItems(data);
              }),
              catchError(() => of(undefined)),
            ),
        null,
        500,
      ),
      filter((story) => story !== undefined),
      mergeMap((story) =>
        this.httpService
          .get(`${this.HN_API_BASE_URL}/user/${story.by}.json`)
          .pipe(
            map((response) => {
              const user = plainToClass(HnsuserDto, response.data);
              if (user.karma >= karma) return story;
            }),
          ),
      ),
      filter((story) => story !== undefined),
      takeWhile(() => {
        return storyCount < remainingStoriesCount;
      }),
      map((story) => {
        storyCount++;
        return story.title;
      }),
      toArray(),
    );

    const remainingStoryTitles = await lastValueFrom(remainingStoryTitles$);

    return this.computeMostOccurringWords(
      newStoryTitlesBasedOnKarma.concat(remainingStoryTitles),
      limit,
    );
  }

  async fetchNewStoryIds(limit: number = 500): Promise<number[]> {
    let storyIds$: Observable<number[]> = null;

    storyIds$ = this.httpService
      .get(
        `${this.HN_API_BASE_URL}/newstories.json?orderBy="$priority"&limitToFirst=${limit}`,
      )
      .pipe(map((response) => response.data));

    return lastValueFrom(storyIds$);
  }

  fetchStoryTitles(storyIds: number[]) {
    const storyUrls = storyIds.map(
      (storyId) => `${this.HN_API_BASE_URL}/item/${storyId}.json`,
    );

    return Promise.all(
      storyUrls.map((url) =>
        lastValueFrom(
          this.httpService.get(url).pipe(
            map((response) => plainToClass(HnstoryDto, response.data).title),
            catchError(() => of('')),
          ),
        ),
      ),
    );
  }

  /**
   * Computes the most occurring words in an array of titles, and returns them sorted by frequency.
   *
   * @param titles - The titles to analyze.
   * @param limit - The maximum number of words to return.
   * @returns An array of objects, where each object contains the word and its frequency.
   */
  private computeMostOccurringWords(titles: string[], limit: number) {
    const wordCounts: Record<string, number> = {};

    titles.forEach((title) => {
      title.match(/(?<!')\b[0-9A-Za-z-.]+\b/g).forEach((word) => {
        const lowerCasedWord = word.toLowerCase();
        wordCounts[lowerCasedWord] = (wordCounts[lowerCasedWord] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Filters a story from an HN API response, if it is a valid story and not deleted or dead.
   *
   * @param data - The HN API response data.
   * @returns The filtered story, or undefined if the story is not valid.
   */
  private filterStoryFromItems(data: HnstoryDto) {
    if (data.type == 'story' && data.dead !== true && data.deleted !== true)
      return plainToClass(HnstoryDto, data);
  }
}
