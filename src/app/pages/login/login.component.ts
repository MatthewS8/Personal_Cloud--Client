import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public credentials = { username: '', password: '' };
  public isRegistering = false;
  public error = '';
  public passwordError = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLoginClicked() {
    this.authService.login(this.credentials.username, this.credentials.password).subscribe({
      next: (result) => {
        console.log('login result', result);
        this.router.navigate(['/dashboard']);
        this.error = '';
      },
      error: (error) => {
        console.error('login error', error);
        this.error = error.error || '';
      }
    });
  }

  onRegisterRequested() {
    this.router.navigate(['/register']);
  }
}