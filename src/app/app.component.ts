import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@services/theme.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  providers: [ThemeService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Personal_Cloud';
  repoLink = 'https://github.com/MatthewS8'

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // this.updateThemeIcon();
  }

  public toggleTheme() {
    console.log('Button clicked');
    this.themeService.toggleTheme();
    // this.updateThemeIcon();
  }
}
