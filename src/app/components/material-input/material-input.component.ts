import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopValueAccessorDirective } from 'src/app/directives/noop-value-accessor-directive.directive';

@Component({
  selector: 'app-material-input',
  standalone: true,
  hostDirectives: [NoopValueAccessorDirective],
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './material-input.component.html',
  styleUrl: './material-input.component.scss',
})
export class MaterialInputComponent {
  @Input() id!: string;
  @Input() label!: string;
  @Input() type: 'text' | 'password' = 'text';
  @Input() formControl!: FormControl;
  @Input() errorMessage: string | undefined;
}
