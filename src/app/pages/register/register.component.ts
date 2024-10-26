import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  public credentials = { username: '', password: '' };
  public isRegistering = false;
  public error = '';
  public repeatedPassword = '';

  public passwordError = '';
  constructor(private authService: AuthService, private router: Router) {}

  onRegisterClicked() {
    this.authService.register(this.credentials.username, this.credentials.password).subscribe({
      next: (result) => {
        console.log('register result', result);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('reg', error);
        this.error = error?.error || '';
      }
    });
  }

  onRegisterRequested() {
    this.isRegistering = true;
  }

  validatePassword() {
    this.passwordError = this.credentials.password.length < 8 ? 'Password must be at least 8 characters long' : '';
  }
}
