import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ContentChild, ElementRef, EventEmitter, Output, Renderer2 } from '@angular/core';


@Component({
  selector: 'app-dropzone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropzone.component.html',
  styleUrl: './dropzone.component.scss'
})
export class DropzoneComponent implements AfterViewInit {
  @ContentChild('content', { static: false }) content: ElementRef | undefined;
  hasContent = false;
  @Output() filesUploaded = new EventEmitter<FileList>();

  constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.hasContent = !!this.content;
    this.cdr.detectChanges();
  }


  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.renderer.addClass(event.target, 'dragover');
  }

  onDragLeave(event: DragEvent) {
    this.renderer.removeClass(event.target, 'dragover');
  }

  onDrop(event: DragEvent) {
    console.log('onDrop', event);
    event.preventDefault();
    this.renderer.removeClass(event.target, 'dragover');
    const files = event.dataTransfer?.files;
    if (files) {
      this.filesUploaded.emit(files);
    }
  }

}
