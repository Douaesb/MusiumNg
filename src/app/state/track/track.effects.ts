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
            console.log('Loaded tracks:', tracks);
            return TrackActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => of(TrackActions.trackError({ error })))
        )
      )
    )
  );

addAudioFile$ = createEffect(() =>
  this.actions$.pipe(
    ofType(TrackActions.addAudioFile),
    mergeMap(({ audioFile }) =>
      this.indexedDbService.addAudioFile(audioFile).pipe(
        map((audioFileId) => {
          console.log('Audio file added with ID:', audioFileId);
          return TrackActions.addAudioFileSuccess({ audioFileId });
        }),
        catchError((error) => {
          console.error('Error in addAudioFile effect:', error);
          return of(TrackActions.trackError({ error }));
        })
      )
    )
  )
);

addTrack$ = createEffect(() =>
  this.actions$.pipe(
    ofType(TrackActions.addTrack),
    mergeMap(({ track }) =>
      this.indexedDbService.addTrack(track).pipe(
        map((trackId) => {
          console.log('Track added with ID:', trackId);
          return TrackActions.addTrackSuccess({
            track: { ...track, id: trackId },
            audioFileId: track.audioFileId! ?? null, // Ensure `audioFileId` is included
          });
        }),
        catchError((error) => {
          console.error('Error in addTrack effect:', error);
          return of(TrackActions.trackError({ error: error.message }));
        })
      )
    )
  )
);


  // Effect for editing a track
  editTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.editTrack),
      mergeMap(({ track }) => {
        console.log('Action received to edit track:', track);
        return this.indexedDbService.updateTrack(track).pipe(
          mergeMap(() => this.indexedDbService.getAllTracks()),
          map((tracks) => {
            console.log('Tracks after editing:', tracks);
            return TrackActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => {
            console.error('Error in editTrack effect:', error);
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
