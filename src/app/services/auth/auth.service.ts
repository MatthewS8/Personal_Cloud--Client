import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import * as CryptoJS from 'crypto-js';

interface LoginResponse {
    token: string;
    public_key: string;
}

interface RegisterResponse {
    message: string;    
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'authToken';
  private apiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password: hashedPassword }).pipe(
      tap((response: LoginResponse) => {
        console.log('login response ', response);
        // save in localStorage
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem('server_public_key', response.public_key);
      })
    );
  }

  register(username: string, password: string): Observable<RegisterResponse> {
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { username, password: hashedPassword }).pipe(
      tap((response: RegisterResponse) => {
        console.log(response);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
