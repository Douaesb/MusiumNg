import { ActionReducerMap } from '@ngrx/store';
import { TrackState, trackReducer } from './track/track.reducer';

export interface AppState {
  track: TrackState;
}

export const reducers: ActionReducerMap<AppState> = {
  track: trackReducer, 
};
