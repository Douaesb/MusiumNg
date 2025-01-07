import { createReducer, on } from '@ngrx/store';
import * as AudioActions from './audio.actions';
import { Track } from '../track/track.models';

export interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  error: any;
}

export const initialState: AudioState = {
  currentTrack: null,
  isPlaying: true,
  volume: 1,
  currentTime: 0,
  error: null,
};

export const audioReducer = createReducer(
  initialState,
  on(AudioActions.loadTrackSuccess, (state, { track }) => ({ ...state, currentTrack: track, error: null })),
  on(AudioActions.loadTrackFailure, (state, { error }) => ({ ...state, error })),
  on(AudioActions.play, (state) => ({ ...state, isPlaying: true })),
  on(AudioActions.pause, (state) => ({ ...state, isPlaying: false })),
  on(AudioActions.stop, (state) => ({ ...state, isPlaying: false, currentTime: 0 })),
  on(AudioActions.setVolume, (state, { volume }) => ({ ...state, volume })),
  on(AudioActions.setCurrentTime, (state, { currentTime }) => ({ ...state, currentTime })),
  on(AudioActions.selectTrack, (state, { track }) => ({ ...state, currentTrack: track, error: null }))
);

