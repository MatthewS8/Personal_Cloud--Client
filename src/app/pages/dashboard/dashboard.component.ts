import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '@services/data.service';
import { DropzoneComponent } from '@components/dropzone/dropzone.component';
import { FileCardComponent } from '@components/file-card/file-card.component';
import { ProgressStatus, FileData } from 'src/app/types/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DropzoneComponent, FileCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(public dataService: DataService) {}

  private subs: Subscription[] = [];
  public myData: FileData[] = [];
  public isModalOpen = false;
  public filesToUpload: File[] | undefined = undefined;
  public uploadProgress: ProgressStatus[] = [];
  public isUploading = signal(false);

  ngOnInit() {
    this.dataService
      .sendSessionKey()
      .then((response) =>
        response.subscribe((res) => console.log('session key post ', res))
      )
      .catch((error) => {
        // TODO: Handle more properly. Maybe show a message to the user and sign out
        console.error('error while sending key', error);
      });
    // FIXME: getData is supposed to be called once the session key is sent
    this.subs.push(
      this.dataService.getData().subscribe((data) => {
        if (data.length > 0) {
          this.myData = data;
        } else {
          this.myData = [];
        }

      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  onDelete(uuid: string) {
    this.dataService.deleteData(uuid).subscribe(() => {
      this.myData = this.myData.filter((el) => el.uuid !== uuid);
    });
  }
  onDownload(rowClicked: FileData) {
    console.log("onDownload", rowClicked.uuid);
    this.dataService.downloadFile(rowClicked.uuid).subscribe({
      next: (file) => {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = rowClicked.fileName;
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

  openInANewTab(rowClicked: FileData) {
    this.dataService.downloadFile(rowClicked.uuid).subscribe({
      next: (file) => {
        const fileBlob = file instanceof File ? file.slice(0, file.size, rowClicked.type) : file;
        const url = window.URL.createObjectURL(fileBlob);
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
    this.isUploading.set(false);
  }

  openUploadModal() {
    this.isModalOpen = true;
  }

  onCancelClicked() {
    this.closeUploadModal();
    this.filesToUpload = undefined;
  }

  onFilesDropped(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      // FIXME status should be 'ready'
      // TODO check if file is removed before uploading
      // TODO check how to update the state and html bindings
      this.filesToUpload = Array.from(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.onFilesDropped(files);
    }
  }

  public deleteElement(title: string) {
    this.filesToUpload = this.filesToUpload?.filter(
      (file) => file.name !== title
    );
  }

  // FIXME remove any from here
  // TODO move to a helper file
  chuck(arr: Array<any>, maxElement: number): Array<Array<any>> {
    return arr.reduce(
      (r, e, i) =>
        i % maxElement ? (r[r.length - 1].push(e), r) : (r.push([e]), r),
      []
    );
  }

  uploadFiles(): void {
    this.isUploading.set(true);
    this.filesToUpload?.forEach((file, index) => {
      this.uploadProgress[index] = { status: 'progress', percentage: 0 };
      this.dataService.uploadFile(file, index).subscribe({
        next: (progress) => {
          this.uploadProgress[index] = progress;
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.uploadProgress[index].status = 'error';
        },
      });
    });
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
