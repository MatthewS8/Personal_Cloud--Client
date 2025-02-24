import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as pako from 'pako';
import { FileData, ProgressStatus } from '../types/types';

interface EncryptedData {
  iv: number[];
  encrypted: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000';
  public readonly CHUNK_SIZE = 64 * 1024; // 64 KB
  private sessionKey: CryptoKey | undefined = undefined;
  constructor(private http: HttpClient) {}

  // Http methods
  getData(): Observable<FileData[]> {
    return this.http.get(`${this.apiUrl}/myFiles`) as Observable<FileData[]>;
  }

  postData(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/uploads/upload`, data);
  }

  deleteData(uuid: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/myFiles/delete/${uuid}`);
  }

  downloadData(uuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/myFiles/download/${uuid}`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  postSessionKey(sessionKey: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/session-key`, { sessionKey });
  }

  // Session Key
  getServerPublicKey(): string {
    return localStorage.getItem('server_public_key')!;
  }

  str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  async importPublicKey(pem: string): Promise<CryptoKey> {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length
    );
    const binaryDerString = pemContents.replace(/\s+/g, '');
    const binaryDer = this.str2ab(window.atob(binaryDerString));

    return crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  }

  // Just to test if the key is correctly transmitted
  async importPredefinedKey(keyString: string) {
    const keyData = new TextEncoder().encode(keyString.padEnd(32, ' '));
    return crypto.subtle.importKey('raw', keyData, 'AES-GCM', true, [
      'encrypt',
      'decrypt',
    ]);
  }

  async sendSessionKey(): Promise<Observable<any>> {
    const publicKeyPem = this.getServerPublicKey();
    const publicKey = await this.importPublicKey(publicKeyPem);
    this.sessionKey = await this.generateSessionKey();
    const symmetricKeyRaw = await crypto.subtle.exportKey(
      'raw',
      this.sessionKey
    );

    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      symmetricKeyRaw
    );

    const encryptedKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(encryptedKey))
    );

    return this.postSessionKey(encryptedKeyBase64);
  }

  async generateSessionKey(): Promise<CryptoKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  // Data manipulation methods
  compressData(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = new Uint8Array(event.target!.result as ArrayBuffer);
        const compressedData = pako.deflate(fileData);
        resolve(compressedData);
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  decompressData(compressedData: Uint8Array, type: string): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const decompressedData = pako.inflate(compressedData);
        const blob = new Blob([decompressedData], {
          type: type,
        });
        const file = new File([blob], 'decompressedFile');
        resolve(file);
      } catch (error) {
        console.error('Error decompressing data:', error);
        reject(error);
      }
    });
  }

  async encryptData(compressedData: Uint8Array): Promise<EncryptedData> {
    if (!this.sessionKey) {
      throw new Error('Session key not set');
    }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      this.sessionKey,
      compressedData
    );
    return {
      iv: Array.from(iv),
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    };
  }

  async decryptData(encryptedData: EncryptedData): Promise<Uint8Array> {
    if (!this.sessionKey) {
      throw new Error('Session key not set');
    }
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: Uint8Array.from(encryptedData.iv),
        },
        this.sessionKey,
        Uint8Array.from(
          atob(encryptedData.encrypted)
            .split('')
            .map((char) => char.charCodeAt(0))
        )
      );
      return new Uint8Array(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  uploadChunk(file: File, chunkIndex: number, totalChunks: number): Observable<ProgressStatus> {
    const start = chunkIndex * this.CHUNK_SIZE;
    const end = Math.min(start + this.CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const reader = new FileReader();
    reader.readAsArrayBuffer(chunk);

    return new Observable((observer) => {
      reader.onload = async () => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const compressedData = pako.deflate(data);
        const { iv, encrypted } = await this.encryptData(compressedData);
        const formData = new FormData();
        formData.append('iv', JSON.stringify(iv));
        formData.append('encrypted', encrypted);
        formData.append('originalSize', data.length.toString());
        formData.append('compressedSize', compressedData.length.toString());
        formData.append('encryptedSize', encrypted.length.toString());
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);
        formData.append('fileType', file.type);
        formData.append('lastModified', file.lastModified.toString());
        this.http
          .post(`${this.apiUrl}/uploads/upload-chunk`, formData, {reportProgress: true, observe: 'events'})
          .pipe(
            map((event) => {
              console.log(" ******* ", file.name, "@", chunkIndex, " - ", chunkIndex, "/", totalChunks, " ******* ");
              if (event.type === HttpEventType.UploadProgress) {
                console.log("UPLOAD CHUNK for file", file.name, "chunk", chunkIndex, "progress ", event.loaded, "/", event.total);
                observer.next({
                  status: 'progress',
                  percentage: event.total ? Math.round((100 * event.loaded) / event.total) : 0,
                });
              } else if (event.type === HttpEventType.Response) {
                console.log("UPLOAD CHUNK for file", file.name, "chunk", chunkIndex, "response ", event.body);
                observer.next(event.body as ProgressStatus);
                observer.complete();
              }
            })
          )
          .subscribe();
      };
    });
  }
  uploadFile(file: File): Observable<any> {
    // FIXME if uploading multiple files, data is corrupted, seems to be last chunk of each file
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    const uploadPromises: Observable<ProgressStatus>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      uploadPromises.push(this.uploadChunk(file, i, totalChunks));
    }
    return new Observable((observer) => {
      Promise.all(uploadPromises.map((obs) => firstValueFrom(obs)))
        .then((responses) => {
          console.log("for file", file.name, "with ", totalChunks, " chunks, responses ", responses);
          observer.next(responses);
          observer.complete();
        })
        .catch((err) => {
          console.error('Error uploading file:', file, err);
          observer.error(err);
        });
    });
  }

  downloadFile(uuid: string): Observable<File> {
    return new Observable((observer) => {
      this.downloadData(uuid).subscribe({
        next: async (response) => {
          const reader = response.body!.stream().getReader();
          const chunks: Uint8Array[] = [];
          let acc = '';
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (readerDone) {
              done = true;
              break;
            }
            acc += new TextDecoder().decode(value);
            let boundary = acc.indexOf('}');
            while (boundary !== -1) {
              const chunkStr = acc.substring(0, boundary + 1);
              acc = acc.substring(boundary + 1);
              boundary = acc.indexOf('}');
              try {
                const encryptedChunk: EncryptedData = JSON.parse(chunkStr);
                const decryptedChunk = await this.decryptData(encryptedChunk);
                const decompressedChunk = pako.inflate(decryptedChunk);
                chunks.push(decompressedChunk);
              } catch (error) {
                console.error('Error processing chunk:', error);
                observer.error('Error processing file');
                return;
              }
            }
          }
          console.log("Downloaded chunks ", chunks.length);

          const blob = new Blob(chunks, { type: 'application/octet-stream' });
          const file = new File([blob], response.headers.get('filename') || 'downloadedFile', {
            type: response.headers.get('fileType') || 'application/octet-stream',
            lastModified: parseInt(response.headers.get('lastModified') || '0', 10),
          });

          observer.next(file);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

}
