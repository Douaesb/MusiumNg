import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Track } from '../../models/track.model';
import * as TrackActions from '../../state/track/track.actions';
import { TrackState } from '../../state/track/track.reducer';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

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
  newTrack: Track = { id: 0, title: '', artist: '', category: '', duration: 0, createdAt: new Date() };

  constructor(private store: Store<{ track: TrackState }>) {
    this.tracks$ = this.store.select(state => state.track.tracks);
    this.error$ = this.store.select(state => state.track.error);
    
  }

  ngOnInit(): void {
    // Dispatch the action to load tracks when the component initializes
    this.store.dispatch(TrackActions.loadTracks());
  }

  addTrack(): void {
    if (this.newTrack.title && this.newTrack.artist && this.newTrack.category) {
      this.newTrack.id = this.generateUniqueId();
      this.store.dispatch(TrackActions.addTrack({ track: this.newTrack }));
      this.resetForm();
    }
  }

  deleteTrack(trackId: number): void {
    this.store.dispatch(TrackActions.deleteTrack({ trackId }));
  }

  private resetForm(): void {
    this.newTrack = { id: 0, title: '', artist: '', category: '', duration: 0, createdAt: new Date() };
  }

  private generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}
