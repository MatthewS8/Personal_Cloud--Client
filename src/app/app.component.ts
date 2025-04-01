import { NgClass } from '@angular/common';
import { Component, computed, HostBinding } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass],
  providers: [ThemeService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @HostBinding('class.dark') get isDark() {
    return this.themeService.isDarkTheme();
  }
  title = 'Personal_Cloud';
  repoLink = 'https://github.com/MatthewS8';
  rotation = -360;
  isAnimating: boolean = false;
  public isDarkTheme = computed(() => this.themeService.isDarkTheme());

  constructor(private themeService: ThemeService) {}

  rotateElement(): void {
    this.rotation += 180;
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 500);
  }

  toggleTheme(): void {
    this.rotateElement();
    this.themeService.toggleTheme();
  }
}
