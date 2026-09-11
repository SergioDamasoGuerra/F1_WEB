import {Event} from './event';

export interface Session {
  id: number;
  type: string;
  startDate: string;
  endDate: string;

  eventId: number;
  event?: Event;

  // results?: Result[]
}

/*
model Session {
  id          Int     @id @default(autoincrement())
  type        String
  startDate   DateTime
  endDate     DateTime

  // FK evento (GP)
  eventId     Int
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Restrict)

  // Resultados
  results     Result[]

  // UNIQUE
  @@unique([eventId, type])
}
*/


export interface SessionDay {
  date: string;
  sessions: Session[];
}
