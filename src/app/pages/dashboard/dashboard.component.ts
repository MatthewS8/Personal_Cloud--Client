import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '@services/data.service';
import { DropzoneComponent } from '@components/dropzone/dropzone.component';
import { FileCardComponent } from '@components/file-card/file-card.component';

interface Data {
  uuid: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DropzoneComponent, FileCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  constructor(public dataService: DataService) {}

  public myData: Data[] = [];
  public isModalOpen = false;
  public uploadedFiles: File[] | null = null;

  ngOnInit() {
    this.dataService
      .sendSessionKey()
      .then((response) =>
        response.subscribe((res) => console.log('session key post ', res))
      )
      .catch((error) => console.error('error while sending key', error));
    this.dataService.getData().subscribe((data) => {
      // FIXME: Error while data is {}
      // FIXME 2: Change myData type to FileData[]
      this.myData = data.map((el: Data) => {
        el.createdAt = new Date(el.createdAt).toLocaleDateString();
        el.updatedAt = new Date(el.updatedAt).toLocaleDateString();
        return el;
      });
    });
  }

  onDelete(uuid: string) {
    this.dataService.deleteData(uuid).subscribe(() => {
      this.myData = this.myData.filter((el) => el.uuid !== uuid);
    });
  }
  onDownload(uuid: string) {
    this.dataService.downloadData(uuid).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName =
          this.myData.find((el: Data) => el.uuid === uuid)?.fileName ??
          'download';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed', error);
      },
    });
  }

  openInANewTab(uuid: string) {
    this.dataService.downloadData(uuid).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // FIXME If the resource is a video, the url will be revoked before the video is played
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed', error);
      },
    });
  }
  closeUploadModal() {
    this.isModalOpen = false;
  }

  openUploadModal() {
    this.isModalOpen = true;
  }

  onCancelClicked() {
    this.closeUploadModal();
    this.uploadedFiles = null;
  }

  onUploadClicked() {
    if (this.uploadedFiles) {
      const filesToUploadChunks = this.chuck(this.uploadedFiles, 10);
      filesToUploadChunks.forEach((filesChunk) => {
        this.dataService
          .uploadData(filesChunk)
          .then((data) => {
            data.subscribe((data2) => console.log(data2));
          })
          .catch((error) => {
            console.error('Upload failed', error);
          });
      });
    }
    this.closeUploadModal();
  }

  onFilesDropped(files: FileList) {
    this.uploadedFiles = Array.from(files);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!!files) this.onFilesDropped(files);
  }

  public deleteElement(title: string) {
    this.uploadedFiles = this.uploadedFiles
      ? this.uploadedFiles.filter((file) => file.name !== title)
      : null;
  }

  chuck(arr: Array<any>, maxElement: number): Array<Array<any>> {
    return arr.reduce(
      (r, e, i) =>
        i % maxElement ? (r[r.length - 1].push(e), r) : (r.push([e]), r),
      []
    );
  }
}
