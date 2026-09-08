import { Season } from './event';
import { DriverEventStanding } from './standings';

export interface Driver {
  id: number;
  name: string;
  acronym: string;
  imageUrl?: string;

  // results?: Result[];
  seasons?: SeasonDriver[];
  standings?: DriverEventStanding[];
}


export interface SeasonDriver {
  number: number;

  driverId: number;
  driver?: Driver;

  seasonId: number;
  season?: Season;
}
