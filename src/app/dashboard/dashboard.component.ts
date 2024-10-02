import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIcon } from '@angular/material/icon';

interface Data {
  uuid: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatSortModule, MatIcon],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  constructor(public dataService: DataService) {}

  public colDefs: string[] = ['fileName', 'createdAt', 'updatedAt', 'uuid'];
  dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>();

  @ViewChild(MatSort)
  sort: MatSort = new MatSort();

  public myData: Data[] = [];

  ngOnInit() {
    this.dataService.getData().subscribe((data) => {
      console.log(data);
      this.myData = data.map((el: Data) => {
        el.createdAt = new Date(el.createdAt).toLocaleDateString();
        el.updatedAt = new Date(el.updatedAt).toLocaleDateString();
        return el;
      });
      this.dataSource.data = data;
      this.dataSource.sort = this.sort;
    });
  }

  onDelete(uuid: string) {
    this.dataService.deleteData(uuid).subscribe(() => {
      this.myData = this.myData.filter((el) => el.uuid !== uuid);
      this.dataSource.data = this.myData;
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
        a.download = fileName; // Set the desired file name
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
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed', error);
      },
    });
  }
}
