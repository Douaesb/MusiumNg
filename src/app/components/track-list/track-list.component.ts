  import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
  import { Store } from '@ngrx/store';
  import { Observable } from 'rxjs';
  import { Track } from '../../state/track/track.models';
  import * as TrackActions from '../../state/track/track.actions';
  import { TrackState } from '../../state/track/track.reducer';
  import { IndexedDbService } from '../../core/services/indexed-db.service';
  import { Router } from '@angular/router'; 
  import { FormsModule } from '@angular/forms';
  import { CommonModule } from '@angular/common';

  @Component({
    selector: 'app-track-list',
    standalone: true,
    templateUrl: './track-list.component.html',
    imports: [
      FormsModule,
      CommonModule
    ]
  })
  export class TrackListComponent implements OnInit {
    @ViewChild('crudModal') crudModal!: ElementRef;

    tracks$: Observable<Track[]>;
    error$: Observable<string | null>;
    newTrack: Track = this.createEmptyTrack();
    selectedTrack: Track | null = null; 
    audioFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number } | null = null;
    audioFileUrl: string | null = null; 
    searchQuery: string = '';
    filteredTracks$: Observable<Track[]>;
    constructor(
      private store: Store<{ track: TrackState }>, 
      private indexedDbService: IndexedDbService,
      private router: Router
    ) {
      this.tracks$ = this.store.select(state => state.track.tracks);
      this.error$ = this.store.select(state => state.track.error);
      this.filteredTracks$ = this.tracks$;

    }

    ngOnInit(): void {
      this.store.dispatch(TrackActions.loadTracks());
    }

    openCreateModal(): void {
      this.newTrack = this.createEmptyTrack();
      this.audioFile = null;
      this.crudModal.nativeElement.classList.remove('hidden');
    }

    closeCreateModal(): void {
      this.crudModal.nativeElement.classList.add('hidden');
    }

    openEditModal(track: Track): void {
      this.selectedTrack = { ...track };
    }

    closeEditModal(): void {
      this.selectedTrack = null;
    }

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

      if (this.isTrackValid(this.newTrack) && this.audioFile) {
        console.log('Track is valid. Attempting to add audio file:', this.audioFile);

        this.indexedDbService.addAudioFile(this.audioFile).subscribe({
          next: (audioFileId) => {
            console.log('Audio File ID returned:', audioFileId);
            
            this.newTrack.audioFileId = audioFileId; 
            this.newTrack.id = audioFileId;

            this.store.dispatch(TrackActions.addTrack({ track: this.newTrack }));
            this.resetForm();
            this.closeCreateModal();
          },
          error: (err) => {
            console.error('Error adding audio file:', err);
          }
        });
      } else {
        console.error('Track data is invalid or audio file is missing:', this.newTrack);
      }
    }

    selectTrack(track: Track): void {
      console.log('Track selected', track);
      this.router.navigate(['/tracks', track.id]);
    }

    editTrack(updatedTrack: Track): void {
      if (this.isTrackValid(updatedTrack)) {
        console.log('Track updated successfully:', updatedTrack);
          if (this.audioFile) {
          this.indexedDbService.updateTrack(updatedTrack, this.audioFile).subscribe({
            next: () => {
              console.log('Track and audio file updated successfully.');
              this.store.dispatch(TrackActions.editTrack({ track: updatedTrack }));
              this.closeEditModal();
            },
            error: (err) => {
              console.error('Error updating track with audio file:', err);
            },
          });
        } else {
          this.store.dispatch(TrackActions.editTrack({ track: updatedTrack }));
          this.closeEditModal();
        }
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
      this.audioFile = null;
      console.log('Form has been reset.');
    }

    private isTrackValid(track: Track): boolean {
      return !!(track.title && track.artist && track.category);
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
    onSearch(): void {
      if (this.searchQuery.trim() === '') {
        this.filteredTracks$ = this.tracks$; // Reset to all tracks
        return;
      }
      this.filteredTracks$ = this.indexedDbService.searchTracks(this.searchQuery);
    }
  }
