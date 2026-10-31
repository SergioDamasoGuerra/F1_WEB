import { Session } from './session';
import { DriverEventStanding, TeamEventStanding } from './standings';

export interface Country {
  id: number;
  code: string;
  name: string;
  flagUrl?: string;
}

export interface Circuit {
  id: number;
  name: string;
  type?: string;
  imageUrl?: string;
  info?: string;

  countryId: number;
  country?: Country;
}

export interface Season{
  year: number;
}

export interface Event {
  id: number;
  name: string;
  officialName?: string;
  startDate: string;
  endDate: string;
  isCancelled: boolean;
  status: 'done' | 'current' | 'upcoming' | 'cancelled';

  circuitId: number;
  circuit?: Circuit;

  seasonId: number;
  season?: Season;

  sessions?: Session[];

  driverStandings?: DriverEventStanding;
  teamStandings?: TeamEventStanding[];

  // will have Prediction[] in future
}

export interface CalendarWeek {
  startDate: Date;
  endDate: Date;
  event?: Event;
}

