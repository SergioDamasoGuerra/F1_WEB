import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Driver } from '../models/driver';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DriversService {
  private apiUrl = 'http://localhost:3000/api/drivers';

  constructor(private http: HttpClient) {}

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(this.apiUrl);
  }
}

