import {Driver} from './driver'

export interface Team {
  id: number;
  name: string;
  points: number;
  position: number;
  drivers?: Driver[];
}

/*  PRISMA:

model Team {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  points   Float
  position Int
  drivers  Driver[]
}
 */
