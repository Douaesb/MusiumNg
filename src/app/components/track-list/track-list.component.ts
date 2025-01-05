import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Track } from '../../models/track.model';
import * as TrackActions from '../../state/track/track.actions';
import { TrackState } from '../../state/track/track.reducer';
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
    AsyncPipe
  ]
})
export class TrackListComponent implements OnInit {

  tracks$: Observable<Track[]>;
  error$: Observable<string | null>;
  newTrack: Track = { id: 0, title: '', artist: '', category: '', duration: 0, createdAt: new Date(), audioFileId: 0, audioFile: { fileBlob: new Blob(), fileName: '', fileType: '', fileSize: 0 } }; // Add audioFile
  selectedTrack: Track | null = null; // Holds the track being edited

  constructor(private store: Store<{ track: TrackState }>) {
    this.tracks$ = this.store.select(state => state.track.tracks);
    this.error$ = this.store.select(state => state.track.error);
  }

  ngOnInit(): void {
    // Dispatch the action to load tracks when the component initializes
    this.store.dispatch(TrackActions.loadTracks());
  }
  addTrack(): void {
    console.log('New Track Data:', this.newTrack);
  
    // Log individual properties to check their values
    console.log('Track Title:', this.newTrack.title);
    console.log('Track Artist:', this.newTrack.artist);
    console.log('Track Category:', this.newTrack.category);
    console.log('Track Audio File ID:', this.newTrack.audioFileId);
    console.log('Track Audio File:', this.newTrack.audioFile);
  
    // Ensure audioFileId is generated or assigned if missing
    if (!this.newTrack.audioFileId) {
      this.newTrack.audioFileId = this.generateUniqueId(); // Example: you can generate or set a valid ID here
      console.log('Generated Audio File ID:', this.newTrack.audioFileId);
    }
  
    // Check if all required fields are populated, also ensuring audioFileId is truthy
    if (this.newTrack.title && this.newTrack.artist && this.newTrack.category && this.newTrack.audioFileId && this.newTrack.audioFile) {
      console.log('Condition met, generating ID and dispatching track:', this.newTrack);
  
      // Set track id and log the new track object
      this.newTrack.id = this.generateUniqueId();
      console.log('New Track after ID generation:', this.newTrack);
  
      // Dispatch the track action
      this.store.dispatch(TrackActions.addTrack({ 
        track: this.newTrack, 
        audioFile: this.newTrack.audioFile 
      }));
  
      // Reset the form
      this.resetForm();
    } else {
      console.log('Condition not met, not dispatching track:', this.newTrack);
      if (!this.newTrack.audioFileId) {
        console.log('Audio File ID is missing or invalid.');
      }
    }
  }
  
  

  

  selectTrack(track: Track): void {
    console.log('Selected Track:', track);
    this.selectedTrack = { ...track };
    console.log('Selected Track 2 :', this.selectedTrack);
  }

  editTrack(updatedTrack: Track): void {
    if (updatedTrack.id && updatedTrack.title && updatedTrack.artist && updatedTrack.category) {
      this.store.dispatch(TrackActions.editTrack({ track: updatedTrack }));
      this.selectedTrack = null;
    }
  }

  deleteTrack(trackId: number): void {
    this.store.dispatch(TrackActions.deleteTrack({ trackId }));
  }

  private resetForm(): void {
    this.newTrack = { id: 0, title: '', artist: '', category: '', duration: 0, createdAt: new Date(), audioFileId: 0, audioFile: { fileBlob: new Blob(), fileName: '', fileType: '', fileSize: 0 } }; // Reset audioFile
  }

  private generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // Method to handle file input and update the audioFile property
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.newTrack.audioFile = {
        fileBlob: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
    }
  }
}
