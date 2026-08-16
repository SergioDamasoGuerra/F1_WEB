import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Circuit, Country, Event } from '../models/event';
import { HttpClient } from '@angular/common/http';
import { Driver } from '../models/driver';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private eventsUrl: string = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.eventsUrl);
  }

}
