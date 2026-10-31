import {Event} from './event';

export interface EventLinkButton {
  name: string;
  flagUrl?: string;
}

export interface EventNeighbors {
  currentEvent: Event;
  pastEvent: EventLinkButton | null;
  nextEvent: EventLinkButton | null;
}

