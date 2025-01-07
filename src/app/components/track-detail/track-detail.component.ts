import { Component, OnInit, OnDestroy } from '@angular/core';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { Track } from '../../state/track/track.models';
import { Observable, Subscription, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { TrackState } from '../../state/track/track.reducer';
import { Store } from '@ngrx/store';
import * as AudioActions from '../../state/audio/audio.actions';
import * as TrackActions from '../../state/track/track.actions';
import { switchMap, tap, catchError, take } from 'rxjs/operators';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [AudioPlayerComponent,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './track-detail.component.html',
})
export class TrackDetailComponent implements OnInit, OnDestroy {
  selectedTrack$: Observable<Track | null>;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private store: Store<{ track: TrackState }>,
    private route: ActivatedRoute,
    private indexedDbService: IndexedDbService,
    private router: Router
  ) {
    this.selectedTrack$ = this.store.select(state => state.track.selectedTrack);
  }

  ngOnInit(): void {
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
  redirectToTracksPage(): void {
    // Navigate to the tracks page
    this.router.navigate(['/tracks']);
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
