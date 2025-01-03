import { createAction, props } from '@ngrx/store';
import { Track } from '../../models/track.model';

export const loadTracks = createAction('[Track] Load Tracks');

export const loadTracksSuccess = createAction(
  '[Track] Load Tracks Success',
  props<{ tracks: Track[] }>()
);

export const loadTracksFailure = createAction(
  '[Track] Load Tracks Failure',
  props<{ error: string }>()
);

export const addTrack = createAction(
  '[Track] Add Track',
  props<{ track: Track }>()
);

export const addTrackSuccess = createAction(
  '[Track] Add Track Success',
  props<{ track: Track }>() 
);

export const addTrackFailure = createAction(
  '[Track] Add Track Failure',
  props<{ error: string }>()
);

export const deleteTrack = createAction(
  '[Track] Delete Track',
  props<{ trackId: number }>()
);

export const deleteTrackSuccess = createAction(
  '[Track] Delete Track Success',
  props<{ trackId: number }>()
);

export const deleteTrackFailure = createAction(
  '[Track] Delete Track Failure',
  props<{ error: string }>()
);

export const trackError = createAction(
  '[Track] Track Error',
  props<{ error: string }>()
);
