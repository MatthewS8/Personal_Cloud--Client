import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialInputComponent } from '@components/material-input/material-input.component';
import { fromEventPattern } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialInputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  public error = '';
  public loginFormGroup = new FormGroup({
    username: new FormControl<string>('', Validators.required),
    password: new FormControl<string>('', Validators.required),
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLoginClicked() {
    if (
      this.loginFormGroup.invalid ||
      this.loginFormGroup.controls.username.value === '' ||
      this.loginFormGroup.controls.password.value === '' ||
      this.loginFormGroup.controls.username.value === null ||
      this.loginFormGroup.controls.password.value === null
    ) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.error = '';
    this.authService
      .login(
        this.loginFormGroup.controls.username.value,
        this.loginFormGroup.controls.password.value
      )
      .subscribe({
        next: (result) => {
          console.log('login result', result);
          this.router.navigate(['/dashboard']);
          this.error = '';
        },
        error: (error) => {
          // TODO: handle error or request timeout
          console.error('login error', error);
          this.error = error.message || '';
        },
      });
  }

  onRegisterRequested() {
    this.router.navigate(['/register']);
  }
}
