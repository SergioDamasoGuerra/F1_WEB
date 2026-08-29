import {Driver} from './driver'

export interface Team {
  id: number;
  name: string;
  drivers?: Driver[];
}

/*  PRISMA:

model Team {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  drivers  Driver[]
}
 */
