import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Event } from '../models/event';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private eventsUrl: string = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  getEvents(year: string): Observable<Event[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<Event[]>(this.eventsUrl, { params });
  }

  getLatestSeason(): Observable<{ year: number }> {
    return this.http.get<{ year: number }>(`${this.eventsUrl}/latest-season`);
  }

  getAllSeasonYears(): Observable<{ year: number }[]> {
    return this.http.get<{ year: number }[]>(`${this.eventsUrl}/season-years`);
  }
}
