import { Injectable } from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HomepageStats} from '../model/HomepageStats';

@Injectable({
  providedIn: 'root'
})
export class PublicDataService {
  private apiUrl = environment.apiUrl + '/auth'; // Ajustez selon votre structure d'URL

  constructor(private http: HttpClient) { }

  getHomepageStats(): Observable<HomepageStats> {
    return this.http.get<HomepageStats>(`${this.apiUrl}/stats`);
  }
}
