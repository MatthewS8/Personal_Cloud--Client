import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private activeTheme: string = 'light';

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.activeTheme = savedTheme;
    }
   }

   setTheme(theme: string): void {
    console.log('Setting theme to:', theme);
    this.activeTheme = theme;
    const themeLink = document.getElementById('app-theme') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = `${theme}.css`;
    } else {
      const link = document.createElement('link');
      link.id = 'app-theme';
      link.rel = 'stylesheet';
      link.href = `${theme}.css`;
      document.head.appendChild(link);
    }
    localStorage.setItem('theme', theme);
  }

  getTheme(): string {
    return this.activeTheme;
  }
}
