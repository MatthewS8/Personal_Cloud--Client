import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as pako from 'pako';


interface EncryptedData {
  iv: number[];
  encrypted: string;
  fileType: string;
  lastModified: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000';
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
    });
  }

  postSessionKey(sessionKey: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/session-key`, {sessionKey});
  }

  // Session Key
  getServerPublicKey(): string {
    return localStorage.getItem('server_public_key')!!;
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
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
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

  // Just to test if the key is correctly trasmitted
  async importPredefinedKey(keyString: string) {
    const keyData = new TextEncoder().encode(keyString.padEnd(32, ' '));
    return crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  async sendSessionKey(): Promise<Observable<any>> {
    const publicKeyPem = this.getServerPublicKey();
    const publicKey = await this.importPublicKey(publicKeyPem);
    this.sessionKey = await this.generateSessionKey();
    const symmetricKeyRaw = await crypto.subtle.exportKey('raw', this.sessionKey);

    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      symmetricKeyRaw
    );

    const encryptedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));

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
        const fileData = new Uint8Array(event.target!!.result as ArrayBuffer);
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
          type: type
        });
        const file = new File([blob], 'decompressedFile');
        resolve(file);
      } catch (error) {
        console.error('Error decompressing data:', error);
        reject(error);
      }
    });
  }

  async encryptData(compressedData: Uint8Array, fileType: string, lastModified: number): Promise<EncryptedData> {
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
    return {iv: Array.from(iv), encrypted: btoa(String.fromCharCode(... new Uint8Array(encrypted))), fileType, lastModified}; // Include fileType
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
        Uint8Array.from(atob(encryptedData.encrypted).split("").map(char => char.charCodeAt(0)))
      );
      return new Uint8Array(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }

  }

  async uploadData(files: File[]): Promise<Observable<any>> {
    const formData = new FormData();
    const encryptedDataPromises = files.map(async (file) => {
      const compressedData = await this.compressData(file);
      const encryptedData: EncryptedData = await this.encryptData(compressedData, file.type, file.lastModified);
      return encryptedData;
    });
    const encryptedDataArray = await Promise.all(encryptedDataPromises);
    encryptedDataArray.forEach((encryptedData, index) => {
      const blob = new Blob([JSON.stringify(encryptedData)], {
        type: 'application/octet-stream',
      });
      formData.append('file', blob, files[index].name);
    });
    return this.postData(formData);
  }
}

export interface FileData {
  createdAt: string;
  fileID: number;
  fileName: string;
  filePath: string;
  ownerId: number;
  updatedAt: string;
  uuid: string;
  size: number;
  type: string;
}
