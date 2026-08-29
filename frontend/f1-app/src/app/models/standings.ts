import { Driver } from './driver';
import { Event } from './event';
import { Team } from './team';

export interface DriverEventStanding {
  id: number;
  position: number;
  points: number;
  driverId: number;
  driver?: Driver;    // Se incluye cuando se usa include: { driver: true } en Express
  eventId: number;
  event?: Event;      // Se incluye cuando se usa include: { event: true } en Express
  teamId: number;
  team?: Team;        // Se incluye cuando se usa include: { team: true } en Express
}


export interface TeamEventStanding {
  id: number;
  position: number;
  points: number;
  teamId: number;
  team?: Team;
  eventId: number;
  event?: Event;
}

