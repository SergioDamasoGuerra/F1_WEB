import { ResolveFn } from '@angular/router';
import { EventsService } from '../services/events.service';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';

export const yearResolver: ResolveFn<number> = (route) => {
  const eventService = inject(EventsService);
  const yearParam = route.paramMap.get('year');

  if(yearParam && !isNaN(Number(yearParam))){
    return of(Number(yearParam));
  }

  return eventService.getLatestSeason().pipe(
    map(data => data.year)
  );
};
