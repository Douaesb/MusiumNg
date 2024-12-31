import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MusicStreamDB extends DBSchema {
  audioFiles: {
    key: number; 
    value: {
      id?: number;
      fileName: string;
      fileBlob: Blob;
      fileType: string;
      fileSize: number;
      createdAt: Date;
    };
  };
  metadata: {
    key: number;
    value: {
      id?: number;
      title: string;
      artist: string;
      description?: string;
      category: string;
      duration: number; 
      createdAt: Date;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private db!: IDBPDatabase<MusicStreamDB>;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<MusicStreamDB>('MusicStreamDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
    console.log('IndexedDB Initialized');
  }

  async addAudioFile(file: Blob, fileName: string, fileType: string, fileSize: number): Promise<number> {
    const createdAt = new Date();
    return await this.db.add('audioFiles', {
      fileBlob: file,
      fileName,
      fileType,
      fileSize,
      createdAt,
    });
  }

  async addMetadata(
    title: string,
    artist: string,
    category: string,
    duration: number,
    description?: string
  ): Promise<number> {
    const createdAt = new Date();
    return await this.db.add('metadata', {
      title,
      artist,
      category,
      duration,
      description,
      createdAt,
    });
  }

  async getAllAudioFiles(): Promise<MusicStreamDB['audioFiles']['value'][]> {
    return await this.db.getAll('audioFiles');
  }

  async getAllMetadata(): Promise<MusicStreamDB['metadata']['value'][]> {
    return await this.db.getAll('metadata');
  }

  async deleteAudioFile(id: number): Promise<void> {
    await this.db.delete('audioFiles', id);
  }

  async deleteMetadata(id: number): Promise<void> {
    await this.db.delete('metadata', id);
  }
}
