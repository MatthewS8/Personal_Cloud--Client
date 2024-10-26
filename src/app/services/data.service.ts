import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as pako from 'pako';

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
    // this.sessionKey = await this.generateSessionKey();
    this.sessionKey = await this.importPredefinedKey('TestKey123456789');
    const symmetricKeyRaw = await crypto.subtle.exportKey('raw', this.sessionKey);
    const symmetricKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(symmetricKeyRaw)));
    console.log('Generated Session Key (Base64): ', symmetricKeyBase64);
    
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

  decompressData(compressedData: Uint8Array, MIME: string): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const decompressedData = pako.inflate(compressedData);
        const blob = new Blob([decompressedData], {
          type: MIME
        });
        const file = new File([blob], 'decompressedFile');
        this.openFileInANewTab(decompressedData, 'Pippo', MIME).then(() => { console.log('File opened in a new tab') });
        resolve(file);
      } catch (error) {
        console.error('Error decompressing data:', error);
        reject(error);
      }
    });
  }

  async encryptData(compressedData: Uint8Array): Promise<{iv: Uint8Array, encrypted: Uint8Array}> {
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
    return {iv, encrypted: new Uint8Array(encrypted)};
  }

  async decryptData(encryptedData: {iv: Uint8Array,  encrypted: Uint8Array}): Promise<Uint8Array> {
    if (!this.sessionKey) {
      throw new Error('Session key not set');
    }
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: encryptedData.iv,
        },
        this.sessionKey,
        encryptedData.encrypted
      );
      return new Uint8Array(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
    
  }

  // Function to test, TODO remove later
  async fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(new Uint8Array(event.target!!.result as ArrayBuffer));
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  compareUint8Arrays(arr1: Uint8Array, arr2: Uint8Array): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  // to test whether the decryption/decompression is correct
  async openFileInANewTab(decryptedData: Uint8Array, fileName: string, mimeType: string) {
    // Create a Blob from the decrypted data
    const blob = new Blob([decryptedData], { type: mimeType });
  
    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);
  
    // Create a new link element
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
  
    // Simulate a click to open the file in a new tab
    window.open(url, '_blank');
  
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);
  }
  
  
    

  async uploadData(files: File[]): Promise<Observable<any>> {
    const formData = new FormData();
    const encryptedDataPromises = files.map(async (file) => {
      // from File to Uint8Array
      const fileUncompressed = await this.fileToUint8Array(file);
      const compressedData = await this.compressData(file);
      const encryptedData = await this.encryptData(compressedData);
      // ToDo remove later
      const decryptedData = await this.decryptData(encryptedData);
      const decompressData = await this.decompressData(decryptedData, file.type);
      console.log('Decrypted !== fileUncompressed', !this.compareUint8Arrays(decryptedData, fileUncompressed));
      
      
      return JSON.stringify(encryptedData);
    });
    const encryptedDataArray = await Promise.all(encryptedDataPromises);
    encryptedDataArray.forEach((encryptedData, index) => {
      const blob = new Blob([encryptedData], {
        type: 'application/octet-stream',
      });
      formData.append('file', blob, files[index].name);
    });
    return this.postData(formData);
  }

  async sendFile(file: File): Promise<Observable<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
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
}
