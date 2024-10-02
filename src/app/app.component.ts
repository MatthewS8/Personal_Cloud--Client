import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Personal_Cloud';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // this.updateThemeIcon();
  }

  private updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon') as HTMLImageElement;
    if (this.themeService.getTheme() === 'light') {
      themeIcon.src = '../assets/sun.svg';
    } else {
      themeIcon.src = './assets/moon.svg';
    }
  }

  public onButtonClicked() {
    console.log('Button clicked');
    const newTheme = this.themeService.getTheme() === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
    // this.updateThemeIcon();
  }
}
