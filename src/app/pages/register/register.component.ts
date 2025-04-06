import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { MaterialInputComponent } from '@components/material-input/material-input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialInputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  public subs: Subscription[] = [];
  public error = ''; // TODO remove me
  public registerFormGroup = new FormGroup({
    username: new FormControl<string>('', [Validators.required]),
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(32),
      /* No need to check password strength for now
      Validators.pattern(
         '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}'
       ), */
    ]),
    password_repeat: new FormControl<string>('', [Validators.required]),
  });
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.registerFormGroup.controls['password_repeat'].valueChanges.subscribe(
        (value) => {
          if (value !== this.registerFormGroup.controls['password'].value) {
            this.registerFormGroup.controls['password_repeat'].setErrors({
              mismatch: true,
            });
          } else {
            this.registerFormGroup.controls['password_repeat'].setErrors(null);
          }
        }
      )
    );
  }

  // TODO
  onRegisterClicked() {
    // this.authService
    //   .register(
    //     this.registerFormGroup.controls['username'],
    //     this.registerFormGroup.controls['password']!
    //   )
    //   .subscribe({
    //     next: (result) => {
    //       console.log('register result', result);
    //       this.router.navigate(['/login']);
    //     },
    //     error: (error) => {
    //       console.error('reg', error);
    //       this.error = error?.error || '';
    //     },
    //   });
  }
}
