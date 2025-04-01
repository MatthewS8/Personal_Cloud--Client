import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'theme';

  isDarkTheme: WritableSignal<boolean> = signal(this.loadTheme());

  toggleTheme(): void {
    this.isDarkTheme.set(!this.isDarkTheme());
    localStorage.setItem(this.themeKey, this.isDarkTheme() ? 'dark' : 'light');
  }

  private loadTheme(): boolean {
    return localStorage.getItem(this.themeKey) === 'dark';
  }
}
