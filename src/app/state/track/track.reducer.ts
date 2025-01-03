import { createReducer, on } from '@ngrx/store';
import { loadTracksSuccess, addTrackSuccess, deleteTrackSuccess, trackError } from './track.actions';
import { Track } from './track.models';

export interface TrackState {
  tracks: Track[];
  error: string | null;
}

export const initialState: TrackState = {
  tracks: [],
  error: null,
};

export const trackReducer = createReducer(
  initialState,
  on(loadTracksSuccess, (state, { tracks }) => ({
    ...state,
    tracks,
    error: null,  // Reset error on successful load
  })),
  on(addTrackSuccess, (state, { track }) => ({
    ...state,
    tracks: [...state.tracks, track],
    error: null,  // Reset error on successful add
  })),
  on(deleteTrackSuccess, (state, { trackId }) => ({
    ...state,
    tracks: state.tracks.filter(track => track.id !== trackId),
    error: null,  // Reset error on successful delete
  })),
  on(trackError, (state, { error }) => ({
    ...state,
    error,  // Store error in state
  }))
);
