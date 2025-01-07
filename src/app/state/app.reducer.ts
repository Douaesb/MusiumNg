import { ActionReducerMap } from '@ngrx/store';
import { TrackState, trackReducer } from './track/track.reducer';
import {  audioReducer, AudioState } from './audio/audio.reducer';

export interface AppState {
  track: TrackState;
  audio: AudioState;
}

export const reducers: ActionReducerMap<AppState> = {
  track: trackReducer, 
  audio: audioReducer,
};
