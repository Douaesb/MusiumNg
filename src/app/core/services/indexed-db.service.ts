import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Observable, from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
      imageFileId?: number;
      createdAt: Date;
    };
  };
  imageFiles: {
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
          if (!db.objectStoreNames.contains('imageFiles')) { 
            db.createObjectStore('imageFiles', { keyPath: 'id', autoIncrement: true });
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

  //IMAGES
  addImageFile(imageFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number }): Observable<number> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const id = await this.db.add('imageFiles', {
          ...imageFile,
          createdAt: new Date(),
        });
        return id;
      })()
    );
  }
  
  getImageFileUrl(imageFileId: number): Observable<string> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const imageFile = await this.db.get('imageFiles', imageFileId);
        if (imageFile) {
          return URL.createObjectURL(imageFile.fileBlob);
        }
        throw new Error('Image file not found');
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
        this.validateTrack(track);
        return this.db.add('tracks', { ...track, createdAt: new Date() });
      })()
    ).pipe(
      catchError((error) => {
        console.error('Error adding track:', error);
        throw error;
      })
    );
  }
  
  updateTrack(
    track: MusicStreamDB['tracks']['value'],
    newAudioFile?: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number },
    newImageFile?: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number }
  ): Observable<number> {
    console.log('updateTrack called with:', { track, newAudioFile, newImageFile });
  
    return from(
      (async () => {
        await this.ensureDBInitialized();
        this.validateTrack(track);
        console.log('Database initialized.');
  
        // Validate track description
        if (track.description && track.description.length > 200) {
          console.error('Validation error: Description exceeds 200 characters');
          throw new Error('Description exceeds 200 characters');
        }
        if (!track.id) {
          console.error('Validation error: Track ID is required for updating');
          throw new Error('Track ID is required for updating');
        }
  
        // Handle new audio file
        if (newAudioFile) {
          console.log('Handling new audio file:', newAudioFile);
          if (track.audioFileId) {
            console.log(`Fetching existing audio file with ID: ${track.audioFileId}`);
            const oldAudioFile = await this.db.get('audioFiles', track.audioFileId);
  
            if (oldAudioFile) {
              console.log('Replacing existing audio file:', oldAudioFile);
              await this.db.put('audioFiles', {
                ...oldAudioFile,
                fileBlob: newAudioFile.fileBlob,
                fileName: newAudioFile.fileName,
                fileType: newAudioFile.fileType,
                fileSize: newAudioFile.fileSize,
                createdAt: new Date(),
              });
            } else {
              console.warn('Existing audio file not found.');
            }
          } else {
            console.log('Adding new audio file to the database.');
            const newAudioFileId = await this.addAudioFile(newAudioFile).toPromise();
            console.log(`New audio file added with ID: ${newAudioFileId}`);
            track.audioFileId = newAudioFileId;
          }
        }
  
        // Handle new image file
        if (newImageFile) {
          console.log('Handling new image file:', newImageFile);
          if (track.imageFileId) {
            console.log(`Fetching existing image file with ID: ${track.imageFileId}`);
            const oldImageFile = await this.db.get('imageFiles', track.imageFileId);
  
            if (oldImageFile) {
              console.log('Replacing existing image file:', oldImageFile);
              await this.db.put('imageFiles', {
                ...oldImageFile,
                fileBlob: newImageFile.fileBlob,
                fileName: newImageFile.fileName,
                fileType: newImageFile.fileType,
                fileSize: newImageFile.fileSize,
                createdAt: new Date(),
              });
              console.log('Existing image file replaced successfully.');
            } else {
              console.warn('Existing image file not found.');
            }
          } else {
            console.log('Adding new image file to the database.');
            const newImageFileId = await this.addImageFile(newImageFile).toPromise();
            console.log(`New image file added with ID: ${newImageFileId}`);
            track.imageFileId = newImageFileId;
          }
        } else {
          console.log('No new image file provided.');
        }
  
        // Update the track details
        console.log('Updating track details:', track);
        const trackId = await this.db.put('tracks', { ...track, createdAt: new Date() });
        console.log(`Track updated successfully with ID: ${trackId}`);
  
        return trackId;
      })()
    ).pipe(
      tap(() => console.log('updateTrack operation completed successfully.')),
      catchError((error) => {
        console.error('Error in updateTrack operation:', error);
        throw error;
      })
    );
  }

  deleteTrack(trackId: number): Observable<void> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const track = await this.db.get('tracks', trackId);
        if (track?.audioFileId) {
          await this.db.delete('audioFiles', track.audioFileId); // Delete the associated audio file
        }
        if (track?.imageFileId) {
          await this.db.delete('imageFiles', track.imageFileId); // Delete the associated image file
        }
        await this.db.delete('tracks', trackId); // Delete the track
      })()
    );
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

  searchTracks(query: string): Observable<MusicStreamDB['tracks']['value'][]> {
    return from(
      (async () => {
        await this.ensureDBInitialized();
        const tracks = await this.db.getAll('tracks');
        const lowerCaseQuery = query.toLowerCase();
        return tracks.filter(
          track =>
            track.title.toLowerCase().includes(lowerCaseQuery) ||
            (track.artist && track.artist.toLowerCase().includes(lowerCaseQuery))
        );
      })()
    );
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

  private validateTrack(track: MusicStreamDB['tracks']['value']): void {
    if (!track.title || track.title.trim().length === 0) {
      throw new Error('Track title is required.');
    }
    if (!track.artist || track.artist.trim().length === 0) {
      throw new Error('Track artist is required.');
    }
    const validCategories = ['Pop', 'Rock', 'Jazz', 'Classical', 'Chaabi']; 
    if (!validCategories.includes(track.category)) {
      throw new Error(`Invalid category. Allowed categories are: ${validCategories.join(', ')}`);
    }
    if (track.description && track.description.length > 200) {
      throw new Error('Description exceeds 200 characters.');
    }
  }
  
  
}
