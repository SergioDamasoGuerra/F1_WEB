import { Team } from './team';

export interface Driver {
  id: number;
  driverNumber: number;
  name: string;
  acronym: string;
  points: number;
  position: number;
  imageUrl?: string;
  teamId: number;
  team?: Team; // Se incluye cuando usas include: { team: true } en Express
  teamColor?: string;
}
