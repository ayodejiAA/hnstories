import { Exclude, Transform } from 'class-transformer';

export class HnstoryDto {
  by: string;

  @Exclude()
  descendants: number;

  id: number;

  @Exclude()
  score: number;

  @Transform(({ value }) => {
    return new Date(value * 1000);
  })
  time: Date;

  type: string;

  @Exclude()
  url: string;

  @Exclude()
  kids: number[];

  @Transform(({ value }) => value.replace(/^(Ask HN:|Show HN:)\s*/i, ''))
  title: string;

  dead: boolean;
  deleted: boolean;
}
