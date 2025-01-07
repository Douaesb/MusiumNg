import { createReducer, on } from '@ngrx/store';
import * as TrackActions from './track.actions';
import { Track } from './track.models';

export interface TrackState {
  tracks: Track[];
  selectedTrack: Track | null;
  error: string | null;
}

export const initialState: TrackState = {
  tracks: [],
  selectedTrack: null,
  error: null,
};

export const trackReducer = createReducer(
  initialState,
  on(TrackActions.loadTracksSuccess, (state, { tracks }) => ({
    ...state,
    tracks,
    error: null,
  })),
  on(TrackActions.selectTrack, (state, { track }) => ({
    ...state,
    selectedTrack: track,
  })),
  on(TrackActions.addTrackSuccess, (state, { track }) => ({
    ...state,
    tracks: [...state.tracks, track],
    error: null,
  })),
  on(TrackActions.editTrackSuccess, (state, { track }) => ({
    ...state,
    tracks: state.tracks.map(t => t.id === track.id ? track : t),
    error: null,
  })),
  on(TrackActions.deleteTrackSuccess, (state, { trackId }) => ({
    ...state,
    tracks: state.tracks.filter(track => track.id !== trackId),
    error: null,
  })),
  on(TrackActions.trackError, (state, { error }) => ({
    ...state,
    error,
  }))
);
