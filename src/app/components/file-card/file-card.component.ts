import { Component, ContentChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.scss'
})
export class FileCardComponent {
  @ContentChild('action', { static: false }) content: ElementRef | undefined;
  @Input() title: string = '';
  @Input() progress: number = 0;
}
