import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Observable, from } from 'rxjs';

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
  tracks: {
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
    try {
      this.db = await openDB<MusicStreamDB>('MusicStreamDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('audioFiles')) {
            db.createObjectStore('audioFiles', { keyPath: 'id', autoIncrement: true });
            console.log('audioFiles store created');
          }
          if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
            console.log('tracks store created');
          }
        },
      });
      console.log('IndexedDB Initialized');
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  }
  

  // Audio Files Methods
  async addAudioFile(file: Blob, fileName: string, fileType: string, fileSize: number): Promise<number | null> {
    if (fileSize > 15 * 1024 * 1024) {
      console.error('File size exceeds 15MB limit');
      return null;
    }
    if (!['audio/mp3', 'audio/wav', 'audio/ogg'].includes(fileType)) {
      console.error('Unsupported file format');
      return null;
    }

    const createdAt = new Date();
    return this.db.add('audioFiles', { fileBlob: file, fileName, fileType, fileSize, createdAt });
  }

  async getAllAudioFiles(): Promise<MusicStreamDB['audioFiles']['value'][]> {
    return this.db.getAll('audioFiles');
  }

  async deleteAudioFile(id: number): Promise<void> {
    await this.db.delete('audioFiles', id);
  }

  private async ensureDBInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }
  
  getAllTracks(): Observable<MusicStreamDB['tracks']['value'][]> {
    return from(
      (async () => {
        await this.ensureDBInitialized();  // Ensure DB is initialized
        return this.db.getAll('tracks');
      })()
    );
  }
  

  // Tracks Methods
  addTrack(track: MusicStreamDB['tracks']['value']): Observable<number> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        if (track.description && track.description.length > 200) {
          throw new Error('Description exceeds 200 characters');
        }
        return this.db.put('tracks', { ...track, createdAt: new Date() });
      })()
    );
  }

  updateTrack(track: MusicStreamDB['tracks']['value']): Observable<number> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        if (track.description && track.description.length > 200) {
          throw new Error('Description exceeds 200 characters');
        }
        if (!track.id) {
          throw new Error('Track ID is required for editing');
        }
        return this.db.put('tracks', { ...track, createdAt: new Date() });
      })()
    );
  }


  deleteTrack(trackId: number): Observable<void> {
    return from(this.db.delete('tracks', trackId));
  }

  async searchTracksByCategory(category: string): Promise<MusicStreamDB['tracks']['value'][]> {
    const tracks = await this.db.getAll('tracks');
    return tracks.filter((track) => track.category.toLowerCase() === category.toLowerCase());
  }
}
