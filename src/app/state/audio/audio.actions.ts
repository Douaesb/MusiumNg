import { createAction, props } from '@ngrx/store';
import { Track } from '../track/track.models';

export const loadTrack = createAction('[Audio] Load Track', props<{ trackId: number }>());
export const loadTrackSuccess = createAction('[Audio] Load Track Success', props<{ track: Track }>());
export const loadTrackFailure = createAction('[Audio] Load Track Failure', props<{ error: any }>());

export const play = createAction('[Audio] Play');
export const pause = createAction('[Audio] Pause');
export const stop = createAction('[Audio] Stop');

export const setVolume = createAction('[Audio] Set Volume', props<{ volume: number }>());
export const setCurrentTime = createAction('[Audio] Set Current Time', props<{ currentTime: number }>());

export const selectTrack = createAction('[Audio] Select Track', props<{ track: Track }>());
export const nextTrack = createAction('[Audio] Next Track');
export const previousTrack = createAction('[Audio] Previous Track');

