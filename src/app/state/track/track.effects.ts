import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import * as TrackActions from './track.actions';
import { IndexedDbService } from '../../core/services/indexed-db.service';

@Injectable()
export class TrackEffects {
  constructor(
    private actions$: Actions,
    private indexedDbService: IndexedDbService
  ) {}

  // Effect for loading tracks
  loadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.loadTracks),
      mergeMap(() =>
        this.indexedDbService.getAllTracks().pipe(
          map((tracks) => {
            console.log('Loaded tracks:', tracks); // Add this log
            return TrackActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => of(TrackActions.trackError({ error })))
        )
      )
    )
  );
  

  // Effect for adding a track
  addTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.addTrack),
      mergeMap(({ track }) => {
        console.log('Action received to add track:', track);
        return this.indexedDbService.addTrack(track).pipe(
          mergeMap(() => this.indexedDbService.getAllTracks()),
          map((tracks) => {
            console.log('Tracks after addition:', tracks);
            return TrackActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => {
            console.error('Error in addTrack effect:', error);
            return of(TrackActions.trackError({ error }));
          })
        );
      })
    )
  );
  
  
  // Effect for deleting a track
  deleteTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.deleteTrack),
      mergeMap(({ trackId }) =>
        this.indexedDbService.deleteTrack(trackId).pipe(
          mergeMap(() => this.indexedDbService.getAllTracks()),
          map((tracks) => TrackActions.loadTracksSuccess({ tracks })),
          catchError((error) => of(TrackActions.trackError({ error })))
        )
      )
    )
  );
}
