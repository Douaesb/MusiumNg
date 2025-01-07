import { Component, OnInit, OnDestroy, Input, SimpleChanges, OnChanges, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { Track } from '../../state/track/track.models';
import { TrackState } from '../../state/track/track.reducer';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as AudioActions from '../../state/audio/audio.actions';
import * as TrackActions from '../../state/track/track.actions';
import { switchMap, tap, catchError, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-player.component.html',
})
export class AudioPlayerComponent implements OnInit, OnDestroy, OnChanges {
  selectedTrack$: Observable<Track | null>;
  
  @Input() track: Track | null = null;
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;

  audioFileUrl: string | null = null;
  isPlaying: boolean = false;
  volume: number = 1;
  currentTime: number = 0;
  duration: number = 0;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private store: Store<{ track: TrackState }>,
    private indexedDbService: IndexedDbService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.selectedTrack$ = this.store.select(state => state.track.selectedTrack);
  }

  ngOnInit(): void {
    this.loadState();
    this.subscriptions.add(
      this.route.params.pipe(
        switchMap(params => {
          const trackId = +params['id'];
          return this.indexedDbService.getTrackById(trackId).pipe(
            tap(track => {
              if (track) {
                console.log('Track fetched from IndexedDB:', track);
                this.store.dispatch(TrackActions.selectTrack({ track }));
                this.store.dispatch(AudioActions.selectTrack({ track }));
              } else {
                console.log('Track not found in IndexedDB');
                this.store.dispatch(TrackActions.selectTrack({ track: null }));
              }
            }),
            catchError(error => {
              console.error('Error fetching track:', error);
              this.store.dispatch(TrackActions.selectTrack({ track: null }));
              return of(null);
            })
          );
        })
      ).subscribe()
    );

    this.selectedTrack$.pipe(
      take(1)
    ).subscribe(track => {
      console.log('Initial selected track from store:', track);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['track'] && this.track) {
      console.log('Track changed in AudioPlayerComponent:', this.track);
      this.loadAudio(this.track.audioFileId!);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.saveState();
  }

  loadAudio(audioFileId: number): void {
    this.indexedDbService.getAudioFileUrl(audioFileId).subscribe({
      next: (url) => {
        this.audioFileUrl = url;
        console.log('Audio file URL:', this.audioFileUrl);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching audio file URL:', err);
      }
    });
  }

  onAudioLoaded(): void {
    const audioElement = this.audioPlayerRef.nativeElement;
    this.duration = audioElement.duration;
    audioElement.volume = this.volume;
    this.cdr.detectChanges();
  }

  playPause(): void {
    const audioElement = this.audioPlayerRef.nativeElement;
    if (this.isPlaying) {
      audioElement.pause();
      this.store.dispatch(AudioActions.pause());
    } else {
      audioElement.play();
      this.store.dispatch(AudioActions.play());
    }
    this.isPlaying = !this.isPlaying;
    this.cdr.detectChanges();
  }

  onSeek(event: Event): void {
    const audioElement = this.audioPlayerRef.nativeElement;
    const target = event.target as HTMLInputElement;
    audioElement.currentTime = Number(target.value);
    this.currentTime = audioElement.currentTime;
    this.cdr.detectChanges();
  }

  onVolumeChange(event: Event): void {
    const audioElement = this.audioPlayerRef.nativeElement;
    const target = event.target as HTMLInputElement;
    this.volume = Number(target.value);
    audioElement.volume = this.volume;
    this.store.dispatch(AudioActions.setVolume({ volume: this.volume }));
    this.cdr.detectChanges();
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  private saveState(): void {
    const state = {
      trackId: this.track?.id,
      volume: this.volume,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
    };
    localStorage.setItem('audioPlayerState', JSON.stringify(state));
  }

  private loadState(): void {
    const savedState = localStorage.getItem('audioPlayerState');
    if (savedState) {
      const { volume, currentTime, isPlaying } = JSON.parse(savedState);
      this.volume = volume || 1;
      this.currentTime = currentTime || 0;
      this.isPlaying = isPlaying || false;
    }
  }

  nextTrack(): void {
    if (this.track?.id) {
      this.indexedDbService.getNextTrack(this.track.id).subscribe({
        next: (nextTrack) => {
          if (nextTrack) {
            this.store.dispatch(TrackActions.selectTrack({ track: nextTrack }));
            this.store.dispatch(AudioActions.selectTrack({ track: nextTrack }));
            // Update URL with the new track ID (use /tracks/:id path)
            this.router.navigate([`/tracks/${nextTrack.id}`]);  // Adjusted the route
          } else {
            console.log('No next track found.');
          }
        },
        error: (err) => console.error('Error fetching next track:', err),
      });
    } else {
      console.log('Track ID is not available');
    }
  }
  
  previousTrack(): void {
    if (this.track?.id) {
      this.indexedDbService.getPreviousTrack(this.track.id).subscribe({
        next: (prevTrack) => {
          if (prevTrack) {
            this.store.dispatch(TrackActions.selectTrack({ track: prevTrack }));
            this.store.dispatch(AudioActions.selectTrack({ track: prevTrack }));
            // Update URL with the new track ID (use /tracks/:id path)
            this.router.navigate([`/tracks/${prevTrack.id}`]);  // Adjusted the route
          } else {
            console.log('No previous track found.');
          }
        },
        error: (err) => console.error('Error fetching previous track:', err),
      });
    } else {
      console.log('Track ID is not available');
    }
  }
  


}
