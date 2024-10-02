import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/myFiles`);
  }

  postData(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, data);
  }

  deleteData(uuid: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/myFiles/delete/${uuid}`);
  }
  
  downloadData(uuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/myFiles/download/${uuid}`, { responseType: 'blob' });
  }
}
