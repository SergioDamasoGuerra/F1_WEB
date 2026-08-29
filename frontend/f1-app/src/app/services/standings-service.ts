import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DriverEventStanding, TeamEventStanding } from '../models/standings';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getDriverStandingsByEvent(eventId: number): Observable<DriverEventStanding[]> {
    const params = new HttpParams().set('eventId', eventId.toString());

    return this.http.get<DriverEventStanding[]>(`${this.apiUrl}/standings/drivers`, { params });
  }

  getTeamStandingsByEvent(eventId: number): Observable<TeamEventStanding[]> {
    const params = new HttpParams().set('eventId', eventId.toString());

    return this.http.get<TeamEventStanding[]>(`${this.apiUrl}/standings/teams`, { params });
  }


}

