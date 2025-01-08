import { createAction, props } from '@ngrx/store';
import { Track } from './track.models';

export const loadTracks = createAction('[Track] Load Tracks');
export const loadTracksSuccess = createAction('[Track] Load Tracks Success', props<{ tracks: Track[] }>());
export const loadTracksFailure = createAction('[Track] Load Tracks Failure', props<{ error: string }>());

export const addTrack = createAction('[Track] Add Track', props<{ track: Track }>());
export const addTrackSuccess = createAction('[Track] Add Track Success', props<{ track: Track }>());
export const addTrackFailure = createAction('[Track] Add Track Failure', props<{ error: string }>());

export const editTrack = createAction('[Track] Edit Track', props<{ track: Track }>());
export const editTrackSuccess = createAction('[Track] Edit Track Success', props<{ track: Track }>());
export const editTrackFailure = createAction('[Track] Edit Track Failure', props<{ error: string }>());

export const deleteTrack = createAction('[Track] Delete Track', props<{ trackId: number }>());
export const deleteTrackSuccess = createAction('[Track] Delete Track Success', props<{ trackId: number }>());
export const deleteTrackFailure = createAction('[Track] Delete Track Failure', props<{ error: string }>());

export const selectTrack = createAction(
  '[Track] Select Track',
  props<{ track: Track | null }>()
);

export const addAudioFile = createAction('[AudioFile] Add Audio File', props<{ audioFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number } }>());
export const addAudioFileSuccess = createAction('[AudioFile] Add Audio File Success', props<{ audioFileId: number }>());
export const addAudioFileFailure = createAction('[AudioFile] Add Audio File Failure', props<{ error: string }>());

export const addImageFile = createAction('[ImageFile] Add Image File', props<{ imageFile: { fileBlob: Blob; fileName: string; fileType: string; fileSize: number } }>());
export const addImageFileSuccess = createAction('[ImageFile] Add Image File Success', props<{ imageFileId: number }>());
export const addImageFileFailure = createAction('[ImageFile] Add Image File Failure', props<{ error: string }>());


export const trackError = createAction('[Track] Track Error', props<{ error: string }>());

