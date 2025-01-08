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

  loadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.loadTracks),
      mergeMap(() =>
        this.indexedDbService.getAllTracks().pipe(
          map((tracks) => {
            console.log('Loaded tracks:', tracks);
            return TrackActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => of(TrackActions.trackError({ error: error.message })))
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
            return of(TrackActions.addAudioFileFailure({ error: error.message }));
          })
        )
      )
    )
  );
  
  addImageFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.addImageFile),
      mergeMap(({ imageFile }) =>
        this.indexedDbService.addImageFile(imageFile).pipe(
          map((imageFileId) => {
            console.log('Image file added with ID:', imageFileId);
            return TrackActions.addImageFileSuccess({ imageFileId });
          }),
          catchError((error) => {
            console.error('Error in addImageFile effect:', error);
            return of(TrackActions.addImageFileFailure({ error: error.message }));
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
              track: { ...track, id: trackId }
            });
          }),
          catchError((error) => {
            console.error('Error in addTrack effect:', error);
            return of(TrackActions.addTrackFailure({ error: error.message }));
          })
        )
      )
    )
  );

  editTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.editTrack),
      mergeMap(({ track }) => {
        console.log('Action received to edit track:', track);
        return this.indexedDbService.updateTrack(track).pipe(
          map(() => {
            console.log('Track edited successfully:', track);
            return TrackActions.editTrackSuccess({ track });
          }),
          catchError((error) => {
            console.error('Error in editTrack effect:', error);
            return of(TrackActions.editTrackFailure({ error: error.message }));
          })
        );
      })
    )
  );

  deleteTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.deleteTrack),
      mergeMap(({ trackId }) =>
        this.indexedDbService.deleteTrack(trackId).pipe(
          map(() => {
            console.log('Track deleted successfully:', trackId);
            return TrackActions.deleteTrackSuccess({ trackId });
          }),
          catchError((error) => of(TrackActions.deleteTrackFailure({ error: error.message })))
        )
      )
    )
  );
}

