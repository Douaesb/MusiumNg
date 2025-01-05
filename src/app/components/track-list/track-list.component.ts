import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Track } from '../../state/track/track.models';
import * as TrackActions from '../../state/track/track.actions';
import { TrackState } from '../../state/track/track.reducer';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-track-list',
  standalone: true,
  templateUrl: './track-list.component.html',
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    AsyncPipe,
  ],
})
export class TrackListComponent implements OnInit {
  tracks$: Observable<Track[]>;
  error$: Observable<string | null>;
  newTrack: Track = this.createEmptyTrack();
  selectedTrack: Track | null = null; 
  audioFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number } | null = null;
  audioFileUrl: string | null = null; // To hold the generated audio file URL

  constructor(
    private store: Store<{ track: TrackState }>, 
    private indexedDbService: IndexedDbService // Inject IndexedDbService
  ) {
    this.tracks$ = this.store.select(state => state.track.tracks);
    this.error$ = this.store.select(state => state.track.error);
  }

  ngOnInit(): void {
    this.store.dispatch(TrackActions.loadTracks());
  }

  // Fetch the audio file URL for the given track
  fetchAudioFileUrl(audioFileId: number): void {
    this.indexedDbService.getAudioFileUrl(audioFileId).subscribe({
      next: (url) => {
        this.audioFileUrl = url;
        console.log('Audio file URL:', this.audioFileUrl);
      },
      error: (err) => {
        console.error('Error fetching audio file URL:', err);
      }
    });
  }
  

  addTrack(): void {
    console.log('New Track Data:', this.newTrack);
    
    if (!this.newTrack.audioFileId || this.newTrack.audioFileId === 0) {
      this.newTrack.audioFileId = this.generateUniqueId();
      console.log('Generated Audio File ID:', this.newTrack.audioFileId);
    }

    if (this.isTrackValid(this.newTrack) && this.audioFile) {
      console.log('Track is valid. Dispatching action with track:', this.newTrack);

      const trackId = this.generateUniqueId(); 
      this.newTrack.id = trackId;

      // Add the audio file to the store first
      this.store.dispatch(TrackActions.addAudioFile({ audioFile: this.audioFile }));

      // Then add the track to the store
      this.store.dispatch(TrackActions.addTrack({ track: this.newTrack }));

      // Reset the form
      this.resetForm();
    } else {
      console.error('Track data is invalid. Missing required fields:', this.newTrack);
    }
  }

  selectTrack(track: Track): void {
    console.log('Track selected for editing:', track);
    this.selectedTrack = { ...track };

    // Fetch the audio file URL for the selected track
    if (track.audioFileId) {
      this.fetchAudioFileUrl(track.audioFileId);
    }
  }

  editTrack(updatedTrack: Track): void {
    if (this.isTrackValid(updatedTrack)) {
      console.log('Track updated successfully:', updatedTrack);
      this.store.dispatch(TrackActions.editTrack({ track: updatedTrack }));
      this.selectedTrack = null;
    } else {
      console.error('Updated track data is invalid:', updatedTrack);
    }
  }

  deleteTrack(trackId: number): void {
    console.log('Deleting track with ID:', trackId);
    this.store.dispatch(TrackActions.deleteTrack({ trackId }));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.audioFile = {
        fileBlob: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
      
      this.audioFileUrl = URL.createObjectURL(this.audioFile.fileBlob);
      console.log('File uploaded successfully:', this.audioFileUrl);
    } else {
      console.warn('No file selected.');
    }
  }
  

  private resetForm(): void {
    this.newTrack = this.createEmptyTrack();
    this.audioFile = null; // Reset audio file
    console.log('Form has been reset.');
  }

  private generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private isTrackValid(track: Track): boolean {
    return !!(track.title && track.artist && track.category && track.audioFileId);
  }

  private createEmptyTrack(): Track {
    return {
      id: 0,
      title: '',
      artist: '',
      category: '',
      duration: 0,
      createdAt: new Date(),
      audioFileId: 0,
    };
  }
}
