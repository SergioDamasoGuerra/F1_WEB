import { DriverEventStanding, TeamEventStanding } from './standings';
import { Season } from './event';

export interface Team {
  id: number;
  name: string;

  seasons?: SeasonTeam[];
  driverStandings?: DriverEventStanding[];
  teamStandings?: TeamEventStanding[];
  // results?: Result[];
}

export interface SeasonTeam {
  officialName: string;
  colour: string;

  teamId: number;
  team?: Team;

  seasonId: number;
  season?: Season;
}
