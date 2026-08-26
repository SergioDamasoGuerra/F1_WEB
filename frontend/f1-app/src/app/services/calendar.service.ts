import { Injectable } from '@angular/core';
import { CalendarWeek, Event} from '../models/event';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  generateWeeks(events: Event[]): CalendarWeek[] {
    if (events.length === 0) {
      return [];
    }

    // Determinar el rango de eventos
    const firstEvent = events.reduce((first, event) =>
      new Date(event.dateStart) < new Date(first.dateStart) ? event : first,
    );

    const lastEvent = events.reduce((last, event) =>
      new Date(event.dateEnd) > new Date(last.dateEnd) ? event : last,
    );

    // Lunes de la semana del primer evento
    const startDate = new Date(firstEvent.dateStart);
    const startDay = startDate.getDay();
    const startDiff = startDay === 0 ? -6 : 1 - startDay;
    startDate.setDate(startDate.getDate() + startDiff);

    // Lunes de la semana del último evento
    const lastDate = new Date(lastEvent.dateEnd);
    const lastDay = lastDate.getDay();
    const lastDiff = lastDay === 0 ? -6 : 1 - lastDay;
    lastDate.setDate(lastDate.getDate() + lastDiff);

    const weeks: CalendarWeek[] = [];

    while (startDate <= lastDate) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const event = events.find(
        (event) => new Date(event.dateStart) <= endDate && new Date(event.dateEnd) >= startDate,
      );

      weeks.push({
        startDate: new Date(startDate),
        endDate,
        event,
      });

      startDate.setDate(startDate.getDate() + 7);
    }

    return weeks;
  }



}
