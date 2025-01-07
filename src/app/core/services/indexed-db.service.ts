import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Track } from '../../state/track/track.models';

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
      trackId?: number;  
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
      audioFileId?: number;
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
          }
          if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
          }
        },
      });
      console.log('IndexedDB Initialized');
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  }

  private async ensureDBInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // AUDIO FILES
  addAudioFile(audioFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number }): Observable<number> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const id = await this.db.add('audioFiles', {
          ...audioFile,
          createdAt: new Date(),
        });
        return id;
      })()
    );
  }

  getAllAudioFiles(): Observable<MusicStreamDB['audioFiles']['value'][]> {
    return from(this.ensureDBInitialized().then(() => this.db.getAll('audioFiles')));
  }

  deleteAudioFile(id: number): Observable<void> {
    return from(this.ensureDBInitialized().then(() => this.db.delete('audioFiles', id)));
  }

  getAudioFileUrl(audioFileId: number): Observable<string> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const audioFile = await this.db.get('audioFiles', audioFileId);
        if (audioFile) {
          return URL.createObjectURL(audioFile.fileBlob);
        }
        throw new Error('Audio file not found');
      })()
    );
  }

  // TRACKS
  getAllTracks(): Observable<MusicStreamDB['tracks']['value'][]> {
    return from(this.ensureDBInitialized().then(() => this.db.getAll('tracks')));
  }

  getTrackById(id: number): Observable<MusicStreamDB['tracks']['value'] | undefined> {
    return from(this.ensureDBInitialized().then(() => this.db.get('tracks', id)));
  }

  addTrack(track: MusicStreamDB['tracks']['value']): Observable<number> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        if (track.description && track.description.length > 200) {
          throw new Error('Description exceeds 200 characters');
        }
        return this.db.add('tracks', { ...track, createdAt: new Date() });
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
          throw new Error('Track ID is required for updating');
        }
        return this.db.put('tracks', { ...track, createdAt: new Date() });
      })()
    );
  }

  deleteTrack(trackId: number): Observable<void> {
    return from(this.ensureDBInitialized().then(() => this.db.delete('tracks', trackId)));
  }

  searchTracksByCategory(category: string): Observable<MusicStreamDB['tracks']['value'][]> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const tracks = await this.db.getAll('tracks');
        return tracks.filter(track => track.category.toLowerCase() === category.toLowerCase());
      })()
    );
  }

  async addTrackWithAudioFile(
    track: MusicStreamDB['tracks']['value'],
    file: Blob,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<number | null> {
    await this.ensureDBInitialized();
    try {
      // Add track without audioFileId initially
      const trackId = await this.db.add('tracks', { ...track, createdAt: new Date() });

      // Add audio file and associate it with the track
      const audioFileId = await this.addAudioFile({ fileBlob: file, fileName, fileType, fileSize }).toPromise();
      if (audioFileId) {
        const audioFile = await this.db.get('audioFiles', audioFileId);
        if (audioFile) {
          await this.db.put('audioFiles', { ...audioFile, trackId });
        }
      }
      return trackId;
    } catch (error) {
      console.error('Error adding track with audio file:', error);
      return null;
    }
  }

  // Navigation Helpers
  getNextTrack(currentTrackId: number): Observable<Track | null> {
    return this.getAllTracks().pipe(
      map(tracks => {
        const currentIndex = tracks.findIndex(track => track.id === currentTrackId);
        return currentIndex >= 0 && currentIndex < tracks.length - 1 ? tracks[currentIndex + 1] : null;
      })
    );
  }

  getPreviousTrack(currentTrackId: number): Observable<Track | null> {
    return this.getAllTracks().pipe(
      map(tracks => {
        const currentIndex = tracks.findIndex(track => track.id === currentTrackId);
        return currentIndex > 0 ? tracks[currentIndex - 1] : null;
      })
    );
  }
}
