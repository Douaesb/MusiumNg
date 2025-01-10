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
import { FormatDatePipe } from '../../format-date.pipe';

@Component({
  selector: 'app-track-list',
  standalone: true,
  templateUrl: './track-list.component.html',
  imports: [FormsModule, CommonModule, FormatDatePipe],
})
export class TrackListComponent implements OnInit {
  @ViewChild('crudModal') crudModal!: ElementRef;

  @ViewChild('imageInput') imageInput!: ElementRef;
  imageUrls: { [trackId: number]: string } = {};
  tracks$: Observable<Track[]>;
  error$: Observable<string | null>;
  newTrack: Track = this.createEmptyTrack();
  selectedTrack: Track | null = null;
  newImageFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number } | null = null;
  audioFile: {
    fileBlob: Blob;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null = null;
  imageFile: {
    fileBlob: Blob;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null = null;
  audioFileUrl: string | null = null;
  imageFileUrl: string | null = null;
  searchQuery: string = '';
  categories: string[] = [
    'Pop',
    'Rock',
    'Jazz',
    'Classical',
    'Piano',
    'Chaabi',
  ];
  filteredTracks$: Observable<Track[]>;
  constructor(
    private store: Store<{ track: TrackState }>,
    private indexedDbService: IndexedDbService,
    private router: Router
  ) {
    this.tracks$ = this.store.select((state) => state.track.tracks);
    this.error$ = this.store.select((state) => state.track.error);
    this.filteredTracks$ = this.tracks$;
  }

  ngOnInit(): void {
    this.store.dispatch(TrackActions.loadTracks());
    this.filteredTracks$ = this.tracks$;

    // Fetch the image URL for each track
    this.tracks$.subscribe((tracks) => {
      tracks.forEach((track) => {
        if (track.imageFileId) {
          this.indexedDbService.getImageFileUrl(track.imageFileId).subscribe({
            next: (url) => {
              this.imageUrls[track.id!] = url; // Store the URL for the track
              console.log('Image URL fetched for track:', track.title, url);
            },
            error: (err) => {
              console.error('Error fetching image file URL:', err);
            },
          });
        }
      });
    });
  }

  openCreateModal(): void {
    this.newTrack = this.createEmptyTrack();
    this.audioFile = null;
    this.imageFile = null;
    this.audioFileUrl = null;
    this.imageFileUrl = null;
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
      },
    });
  }
  onAudioFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      if (this.isAudioFileValid({ fileType: file.type, fileSize: file.size })) {
        this.audioFile = {
          fileBlob: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
        this.audioFileUrl = URL.createObjectURL(file);
  
        const audio = new Audio(this.audioFileUrl);
        audio.onloadedmetadata = () => {
          const duration = audio.duration; // Duration in seconds
          this.newTrack.duration = duration; // Store duration in your track object
          console.log('Audio Duration:', duration);
        };
      } else {
        alert('Invalid audio file. Accepted formats: MP3, WAV, OGG. Max size: 15MB.');
      }
    }
  }
  
  addTrack(): void {
    console.log('New Track Data:', this.newTrack);

    if (this.isTrackValid(this.newTrack) && this.audioFile ) {
      console.log(
        'Track is valid. Attempting to add audio and image files:',
        this.audioFile,
        this.imageFile
      );

      // Add Audio File
      this.indexedDbService.addAudioFile(this.audioFile).subscribe({
        next: (audioFileId) => {
          console.log('Audio File ID returned:', audioFileId);

          // Add Image File
          this.indexedDbService.addImageFile(this.imageFile!).subscribe({
            next: (imageFileId) => {
              console.log('Image File ID returned:', imageFileId);

              this.newTrack.audioFileId = audioFileId;
              this.newTrack.imageFileId = imageFileId;
              this.newTrack.id = audioFileId;

              // Fetch the Image URL for displaying it in the component
              this.indexedDbService.getImageFileUrl(imageFileId).subscribe({
                next: (url) => {
                  this.imageFileUrl = url; // Set the image URL to display it
                  console.log('Image URL fetched:', this.imageFileUrl);
                },
                error: (err) => {
                  console.error('Error fetching image file URL:', err);
                },
              });

              this.store.dispatch(
                TrackActions.addTrack({ track: this.newTrack })
              );
              this.resetForm();
              this.closeCreateModal();
            },
            error: (err) => {
              console.error('Error adding image file:', err);
            },
          });
        },
        error: (err) => {
          console.error('Error adding audio file:', err);
        },
      });
    } else {
      console.error(
        'Track data is invalid or missing audio/image files:',
        this.newTrack
      );
    }
  }

  selectTrack(track: Track): void {
    console.log('Track selected', track);
    this.router.navigate(['/tracks', track.id]);
  }

  editTrack(updatedTrack: Track): void {
    if (this.isTrackValid(updatedTrack)) {
      console.log('Track updated successfully:', updatedTrack);
  
      const imageFile = this.newImageFile;  // Make sure to pass the correct `newImageFile`
  
      if (this.audioFile || imageFile) {
        // Pass the `newImageFile` (if exists) to the update method
        this.indexedDbService
          .updateTrack(updatedTrack, this.audioFile!, imageFile!)
          .subscribe({
            next: () => {
              console.log('Track, audio file, and image updated successfully.');
              this.store.dispatch(
                TrackActions.editTrack({ track: updatedTrack })
              );
              this.closeEditModal();
            },
            error: (err) => {
              console.error('Error updating track with audio file and image:', err);
            },
          });
      } else {
        // Update track only without audio or image file
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

  // onFileChange(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input?.files?.length) {
  //     const file = input.files[0];
  //     this.audioFile = {
  //       fileBlob: file,
  //       fileName: file.name,
  //       fileType: file.type,
  //       fileSize: file.size,
  //     };

  //     this.audioFileUrl = URL.createObjectURL(this.audioFile.fileBlob);
  //     console.log('File uploaded successfully:', this.audioFileUrl);
  //   } else {
  //     console.warn('No file selected.');
  //   }
  // }
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      
      // Validate the audio file
      if (this.isAudioFileValid({ fileType: file.type, fileSize: file.size })) {
        this.audioFile = {
          fileBlob: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
  
        this.audioFileUrl = URL.createObjectURL(this.audioFile.fileBlob);
        console.log('File uploaded successfully:', this.audioFileUrl);
  
        const audio = new Audio(this.audioFileUrl);
  
        audio.onloadedmetadata = () => {
          const duration = audio.duration;
          console.log('Audio Duration:', duration);
  
          if (duration > 0) {
            this.newTrack.duration = duration;
            console.log('Duration set to:', this.newTrack.duration);
          } else {
            console.error('Invalid audio duration:', duration);
          }
        };
  
        audio.onerror = (err) => {
          console.error('Error loading audio file metadata:', err);
        };
      } else {
        alert('Invalid audio file. Accepted formats: MP3, WAV, OGG. Max size: 15MB.');
      }
    } else {
      console.warn('No file selected.');
    }
  }
  

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  onImageFileChange(event: Event, isUpdate: boolean = false): void {
    const input = event.target as HTMLInputElement;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
    if (input.files && input.files[0]) {
      const file = input.files[0];
  
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an image (JPEG, PNG, GIF).');
        return;
      }
  
      if (isUpdate &&this.isImageFileValid({ fileType: file.type, fileSize: file.size })) {
        // For updating
        this.newImageFile = {
          fileBlob: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
        console.log('Image file selected for update:', this.newImageFile);
      } else if (this.isImageFileValid({ fileType: file.type, fileSize: file.size })) {
        // For adding a new image
        this.imageFile = {
          fileBlob: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };
        console.log('New image file selected:', this.imageFile);
      }
    } else {
      console.log('No file selected.');
    }
  }
  

  private resetForm(): void {
    this.newTrack = this.createEmptyTrack();
    this.audioFile = null;
    console.log('Form has been reset.');
  }

  // private isTrackValid(track: Track): boolean {
  //   return !!(track.title && track.artist && track.category);
  // }
  private isTrackValid(track: Track): boolean {
    const titleValid = track.title && track.title.length <= 50;
    const artistValid = track.artist && track.artist.length <= 50;
    const categoryValid = this.categories.includes(track.category);
    const descriptionValid = !track.description || track.description.length <= 200;

    return !!(titleValid && artistValid && categoryValid && descriptionValid);
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
  filterByCategory(category: string): void {
    this.filteredTracks$ =
      this.indexedDbService.searchTracksByCategory(category);
  }
  resetFilter(): void {
    this.filteredTracks$ = this.tracks$;
  }
  
  private isAudioFileValid(file: { fileType: string; fileSize: number }): boolean {
    const allowedFormats = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
    console.log('File type:', file.fileType);
    console.log('File size:', file.fileSize);
  
    const maxSize = 15 * 1024 * 1024; // 15MB
    console.log('Max size:', maxSize);
  
    // Compare file type in a case-insensitive manner
    const isFormatValid = allowedFormats.includes(file.fileType.toLowerCase());
    const isSizeValid = file.fileSize <= maxSize;
  
    console.log('Format valid:', isFormatValid);
    console.log('Size valid:', isSizeValid);
  
    return isFormatValid && isSizeValid;
  }
  
  private isImageFileValid(file: { fileType: string; fileSize: number }): boolean {
    const allowedFormats = ['image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return allowedFormats.includes(file.fileType) && file.fileSize <= maxSize;
  }
}
