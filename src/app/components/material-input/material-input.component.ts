import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-material-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './material-input.component.html',
  styleUrl: './material-input.component.scss',
})
export class MaterialInputComponent {
  @Input() id!: string;
  @Input() label!: string;
  @Input() type: 'text' | 'password' = 'text';
  @Input() value: unknown = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<string>();
}
